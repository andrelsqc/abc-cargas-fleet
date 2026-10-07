import {createHash} from 'node:crypto';import bcrypt from 'bcryptjs';
import {TABLES,backupTickets,stateDigest} from './backup.js';import {cleanRecords} from './cleanup.js';
export function parseBackup(text){
 if(typeof text!=='string'||Buffer.byteLength(text)>8000000)throw Error('Use um backup SQL de até 8 MB.');
 const marker='-- SHA256_BEFORE_TRAILER ',i=text.lastIndexOf(marker);if(i<0||!text.endsWith('-- ABC_BACKUP_COMPLETE\n'))throw Error('Backup incompleto.');
 const checksum=text.slice(i).split('\n')[0].slice(marker.length);if(createHash('sha256').update(text.slice(0,i)).digest('hex')!==checksum)throw Error('Integridade do backup inválida.');
 const match=text.match(/^-- COUNTS (.*)$/m);if(!match)throw Error('Contagens ausentes.');const counts=JSON.parse(match[1]),rows=Object.fromEntries(TABLES.map(t=>[t,[]]));
 for(const line of text.split('\n'))if(line.startsWith('INSERT INTO public.')){const m=line.match(/^INSERT INTO public\.(\w+) SELECT \* FROM json_populate_record\(NULL::public\.\1,'((?:[^']|'')*)'\);$/);if(!m||!TABLES.includes(m[1]))throw Error('Formato de registro não reconhecido.');const row=JSON.parse(m[2].replaceAll("''","'"));if(!row||typeof row!=='object'||Array.isArray(row))throw Error('Registro inválido.');rows[m[1]].push(row);}
 if(Object.keys(counts).length!==TABLES.length||TABLES.some(t=>counts[t]!==rows[t].length))throw Error('Contagens do backup não correspondem aos registros.');
 if(rows.organizations.length!==1||rows.organization_settings.length!==1)throw Error('Backup deve conter uma empresa.');const org=rows.organizations[0].id;
 for(const t of TABLES)for(const r of rows[t])if((t==='organizations'?r.id:r.organization_id)!==org)throw Error('Backup contém registros de outra empresa.');
 for(const p of rows.fleet_inspection_photos){if(typeof p.bytes!=='string'||!/^\\x(?:[a-f0-9]{2})*$/i.test(p.bytes))throw Error('Foto inválida.');const bytes=Buffer.from(p.bytes.slice(2),'hex');if(bytes.length>700000||createHash('sha256').update(bytes).digest('hex')!==p.sha256)throw Error('Integridade de foto inválida.');}
 return {org,rows,counts};
}
export async function restoreRecords(c,backup,currentUser){
 const admin=backup.rows.users.find(u=>u.id===currentUser.id);if(!admin||admin.name!=='Michele Shibata'||admin.email!==currentUser.email||admin.role!=='admin')throw Error('Backup não corresponde à conta da Michele.');
 const old=(await c.query('SELECT revision FROM organization_settings WHERE organization_id=$1',[backup.org])).rows[0];
 // Dados extraídos do arquivo são parâmetros JSON. Nenhum SQL do arquivo é executado.
 await cleanRecords(c,backup.org,currentUser.id);
 for(const t of TABLES){const columns=new Set((await c.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2',['public',t])).rows.map(r=>r.column_name));for(const original of backup.rows[t]){const row={...original};if(Object.keys(row).some(k=>!columns.has(k)))throw Error('Backup incompatível com o esquema atual.');if(t==='users'&&row.id===currentUser.id)continue;
 if(t==='organization_settings')row.revision=Math.max(Number(old.revision),Number(row.revision))+1;
 if(t==='organizations'){await c.query('UPDATE organizations SET name=$2 WHERE id=$1',[backup.org,row.name]);continue;}
 if(t==='organization_settings'){await c.query('DELETE FROM organization_settings WHERE organization_id=$1',[backup.org]);}
 await c.query(`INSERT INTO public.${t} SELECT * FROM json_populate_record(NULL::public.${t},$1::json)`,[JSON.stringify(row)]);
 }}
 for(const t of TABLES){const key=t==='organizations'?'id':'organization_id';const n=Number((await c.query(`SELECT COUNT(*) AS n FROM public.${t} WHERE ${key}=$1`,[backup.org])).rows[0].n);if(n!==backup.counts[t])throw Error('Contagem final divergente.');}
 await c.query("SELECT setval(pg_get_serial_sequence('fleet_reservation_events','id'),COALESCE((SELECT MAX(id) FROM fleet_reservation_events),1),(SELECT COUNT(*)>0 FROM fleet_reservation_events))");
}
export function installRestore(app,{pool,auth,role}){app.post('/api/maintenance/restore',auth,role('admin'),async(req,res)=>{
 if(req.body.confirmation!=='RESTAURAR FROTA')return res.status(400).json({error:'Digite exatamente RESTAURAR FROTA.'});const ticket=backupTickets.get(req.user.org);
 if(!ticket||ticket.user!==req.user.sub||ticket.checksum!==req.body.currentChecksum||ticket.expires<Date.now())return res.status(409).json({error:'Baixe um novo backup do estado atual antes de restaurar.'});
 let c;try{const backup=parseBackup(req.body.backup);if(backup.org!==req.user.org)throw Error('Backup de outra empresa.');c=await pool.connect();await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='10s'");await c.query('LOCK TABLE '+TABLES.map(t=>'public.'+t).join(',')+' IN SHARE ROW EXCLUSIVE MODE');const user=(await c.query('SELECT * FROM users WHERE id=$1 AND organization_id=$2',[req.user.sub,req.user.org])).rows[0];if(!user||user.name!=='Michele Shibata'||user.email!=='michele@abccargas.local'||user.role!=='admin'||!user.active||typeof req.body.password!=='string'||!(await bcrypt.compare(req.body.password,user.password_hash)))throw Error('Conta ou senha atual inválida.');if(ticket.expires<Date.now()||await stateDigest(c,req.user.org)!==ticket.digest)throw Error('O banco mudou desde o backup atual. Baixe outro backup.');await restoreRecords(c,backup,user);await c.query('COMMIT');backupTickets.delete(req.user.org);res.json({ok:true,counts:backup.counts});}catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});res.status(409).json({error:e.code==='55P03'?'Há operações em andamento. Pause o uso e tente novamente.':e.message});}finally{c?.release();}
});}
