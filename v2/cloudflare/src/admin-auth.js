// HAVANA NICE V2: server-only administrator login and short-lived access sessions.
// No password, bearer or hash is embedded in the PWA. All switches default off.
// Call this endpoint only after 0010_chat_admin_sessions.sql was applied.
const encoder=new TextEncoder();
const HOUR=60*60*1000;
const ATTEMPT_WINDOW=15*60*1000;
const SESSION_DURATION=8*HOUR;
const MIN_SECRET_LENGTH=40;
const TOKEN=/^[A-Za-z0-9_-]{40,128}$/;
function opaque(bytes=32){
 return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes))))
   .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');
}
async function hash(value){
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))]
   .map(v=>v.toString(16).padStart(2,'0')).join('');
}
async function equalSecret(left,right){
 const [a,b]=await Promise.all([
   crypto.subtle.digest('SHA-256',encoder.encode(left)),
   crypto.subtle.digest('SHA-256',encoder.encode(right)),
 ]);
 let difference=0;const x=new Uint8Array(a),y=new Uint8Array(b);
 for(let i=0;i<x.length;i++)difference|=x[i]^y[i];
 return difference===0;
}
export function adminLoginConfigured(env){
 return env.V2_ADMIN_LOGIN_MODE==='enabled' &&
  typeof env.V2_ADMIN_LOGIN_SECRET==='string' &&
  env.V2_ADMIN_LOGIN_SECRET.length>=MIN_SECRET_LENGTH;
}
function tokenFromRequest(request){
 return (request.headers.get('authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{40,128})$/i)?.[1]||'';
}
export async function verifyAdminSession(request,env){
 if(!adminLoginConfigured(env))return false;
 const token=tokenFromRequest(request);
 if(!TOKEN.test(token))return false;
 const row=await env.DB.prepare(
   'SELECT expires_at,revoked_at FROM chat_admin_sessions WHERE token_hash=?'
 ).bind(await hash(token)).first();
 return !!row&&row.revoked_at==null&&Number(row.expires_at)>Date.now();
}
async function clientHash(request,env){
 // Store no raw IP. Aggregate rate limits by Cloudflare edge IP, with secret salt.
 const ip=request.headers.get('cf-connecting-ip')||'unknown';
 return hash(env.V2_ADMIN_LOGIN_SECRET+':'+ip);
}
export async function handleAdminSessionApi(request,env,url,origin,respond){
 const reply=(body,status=200)=>respond(body,status,origin);
 if(url.pathname==='/api/chat/admin/auth/status'&&request.method==='GET'){
   return reply({enabled:adminLoginConfigured(env)});
 }
 if(!adminLoginConfigured(env))return reply({error:'Inicio de administrador aún no configurado'},503);
 if(url.pathname==='/api/chat/admin/auth/session'&&request.method==='GET'){
   if(!await verifyAdminSession(request,env))return reply({error:'No autorizado'},401);
   return reply({ok:true});
 }
 if(url.pathname==='/api/chat/admin/auth/session'&&request.method==='DELETE'){
   if(!await verifyAdminSession(request,env))return reply({error:'No autorizado'},401);
   await env.DB.prepare('UPDATE chat_admin_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL')
     .bind(Date.now(),await hash(tokenFromRequest(request))).run();
   return reply({ok:true});
 }
 if(url.pathname!=='/api/chat/admin/auth/session'||request.method!=='POST')
   return reply({error:'Método no permitido'},405);
 if((request.headers.get('content-type')||'').split(';')[0].trim()!=='application/json')
   return reply({error:'Solicitud inválida'},415);
 let body=null;
 try{body=await request.json();}catch{return reply({error:'Solicitud inválida'},400);}
 const now=Date.now(),client=await clientHash(request,env);
 const existing=await env.DB.prepare(
   'SELECT failures,window_start FROM chat_admin_login_limits WHERE client_hash=?'
 ).bind(client).first();
 if(existing?.window_start>now-ATTEMPT_WINDOW&&Number(existing.failures)>=5)
   return reply({error:'Demasiados intentos. Intenta más tarde.'},429);
 // A musician session token/name can never be an administrator credential.
 const password=typeof body?.password==='string'?body.password:'';
 const valid=password.length>=MIN_SECRET_LENGTH&&password.length<=256&&
   await equalSecret(password,env.V2_ADMIN_LOGIN_SECRET);
 if(!valid){
   await env.DB.prepare(
     'INSERT INTO chat_admin_login_limits(client_hash,window_start,failures) VALUES(?,?,1) '+
     'ON CONFLICT(client_hash) DO UPDATE SET failures=CASE WHEN window_start<? THEN 1 ELSE failures+1 END,'+
     'window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END'
   ).bind(client,now,now-ATTEMPT_WINDOW,now-ATTEMPT_WINDOW).run();
   return reply({error:'Credencial no válida'},401);
 }
 await env.DB.prepare('DELETE FROM chat_admin_login_limits WHERE client_hash=?').bind(client).run();
 const token=opaque(),expiresAt=now+SESSION_DURATION;
 await env.DB.prepare('INSERT INTO chat_admin_sessions(token_hash,created_at,expires_at) VALUES(?,?,?)')
   .bind(await hash(token),now,expiresAt).run();
 return reply({token,expiresAt:new Date(expiresAt).toISOString(),role:'chat-admin'});
}
