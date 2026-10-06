export function brazilDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function licenseState(d,now=new Date()){
 if(!d||d.active===false||d.accountActive===false)return {blocked:true,kind:'inactive',label:'Motorista ou conta inativa'};
 if(d.userId!==undefined&&!d.userId)return {blocked:true,kind:'unlinked',label:'Vincule a conta ao motorista'};
 if(!/^\d{11}$/.test(d.licenseNumber||'')||!/^\d{4}-\d{2}-\d{2}$/.test(d.licenseExpiry||''))return {blocked:true,kind:'missing',label:'CNH incompleta · regularizar cadastro'};
 if(!['B','AB','C','D','E','AC','AD','AE'].includes(d.license))return {blocked:true,kind:'category',label:'Categoria incompatível com a frota leve'};
 const days=Math.round((Date.parse(d.licenseExpiry+'T12:00:00Z')-Date.parse(brazilDate(now)+'T12:00:00Z'))/86400000);
 if(!Number.isFinite(days))return {blocked:true,kind:'missing',label:'Validade inválida'};
 if(days<0)return {blocked:true,kind:'expired',days,label:'CNH vencida'};
 return {blocked:false,kind:days<=7?'7':days<=30?'30':days<=60?'60':'valid',days,label:days===0?'CNH vence hoje':days<=60?'CNH vence em '+days+' dias':'CNH válida pela data cadastrada'};
}
export function licenseAlerts(drivers,now=new Date()){return drivers.filter(d=>d.active!==false&&d.accountActive!==false).flatMap(d=>{const s=licenseState(d,now);if(s.kind==='valid')return [];return [{id:'CNH-'+d.id+'-'+(d.licenseExpiry||'missing')+'-'+s.kind,driverId:d.id,days:s.days,title:s.label,text:d.name+' · '+(d.licenseExpiry?'Validade: '+d.licenseExpiry:'Informe número e validade da CNH')+' · verificação por cadastro',level:s.blocked?'bad':'warn',read:false,date:brazilDate(now),persistent:true}];}).sort((a,b)=>(a.days??Infinity)-(b.days??Infinity));}
