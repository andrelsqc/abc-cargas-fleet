import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, tx } from './db.js';
import {CATALOG,DEFAULT_POLICY} from './catalog.js';
import {validateState,InputError} from './validation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const isProd = process.env.NODE_ENV === 'production';
const COOKIE = 'abc_session';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '12mb' }));
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


const numFields={vehicles:['km','fuel'],fuel:['liters','km']};
async function loadState(orgId){
 return tx(async c=>{
 await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');
 const [v,d,m,f,n,s,y]=await Promise.all([
  c.query(`SELECT code id,plate,model,status,km,driver,to_char(next_maintenance,'YYYY-MM-DD') "nextMaintenance",fuel,details FROM vehicles WHERE organization_id=$1 ORDER BY plate`,[orgId]),
  c.query(`SELECT code id,name,license,status FROM drivers WHERE organization_id=$1 ORDER BY name`,[orgId]),
  c.query(`SELECT code id,vehicle_code vehicle,type,to_char(service_date,'YYYY-MM-DD') date,status,notes,details FROM maintenance WHERE organization_id=$1 ORDER BY service_date DESC`,[orgId]),
  c.query(`SELECT code id,vehicle_code vehicle,to_char(service_date,'YYYY-MM-DD') date,liters,km,driver,details FROM fuel_records WHERE organization_id=$1 ORDER BY service_date DESC,code`,[orgId]),
  c.query(`SELECT code id,vehicle_code vehicle,title,body text,level,read,to_char(event_date,'YYYY-MM-DD') date FROM notifications WHERE organization_id=$1 ORDER BY event_date DESC`,[orgId]),
  c.query(`SELECT company_name company,details,revision FROM organization_settings WHERE organization_id=$1`,[orgId]),
  c.query(`SELECT code id,name,address FROM yards WHERE organization_id=$1 ORDER BY name`,[orgId])
 ]);
 const merge=(rows,key)=>rows.map(row=>{const {details,...base}=row;const item={...(details||{}),...base};for(const field of numFields[key]||[])item[field]=Number(item[field]);return item});
 return {state:{vehicles:merge(v.rows,'vehicles'),drivers:d.rows,maintenance:merge(m.rows,'maintenance'),fuel:merge(f.rows,'fuel'),notifications:n.rows,yards:y.rows,settings:{policy:DEFAULT_POLICY,catalog:[],...(s.rows[0]?.details||{}),company:s.rows[0]?.company||'ABC Cargas',user:''}},revision:Number(s.rows[0]?.revision||0)};
 });
}
app.get('/api/catalog',auth,(_req,res)=>res.json({catalog:CATALOG}));
app.get('/api/bootstrap',auth,async(req,res)=>{
 const result=await loadState(req.user.org);result.state.settings.user=req.user.name;
 res.json({...result,catalog:CATALOG,user:{id:req.user.sub,name:req.user.name,email:req.user.email,role:req.user.role},schemaVersion:2});
});
const vehicleExtras=['brand','bodyType','year','color','yardId','purchaseDate','purchaseKm','purchaseValue','currentValue','residualValue','lifecycleMonths','replacementKm','trackerId','position','image'];
const picked=(obj,keys)=>Object.fromEntries(keys.filter(k=>obj[k]!==undefined).map(k=>[k,obj[k]]));
async function upsert(c,table,org,rows,fields,extras=[]){
 const columns=['organization_id','code',...fields.map(([db])=>db),...(extras.length?['details']:[])];
 const updates=[...fields.map(([db])=>`${db}=EXCLUDED.${db}`),...(extras.length?['details=EXCLUDED.details']:[]),'updated_at=NOW()'];
 const sql=`INSERT INTO ${table}(${columns.join(',')}) VALUES(${columns.map((_,i)=>'$'+(i+1)).join(',')}) ON CONFLICT(organization_id,code) DO UPDATE SET ${updates.join(',')}`;
 for(const row of rows){const values=[org,row.id,...fields.map(([,key,fallback])=>row[key]??fallback),...(extras.length?[JSON.stringify(picked(row,extras))]:[])];await c.query(sql,values);}
}
async function removeMissing(c,table,org,rows){await c.query(`DELETE FROM ${table} WHERE organization_id=$1 AND NOT(code=ANY($2::text[]))`,[org,rows.map(x=>x.id)]);}
app.post('/api/state/sync',auth,role('admin','manager','operator'),async(req,res)=>{
 const state=validateState(req.body?.state), revision=req.body?.revision;
 if(!Number.isInteger(revision)||revision<0)throw new InputError('Atualize a página para carregar a nova versão do sistema.',409);
 const org=req.user.org;
 await tx(async c=>{
  const lock=await c.query('SELECT revision FROM organization_settings WHERE organization_id=$1 FOR UPDATE',[org]);
  if(Number(lock.rows[0]?.revision)!==revision)throw new InputError('Outra sessão atualizou os dados. Recarregue a página antes de salvar.',409);
  await upsert(c,'yards',org,state.yards,[['name','name'],['address','address','']]);
  await upsert(c,'vehicles',org,state.vehicles,[['plate','plate'],['model','model'],['status','status'],['km','km',0],['driver','driver','—'],['next_maintenance','nextMaintenance',null],['fuel','fuel',0]],vehicleExtras);
  await upsert(c,'drivers',org,state.drivers,[['name','name'],['license','license','B'],['status','status']]);
  await upsert(c,'maintenance',org,state.maintenance,[['vehicle_code','vehicle'],['type','type'],['service_date','date'],['status','status'],['notes','notes','']],['cost','downtimeDays']);
  await upsert(c,'fuel_records',org,state.fuel,[['vehicle_code','vehicle'],['service_date','date'],['liters','liters'],['km','km',0],['driver','driver','—']],['cost','fullTank']);
  await upsert(c,'notifications',org,state.notifications,[['vehicle_code','vehicle',null],['title','title'],['body','text',''],['level','level','warn'],['read','read',false],['event_date','date']]);
  for(const [table,rows] of [['notifications',state.notifications],['fuel_records',state.fuel],['maintenance',state.maintenance],['vehicles',state.vehicles],['drivers',state.drivers],['yards',state.yards]])await removeMissing(c,table,org,rows);
  await c.query('UPDATE organization_settings SET company_name=$2,details=$3,revision=revision+1,updated_at=NOW() WHERE organization_id=$1',[org,state.settings.company,JSON.stringify(picked(state.settings,['policy','catalog','dismissedAlerts']))]);
 });
 res.json({ok:true,revision:revision+1});
});
// Manual last-position entry now. Provider adapters can later call an authenticated integration path.
app.post('/api/vehicles/:id/position',auth,role('admin','manager','operator'),async(req,res)=>{
 const lat=Number(req.body?.lat),lng=Number(req.body?.lng),at=req.body?.at||new Date().toISOString();
 if(typeof req.body?.lat!=='number'||typeof req.body?.lng!=='number'||!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lng)||Math.abs(lng)>180||Number.isNaN(Date.parse(at)))throw new InputError('Coordenadas ou horário inválidos.');
 let revision;
 await tx(async c=>{
  await c.query('SELECT revision FROM organization_settings WHERE organization_id=$1 FOR UPDATE',[req.user.org]);
  const result=await c.query(`UPDATE vehicles SET details=jsonb_set(details,'{position}',$3::jsonb),updated_at=NOW() WHERE organization_id=$1 AND code=$2`,[req.user.org,req.params.id,JSON.stringify({lat,lng,at,source:'manual'})]);
  if(!result.rowCount)throw new InputError('Veículo não encontrado.',404);
  revision=Number((await c.query('UPDATE organization_settings SET revision=revision+1 WHERE organization_id=$1 RETURNING revision',[req.user.org])).rows[0].revision);
 });
 res.json({ok:true,revision});
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

app.use(express.static(path.join(__dirname,'../public'),{setHeaders(res,file){if(file.endsWith('.html'))res.set('Cache-Control','no-cache')}}));
app.use((req,res)=>{ if(req.method==='GET' && req.accepts('html')) return res.sendFile(path.join(__dirname,'../public/index.html')); res.status(404).json({error:'Rota não encontrada'}); });

app.use((err,_req,res,_next)=>{if(err instanceof InputError)return res.status(err.status).json({error:err.message});if(err.code==='23505')return res.status(409).json({error:'Placa ou registro já cadastrado.'});if(err.type==='entity.too.large')return res.status(413).json({error:'Dados muito grandes. Reduza as imagens.'});console.error(err);res.status(500).json({error:'Não foi possível concluir a operação. Tente novamente.'});});
app.listen(PORT,()=>console.log(`ABC Cargas SaaS: http://localhost:${PORT}`));
