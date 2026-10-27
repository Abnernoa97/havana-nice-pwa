import { useState } from 'react';

type Module = 'home' | 'calendar' | 'repertoire' | 'notices' | 'settings' | 'admin';
const modules: {id:Module; label:string; glyph:string}[] = [
  {id:'home',label:'Inicio',glyph:'⌂'},
  {id:'calendar',label:'Calendario',glyph:'▦'},
  {id:'repertoire',label:'Repertorio',glyph:'♫'},
  {id:'notices',label:'Avisos',glyph:'◌'},
  {id:'settings',label:'Ajustes',glyph:'⚙'},
];
function Placeholder({title,description}:{title:string;description:string}) {
  return <div className="visual-empty">
    <span className="visual-empty-icon" aria-hidden="true">◇</span>
    <h3>{title}</h3><p>{description}</p>
  </div>;
}
export default function VisualApp() {
  const [active,setActive]=useState<Module>('home');
  const title=active==='home'?'Inicio':active==='calendar'?'Calendario':active==='repertoire'?'Repertorio':active==='notices'?'Avisos':active==='settings'?'Ajustes':'Administración';
  return <div className="visual-shell">
    <header className="visual-header">
      <div><div className="visual-brand">HAVANA NICE</div><div className="visual-subtitle">PRIVATE MEMBERS · V2</div></div>
      <span className="visual-preview">Vista preliminar</span>
    </header>
    <div className="visual-layout">
      <aside className="visual-side" aria-label="Navegación de módulos">
        <p className="visual-side-title">MÓDULOS</p>
        {modules.map(m=><button key={m.id} type="button" className={active===m.id?'visual-nav active':'visual-nav'}
          aria-current={active===m.id?'page':undefined} onClick={()=>setActive(m.id)}>
          <span aria-hidden="true">{m.glyph}</span> {m.label}
        </button>)}
        <button type="button" className={active==='admin'?'visual-nav active':'visual-nav'}
          aria-current={active==='admin'?'page':undefined} onClick={()=>setActive('admin')}>
          <span aria-hidden="true">◇</span> Administración
        </button>
        <div className="visual-side-note">El Chat de Android permanece 100 % nativo y no se carga aquí.</div>
      </aside>
      <main className="visual-content" id="visual-content">
        <div className="visual-section-header">
          <span className="visual-overline">HAVANA NICE / {title.toUpperCase()}</span>
          <h1>{title}</h1>
          <p className="visual-intro">{active==='home'?'Tu espacio de trabajo para cada celebración.':active==='calendar'?'Toda la información de los eventos, en un solo lugar.':active==='repertoire'?'Canciones y listas organizadas para cada evento.':active==='notices'?'Actualizaciones del equipo y comunicaciones importantes.':active==='settings'?'Preferencias de la aplicación y del dispositivo.':'Gestión privada de músicos, eventos y permisos.'}</p>
        </div>
        {active==='home'&&<>
          <div className="visual-welcome"><div><span className="visual-overline">BIENVENIDOS</span><h2>Todo listo para organizarnos.</h2><p>Próximamente verás aquí tus eventos, repertorios y avisos reales.</p></div><span className="visual-mark" aria-hidden="true">HN</span></div>
          <div className="visual-grid">
            <button type="button" className="visual-tile" onClick={()=>setActive('calendar')}><span className="visual-overline">01 / AGENDA</span><strong>Calendario</strong><span>Consultar eventos y horarios <span aria-hidden="true">›</span></span></button>
            <button type="button" className="visual-tile" onClick={()=>setActive('repertoire')}><span className="visual-overline">02 / MÚSICA</span><strong>Repertorio</strong><span>Listas generales y por evento <span aria-hidden="true">›</span></span></button>
            <button type="button" className="visual-tile" onClick={()=>setActive('notices')}><span className="visual-overline">03 / EQUIPO</span><strong>Avisos</strong><span>Comunicaciones del grupo <span aria-hidden="true">›</span></span></button>
          </div>
          <Placeholder title="Próximos eventos" description="El calendario aún no está conectado. No se mostrarán eventos inventados ni datos privados."/>
        </>}
        {active==='calendar'&&<>
          <div className="visual-bar"><span>Eventos programados</span><span>Sin datos conectados</span></div>
          <Placeholder title="Agenda en preparación" description="Los eventos reales incluirán Llegar, Vestuario, Notas, Llamadas, Show y repertorio asociado, según los permisos."/>
        </>}
        {active==='repertoire'&&<>
          <div className="visual-bar"><span>General · Por evento</span><span>Sin canciones conectadas</span></div>
          <Placeholder title="Repertorio en preparación" description="La biblioteca de canciones, el checklist, el orden y los enlaces estarán disponibles cuando se conecten los datos reales."/>
        </>}
        {active==='notices'&&<Placeholder title="Avisos en preparación" description="Las comunicaciones y los estados leído/no leído se habilitarán con su almacenamiento y permisos."/>}
        {active==='settings'&&<Placeholder title="Ajustes en preparación" description="Las preferencias se habilitarán cuando puedan guardarse de forma segura para cada integrante."/>}
        {active==='admin'&&<>
          <div className="visual-restricted">ADMINISTRACIÓN SEPARADA DE ESTA VISTA PRELIMINAR</div>
          <Placeholder title="Administración en preparación" description="El Administrador real ya gestiona el acceso de músicos en /admin.html. Esta maqueta no abre una segunda entrada ni muestra información privada."/>
        </>}
      </main>
    </div>
    <nav className="visual-bottom-nav" aria-label="Navegación principal">
      {modules.slice(0,4).map(m=><button key={m.id} type="button" className={active===m.id?'active':''}
        aria-current={active===m.id?'page':undefined} onClick={()=>setActive(m.id)}>
        <span aria-hidden="true">{m.glyph}</span><small>{m.label}</small>
      </button>)}
      <button type="button" className={active==='settings'||active==='admin'?'active':''}
        aria-current={active==='settings'||active==='admin'?'page':undefined} onClick={()=>setActive('settings')}><span aria-hidden="true">⚙</span><small>Ajustes</small></button>
    </nav>
  </div>;
}
