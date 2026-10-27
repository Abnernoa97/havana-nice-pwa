import {HAVANA_V2_DEV_API_BASE_URL as API} from '@havana/shared';

// Do not save administrative bearer tokens in localStorage, IndexedDB or cookies.
export type AdminSession={token:string;expiresAt:string;role:'chat-admin'};
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
export function adminOtherSessions(token:string){
 return api<{others:number}>('/api/chat/admin/auth/sessions',authenticated(token));
}
export function adminRevokeOtherSessions(token:string){
 return api<{ok:boolean;revoked:number}>('/api/chat/admin/auth/revoke-others',
  authenticated(token,{method:'POST'}));
}
export type AdminMember={
 actor_id:string;username:string;display_name:string;active:number;session_count:number;
};
export function adminMembers(token:string){
 return api<{members:AdminMember[]}>('/api/chat/admin/members',authenticated(token));
}
export function adminCreateMember(token:string,displayName:string){
 return api<{member:AdminMember}>('/api/chat/admin/members',authenticated(token,{method:'POST',body:JSON.stringify({displayName})}));
}
export type AdminMemberHistoryEvent={
 event_type:'login'|'connect'|'disconnect';occurred_at:number;
 platform:string;operating_system:string;device_name:string;device_model:string|null;
};
export type AdminMemberHistory={
 entries:number;events:AdminMemberHistoryEvent[];since:string;
};
export function adminMemberHistory(token:string,actorId:string){
 return api<AdminMemberHistory>('/api/chat/admin/member-history?actorId='+encodeURIComponent(actorId),authenticated(token));
}
export function adminRemoveMember(token:string,actorId:string,confirmName:string){
 return api<{ok:boolean;deleted:boolean}>('/api/chat/admin/remove-member',
  authenticated(token,{method:'POST',body:JSON.stringify({actorId,confirmName})}));
}

export type AdminRealtimeEvent={type:'admin.ready'}|{type:'admin.invalidate';topic:'requests'|'members'};
export function openAdminRealtime(token:string,onEvent:(event:AdminRealtimeEvent)=>void):WebSocket{
 if(!/^[A-Za-z0-9_-]{40,128}$/.test(token))throw new Error('Sesión administrativa inválida');
 const url=API.replace(/^http/,'ws')+'/ws/admin';
 const socket=new WebSocket(url,['havana-v2-admin','admin.'+token]);
 socket.addEventListener('message',event=>{
  try{
   const value=JSON.parse(String(event.data)) as Partial<AdminRealtimeEvent>;
   if(value.type==='admin.ready')onEvent({type:'admin.ready'});
   if(value.type==='admin.invalidate'&&(value.topic==='requests'||value.topic==='members'))
     onEvent({type:'admin.invalidate',topic:value.topic});
  }catch{/* Unrecognized server event: ignore; privileged API remains authoritative. */}
 });
 return socket;
}
