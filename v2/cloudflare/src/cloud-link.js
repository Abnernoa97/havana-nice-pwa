// HAVANA NICE V2 M01: use the ALREADY PUBLISHED HAVANA CLOUD API.
// This module NEVER modifies or deploys HAVANA CLOUD, requests Google OAuth,
// sends owner credentials to a musician, or exposes the signed Cloud cookie.
// Disabled until the administrator explicitly links the existing Cloud account.
import {verifyAdminSession,adminLoginConfigured} from './admin-auth.js';

const BASE='https://havana-nice-cloud.soloaplicaciones97.workers.dev';
const TE=new TextEncoder(),TD=new TextDecoder();
const DEVICE=/^d1\.([0-9]{10,12})\.[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/i;
const VALID_CLOUD_PATHS=new Set(['/api/auth/login','/api/auth/device','/api/google/upload/session','/api/google/upload/chunk']);
const RUNTIME_FLAG='enabled';

const encode=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),x=>x.charCodeAt(0));
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});

export function cloudLinkConfigured(env){
 return env?.V2_CLOUD_LINK_ENABLED===RUNTIME_FLAG && adminLoginConfigured(env) &&
  typeof env?.HAVANA_CLOUD_BRIDGE?.fetch==='function';
}
async function encryptionKey(env){
 const seed=await crypto.subtle.importKey('raw',TE.encode(env.V2_ADMIN_LOGIN_SECRET),'HKDF',false,['deriveKey']);
 return crypto.subtle.deriveKey({
  name:'HKDF',hash:'SHA-256',salt:TE.encode('HAVANA NICE V2 CLOUD-DEVICE-ONLY v1'),
  info:TE.encode('encrypt owner-approved Cloud device tokens'),
 },seed,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encryptDeviceToken(env,token){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const data=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},
  await encryptionKey(env),TE.encode(token)));
 return {encrypted_token:encode(data),iv:encode(iv)};
}
async function decryptDeviceToken(env,row){
 const iv=decode(row.iv),encrypted=decode(row.encrypted_token);
 if(iv.length!==12||encrypted.length>512)throw Error('bad_cloud_link');
 const output=await crypto.subtle.decrypt({name:'AES-GCM',iv},await encryptionKey(env),encrypted);
 const token=TD.decode(output);
 if(!DEVICE.test(token))throw Error('bad_cloud_link');
 return token;
}
async function readLink(env){
 const row=await env.DB.prepare('SELECT encrypted_token,iv,expires_at FROM chat_cloud_link WHERE id=1').first();
 return row||null;
}
async function writeToken(env,token){
 const parsed=DEVICE.exec(token);
 if(!parsed||Number(parsed[1])*1000<=Date.now())throw Error('bad_cloud_device_token');
 const sealed=await encryptDeviceToken(env,token);
 await env.DB.prepare(
  'INSERT INTO chat_cloud_link(id,encrypted_token,iv,expires_at,updated_at) VALUES(1,?,?,?,?) '+
  'ON CONFLICT(id) DO UPDATE SET encrypted_token=excluded.encrypted_token,iv=excluded.iv,'+
  'expires_at=excluded.expires_at,updated_at=excluded.updated_at'
 ).bind(sealed.encrypted_token,sealed.iv,Number(parsed[1])*1000,Date.now()).run();
}
async function fetchCloud(env,path,options){
 if(!path.startsWith('/api/')||path.includes('//')||!VALID_CLOUD_PATHS.has(path))
  throw Error('cloud_path_not_allowed');
 return env.HAVANA_CLOUD_BRIDGE.fetch(BASE+path,options);
}
export async function cloudLinkStatus(env){
 if(!cloudLinkConfigured(env))return {available:false,linked:false};
 const row=await readLink(env);
 return {available:true,linked:!!row&&Number(row.expires_at)>Date.now()};
}
// ONLY a logged-in Admin can authorize this; the password exists exclusively
// in this single POST body and is never written to D1 or any log.
export async function handleCloudLinkAdmin(request,env,url,origin,respond){
 const send=(data,status=200)=>respond(data,status,origin);
 if(!await verifyAdminSession(request,env))return send({error:'No autorizado'},401);
 if(url.pathname==='/api/chat/admin/cloud/status'&&request.method==='GET'){
  try{return send(await cloudLinkStatus(env));}
  catch{return send({available:cloudLinkConfigured(env),linked:false});}
 }
 if(!cloudLinkConfigured(env))return send({error:'Enlace a CLOUD todavía no configurado en V2'},503);
 if(url.pathname==='/api/chat/admin/cloud/disconnect'&&request.method==='POST'){
  await env.DB.prepare('DELETE FROM chat_cloud_link WHERE id=1').run();
  return send({ok:true,linked:false});
 }
 if(url.pathname!=='/api/chat/admin/cloud/connect'||request.method!=='POST')
  return send({error:'Ruta no disponible'},404);
 if((request.headers.get('content-type')||'').split(';')[0].trim()!=='application/json')
  return send({error:'Solicitud inválida'},415);
 if(Number(request.headers.get('content-length')||0)>1024)return send({error:'Solicitud demasiado grande'},413);
 const raw=await request.text();
 if(raw.length>1024)return send({error:'Solicitud demasiado grande'},413);
 let body;try{body=JSON.parse(raw);}catch{return send({error:'Solicitud inválida'},400);}
 const password=typeof body?.password==='string'?body.password:'';
 if(!password||password.length>256)return send({error:'Contraseña inválida'},400);
 try{
  const upstream=await fetchCloud(env,'/api/auth/login',{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({password})
  });
  if(upstream.status===429)return send({error:'Demasiados intentos de acceso en CLOUD'},429);
  if(!upstream.ok)return send({error:'No se pudo autorizar HAVANA CLOUD'},401);
  const result=await upstream.json();
  if(!DEVICE.test(result?.deviceToken||''))return send({error:'CLOUD no entregó acceso de dispositivo'},502);
  await writeToken(env,result.deviceToken);
  return send({ok:true,linked:true});
 }catch{
  return send({error:'No se pudo establecer el enlace seguro con CLOUD'},503);
 }
}
// Only V2's backend calls this; never return owner cookie/device token or
// Cloud account IDs to musicians. Caller must whitelist each media operation.
export async function requestExistingCloud(env,path,options={}){
 if(!cloudLinkConfigured(env))throw Error('cloud_unavailable');
 const row=await readLink(env);
 if(!row||Number(row.expires_at)<=Date.now())throw Error('cloud_not_linked');
 const device=await decryptDeviceToken(env,row);
 const auth=await fetchCloud(env,'/api/auth/device',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({token:device})
 });
 if(!auth.ok)throw Error('cloud_link_expired');
 const authBody=await auth.json();
 const issued=auth.headers.get('set-cookie')||'';
 const cookie=/^hn_cloud_session=([^;\s]+)/.exec(issued)?.[0];
 if(!cookie||!DEVICE.test(authBody?.deviceToken||''))throw Error('cloud_link_expired');
 // A normal request must not write D1 for every 4 MiB fragment. Refresh
 // the long-lived device grant only when expiration is close.
 if(Number(row.expires_at)<Date.now()+7*24*3600_000)
  await writeToken(env,authBody.deviceToken);
 const headers=new Headers(options.headers||{});
 headers.set('cookie',cookie);
 headers.delete('authorization');
 return fetchCloud(env,path,{...options,headers});
}
