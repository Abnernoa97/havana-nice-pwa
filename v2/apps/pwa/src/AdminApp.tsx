import {useCallback,useEffect,useState} from 'react';
import {fetchBackendHealth,type BackendHealth} from '@havana/shared';
import AdminChatAccess from './AdminChatAccess';

// The single Administrator PWA grows by module. Chat is the current workstream.
// Personal data and privileged actions are NEVER exposed without server-side auth.
type Tab='overview'|'requests'|'devices'|'members'|'security';
type Health={phase:'checking'|'online'|'offline';data:BackendHealth|null;at:string|null};
const tabs:{id:Tab;name:string;icon:string;description:string}[]=[
  {id:'overview',name:'Chat · Estado',icon:'⌂',description:'Funcionamiento del Chat de información'},
  {id:'requests',name:'Solicitudes',icon:'↗',description:'Aprobaciones de teléfonos nuevos'},
  {id:'devices',name:'Dispositivos',icon:'▣',description:'Teléfonos asociados al Chat'},
  {id:'members',name:'Músicos',icon:'♫',description:'Integrantes y permisos del Chat'},
  {id:'security',name:'Seguridad',icon:'◇',description:'Sesiones y protección del Chat'},
];
function Empty({title,text}:{title:string;text:string}) {
 return <div className="a-empty"><span aria-hidden="true">◎</span><h3>{title}</h3><p>{text}</p></div>;
}
export default function AdminApp(){
 const [tab,setTab]=useState<Tab>('overview');
 const [health,setHealth]=useState<Health>({phase:'checking',data:null,at:null});
 const [installEvent,setInstallEvent]=useState<Event|null>(null);
 const current=tabs.find(t=>t.id===tab)!;
 const refresh=useCallback(async()=>{
   try{
     const data=await fetchBackendHealth();
     setHealth({phase:data.ok&&data.database==='ok'?'online':'offline',data,
       at:new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})});
   }catch{
     setHealth(previous=>({...previous,phase:'offline'}));
   }
 },[]);
 useEffect(()=>{
   void refresh();
   const timer=window.setInterval(()=>{if(!document.hidden)void refresh();},45_000);
   const onReturn=()=>{if(!document.hidden)void refresh();};
   document.addEventListener('visibilitychange',onReturn);
   window.addEventListener('online',onReturn);
   return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',onReturn);window.removeEventListener('online',onReturn);};
 },[refresh]);
 useEffect(()=>{
   const save=(e:Event)=>{e.preventDefault();setInstallEvent(e);};
   window.addEventListener('beforeinstallprompt',save);
   return()=>window.removeEventListener('beforeinstallprompt',save);
 },[]);
 function install() {
   const e=installEvent as (Event&{prompt:()=>Promise<void>;userChoice:Promise<unknown>})|null;
   if(!e)return;
   void e.prompt().then(()=>e.userChoice).finally(()=>setInstallEvent(null));
 }
 const navigation=tabs.map(t=><button key={t.id} type="button" onClick={()=>setTab(t.id)}
  aria-current={t.id===tab?'page':undefined} className={t.id===tab?'active':''}>
  <span aria-hidden="true">{t.icon}</span><span>{t.name.replace('Chat · ','')}</span></button>);
 return <div className="a-shell">
  <header className="a-header">
   <div><strong>HAVANA NICE</strong><small>V2 / ADMINISTRADOR</small></div>
   <div className="a-header-tools">
    {installEvent&&<button type="button" className="a-install" onClick={install}>Instalar</button>}
    <span className="a-badge">CHAT</span>
   </div>
  </header>
  <div className="a-layout">
   <aside className="a-side">
    <div className="a-eyebrow">MÓDULO ACTUAL</div><h2 className="a-side-heading">Chat de información</h2>
    <nav aria-label="Administración del Chat">{navigation}</nav>
    <p>Un único panel para Chat, Calendario, Repertorio y los siguientes módulos, sin duplicar aplicaciones.</p>
   </aside>
   <main className="a-main">
    <div className="a-title"><span className="a-eyebrow">ADMINISTRADOR / CHAT DE INFORMACIÓN</span><h1>{current.name}</h1><p>{current.description}</p></div>
    {tab==='overview'&&<>
     <div className="a-health" role="status" aria-live="polite">
      <div className="a-health-main">
       <span className={health.phase==='online'?'a-health-dot online':'a-health-dot'} aria-hidden="true"/>
       <div><strong>{health.phase==='online'?'Servidor V2 conectado':health.phase==='checking'?'Comprobando conexión…':'No se pudo confirmar la conexión'}</strong>
        <p>Estado consultado directamente a HAVANA NICE V2, sin datos privados.</p></div>
      </div>
      <button className="a-refresh" type="button" onClick={()=>void refresh()}>Actualizar</button>
     </div>
     <div className="a-stats">
      <div className="a-stat"><small>Servidor de Chat</small><strong className="a-status-text">{health.phase==='online'?'Disponible':health.phase==='checking'?'Verificando':'Sin confirmar'}</strong><span>API real de Cloudflare</span></div>
      <div className="a-stat"><small>Base de datos</small><strong className="a-status-text">{health.phase==='online'&&health.data?.database==='ok'?'Conectada':'Sin confirmar'}</strong><span>Sin exponer información de músicos</span></div>
      <button className="a-stat" type="button" onClick={()=>setTab('requests')}><small>Solicitudes pendientes</small><strong>—</strong><span>Requieren autorización ›</span></button>
     </div>
     <section className="a-panel"><h2>Gestión del Chat</h2>
      <p className="a-detail">Una misma conversación en Android nativo e iPhone PWA; desde aquí se administrarán sus accesos y dispositivos cuando esté activa la seguridad S01/S02.</p>
      <div className="a-shortcuts">
       <button type="button" onClick={()=>setTab('requests')}>Solicitudes <span aria-hidden="true">›</span></button>
       <button type="button" onClick={()=>setTab('devices')}>Dispositivos <span aria-hidden="true">›</span></button>
       <button type="button" onClick={()=>setTab('members')}>Músicos <span aria-hidden="true">›</span></button>
      </div>
     </section>
    </>}
    <AdminChatAccess section={tab}/>
    {tab==='members'&&<section className="a-panel"><h2>Integrantes del Chat</h2>
     <Empty title="Permisos de músicos protegidos" text="La lista real solo estará disponible con una sesión administrativa autorizada por Cloudflare."/>
     <div className="a-actions"><button type="button" disabled>Administrar acceso</button></div>
    </section>}
    {tab==='security'&&<section className="a-panel"><h2>Seguridad de acceso</h2><div className="a-security">{[
      ['Identidad independiente','El nombre de un músico nunca concede privilegios administrativos.'],
      ['Dispositivos nuevos','Necesitan aprobación explícita antes de obtener acceso al Chat.'],
      ['Revocación individual','Se podrá bloquear cada dispositivo sin afectar a los demás.'],
      ['Sesiones existentes','Conservar el acceso e historial durante migraciones y actualizaciones.'],
      ['PWA actualizable','El Administrador comprueba la versión al regresar a la aplicación instalada.'],
     ].map(([title,body])=><div key={title}><strong>{title}</strong><p>{body}</p></div>)}</div></section>}
    <footer>HAVANA NICE V2 · Administrador único / Chat · {health.at?'Comprobado '+health.at:'Sin comprobar'}</footer>
   </main>
  </div>
  <nav className="a-bottom" aria-label="Secciones del Chat en Administrador">{navigation}</nav>
 </div>;
}
