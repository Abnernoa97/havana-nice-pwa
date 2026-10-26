import {HAVANA_V2_DEV_API_BASE_URL as API} from '@havana/shared';

// Do not save administrative bearer tokens in localStorage, IndexedDB or cookies.
export type AdminSession={token:string;expiresAt:string;role:'chat-admin'};
export type AdminDeviceRequest={
 request_id:string;actor_id:string;display_name:string;device_label:string;
 status:'pending'|'approved'|'denied'|'revoked';created_at:number;expires_at:number;
 decided_at:number|null;redeemed_at:number|null;
};
type ApiResult={error?:string};
async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const res=await fetch(API+path,{...options,cache:'no-store',headers:{
   Accept:'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...options.headers,
 }});
 const result=await res.json() as T&ApiResult;
 if(!res.ok)throw new Error(result.error||`Operación no disponible: ${res.status}`);
 return result;
}
function authenticated(token:string,options:RequestInit={}):RequestInit{
 return {...options,headers:{Authorization:`Bearer ${token}`,...options.headers}};
}
export function adminAvailability(){
 return api<{enabled:boolean}>('/api/chat/admin/auth/status');
}
export function adminLogin(password:string){
 return api<AdminSession>('/api/chat/admin/auth/session',{method:'POST',body:JSON.stringify({password})});
}
export function adminLogout(token:string){
 return api<{ok:boolean}>('/api/chat/admin/auth/session',authenticated(token,{method:'DELETE'}));
}
export function adminVerify(token:string){
 return api<{ok:boolean}>('/api/chat/admin/auth/session',authenticated(token));
}
export function adminDeviceRequests(token:string){
 return api<{requests:AdminDeviceRequest[]}>('/api/chat/admin/device-requests',authenticated(token));
}
export function adminDeviceAction(token:string,id:string,action:'approve'|'deny'|'revoke'){
 if(!/^[a-zA-Z0-9_-]{20,40}$/.test(id))throw new Error('Solicitud inválida');
 return api<{ok:boolean;status:string}>(
   '/api/chat/admin/device-requests/'+encodeURIComponent(id)+'/'+action,
   authenticated(token,{method:'POST'}));
}
