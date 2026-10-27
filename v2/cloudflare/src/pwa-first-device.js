// HAVANA NICE V2: PWA-only first-device registration during observe mode.
// This route NEVER changes the legacy Android/native named-login endpoint.
// All six existing identities are seeded as claimed by migration 0011, so a
// NEW PWA browser must request the Administrator's approval for those names.
// New allowlisted members can claim one first device only, transactionally.
import {deviceManagementEnabled,randomCredential,tokenDigest} from './device-approval.js';
import {notifyAdminClients} from './admin-realtime.js';

const SESSION_EXPIRY=Date.UTC(2100,0,1);
const HOUR=60*60*1000;

function error(respond,origin,message,status=400,code){
 return respond(code?{error:message,code}:{error:message},status,origin);
}
export async function handlePwaFirstDeviceSession(request,env,origin,respond,normalizeName){
 if(request.method!=='POST')return error(respond,origin,'Método no permitido',405);
 if(!deviceManagementEnabled(env))return error(respond,origin,'Alta de dispositivos no disponible',503);
 let data;
 try{data=await request.json();}catch{return error(respond,origin,'Solicitud inválida',400);}
 const name=normalizeName(data?.displayName);
 if(!name)return error(respond,origin,'Nombre inválido',400);
 const member=await env.DB.prepare(
   'SELECT actor_id,display_name FROM chat_members WHERE username=? AND active=1'
 ).bind(name).first();
 if(!member)return error(respond,origin,'Nombre no autorizado',403);

 const taken=await env.DB.prepare('SELECT actor_id FROM chat_pwa_first_claims WHERE actor_id=?')
   .bind(member.actor_id).first();
 const approvalRequired=()=>error(respond,origin,
   'Este nombre ya tiene un primer dispositivo registrado. Solicita autorización.',403,
   'device_approval_required');
 if(taken)return approvalRequired();

 // Single-winner INSERT OR IGNORE with a unique actor_id, followed by
 // conditional inserts inside ONE atomic D1 batch (also handles race losers).
 // We register the initial device as an approved enrollment so its individual
 // session is revocable by the same existing Admin device-control action.
 const now=Date.now(),enrollmentId=randomCredential(18),token=randomCredential(32);
 const digest=await tokenDigest(token),requestDigest=await tokenDigest(randomCredential(32));
 const result=await env.DB.batch([
   env.DB.prepare(
     'INSERT OR IGNORE INTO chat_pwa_first_claims(actor_id,enrollment_id,claimed_at) VALUES(?,?,?)'
   ).bind(member.actor_id,enrollmentId,now),
   env.DB.prepare(
     "INSERT INTO chat_device_requests(request_id,request_secret_hash,actor_id,display_name,device_label,status,created_at,expires_at,decided_at,redeemed_at) " +
     "SELECT ?,?,?,?,?, 'approved',?,?,?,? WHERE EXISTS " +
     '(SELECT 1 FROM chat_pwa_first_claims WHERE actor_id=? AND enrollment_id=?)'
   ).bind(enrollmentId,requestDigest,member.actor_id,member.display_name,
     'PWA · primer dispositivo',now,now+24*HOUR,now,now,member.actor_id,enrollmentId),
   env.DB.prepare(
     "INSERT INTO chat_sessions(token_hash,actor_id,display_name,expires_at,enrollment_id) " +
     "SELECT ?,actor_id,display_name,?,request_id FROM chat_device_requests WHERE request_id=? AND status='approved'"
   ).bind(digest,SESSION_EXPIRY,enrollmentId),
 ]);
 if(result.some(x=>Number(x?.meta?.changes)!==1))return approvalRequired();
 await notifyAdminClients(env,'requests');
 await notifyAdminClients(env,'members');
 return respond({token,actorId:member.actor_id,displayName:member.display_name,
   expiresAt:new Date(SESSION_EXPIRY).toISOString()},200,origin);
}
