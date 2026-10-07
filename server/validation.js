import {catalogFor} from './catalog.js';
export class InputError extends Error{constructor(message,status=400){super(message);this.status=status;}}
export const normalizePlate=p=>String(p||'').replace(/[^a-z0-9]/gi,'').toUpperCase();
const str=(x,n=500)=>typeof x==='string'&&x.length<=n;
const num=(x)=>x===null||x===undefined||(typeof x==='number'&&Number.isFinite(x)&&x>=0);
const date=x=>!x||(typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x);
const need=(v,m)=>{if(!v)throw new InputError(m)};
export function validateState(state){
 need(state&&typeof state==='object','Dados inválidos.');
 for(const key of ['vehicles','drivers','maintenance','fuel','notifications','yards']){
  need(Array.isArray(state[key])&&state[key].length<=10000,'Lista inválida: '+key);
  const seen=new Set();
  for(const x of state[key]){need(x&&str(x.id,80)&&/^[A-Za-z0-9_-]+$/.test(x.id)&&!seen.has(x.id),'Código interno inválido ou duplicado em '+key);seen.add(x.id)}
 }
 need(state.settings&&str(state.settings.company,160)&&state.settings.company.trim(),'Informe a empresa.');
 need(!state.settings.catalog||Array.isArray(state.settings.catalog)&&state.settings.catalog.length<=300,'Catálogo inválido.');
 for(const c of state.settings.catalog||[]){need(str(c.brand,80)&&c.brand.trim()&&str(c.model,100)&&c.model.trim()&&['Hatch','Sedã','SUV','Picape','Utilitário leve'].includes(c.bodyType),'Modelo de catálogo inválido.');need(!c.image||(typeof c.image==='string'&&c.image.length<=400000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(c.image)),'Ilustração do modelo inválida.');need(Number.isInteger(c.sprite)&&c.sprite>=0&&c.sprite<24,'Imagem inválida.');}
 const cat=catalogFor(state.settings),plates=new Set(),yards=new Set(state.yards.map(x=>x.id)),vehicles=new Set(state.vehicles.map(x=>x.id));
 for(const y of state.yards)need(str(y.name,120)&&y.name.trim()&&str(y.address,500),'Informe um nome válido para o pátio.');
 need(!state.settings.dismissedAlerts||(Array.isArray(state.settings.dismissedAlerts)&&state.settings.dismissedAlerts.length<=10000&&state.settings.dismissedAlerts.every(x=>str(x,160))),'Alertas inválidos.');
 const policy=state.settings.policy||{};
 for(const field of ['maxAgeMonths','maxKm','maxMaintenancePercent','warningPercent'])need(policy[field]===undefined||(typeof policy[field]==='number'&&Number.isFinite(policy[field])&&policy[field]>0),'Política inválida.');
 if(policy.warningPercent!==undefined)need(policy.warningPercent>0&&policy.warningPercent<100,'O alerta antecipado deve ficar entre 1 e 99%.');
 for(const v of state.vehicles){
  need(v.active===undefined||typeof v.active==='boolean','Situação do veículo inválida.');
  const plate=normalizePlate(v.plate);need(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(plate)&&!plates.has(plate),'Placa inválida ou já cadastrada: '+plate);plates.add(plate);v.plate=plate;
  need(str(v.model,120)&&v.model.trim()&&str(v.brand||'',80),'Montadora/modelo inválido.');
  need(!v.brand||cat.some(c=>c.brand===v.brand&&c.model===v.model),'Escolha um modelo da montadora selecionada.');
  need(['Disponível','Em operação','Indisponível'].includes(v.status),'Status inválido.');
  need(!v.yardId||yards.has(v.yardId),'Pátio inexistente para '+plate);
  need(num(v.km)&&num(v.fuel)&&Number(v.fuel||0)<=100,'Quilometragem/combustível inválido.');
  need(str(v.driver||'',160)&&date(v.nextMaintenance)&&date(v.purchaseDate),'Data ou motorista inválido.');
  for(const key of ['purchaseKm','purchaseValue','currentValue','residualValue','lifecycleMonths','replacementKm'])need(num(v[key]),'Valor inválido em '+plate+': '+key);
  need(!v.purchaseValue||Number(v.residualValue||0)<=v.purchaseValue,'O residual não pode superar o valor de aquisição.');
  need(!v.purchaseKm||v.purchaseKm<=v.km,'KM de aquisição maior que a quilometragem atual.');
  need(!v.year||Number.isInteger(v.year)&&v.year>=1950&&v.year<=new Date().getFullYear()+2,'Ano inválido.');
  need(!v.color||str(v.color,40),'Cor inválida.');need(!v.trackerId||str(v.trackerId,120),'Rastreador inválido.');
  if(v.position){const p=v.position;need(typeof p.lat==='number'&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&typeof p.lng==='number'&&Number.isFinite(p.lng)&&Math.abs(p.lng)<=180&&typeof p.at==='string'&&!Number.isNaN(Date.parse(p.at))&&['manual','tracker'].includes(p.source),'Posição inválida.');}
  if(v.image)need(typeof v.image==='string'&&v.image.length<=400000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v.image),'Imagem inválida ou muito grande.');
 }
 const links=new Set(),licenses=new Set();
 for(const d of state.drivers){need(str(d.name,160)&&d.name.trim()&&['A','B','AB','C','D','E','AC','AD','AE'].includes(d.license)&&str(d.status,80),'Motorista inválido.');need(d.active===undefined||typeof d.active==='boolean','Situação do motorista inválida.');need(!d.licenseNumber||/^\d{11}$/.test(d.licenseNumber),'O número da CNH deve conter 11 dígitos.');need(date(d.licenseExpiry),'Validade da CNH inválida.');need(!d.userId||/^[0-9a-f-]{36}$/i.test(d.userId),'Conta inválida.');
 if(d.userId){need(!links.has(d.userId),'Conta já vinculada a outro motorista.');links.add(d.userId)}if(d.licenseNumber){need(!licenses.has(d.licenseNumber),'CNH já cadastrada.');licenses.add(d.licenseNumber)}}
 for(const m of state.maintenance)need(vehicles.has(m.vehicle)&&str(m.type,120)&&date(m.date)&&!!m.date&&str(m.status,80)&&str(m.notes,2000)&&num(m.cost)&&num(m.downtimeDays),'Manutenção inválida.');
 for(const f of state.fuel)need(vehicles.has(f.vehicle)&&date(f.date)&&!!f.date&&typeof f.liters==='number'&&f.liters>0&&num(f.km)&&str(f.driver,160)&&num(f.cost),'Abastecimento inválido.');
 for(const n of state.notifications)need((!n.vehicle||vehicles.has(n.vehicle))&&str(n.title,200)&&str(n.text,2000)&&str(n.level,20)&&typeof n.read==='boolean'&&date(n.date)&&!!n.date,'Alerta inválido.');
 return state;
}
