import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, tx } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const isProd = process.env.NODE_ENV === 'production';
const COOKIE = 'abc_session';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

function issueSession(res, user){
  const token = jwt.sign({ sub:user.id, org:user.organization_id, role:user.role, name:user.name, email:user.email }, JWT_SECRET, {expiresIn:'8h'});
  res.cookie(COOKIE, token, {httpOnly:true, sameSite:'lax', secure:isProd, maxAge:8*60*60*1000, path:'/'});
}
function auth(req,res,next){
  const token=req.cookies[COOKIE];
  if(!token) return res.status(401).json({error:'Não autenticado'});
  try { req.user=jwt.verify(token,JWT_SECRET); next(); }
  catch { return res.status(401).json({error:'Sessão expirada'}); }
}
function role(...allowed){return (req,res,next)=>allowed.includes(req.user.role)?next():res.status(403).json({error:'Permissão insuficiente'});}

app.get('/api/health', async (_req,res)=>{
  try { await pool.query('SELECT 1'); res.json({ok:true,service:'abc-cargas-api',database:'online'}); }
  catch(e){ res.status(503).json({ok:false,service:'abc-cargas-api',database:'offline'}); }
});

app.post('/api/auth/login', async (req,res)=>{
  const email=String(req.body?.email||'').trim().toLowerCase();
  const password=String(req.body?.password||'');
  if(!email||!password) return res.status(400).json({error:'Informe e-mail e senha.'});
  const {rows}=await pool.query(`SELECT id,organization_id,name,email,password_hash,role,active FROM users WHERE lower(email)=lower($1) LIMIT 1`,[email]);
  const user=rows[0];
  if(!user || !user.active || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({error:'E-mail ou senha inválidos.'});
  issueSession(res,user);
  res.json({user:{id:user.id,name:user.name,email:user.email,role:user.role,organizationId:user.organization_id}});
});

app.post('/api/auth/logout',(req,res)=>{res.clearCookie(COOKIE,{httpOnly:true,sameSite:'lax',secure:isProd,path:'/'});res.json({ok:true});});
app.get('/api/auth/me',auth,async(req,res)=>{res.json({user:{id:req.user.sub,name:req.user.name,email:req.user.email,role:req.user.role,organizationId:req.user.org}})});

async function loadState(orgId){
  const [v,d,m,f,n,s]=await Promise.all([
    pool.query(`SELECT code id,plate,model,status,km,driver,to_char(next_maintenance,'YYYY-MM-DD') "nextMaintenance",fuel FROM vehicles WHERE organization_id=$1 ORDER BY code`,[orgId]),
    pool.query(`SELECT code id,name,license,status FROM drivers WHERE organization_id=$1 ORDER BY name`,[orgId]),
    pool.query(`SELECT code id,vehicle_code vehicle,type,to_char(service_date,'YYYY-MM-DD') date,status,notes FROM maintenance WHERE organization_id=$1 ORDER BY service_date DESC`,[orgId]),
    pool.query(`SELECT code id,vehicle_code vehicle,to_char(service_date,'YYYY-MM-DD') date,liters,km,driver FROM fuel_records WHERE organization_id=$1 ORDER BY service_date DESC`,[orgId]),
    pool.query(`SELECT code id,vehicle_code vehicle,title,body text,level,read,to_char(event_date,'YYYY-MM-DD') date FROM notifications WHERE organization_id=$1 ORDER BY event_date DESC`,[orgId]),
    pool.query(`SELECT company_name company FROM organization_settings WHERE organization_id=$1`,[orgId])
  ]);
  return {vehicles:v.rows,drivers:d.rows,maintenance:m.rows,fuel:f.rows,notifications:n.rows,settings:{company:s.rows[0]?.company||'ABC Cargas',user:reqSafeUserName(orgId)}};
}
function reqSafeUserName(_orgId){return 'Michele Shibata'}
app.get('/api/bootstrap',auth,async(req,res)=>{
  const state=await loadState(req.user.org); state.settings.user=req.user.name; res.json({state,user:{id:req.user.sub,name:req.user.name,email:req.user.email,role:req.user.role}});
});

function normalizeArray(v){return Array.isArray(v)?v:[];}
app.post('/api/state/sync',auth,role('admin','manager','operator'),async(req,res)=>{
  const state=req.body?.state;
  if(!state || !Array.isArray(state.vehicles) || !Array.isArray(state.drivers)) return res.status(400).json({error:'Estado inválido.'});
  const org=req.user.org;
  await tx(async c=>{
    const vehicles=normalizeArray(state.vehicles), drivers=normalizeArray(state.drivers), maint=normalizeArray(state.maintenance), fuel=normalizeArray(state.fuel), notes=normalizeArray(state.notifications);
    for(const v of vehicles) await c.query(`INSERT INTO vehicles(organization_id,code,plate,model,status,km,driver,next_maintenance,fuel) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(organization_id,code) DO UPDATE SET plate=EXCLUDED.plate,model=EXCLUDED.model,status=EXCLUDED.status,km=EXCLUDED.km,driver=EXCLUDED.driver,next_maintenance=EXCLUDED.next_maintenance,fuel=EXCLUDED.fuel,updated_at=NOW()`,[org,v.id,v.plate,v.model,v.status,Number(v.km||0),v.driver||'—',v.nextMaintenance||null,Number(v.fuel||0)]);
    const vIds=vehicles.map(v=>v.id); if(vIds.length) await c.query(`DELETE FROM vehicles WHERE organization_id=$1 AND NOT (code = ANY($2::text[]))`,[org,vIds]); else await c.query(`DELETE FROM vehicles WHERE organization_id=$1`,[org]);
    for(const d of drivers) await c.query(`INSERT INTO drivers(organization_id,code,name,license,status) VALUES($1,$2,$3,$4,$5) ON CONFLICT(organization_id,code) DO UPDATE SET name=EXCLUDED.name,license=EXCLUDED.license,status=EXCLUDED.status,updated_at=NOW()`,[org,d.id,d.name,d.license||'E',d.status]);
    const dIds=drivers.map(d=>d.id); if(dIds.length) await c.query(`DELETE FROM drivers WHERE organization_id=$1 AND NOT (code = ANY($2::text[]))`,[org,dIds]); else await c.query(`DELETE FROM drivers WHERE organization_id=$1`,[org]);
    for(const x of maint) await c.query(`INSERT INTO maintenance(organization_id,code,vehicle_code,type,service_date,status,notes) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(organization_id,code) DO UPDATE SET vehicle_code=EXCLUDED.vehicle_code,type=EXCLUDED.type,service_date=EXCLUDED.service_date,status=EXCLUDED.status,notes=EXCLUDED.notes,updated_at=NOW()`,[org,x.id,x.vehicle,x.type,x.date,x.status,x.notes||'']);
    const mIds=maint.map(x=>x.id); if(mIds.length) await c.query(`DELETE FROM maintenance WHERE organization_id=$1 AND NOT (code = ANY($2::text[]))`,[org,mIds]); else await c.query(`DELETE FROM maintenance WHERE organization_id=$1`,[org]);
    for(const x of fuel) await c.query(`INSERT INTO fuel_records(organization_id,code,vehicle_code,service_date,liters,km,driver) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(organization_id,code) DO UPDATE SET vehicle_code=EXCLUDED.vehicle_code,service_date=EXCLUDED.service_date,liters=EXCLUDED.liters,km=EXCLUDED.km,driver=EXCLUDED.driver,updated_at=NOW()`,[org,x.id,x.vehicle,x.date,Number(x.liters||0),Number(x.km||0),x.driver||'—']);
    const fIds=fuel.map(x=>x.id); if(fIds.length) await c.query(`DELETE FROM fuel_records WHERE organization_id=$1 AND NOT (code = ANY($2::text[]))`,[org,fIds]); else await c.query(`DELETE FROM fuel_records WHERE organization_id=$1`,[org]);
    for(const x of notes) await c.query(`INSERT INTO notifications(organization_id,code,vehicle_code,title,body,level,read,event_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(organization_id,code) DO UPDATE SET vehicle_code=EXCLUDED.vehicle_code,title=EXCLUDED.title,body=EXCLUDED.body,level=EXCLUDED.level,read=EXCLUDED.read,event_date=EXCLUDED.event_date,updated_at=NOW()`,[org,x.id,x.vehicle||null,x.title,x.text||'',x.level||'warn',!!x.read,x.date]);
    const nIds=notes.map(x=>x.id); if(nIds.length) await c.query(`DELETE FROM notifications WHERE organization_id=$1 AND NOT (code = ANY($2::text[]))`,[org,nIds]); else await c.query(`DELETE FROM notifications WHERE organization_id=$1`,[org]);
    if(state.settings?.company) await c.query(`INSERT INTO organization_settings(organization_id,company_name) VALUES($1,$2) ON CONFLICT(organization_id) DO UPDATE SET company_name=EXCLUDED.company_name,updated_at=NOW()`,[org,state.settings.company]);
  });
  res.json({ok:true});
});

app.post('/api/users',auth,role('admin'),async(req,res)=>{
  const name=String(req.body?.name||'').trim(), email=String(req.body?.email||'').trim().toLowerCase(), password=String(req.body?.password||''), roleName=String(req.body?.role||'viewer');
  if(!name||!email||password.length<8) return res.status(400).json({error:'Nome, e-mail e senha (mín. 8 caracteres) são obrigatórios.'});
  if(!['admin','manager','operator','viewer'].includes(roleName)) return res.status(400).json({error:'Perfil inválido.'});
  const hash=await bcrypt.hash(password,12);
  try { const {rows}=await pool.query(`INSERT INTO users(organization_id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5) RETURNING id,name,email,role,active`,[req.user.org,name,email,hash,roleName]); res.status(201).json({user:rows[0]}); }
  catch(e){ if(e.code==='23505') return res.status(409).json({error:'E-mail já cadastrado nesta empresa.'}); throw e; }
});
app.get('/api/users',auth,role('admin','manager'),async(req,res)=>{const {rows}=await pool.query(`SELECT id,name,email,role,active,created_at FROM users WHERE organization_id=$1 ORDER BY name`,[req.user.org]);res.json({users:rows});});

app.use(express.static(path.join(__dirname,'../public')));
app.use((req,res)=>{ if(req.method==='GET' && req.accepts('html')) return res.sendFile(path.join(__dirname,'../public/index.html')); res.status(404).json({error:'Rota não encontrada'}); });

app.use((err,_req,res,_next)=>{console.error(err);res.status(500).json({error:'Erro interno do servidor.'});});
app.listen(PORT,()=>console.log(`ABC Cargas SaaS: http://localhost:${PORT}`));
