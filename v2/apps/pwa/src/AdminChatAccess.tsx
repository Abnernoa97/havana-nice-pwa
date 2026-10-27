import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {adminAvailability,adminLogin,adminLogout,adminVerify,adminMembers,adminCreateMember,openAdminRealtime,
 type AdminSession,type AdminMember} from './admin-api';

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
 const [realtime,setRealtime]=useState<'waiting'|'connected'|'reconnecting'>('waiting');

 const refreshMembers=useCallback(async(token:string)=>{
   try{const data=await adminMembers(token);setMembers(data.members);setLoaded(true);}
   catch(e){const reason=e instanceof Error?e.message:'No se pudieron consultar los músicos';setError(reason);if(reason==='No autorizado')setSession(null);}
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
   void adminVerify(session.token).then(()=>void refreshMembers(session.token))
     .catch(()=>{setSession(null);setError('Tu sesión de Administrador expiró.');});
 },[session,refreshMembers]);
 useEffect(()=>{
   if(!session){setRealtime('waiting');return;}
   let active=true,socket:WebSocket|null=null,timer:ReturnType<typeof setTimeout>|null=null;
   let retry=1000;
   const reconnect=()=>{
     if(!active||document.hidden||!navigator.onLine)return;
     setRealtime('reconnecting');
     try{
       socket=openAdminRealtime(session.token,event=>{
         if(!active)return;
         if(event.type==='admin.ready'){retry=1000;setRealtime('connected');void refreshMembers(session.token);}
         if(event.type==='admin.invalidate'&&event.topic==='members')void refreshMembers(session.token);
       });
       socket.onclose=e=>{
         if(!active)return;
         setRealtime('reconnecting');socket=null;
         if(e.code===4003){setSession(null);setError('Tu sesión administrativa fue revocada.');return;}
         timer=setTimeout(reconnect,retry);retry=Math.min(15000,retry*2);
       };
       socket.onerror=()=>{if(active)setRealtime('reconnecting');};
     }catch{
       timer=setTimeout(reconnect,retry);retry=Math.min(15000,retry*2);
     }
   };
   const resume=()=>{
     if(!active)return;
     if(document.hidden||!navigator.onLine){socket?.close();return;}
     void adminVerify(session.token).then(()=>void refreshMembers(session.token)).catch(()=>setSession(null));
     if(!socket||socket.readyState===WebSocket.CLOSED)reconnect();
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
 },[session,refreshMembers]);
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
   setSession(null);setMembers([]);setLoaded(false);setError('');setNotice('');setName('');
   try{await adminLogout(token);}catch{/* In-memory session is discarded even when offline. */}
 }
 async function addMember(event:FormEvent){
   event.preventDefault();if(!session||busy||!name.trim())return;
   setBusy(true);setError('');setNotice('');
   try{
     const result=await adminCreateMember(session.token,name.trim());
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
         <button type="button" onClick={()=>void refreshMembers(session.token)}>Actualizar</button>
         <button type="button" onClick={()=>void logout()}>Cerrar sesión</button>
       </div>
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
       <div className="a-member-rows">{members.map(person=><div className="a-member-row" key={person.actor_id}>
         <div className="a-member-avatar" aria-hidden="true">{person.display_name.charAt(0).toUpperCase()}</div>
         <div className="a-member-identity"><strong>{person.display_name}</strong><small>{person.active===1?'Autorizado':'Inactivo'}</small></div>
         <span className={person.active===1?'a-member-status on':'a-member-status'}>{person.active===1?'Activo':'Inactivo'}</span>
       </div>)}</div>}
   </section>
 </div>;
}
