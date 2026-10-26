import {useState} from 'react';

// Structural PWA only: no credentials, private records or privileged API calls.
// Administrative actions require independent server-side authentication first.
type Page='summary'|'requests'|'devices'|'members'|'security';
const entries:{key:Page;name:string;symbol:string;description:string}[]=[
 {key:'summary',name:'Resumen',symbol:'⌂',description:'Control general del Chat'},
 {key:'requests',name:'Solicitudes',symbol:'↗',description:'Nuevos teléfonos que solicitan acceso'},
 {key:'devices',name:'Dispositivos',symbol:'▣',description:'Teléfonos asociados a los músicos'},
 {key:'members',name:'Músicos',symbol:'♫',description:'Integrantes y autorizaciones'},
 {key:'security',name:'Seguridad',symbol:'◇',description:'Sesiones, privacidad y permisos'},
];
function Empty({title,text}:{title:string;text:string}){return <div className="a-empty"><span aria-hidden="true">◎</span><h3>{title}</h3><p>{text}</p></div>}
export default function AdminApp(){
 const [page,setPage]=useState<Page>('summary');
 const active=entries.find(x=>x.key===page)!;
 const navigation=entries.map(x=><button type="button" key={x.key} onClick={()=>setPage(x.key)}
   className={x.key===page?'active':''} aria-current={x.key===page?'page':undefined}>
   <span aria-hidden="true">{x.symbol}</span><span>{x.name}</span></button>);
 return <div className="a-shell">
  <header className="a-header"><div><strong>HAVANA NICE</strong><small>V2 / ADMINISTRACIÓN DEL CHAT</small></div><span className="a-badge">VISTA PRELIMINAR</span></header>
  <div className="a-layout">
   <aside className="a-side"><div className="a-eyebrow">ADMINISTRADOR</div><nav aria-label="Navegación de administrador">{navigation}</nav><p>Chat Android nativo · Chat iPhone PWA<br/>Permisos definidos en el servidor</p></aside>
   <main className="a-main">
    <div className="a-title"><span className="a-eyebrow">GESTIÓN PRIVADA DEL CHAT</span><h1>{active.name}</h1><p>{active.description}</p></div>
    <div className="a-warning" role="status"><span aria-hidden="true">◈</span><div><strong>Acceso administrativo todavía no habilitado</strong><p>Esta pantalla muestra la estructura definitiva del panel. Datos, autenticación y acciones reales se conectarán cuando estén verificados los permisos del servidor. Ningún cambio se ejecuta desde esta vista.</p></div></div>
    {page==='summary'&&<>
     <div className="a-stats">{[
       {label:'Solicitudes pendientes',desc:'Aprobación de teléfonos',go:'requests' as Page},
       {label:'Dispositivos autorizados',desc:'Sesiones de cada músico',go:'devices' as Page},
       {label:'Músicos del Chat',desc:'Accesos del equipo',go:'members' as Page},
      ].map(c=><button key={c.go} className="a-stat" type="button" onClick={()=>setPage(c.go)}>
       <small>{c.label}</small><strong>—</strong><span>{c.desc} ›</span></button>)}</div>
     <section className="a-panel"><h2>Actividad de acceso</h2><Empty title="Sin datos conectados" text="Aquí aparecerán únicamente las solicitudes y sesiones reales después de iniciar sesión como administrador."/></section>
    </>}
    {page==='requests'&&<section className="a-panel"><h2>Solicitudes de nuevos teléfonos</h2><p className="a-detail">Un nuevo dispositivo debe esperar tu autorización; el nombre de un músico por sí solo no concede acceso.</p><Empty title="Solicitudes protegidas" text="Cuando el servidor esté conectado podrás revisar cada solicitud, aprobarla o rechazarla."/><div className="a-actions"><button disabled type="button">Aprobar</button><button disabled type="button">Rechazar</button></div></section>}
    {page==='devices'&&<section className="a-panel"><h2>Dispositivos vinculados</h2><Empty title="Teléfonos autorizados" text="Aquí podrás consultar cada teléfono, su músico y revocar únicamente el dispositivo elegido."/><div className="a-actions"><button type="button" disabled>Revocar dispositivo</button></div></section>}
    {page==='members'&&<section className="a-panel"><h2>Integrantes del Chat</h2><Empty title="Músicos autorizados" text="La lista real se consultará con sesión de administrador, sin exponer identidades al público."/><div className="a-actions"><button type="button" disabled>Administrar acceso</button></div></section>}
    {page==='security'&&<section className="a-panel"><h2>Protecciones de acceso</h2><div className="a-security">{[
      ['Cuenta administrativa independiente','El nombre de un músico nunca debe servir como contraseña de administrador.'],
      ['Autorización por dispositivo','Cada teléfono nuevo tendrá que solicitar acceso y esperar aprobación.'],
      ['Revocación individual','Se bloqueará un dispositivo sin cerrar las demás sesiones legítimas.'],
      ['Datos privados','Ni claves de administración ni conversaciones se almacenan en esta interfaz.'],
    ].map(([a,b])=><div key={a}><strong>{a}</strong><p>{b}</p></div>)}</div></section>}
    <footer>HAVANA NICE V2 · Panel administrativo estructural · Sin operaciones activas</footer>
   </main>
  </div>
  <nav className="a-bottom" aria-label="Administración móvil">{navigation}</nav>
 </div>;
}
