import {useEffect,useState,type FormEvent} from 'react';
import {adminCloudLinkStatus,adminCloudLinkConnect,adminCloudLinkDisconnect,
 type AdminCloudLinkStatus,isAdminUnauthorized} from './admin-api';

export default function AdminCloudConnection({token,onExpired}:{token:string;onExpired:()=>void}){
 const [status,setStatus]=useState<AdminCloudLinkStatus|null>(null);
 const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  void adminCloudLinkStatus(token).then(next=>{if(active)setStatus(next);})
    .catch(e=>{if(active){setStatus({available:false,linked:false});if(isAdminUnauthorized(e))onExpired();}});
  return()=>{active=false;};
 },[token,onExpired]);
 async function connect(e:FormEvent){
  e.preventDefault();if(busy||!password||!status?.available)return;
  const value=password;setPassword('');setBusy(true);setError('');
  try{
   const result=await adminCloudLinkConnect(token,value);
   setStatus({available:true,linked:result.linked});
  }catch(e){
   if(isAdminUnauthorized(e))onExpired();
   else setError('No se pudo autorizar CLOUD. Comprueba el acceso y vuelve a intentar.');
  }finally{setBusy(false);}
 }
 async function disconnect(){
  if(busy||!status?.linked)return;
  if(!window.confirm('¿Desvincular HAVANA CLOUD del Chat V2? Los archivos existentes no se borrarán.'))return;
  setBusy(true);setError('');
  try{await adminCloudLinkDisconnect(token);setStatus({available:true,linked:false});}
  catch(e){if(isAdminUnauthorized(e))onExpired();else setError('No se pudo desvincular.');}
  finally{setBusy(false);}
 }
 // Do not clutter the live Admin Chat with unfinished setup when the V2 link is disabled.
 if(status===null||!status.available)return null;
 return <section className="a-panel" aria-label="Almacenamiento del Chat">
  <h2>Almacenamiento del Chat</h2>
  {!status.available?
   <p className="a-detail">Conexión segura en preparación. HAVANA CLOUD funciona independientemente y no se ha modificado.</p>:
   status.linked?
   <div><p className="a-detail">Acceso a HAVANA CLOUD autorizado para el servidor V2. Los músicos no reciben acceso a tu nube. La subida de archivos seguirá deshabilitada hasta completar M01/M02.</p>
    <button type="button" disabled={busy} onClick={()=>void disconnect()}>{busy?'Procesando…':'Desvincular'}</button></div>:
   <form onSubmit={connect} className="a-admin-login">
    <p className="a-detail">Autoriza una vez el almacenamiento existente. La contraseña no se guarda; solo el servidor V2 conserva un acceso cifrado.</p>
    <label htmlFor="cloud-owner-password">Contraseña de HAVANA CLOUD</label>
    <input id="cloud-owner-password" type="password" autoComplete="off" maxLength={256} required
      value={password} onChange={e=>setPassword(e.target.value)}/>
    <button type="submit" disabled={busy||!password}>{busy?'Conectando…':'Vincular almacenamiento'}</button>
   </form>}
  {error&&<p role="alert" className="a-admin-error">{error}</p>}
 </section>;
}
