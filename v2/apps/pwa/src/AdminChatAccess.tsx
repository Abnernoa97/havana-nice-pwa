import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {adminAvailability,adminDeviceAction,adminDeviceRequests,adminLogin,adminLogout,adminVerify,adminMembers,openAdminRealtime,
 type AdminDeviceRequest,type AdminSession,type AdminMember} from './admin-api';

type Section='overview'|'requests'|'devices'|'members'|'security';
type Readiness='loading'|'disabled'|'enabled'|'error';
function when(value:number){return new Date(value).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'});}
export default function AdminChatAccess({section}:{section:Section}){
 const [readiness,setReadiness]=useState<Readiness>('loading');
 const [session,setSession]=useState<AdminSession|null>(null);
 const [password,setPassword]=useState('');
 const [processing,setProcessing]=useState(false);
 const [error,setError]=useState('');
 const [rows,setRows]=useState<AdminDeviceRequest[]>([]);
 const [members,setMembers]=useState<AdminMember[]>([]);
 const [membersReady,setMembersReady]=useState(false);
 const [listReady,setListReady]=useState(false);
 const [pendingId,setPendingId]=useState('');
 const [realtime,setRealtime]=useState<'waiting'|'connected'|'reconnecting'>('waiting');
 const refreshMembers=useCallback(async(token:string)=>{
   setMembersReady(false);
   try{
     const data=await adminMembers(token);
     setMembers(data.members);
     setMembersReady(true);
   }catch(e){
     setError(e instanceof Error?e.message:'No se pudieron consultar músicos');
   }
 },[]);
 const refresh=useCallback(async(token:string)=>{
   setListReady(false);
   try{
    const data=await adminDeviceRequests(token);
    setRows(data.requests);
    setListReady(true);
   }catch(e){
    const reason=e instanceof Error?e.message:'No se pudieron consultar solicitudes';
    setError(reason);
    if(reason.includes('No autorizado'))setSession(null);
   }
 },[]);
 useEffect(()=>{
  let closed=false;
  void adminAvailability().then(res=>{if(!closed)setReadiness(res.enabled?'enabled':'disabled');})
   .catch(()=>{if(!closed)setReadiness('error');});
  return()=>{closed=true;};
 },[]);
 useEffect(()=>{
  if(!session)return;
  const expiry=Date.parse(session.expiresAt);
  if(!Number.isFinite(expiry)||expiry<=Date.now()){setSession(null);return;}
  void adminVerify(session.token).then(()=>{void refresh(session.token);void refreshMembers(session.token);}).catch(()=>{
    setSession(null);setError('La sesión administrativa venció o fue revocada.');
  });
 },[session,refresh,refreshMembers]);
 // Authenticated real-time invalidation. Never store the admin token or show
 // private data over WebSocket; the protected API is still the source of truth.
 useEffect(()=>{
   if(!session){setRealtime('waiting');return;}
   let active=true,socket:WebSocket|null=null,retryTimer:ReturnType<typeof setTimeout>|null=null;
   let retry=1000;
   const refreshLatest=()=>{
     if(!active||document.hidden||!navigator.onLine)return;
     void adminVerify(session.token).then(()=>{
       if(!active)return;
       void refresh(session.token);void refreshMembers(session.token);
     }).catch(()=>{
       if(active){setSession(null);setError('La sesión administrativa expiró o fue revocada.');}
     });
   };
   const connect=()=>{
     if(!active||document.hidden||!navigator.onLine)return;
     setRealtime('reconnecting');
     try{
       socket=openAdminRealtime(session.token,event=>{
         if(!active)return;
         if(event.type==='admin.ready'){retry=1000;setRealtime('connected');refreshLatest();}
         if(event.type==='admin.invalidate'&&event.topic==='requests')void refresh(session.token);
         if(event.type==='admin.invalidate'&&event.topic==='members')void refreshMembers(session.token);
       });
       socket.onclose=event=>{
         if(!active)return;
         setRealtime('reconnecting');socket=null;
         if(event.code===4003){setSession(null);setError('La sesión administrativa fue revocada.');return;}
         retryTimer=setTimeout(connect,retry);retry=Math.min(retry*2,15000);
       };
       socket.onerror=()=>{if(active)setRealtime('reconnecting');};
     }catch{
       if(!active)return;
       retryTimer=setTimeout(connect,retry);retry=Math.min(retry*2,15000);
     }
   };
   const onResume=()=>{
     if(!active)return;
     if(document.hidden||!navigator.onLine){socket?.close();return;}
     refreshLatest();
     if(!socket||socket.readyState===WebSocket.CLOSED)connect();
   };
   const expireAfter=Math.max(0,Date.parse(session.expiresAt)-Date.now());
   const expiryTimer=setTimeout(()=>{
     if(active){setSession(null);setError('La sesión administrativa expiró.');}
   },Number.isFinite(expireAfter)?expireAfter:0);
   document.addEventListener('visibilitychange',onResume);
   window.addEventListener('online',onResume);
   window.addEventListener('offline',onResume);
   connect();
   return()=>{
     active=false;clearTimeout(expiryTimer);
     if(retryTimer)clearTimeout(retryTimer);
     document.removeEventListener('visibilitychange',onResume);
     window.removeEventListener('online',onResume);
     window.removeEventListener('offline',onResume);
     socket?.close();
   };
 },[session,refresh,refreshMembers]);
 async function login(e:FormEvent){
  e.preventDefault();if(processing||!password)return;
  setProcessing(true);setError('');
  try{
    const next=await adminLogin(password);
    setPassword('');
    setSession(next);
  }catch(e){setError(e instanceof Error?e.message:'No se pudo iniciar sesión');}
  finally{setProcessing(false);}
 }
 async function logout(){
  if(!session)return;
  const value=session.token;
  setSession(null);setRows([]);setMembers([]);setListReady(false);setMembersReady(false);setError('');
  try{await adminLogout(value);}catch{/* The client token is discarded even while offline. */}
 }
 async function action(item:AdminDeviceRequest,verb:'approve'|'deny'|'revoke'){
  if(!session||pendingId)return;
  if(verb==='revoke'&&!window.confirm('¿Revocar únicamente este dispositivo?'))return;
  setPendingId(item.request_id);setError('');
  try{await adminDeviceAction(session.token,item.request_id,verb);await refresh(session.token);}
  catch(e){setError(e instanceof Error?e.message:'No se pudo ejecutar la acción');}
  finally{setPendingId('');}
 }
 const interactive=section==='requests'||section==='devices';
 if(readiness==='loading')return <div className="a-panel" role="status">Comprobando disponibilidad administrativa…</div>;
 if(readiness!=='enabled')return <div className="a-panel a-admin-lock" role="status">
  <h2>Autorización del Administrador</h2>
  <p className="a-detail">{readiness==='disabled'?
  'La autenticación administrativa aún no está activada en el servidor. El Chat y sus sesiones actuales permanecen intactos.':
  'No se pudo consultar la disponibilidad administrativa. Revisa tu conexión.'}</p>
 </div>;
 if(!session)return <section className="a-panel a-admin-lock">
  <h2>Acceso de Administrador</h2>
  <p className="a-detail">La administración requiere una credencial independiente de los nombres del Chat. No se guardará en el teléfono.</p>
  <form className="a-admin-login" onSubmit={e=>void login(e)}>
   <label htmlFor="admin-password">Credencial de administración</label>
   <input id="admin-password" type="password" autoComplete="off" value={password}
    onChange={e=>setPassword(e.target.value)} required minLength={40}/>
   <button type="submit" disabled={processing}>{processing?'Verificando…':'Entrar al Administrador'}</button>
  </form>
  {error&&<p role="alert" className="a-admin-error">{error}</p>}
 </section>;
 const visible=section==='requests'?rows.filter(x=>x.status==='pending'):rows.filter(x=>x.status==='approved'||x.status==='revoked');
 return <section className="a-panel a-admin-private">
  <div className="a-admin-toolbar"><div><h2>Administrador autorizado</h2>
   <p className="a-detail">Sesión temporal · Los cambios son validados por Cloudflare · {realtime==='connected'?'Sincronización automática activa':'Reconectando sincronización automática'}</p></div>
   <div className="a-admin-toolbar-actions"><button type="button" onClick={()=>void refresh(session.token)}>Actualizar</button>
    <button type="button" onClick={()=>void logout()}>Cerrar sesión</button></div>
  </div>
  {error&&<p role="alert" className="a-admin-error">{error}</p>}
  {interactive&&<div className="a-admin-records">
    <h3>{section==='requests'?'Solicitudes pendientes':'Dispositivos aprobados o revocados'}</h3>
    {!listReady?<p className="a-detail">Consultando datos privados…</p>:visible.length===0?
     <p className="a-detail">No hay registros en esta categoría.</p>:
     visible.map(item=><div key={item.request_id} className="a-admin-record">
      <div><strong>{item.display_name}</strong><span>{item.device_label} · {when(item.created_at)}</span>
       <small>Estado: {item.status}</small></div>
      <div className="a-admin-record-buttons">{item.status==='pending'?
       <><button type="button" disabled={!!pendingId} onClick={()=>void action(item,'approve')}>Aprobar</button>
         <button type="button" disabled={!!pendingId} onClick={()=>void action(item,'deny')}>Rechazar</button></>:
       item.status==='approved'?<button type="button" disabled={!!pendingId} onClick={()=>void action(item,'revoke')}>Revocar dispositivo</button>:null}
      </div>
     </div>)}
   </div>}
  {section==='members'&&<div className="a-admin-records">
    <h3>Músicos de HAVANA NICE V2</h3>
    {!membersReady?<p className="a-detail">Consultando integrantes…</p>:
      members.length===0?<p className="a-detail">Sin integrantes registrados.</p>:
      members.map(person=><div key={person.actor_id} className="a-admin-record">
        <div><strong>{person.display_name}</strong>
          <span>{person.active===1?'Autorizado':'Acceso suspendido'}</span>
          <small>Credenciales vigentes: {person.session_count} (no equivale a teléfonos conectados ahora)</small>
        </div>
      </div>)}
  </div>}
  {section==='security'&&<p className="a-detail">Sesión administrativa verificada. Los controles adicionales de dispositivos estarán disponibles tras la etapa S01/S02.</p>}
  {section==='overview'&&<p className="a-detail">Administrador conectado al servicio V2. La gestión de dispositivos permanece bajo verificación de permisos.</p>}
 </section>;
}
