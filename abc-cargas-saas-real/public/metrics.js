export const DEFAULT_POLICY={maxAgeMonths:60,maxKm:150000,maxMaintenancePercent:15,warningPercent:80};
export function monthsBetween(start,end=new Date()){
 if(!start)return null;const a=new Date(start+'T12:00:00'),b=new Date(end);if(Number.isNaN(+a)||Number.isNaN(+b)||a>b)return null;
 let months=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();if(b.getDate()<a.getDate())months--;return Math.max(0,months);
}
export function vehicleMetrics(v,db,now=new Date()){
 const policy={...DEFAULT_POLICY,...db.settings?.policy},age=monthsBetween(v.purchaseDate,now);
 const life=Number(v.lifecycleMonths||policy.maxAgeMonths),purchase=Number(v.purchaseValue||0),residual=Number(v.residualValue||0),hasDep=purchase>0&&v.residualValue!==undefined&&v.residualValue!==null&&life>0&&age!==null&&residual<=purchase;
 const monthly=hasDep?(purchase-residual)/life:null;
 const estimatedValue=hasDep?Math.max(residual,purchase-monthly*Math.min(age,life)):null;
 const dep=hasDep?purchase-estimatedValue:null;
 const monthRemaining=age===null||!life?null:Math.max(0,life-age);
 const kmLimit=Number(v.replacementKm||policy.maxKm),kmRemaining=kmLimit>0?Math.max(0,kmLimit-Number(v.km||0)):null;
 const cutoff=new Date(now);cutoff.setFullYear(cutoff.getFullYear()-1);
 const maintenance=db.maintenance.filter(m=>m.vehicle===v.id&&m.status==='Concluída'&&new Date(m.date+'T12:00:00')>=cutoff&&new Date(m.date+'T12:00:00')<=now);
 const priced=maintenance.filter(m=>m.cost!==null&&m.cost!==undefined&&Number(m.cost)>0);
 const maintenanceCost=priced.reduce((s,m)=>s+Number(m.cost),0);
 const baseValue=Number(v.currentValue||0)||estimatedValue||null;
 const maintenancePercent=baseValue&&priced.length?maintenanceCost/baseValue*100:null;
 const records=db.fuel.filter(f=>f.vehicle===v.id).sort((a,b)=>Number(a.km)-Number(b.km));
 // Only full-tank intervals provide a comparable consumption estimate.
 const full=records.filter(f=>f.fullTank===true);let kmPerLiter=null;
 if(full.length>=2){const first=full[0],last=full.at(-1);const liters=records.filter(f=>Number(f.km)>Number(first.km)&&Number(f.km)<=Number(last.km)).reduce((s,f)=>s+Number(f.liters||0),0);const distance=Number(last.km)-Number(first.km);if(distance>0&&liters>0)kmPerLiter=distance/liters;}
 let costPerKm=null,recordedDistance=null;
 if(records.length>=2){const first=records[0],last=records.at(-1),distance=Number(last.km)-Number(first.km);if(distance>0){recordedDistance=distance;const interval=records.filter(f=>Number(f.km)>Number(first.km));if(interval.every(f=>Number(f.cost)>0)){const fuelCost=interval.reduce((s,f)=>s+Number(f.cost),0);const mCost=db.maintenance.filter(m=>m.vehicle===v.id&&m.status==='Concluída'&&m.date>=first.date&&m.date<=last.date).reduce((s,m)=>s+Number(m.cost||0),0);costPerKm=(fuelCost+mCost)/distance;}}}
 const monthlyKm=age&&v.purchaseKm!==null&&v.purchaseKm!==undefined?Math.max(0,Number(v.km)-Number(v.purchaseKm))/age:null;
 const yearsRemaining=monthlyKm>0&&kmRemaining!==null?kmRemaining/monthlyKm/12:null;
 const reasons=[],warnings=[];const warn=Number(policy.warningPercent||80)/100;
 if(age!==null&&life>0){if(age>=life)reasons.push('Limite de idade atingido');else if(age/life>=warn)warnings.push('Idade próxima do limite');}
 if(kmLimit>0){if(Number(v.km)>=kmLimit)reasons.push('Limite de quilometragem atingido');else if(Number(v.km)/kmLimit>=warn)warnings.push('Quilometragem próxima do limite');}
 if(maintenancePercent!==null&&Number(policy.maxMaintenancePercent)>0){if(maintenancePercent>=policy.maxMaintenancePercent)reasons.push('Custo de manutenção acima do limite');else if(maintenancePercent/policy.maxMaintenancePercent>=warn)warnings.push('Custo de manutenção em atenção');}
 return {age,life,monthly,estimatedValue,depreciation:dep,monthRemaining,kmLimit,kmRemaining,maintenanceCost,maintenancePercent,baseValue,kmPerLiter,costPerKm,recordedDistance,monthlyKm,yearsRemaining,reasons,warnings,level:reasons.length?'bad':warnings.length?'warn':'ok'};
}
export function fleetCounts(vehicles){return {total:vehicles.length,available:vehicles.filter(v=>v.status==='Disponível').length,unavailable:vehicles.filter(v=>v.status==='Indisponível').length,operation:vehicles.filter(v=>v.status==='Em operação').length};}
export function lifecycleAlerts(db,now=new Date()){
 return db.vehicles.filter(v=>v.active!==false).flatMap(v=>{const m=vehicleMetrics(v,db,now);const reasons=m.reasons.length?m.reasons:m.warnings;if(!reasons.length)return[];return [{id:'LIFE-'+v.id+'-'+(m.reasons.length?'limit':'warning'),vehicle:v.id,title:m.reasons.length?'Revisar substituição':'Acompanhar ciclo de vida',text:reasons.join(' · '),level:m.level,read:false,date:now.toISOString().slice(0,10),derived:true}];});
}
