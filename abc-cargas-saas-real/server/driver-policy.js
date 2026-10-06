import {licenseState} from '../public/license.js';
import {InputError} from './validation.js';
export async function requireDriver(c,org,id,at=new Date()){
 const d=(await c.query(`SELECT d.name,d.active,d.user_id "userId",d.license,d.license_number "licenseNumber",to_char(d.license_expiry,'YYYY-MM-DD') "licenseExpiry",u.active "accountActive" FROM drivers d JOIN users u ON u.id=d.user_id AND u.organization_id=d.organization_id WHERE d.organization_id=$1 AND d.user_id=$2`,[org,id])).rows[0];
 const s=licenseState(d,at);if(s.blocked)throw new InputError(d?s.label:'Vincule a conta ao cadastro de motorista e preencha a CNH antes de reservar ou retirar.',409);return d;
}
