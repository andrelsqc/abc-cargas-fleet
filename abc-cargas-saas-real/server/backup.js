import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
export const TABLES=['organizations','users','organization_settings','yards','vehicles','drivers','maintenance','fuel_records','notifications','fleet_reservations','fleet_inspections','fleet_inspection_photos','fleet_reservation_events'];
export function sqlLiteral(value){return "'"+String(value).replaceAll("'","''")+"'";}
export function restoreRow(table,json){if(!TABLES.includes(table))throw Error('Tabela inválida');JSON.parse(json);return `INSERT INTO public.${table} SELECT * FROM json_populate_record(NULL::public.${table},${sqlLiteral(json)});\n`;}
export const backupTickets=new Map();
export async function stateDigest(c,org){const hash=createHash('sha256');for(const table of TABLES){let offset=0;while(true){const where=table==='organizations'?'id':'organization_id';const rows=(await c.query(`SELECT row_to_json(t)::text AS data FROM public.${table} t WHERE ${where}=$1 ORDER BY ${table==='organization_settings'?'organization_id':table==='organizations'||table==='users'||table.startsWith('fleet_')?'id':'code'} LIMIT 30 OFFSET $2`,[org,offset])).rows;for(const row of rows)hash.update(table+'\n'+row.data+'\n');if(rows.length<30)break;offset+=30;}}return hash.digest('hex');}
export function installBackup(app,{pool,auth,role}){
 app.post('/api/maintenance/backup',auth,role('admin'),async(req,res)=>{
  const u=(await pool.query('SELECT name,email,password_hash FROM users WHERE id=$1 AND organization_id=$2 AND active=true',[req.user.sub,req.user.org])).rows[0];
  if(!u||u.name!=='Michele Shibata'||u.email!=='michele@abccargas.local')return res.status(403).json({error:'Esta operação exige a administradora Michele Shibata.'});
  if(typeof req.body.password!=='string'||!(await bcrypt.compare(req.body.password,u.password_hash)))return res.status(403).json({error:'Senha atual incorreta.'});
  let c;try{
   c=await pool.connect();await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
   const schemas=await Promise.all(['schema.sql','upgrade-v2.sql','upgrade-v3.sql','upgrade-v4.sql'].map(f=>fs.readFile(new URL('../db/'+f,import.meta.url),'utf8')));
   res.set({'Content-Type':'application/sql; charset=utf-8','Content-Disposition':'attachment; filename="ABC_Cargas_Backup.sql"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   const hash=createHash('sha256');const write=async text=>{hash.update(text);if(res.destroyed)throw Error('Download interrompido');if(!res.write(text))await once(res,'drain');};
   await write('-- ABC Cargas v4 — backup lógico da empresa\n-- Restaurar somente em banco NOVO e VAZIO. Dados pessoais e hashes de senha.\nBEGIN;\nSET standard_conforming_strings=on;\n'+schemas.join('\n')+'\nCREATE TABLE IF NOT EXISTS fleet_schema_migrations(code TEXT PRIMARY KEY,applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());\n');
   const stateHash=createHash('sha256');const counts={};for(const table of TABLES){let offset=0;counts[table]=0;while(true){const where=table==='organizations'?'id':'organization_id';const rows=(await c.query(`SELECT row_to_json(t)::text AS data FROM public.${table} t WHERE ${where}=$1 ORDER BY ${table==='organization_settings'?'organization_id':table==='organizations'||table==='users'||table.startsWith('fleet_')?'id':'code'} LIMIT 30 OFFSET $2`,[req.user.org,offset])).rows;for(const row of rows){stateHash.update(table+'\n'+row.data+'\n');await write(restoreRow(table,row.data));}counts[table]+=rows.length;if(rows.length<30)break;offset+=30;}}
   await write("INSERT INTO fleet_schema_migrations(code) VALUES('fleet-v2'),('fleet-v3'),('fleet-v4') ON CONFLICT DO NOTHING;\nSELECT setval(pg_get_serial_sequence('fleet_reservation_events','id'),COALESCE((SELECT MAX(id) FROM fleet_reservation_events),1),(SELECT COUNT(*)>0 FROM fleet_reservation_events));\nCOMMIT;\n-- COUNTS "+JSON.stringify(counts)+'\n');
   await c.query('COMMIT');const checksum=hash.digest('hex');backupTickets.set(req.user.org,{user:req.user.sub,checksum,digest:stateHash.digest('hex'),expires:Date.now()+30*60000});res.end('-- SHA256_BEFORE_TRAILER '+checksum+'\n-- ABC_BACKUP_COMPLETE\n');
  }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});console.error('Backup falhou:',e.message);if(res.headersSent)res.destroy();else res.status(500).json({error:'Falha ao gerar backup. Nenhum dado foi apagado.'});}finally{c?.release();}
 });
}
