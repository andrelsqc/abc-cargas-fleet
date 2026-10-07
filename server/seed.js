import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, tx } from './db.js';

const DEMO = {
  vehicles: [
    {id:'ABC-001',plate:'BRA-1A01',brand:'Volkswagen',model:'Polo',status:'Disponível',km:48210,driver:'Carlos Silva',nextMaintenance:'2026-10-07',fuel:72},
    {id:'ABC-002',plate:'BRA-1A02',brand:'Chevrolet',model:'Onix',status:'Em operação',km:63840,driver:'João Santos',nextMaintenance:'2026-10-02',fuel:58},
    {id:'ABC-003',plate:'BRA-1A03',brand:'Toyota',model:'Corolla',status:'Disponível',km:51720,driver:'Marcos Lima',nextMaintenance:'2026-09-30',fuel:81},
    {id:'ABC-004',plate:'BRA-1A04',brand:'Volkswagen',model:'Polo',status:'Em operação',km:72100,driver:'Rafael Souza',nextMaintenance:'2026-10-14',fuel:43},
    {id:'ABC-005',plate:'BRA-1A05',brand:'Chevrolet',model:'Onix',status:'Disponível',km:45200,driver:'—',nextMaintenance:'2026-10-21',fuel:67},
    {id:'ABC-006',plate:'BRA-1A06',brand:'Hyundai',model:'HB20',status:'Em operação',km:58100,driver:'Eduardo Alves',nextMaintenance:'2026-10-09',fuel:51},
    {id:'ABC-007',plate:'BRA-1A07',brand:'Volkswagen',model:'Polo',status:'Disponível',km:39900,driver:'—',nextMaintenance:'2026-10-04',fuel:88},
    {id:'ABC-008',plate:'BRA-1A08',brand:'Toyota',model:'Corolla',status:'Indisponível',km:84500,driver:'—',nextMaintenance:'2026-09-25',fuel:21},
    {id:'ABC-009',plate:'BRA-1A09',brand:'Chevrolet',model:'Onix',status:'Em operação',km:60400,driver:'André Costa',nextMaintenance:'2026-10-18',fuel:61},
    {id:'ABC-010',plate:'BRA-1A10',brand:'Volkswagen',model:'Polo',status:'Disponível',km:42800,driver:'—',nextMaintenance:'2026-10-26',fuel:76}
  ],
  drivers: [
    {id:'DRV-001',name:'Carlos Silva',license:'B',status:'Disponível'},{id:'DRV-002',name:'João Santos',license:'B',status:'Em rota'},
    {id:'DRV-003',name:'Marcos Lima',license:'B',status:'Disponível'},{id:'DRV-004',name:'Rafael Souza',license:'B',status:'Em rota'},
    {id:'DRV-005',name:'Eduardo Alves',license:'B',status:'Em rota'},{id:'DRV-006',name:'André Costa',license:'B',status:'Em rota'}
  ],
  maintenance: [
    {id:'MNT-001',vehicle:'ABC-008',type:'Corretiva',date:'2026-09-25',status:'Pendente',notes:'Manutenção pendente.'},
    {id:'MNT-002',vehicle:'ABC-003',type:'Preventiva',date:'2026-09-30',status:'Agendada',notes:'Revisão preventiva.'},
    {id:'MNT-003',vehicle:'ABC-007',type:'Preventiva',date:'2026-10-04',status:'Agendada',notes:'Inspeção geral.'},
    {id:'MNT-004',vehicle:'ABC-001',type:'Preventiva',date:'2026-10-07',status:'Agendada',notes:'Troca de filtros.'}
  ],
  fuel: [
    {id:'FUE-001',vehicle:'ABC-002',date:'2026-09-22',liters:42,km:63840,driver:'João Santos'},
    {id:'FUE-002',vehicle:'ABC-004',date:'2026-09-22',liters:39,km:72100,driver:'Rafael Souza'},
    {id:'FUE-003',vehicle:'ABC-006',date:'2026-09-21',liters:41,km:58100,driver:'Eduardo Alves'}
  ],
  notifications: [
    {id:'ALT-001',vehicle:'ABC-008',title:'Veículo indisponível',text:'Manutenção pendente.',level:'bad',read:false,date:'2026-09-23'},
    {id:'ALT-002',vehicle:'ABC-003',title:'Revisão próxima',text:'Revisão preventiva programada.',level:'warn',read:false,date:'2026-09-23'},
    {id:'ALT-003',vehicle:'ABC-007',title:'Manutenção agendada',text:'Inspeção prevista para 04/10/2026.',level:'warn',read:false,date:'2026-09-22'}
  ]
};
await tx(async c=>{
  // Existing demo organization must not be recreated or overwritten at startup.
  const existing = await c.query('SELECT id FROM organizations WHERE name=$1 ORDER BY created_at LIMIT 1', ['ABC Cargas']);
  if(existing.rows.length){ console.log('Empresa existente preservada; seed não reaplicado.'); return; }
  const org = await c.query(`INSERT INTO organizations(name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id`, ['ABC Cargas']);
  let orgId = org.rows[0]?.id;
  if(!orgId) orgId=(await c.query(`SELECT id FROM organizations WHERE name=$1`,['ABC Cargas'])).rows[0].id;
  const hash = await bcrypt.hash(process.env.SEED_PASSWORD || 'ABC@123456', 12);
  await c.query(`INSERT INTO users(organization_id,name,email,password_hash,role) VALUES($1,$2,$3,$4,'admin') ON CONFLICT (organization_id,email) DO UPDATE SET name=EXCLUDED.name, password_hash=EXCLUDED.password_hash, active=true`, [orgId,'Michele Shibata','michele@abccargas.local',hash]);
  await c.query(`INSERT INTO organization_settings(organization_id,company_name) VALUES($1,$2) ON CONFLICT (organization_id) DO UPDATE SET company_name=EXCLUDED.company_name,updated_at=NOW()`,[orgId,'ABC Cargas']);
  await c.query('INSERT INTO yards(organization_id,code,name,address) VALUES($1,$2,$3,$4)',[orgId,'PATIO-PRINCIPAL','Pátio principal','']);
  for(const v of DEMO.vehicles) await c.query(`INSERT INTO vehicles(organization_id,code,plate,model,status,km,driver,next_maintenance,fuel,details) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(organization_id,code) DO UPDATE SET plate=EXCLUDED.plate,model=EXCLUDED.model,status=EXCLUDED.status,km=EXCLUDED.km,driver=EXCLUDED.driver,next_maintenance=EXCLUDED.next_maintenance,fuel=EXCLUDED.fuel,updated_at=NOW()`,[orgId,v.id,v.plate,v.model,v.status,v.km,v.driver,v.nextMaintenance||null,v.fuel,JSON.stringify({brand:v.brand,yardId:"PATIO-PRINCIPAL"})]);
  for(const d of DEMO.drivers) await c.query(`INSERT INTO drivers(organization_id,code,name,license,status) VALUES($1,$2,$3,$4,$5) ON CONFLICT(organization_id,code) DO UPDATE SET name=EXCLUDED.name,license=EXCLUDED.license,status=EXCLUDED.status,updated_at=NOW()`,[orgId,d.id,d.name,d.license,d.status]);
  for(const m of DEMO.maintenance) await c.query(`INSERT INTO maintenance(organization_id,code,vehicle_code,type,service_date,status,notes) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(organization_id,code) DO UPDATE SET vehicle_code=EXCLUDED.vehicle_code,type=EXCLUDED.type,service_date=EXCLUDED.service_date,status=EXCLUDED.status,notes=EXCLUDED.notes,updated_at=NOW()`,[orgId,m.id,m.vehicle,m.type,m.date,m.status,m.notes]);
  for(const f of DEMO.fuel) await c.query(`INSERT INTO fuel_records(organization_id,code,vehicle_code,service_date,liters,km,driver) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(organization_id,code) DO UPDATE SET vehicle_code=EXCLUDED.vehicle_code,service_date=EXCLUDED.service_date,liters=EXCLUDED.liters,km=EXCLUDED.km,driver=EXCLUDED.driver,updated_at=NOW()`,[orgId,f.id,f.vehicle,f.date,f.liters,f.km,f.driver]);
  for(const n of DEMO.notifications) await c.query(`INSERT INTO notifications(organization_id,code,vehicle_code,title,body,level,read,event_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(organization_id,code) DO UPDATE SET vehicle_code=EXCLUDED.vehicle_code,title=EXCLUDED.title,body=EXCLUDED.body,level=EXCLUDED.level,read=EXCLUDED.read,event_date=EXCLUDED.event_date,updated_at=NOW()`,[orgId,n.id,n.vehicle,n.title,n.text,n.level,n.read,n.date]);
});
await pool.end();
console.log('Seed ready.');
console.log('Login criado para michele@abccargas.local com a senha configurada.');
