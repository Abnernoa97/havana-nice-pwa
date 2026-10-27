import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {adminAvailability,adminLogin,adminLogout,adminVerify,adminOtherSessions,adminRevokeOtherSessions,adminMembers,adminCreateMember,adminMemberHistory,adminRemoveMember,openAdminRealtime,
 type AdminSession,type AdminMember,type AdminMemberHistory,isAdminUnauthorized} from './admin-api';

type Section='access'|'chat'|'repertoire'|'calendar'|'more';
type Readiness='loading'|'disabled'|'enabled'|'error';

export default function AdminChatAccess({section}:{section:Section}){
 const [readiness,setReadiness]=useState<Readiness>('loading');
 const [session,setSession]=useState<AdminSession|null>(null);
 const [password,setPassword]=useState('');
 const [name,setName]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [members,setMembers]=useState<AdminMember[]>([]);
 const [loaded,setLoaded]=useState(false);
 const [expanded,setExpanded]=useState('');
 const [history,setHistory]=useState<Record<string,AdminMemberHistory>>({});
 const [historyLoading,setHistoryLoading]=useState('');
 const [historyErrors,setHistoryErrors]=useState<Record<string,string>>({});
 const [removing,setRemoving]=useState('');
 const [otherSessions,setOtherSessions]=useState<number|null>(null);
 const [sessionsBusy,setSessionsBusy]=useState(false);
 const [realtime,setRealtime]=useState<'waiting'|'connected'|'reconnecting'>('waiting');
 // Prevent frontend updates from interrupting authorized admin sessions.
 // The marker contains no credential; actual tokens stay in React memory only.
 useEffect(()=>{
   document.documentElement.dataset.adminSessionActive=session?'true':'false';
   if(!session)window.dispatchEvent(new Event('havana-admin-session-ended'));
   return()=>{document.documentElement.dataset.adminSessionActive='false';};
 },[session]);

 const refreshOtherSessions=useCallback(async(token:string)=>{
   try{
     const data=await adminOtherSessions(token);
     setOtherSessions(data.others);
   }catch(reason){
     if(isAdminUnauthorized(reason)){setSession(null);setError('Tu sesión de Administrador expiró.');}
     else setOtherSessions(null);
   }
 },[]);
 const refreshMembers=useCallback(async(token:string)=>{
   try{const data=await adminMembers(token);setMembers(data.members);setLoaded(true);}
   catch(e){
     if(isAdminUnauthorized(e)){setSession(null);setError('Tu sesión de Administrador expiró.');return;}
     setError('No se pudo actualizar la lista. Comprueba tu conexión; conservamos la sesión y los datos cargados.');
   }
 },[]);
 useEffect(()=>{
   let active=true;
   void adminAvailability().then(result=>{if(active)setReadiness(result.enabled?'enabled':'disabled');})
     .catch(()=>{if(active)setReadiness('error');});
   return()=>{active=false;};
 },[]);
 useEffect(()=>{
   if(!session)return;
   const expiry=Date.parse(session.expiresAt);
   if(!Number.isFinite(expiry)||expiry<=Date.now()){setSession(null);return;}
   void adminVerify(session.token).then(()=>{
     void refreshMembers(session.token);
     void refreshOtherSessions(session.token);
   }).catch(reason=>{
     if(isAdminUnauthorized(reason)){setSession(null);setError('Tu sesión de Administrador expiró.');}
     else setError('No se pudo verificar la conexión. Tu sesión permanece abierta para reintentar.');
   });
 },[session,refreshMembers,refreshOtherSessions]);
 useEffect(()=>{
   if(!session){setRealtime('waiting');return;}
   let active=true,socket:WebSocket|null=null,timer:ReturnType<typeof setTimeout>|null=null;
   let retry=1000;
   const clearRetry=()=>{
     if(timer!==null){clearTimeout(timer);timer=null;}
   };
   const reconnect=()=>{
     if(!active||document.hidden||!navigator.onLine)return;
     // One Admin socket at a time: avoid duplicates when online/foreground fires
     // while a connection is still opening or an old close event is pending.
     if(socket&&(socket.readyState===WebSocket.OPEN||socket.readyState===WebSocket.CONNECTING))return;
     clearRetry();
     setRealtime('reconnecting');
     try{
       const opened=openAdminRealtime(session.token,event=>{
         if(!active||socket!==opened)return;
         if(event.type==='admin.ready'){retry=1000;setRealtime('connected');void refreshMembers(session.token);void refreshOtherSessions(session.token);}
         if(event.type==='admin.invalidate'&&event.topic==='members')void refreshMembers(session.token);
       });
       socket=opened;
       opened.onclose=e=>{
         // Ignore a stale socket closed by offline/background transitions.
         if(!active||socket!==opened)return;
         socket=null;
         setRealtime('reconnecting');
         if(e.code===4003){setSession(null);setError('Tu sesión administrativa fue revocada.');return;}
         if(!document.hidden&&navigator.onLine){
           clearRetry();
           timer=setTimeout(()=>{timer=null;reconnect();},retry);
           retry=Math.min(15000,retry*2);
         }
       };
       opened.onerror=()=>{if(active&&socket===opened)setRealtime('reconnecting');};
     }catch{
       if(active&&!document.hidden&&navigator.onLine){
         clearRetry();
         timer=setTimeout(()=>{timer=null;reconnect();},retry);
         retry=Math.min(15000,retry*2);
       }
     }
   };
   const resume=()=>{
     if(!active)return;
     if(document.hidden||!navigator.onLine){
       clearRetry();
       const previous=socket;
       socket=null; // The next foreground/online event may connect immediately.
       if(previous&&previous.readyState!==WebSocket.CLOSED)previous.close();
       setRealtime('reconnecting');
       return;
     }
     void adminVerify(session.token).then(()=>{void refreshMembers(session.token);void refreshOtherSessions(session.token);}).catch(reason=>{
       if(!active)return;
       if(isAdminUnauthorized(reason)){setSession(null);setError('Tu sesión administrativa expiró.');}
       else setError('Sin conexión temporal. La sesión sigue abierta; se actualizará al reconectar.');
     });
     if(!socket||socket.readyState===WebSocket.CLOSING||socket.readyState===WebSocket.CLOSED){
       socket=null;
       reconnect();
     }
   };
   const duration=Math.max(0,Date.parse(session.expiresAt)-Date.now());
   const expiryTimer=setTimeout(()=>{if(active){setSession(null);setError('La sesión administrativa expiró.');}},duration);
   document.addEventListener('visibilitychange',resume);
   window.addEventListener('online',resume);
   window.addEventListener('offline',resume);
   reconnect();
   return()=>{
     active=false;clearTimeout(expiryTimer);if(timer)clearTimeout(timer);
     document.removeEventListener('visibilitychange',resume);
     window.removeEventListener('online',resume);
     window.removeEventListener('offline',resume);
     socket?.close();
   };
 },[session,refreshMembers,refreshOtherSessions]);
 async function login(event:FormEvent){
   event.preventDefault();if(busy||!password)return;
   setBusy(true);setError('');
   try{const next=await adminLogin(password);setPassword('');setSession(next);}
   catch(e){setError(e instanceof Error?e.message:'No se pudo iniciar sesión');}
   finally{setBusy(false);}
 }
 async function logout(){
   if(!session)return;
   const token=session.token;
   setSession(null);setMembers([]);setLoaded(false);setError('');setNotice('');setName('');setOtherSessions(null);
   try{await adminLogout(token);}catch{/* In-memory session is discarded even when offline. */}
 }
 async function toggleMember(person:AdminMember){
   if(expanded===person.actor_id){setExpanded('');return;}
   setExpanded(person.actor_id);
   if(!session)return;
   setHistoryLoading(person.actor_id);
   setHistory(previous=>{const next={...previous};delete next[person.actor_id];return next;});
   setHistoryErrors(previous=>{const next={...previous};delete next[person.actor_id];return next;});
   try{
     const value=await adminMemberHistory(session.token,person.actor_id);
     setHistory(previous=>({...previous,[person.actor_id]:value}));
   }catch{
     setHistoryErrors(previous=>({...previous,[person.actor_id]:'No se pudo consultar el historial en Cloudflare. Cierra y vuelve a abrir para reintentar.'}));
   }finally{setHistoryLoading(current=>current===person.actor_id?'':current);}
 }
 async function removeMember(person:AdminMember){
   if(!session||removing||busy)return;
   const confirmed=window.confirm(
     '¿Eliminar DEFINITIVAMENTE a '+person.display_name+'?\\n\\nSe eliminarán su nombre, sesiones, mensajes propios, reacciones y registro de acceso. Se cerrarán sus dispositivos conectados. Esta acción no se puede deshacer.'
   );
   if(!confirmed)return;
   setRemoving(person.actor_id);setError('');setNotice('');
   try{
     await adminRemoveMember(session.token,person.actor_id,person.display_name);
     // This local update happens ONLY after the server confirmed deletion.
     // A later list refresh can fail without falsely showing a deleted member.
     setMembers(previous=>previous.filter(item=>item.actor_id!==person.actor_id));
     setHistory(previous=>{const next={...previous};delete next[person.actor_id];return next;});
     if(expanded===person.actor_id)setExpanded('');
     await refreshMembers(session.token);
     setNotice('Miembro eliminado definitivamente: '+person.display_name);
   }catch(e){setError(e instanceof Error?e.message:'No se pudo eliminar el miembro');}
   finally{setRemoving('');}
 }
 async function closeOtherSessions(){
   if(!session||sessionsBusy||!otherSessions)return;
   if(!window.confirm('¿Cerrar las otras '+otherSessions+' sesiones administrativas? Tu sesión actual seguirá abierta.'))return;
   setSessionsBusy(true);setError('');setNotice('');
   try{
     const result=await adminRevokeOtherSessions(session.token);
     setOtherSessions(0);
     setNotice('Otras sesiones administrativas cerradas: '+result.revoked+'. Esta sesión continúa activa.');
   }catch(e){setError(e instanceof Error?e.message:'No se pudieron cerrar otras sesiones');}
   finally{setSessionsBusy(false);}
 }
 async function addMember(event:FormEvent){
   event.preventDefault();if(!session||busy||!name.trim())return;
   setBusy(true);setError('');setNotice('');
   try{
     const result=await adminCreateMember(session.token,name.trim());
     // Confirmed by D1: keep the new member visible if a follow-up GET fails.
     setMembers(previous=>previous.some(item=>item.actor_id===result.member.actor_id)
       ?previous:[...previous,result.member].sort((a,b)=>a.display_name.localeCompare(b.display_name,'es')));
     setLoaded(true);
     setName('');
     setNotice('Nombre autorizado: '+result.member.display_name);
     await refreshMembers(session.token);
   }catch(e){setError(e instanceof Error?e.message:'No se pudo añadir el miembro');}
   finally{setBusy(false);}
 }
 // Keep the Administrator's verified session when changing navigation sections.
 if(section!=='access')return null;
 if(readiness==='loading')return <section className="a-panel">Comprobando el acceso administrativo…</section>;
 if(readiness!=='enabled')return <section className="a-panel">
   <h2>Acceso de Administrador</h2>
   <p className="a-detail">{readiness==='disabled'?'Acceso administrativo todavía no configurado.':'No se pudo verificar la conexión al Administrador.'}</p>
 </section>;
 if(!session)return <section className="a-panel a-admin-lock">
   <h2>Entrar al Administrador</h2>
   <p className="a-detail">Inicia sesión para crear y autorizar músicos. La contraseña no se guarda en el teléfono.</p>
   <form className="a-admin-login" onSubmit={login}>
     <label htmlFor="admin-password">Contraseña de Administrador</label>
     <input id="admin-password" type="password" autoComplete="off" value={password}
       onChange={event=>setPassword(event.target.value)} required minLength={40}/>
     <button type="submit" disabled={busy}>{busy?'Verificando…':'Entrar'}</button>
   </form>
   {error&&<p role="alert" className="a-admin-error">{error}</p>}
 </section>;
 return <div className="a-access-workspace">
   <section className="a-panel a-admin-private">
     <div className="a-admin-toolbar">
       <div><h2>Administrador autorizado</h2>
         <p className="a-detail">{realtime==='connected'?'Sincronización automática activa':'Conectando con Cloudflare…'}</p></div>
       <div className="a-admin-toolbar-actions">
         <button type="button" onClick={()=>{void refreshMembers(session.token);void refreshOtherSessions(session.token);}}>Actualizar</button>
         <button type="button" onClick={()=>void logout()}>Cerrar sesión</button>
       </div>
     </div>
     <div className="a-admin-session-security">
       <span>Otras sesiones administrativas: <strong>{otherSessions===null?'Verificando…':otherSessions}</strong></span>
       {otherSessions!==null&&otherSessions>0&&<button type="button"
          disabled={sessionsBusy} onClick={()=>void closeOtherSessions()}>
          {sessionsBusy?'Cerrando…':'Cerrar otras sesiones'}
       </button>}
     </div>
   </section>
   <section className="a-panel a-member-add">
     <h2>Añadir miembro</h2>
     <p className="a-detail">Escribe el nombre que quieres autorizar. Solo los nombres creados aquí podrán entrar al Chat de músicos.</p>
     <form className="a-member-form" onSubmit={addMember}>
       <label htmlFor="new-musician-name">Nombre del músico</label>
       <input id="new-musician-name" type="text" value={name}
         onChange={event=>setName(event.target.value)} autoCapitalize="words"
         autoCorrect="off" maxLength={28} placeholder="Ej. María José" required/>
       <button type="submit" disabled={busy||!name.trim()}>{busy?'Guardando…':'Añadir y autorizar'}</button>
     </form>
     {notice&&<p className="a-member-notice" role="status">{notice}</p>}
     {error&&<p className="a-admin-error" role="alert">{error}</p>}
   </section>
   <section className="a-panel a-member-list">
     <div className="a-member-heading">
       <h2>Músicos autorizados</h2><span>{loaded?members.filter(person=>person.active===1).length:'—'}</span>
     </div>
     {!loaded?<p className="a-detail">Cargando integrantes…</p>:
       members.length===0?<p className="a-detail">Todavía no hay miembros registrados. Añade el primero arriba.</p>:
       <div className="a-member-rows">{members.map(person=><div className="a-member-group" key={person.actor_id}>
         <div className="a-member-row">
           <button type="button" className="a-member-expand" aria-expanded={expanded===person.actor_id}
             onClick={()=>void toggleMember(person)}>
             <span className="a-member-avatar" aria-hidden="true">{person.display_name.charAt(0).toUpperCase()}</span>
             <span className="a-member-identity"><strong>{person.display_name}</strong><small>{person.active===1?'Autorizado':'Inactivo'}</small></span>
             <span className="a-member-chevron" aria-hidden="true">{expanded===person.actor_id?'⌃':'⌄'}</span>
           </button>
           <span className={person.active===1?'a-member-status on':'a-member-status'}>{person.active===1?'Activo':'Inactivo'}</span>
           <button type="button" className="a-member-delete" onClick={()=>void removeMember(person)}
             disabled={!!removing||busy} title={'Eliminar definitivamente a '+person.display_name}
             aria-label={'Eliminar definitivamente a '+person.display_name}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
               <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7"/>
             </svg>
           </button>
         </div>
         {expanded===person.actor_id&&<div className="a-member-history">
           <h3>Historial de accesos</h3>
           {historyLoading===person.actor_id?<p>Cargando datos desde Cloudflare…</p>:
             historyErrors[person.actor_id]?<p className="a-admin-error" role="alert">{historyErrors[person.actor_id]}</p>:
             !history[person.actor_id]?<p>Sin datos de historial disponibles.</p>:
             <>
               <p className="a-member-count">Entradas registradas: <strong>{history[person.actor_id]?.entries ?? 0}</strong></p>
               {history[person.actor_id]?.events.length===0?
                 <p>Sin historial registrado. Las entradas anteriores a la activación de este registro no se pueden reconstruir.</p>:
                 <div className="a-member-events">{history[person.actor_id]?.events.map((event,index)=>
                   <div className="a-member-event" key={event.occurred_at+'-'+index}>
                     <strong>{event.event_type==='login'?'Entrada':event.event_type==='connect'?'Conectó al Chat':'Desconectó del Chat'} · {new Date(event.occurred_at).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'})}</strong>
                     <span>{event.platform} · {event.operating_system}</span>
                     <span>{event.device_name}{event.device_model?' · Modelo: '+event.device_model:' · Modelo no disponible'}</span>
                   </div>)}</div>}
               <small>{history[person.actor_id]?.since}</small>
             </>}
         </div>}
       </div>)}</div>}
   </section>
 </div>;
}
