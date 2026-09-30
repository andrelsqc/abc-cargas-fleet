// Initial light-vehicle catalogue. Images are illustrative; catalogue can be extended in settings.
export const CATALOG = [
 ['Volkswagen','Polo','Hatch',0],['Volkswagen','Virtus','Sedã',1],['Volkswagen','Nivus','SUV',2],['Volkswagen','T-Cross','SUV',3],
 ['Fiat','Argo','Hatch',4],['Fiat','Cronos','Sedã',5],['Fiat','Pulse','SUV',6],['Fiat','Strada','Picape',7],['Fiat','Toro','Picape',8],
 ['Chevrolet','Onix','Hatch',9],['Chevrolet','Onix Plus','Sedã',10],['Chevrolet','Tracker','SUV',11],['Chevrolet','S10','Picape',12],
 ['Toyota','Corolla','Sedã',13],['Toyota','Corolla Cross','SUV',14],['Toyota','Hilux','Picape',15],
 ['Honda','City','Sedã',16],['Honda','HR-V','SUV',17],['Honda','Civic','Sedã',18],
 ['Hyundai','HB20','Hatch',19],['Hyundai','HB20S','Sedã',20],['Hyundai','Creta','SUV',21],
 ['Renault','Kwid','Hatch',22],['Renault','Duster','SUV',23]
].map(([brand,model,bodyType,sprite])=>({brand,model,bodyType,sprite}));
export const DEFAULT_POLICY={maxAgeMonths:60,maxKm:150000,maxMaintenancePercent:15,warningPercent:80};
export function catalogFor(settings){return [...CATALOG,...(Array.isArray(settings?.catalog)?settings.catalog:[])];}
