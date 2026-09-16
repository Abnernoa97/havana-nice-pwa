/* HAVANA NICE — CALENDAR V5
   One calendar owner for musician data/screen creation.
   Recipient visibility is enforced by get_calendar_events_for_profile().
   No musician-side recipient filter, no polling.
*/
(function(){
  'use strict';

  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  let clientPromise=null;
  let musicianReady=false;
  let realtimeStarted=false;

  function isAdmin(){return document.title.includes('ADMIN')||!!document.getElementById('loginCard');}
  function loadSupabase(){
    if(window.hnSupabase&&typeof window.hnSupabase.rpc==='function')return Promise.resolve(window.hnSupabase);
    if(window.hnAdminSupabase&&typeof window.hnAdminSupabase.rpc==='function')return Promise.resolve(window.hnAdminSupabase);
    if(!clientPromise)clientPromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(m=>m.createClient(SUPABASE_URL,SUPABASE_KEY));
    return clientPromise;
  }
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function fmtDate(v){if(!v)return '';return new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(v+'T00:00:00'));}
  function fmtTime(v){return v?String(v).slice(0,5):'';}
  function mapsUrl(v){v=String(v??'').trim();return /^https?:\/\//i.test(v)?v:'';}
  function style(css,id){if(document.getElementById(id))return;const s=document.createElement('style');s.id=id;s.textContent=css;document.head.appendChild(s);}

  async function initAdmin(){
    const app=document.getElementById('app');if(!app)return;
    style('.calendar-card{grid-column:1/-1!important}.calendar-form{display:grid;grid-template-columns:1.15fr .7fr;gap:8px}.calendar-form textarea{min-height:76px}.calendar-form .full{grid-column:1/-1}.calendar-form .time-grid{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.calendar-form .field-label{display:block;margin:2px 0 5px;color:#8f908b;font-size:8px;letter-spacing:.12em;text-transform:uppercase}.calendar-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.calendar-event{border-top:1px solid #292a27;padding:15px 0;display:flex;justify-content:space-between;gap:15px}.calendar-event-main{min-width:0}.calendar-event-title{text-transform:uppercase;letter-spacing:.1em;color:#f4f1e8}.calendar-event-date{color:var(--gold);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-top:6px}.calendar-event-details{font-size:9px;color:var(--muted);margin-top:7px;line-height:1.5;white-space:pre-wrap}.calendar-meta{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:9px;color:#8f908b;font-size:8px;letter-spacing:.08em;text-transform:uppercase}.calendar-meta strong{color:#f4f1e8;font-weight:500}.calendar-map-link{display:inline-block;margin-top:9px;color:var(--gold2);font-size:9px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none}@media(max-width:760px){.calendar-card{grid-column:auto!important}.calendar-form{grid-template-columns:1fr}.calendar-form .full{grid-column:auto}.calendar-form .time-grid{grid-template-columns:1fr}}','hn-calendar-admin-v5');
    const dashboard=app.querySelector('.dashboard');if(!dashboard)return;
    const systemCard=[...dashboard.querySelectorAll('.card')].find(c=>c.querySelector('#statMusicians'));if(!systemCard||document.getElementById('calendarAdminCard'))return;
    const eyebrow=systemCard.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='05 · Sistema';
    const card=document.createElement('section');card.className='card calendar-card';card.id='calendarAdminCard';
    card.innerHTML='<div class="card-head"><div><div class="eyebrow">04 · Calendario</div><h1>Calendario de eventos</h1><div class="sub">Crea la ficha completa del trabajo y el acceso directo al lugar.</div></div></div><div class="calendar-form"><div><span class="field-label">Evento / nombre</span><input id="cTitle" placeholder="Ej. Boda Kelly & Jericho"></div><div><span class="field-label">Fecha</span><input id="cDate" type="date"></div><div class="full"><span class="field-label">Lugar / venue</span><input id="cVenue" placeholder="Nombre del venue o lugar de trabajo"></div><div class="time-grid"><div><span class="field-label">Hora de llamada</span><input id="cCall" type="time"></div><div><span class="field-label">Prueba de sonido</span><input id="cSound" type="time"></div><div><span class="field-label">Show</span><input id="cShow" type="time"></div></div><div class="full"><span class="field-label">Detalles</span><textarea id="cDetails" placeholder="Información general del trabajo"></textarea></div><div><span class="field-label">Vestuario</span><input id="cDress" placeholder="Ej. Traje negro / formal"></div><div><span class="field-label">Contacto</span><input id="cContact" placeholder="Nombre del contacto"></div><div><span class="field-label">Teléfono</span><input id="cPhone" type="tel" placeholder="WhatsApp / teléfono"></div><div><span class="field-label">Notas internas</span><input id="cNotes" placeholder="Notas importantes"></div><div class="full"><span class="field-label">Google Maps</span><input id="cMap" type="url" placeholder="Enlace directo a Google Maps"></div></div><div class="calendar-actions"><button id="cSave">Añadir al calendario</button><button id="cCancel" class="danger" style="display:none">Cancelar edición</button></div><div id="cMsg" class="msg"></div><div id="cList"></div>';
    dashboard.insertBefore(card,systemCard);
    const s=await loadSupabase(),$=id=>document.getElementById(id);let events=[],editingId=null;
    async function load(){const{data,error}=await s.rpc('admin_list_calendar_events');if(error){$('cMsg').textContent='Error al cargar calendario';return}events=data||[];render();}
    function render(){$('cList').innerHTML=events.length?events.map(e=>`<div class="calendar-event"><div class="calendar-event-main"><div class="calendar-event-title">${esc(e.title)}</div><div class="calendar-event-date">${esc(fmtDate(e.event_date))}</div>${e.venue?`<div class="calendar-meta"><strong>${esc(e.venue)}</strong>${e.call_time?`<span>Llamada ${esc(fmtTime(e.call_time))}</span>`:''}${e.soundcheck_time?`<span>Sonido ${esc(fmtTime(e.soundcheck_time))}</span>`:''}${e.show_time?`<span>Show ${esc(fmtTime(e.show_time))}</span>`:''}</div>`:''}${e.dress_code?`<div class="calendar-event-details"><strong>Vestuario:</strong> ${esc(e.dress_code)}</div>`:''}${e.details?`<div class="calendar-event-details">${esc(e.details)}</div>`:''}${e.contact_name?`<div class="calendar-event-details"><strong>Contacto:</strong> ${esc(e.contact_name)}${e.contact_phone?' · '+esc(e.contact_phone):''}</div>`:''}${e.notes?`<div class="calendar-event-details"><strong>Notas:</strong> ${esc(e.notes)}</div>`:''}${mapsUrl(e.map_url)?`<a class="calendar-map-link" href="${esc(mapsUrl(e.map_url))}" target="_blank" rel="noopener">Abrir Google Maps ↗</a>`:''}</div><div class="actions"><button class="cedit" data-id="${e.id}">Editar</button><button class="cdel danger" data-id="${e.id}">Borrar</button></div></div>`).join(''):'<div class="empty">No hay eventos en el calendario</div>';
      document.querySelectorAll('.cedit').forEach(b=>b.onclick=()=>{const e=events.find(x=>x.id===b.dataset.id);if(!e)return;editingId=e.id;const map={cTitle:'title',cDate:'event_date',cVenue:'venue',cDetails:'details',cDress:'dress_code',cContact:'contact_name',cPhone:'contact_phone',cNotes:'notes',cMap:'map_url'};Object.entries(map).forEach(([id,key])=>$(id).value=e[key]||'');$('cCall').value=fmtTime(e.call_time);$('cSound').value=fmtTime(e.soundcheck_time);$('cShow').value=fmtTime(e.show_time);$('cSave').textContent='Guardar cambios';$('cCancel').style.display='inline-block';$('cTitle').focus()});
      document.querySelectorAll('.cdel').forEach(b=>b.onclick=async()=>{if(!confirm('¿Borrar este evento del calendario?'))return;const{error}=await s.rpc('admin_delete_calendar_event',{p_id:b.dataset.id});if(error){$('cMsg').textContent='No se pudo borrar';return}load()});
    }
    function reset(){editingId=null;['cTitle','cDate','cVenue','cCall','cSound','cShow','cDetails','cDress','cContact','cPhone','cNotes','cMap'].forEach(id=>{if($(id))$(id).value=''});$('cSave').textContent='Añadir al calendario';$('cCancel').style.display='none';}
    $('cCancel').onclick=()=>{reset();$('cMsg').textContent=''};
    $('cSave').onclick=async()=>{const title=$('cTitle').value.trim(),date=$('cDate').value,venue=$('cVenue').value.trim(),call=$('cCall').value||null,sound=$('cSound').value||null,show=$('cShow').value||null,details=$('cDetails').value.trim(),dress=$('cDress').value.trim(),contact=$('cContact').value.trim(),phone=$('cPhone').value.trim(),notes=$('cNotes').value.trim(),map=$('cMap').value.trim();if(!title||!date){$('cMsg').textContent='Completa evento y fecha';return}if(map&&!/^https?:\/\//i.test(map)){$('cMsg').textContent='El enlace de Maps debe comenzar con https://';return}const button=$('cSave'),id=editingId;button.disabled=true;button.textContent=id?'Guardando…':'Añadiendo…';try{const rpc=id?'admin_update_calendar_event':'admin_create_calendar_event';const p=id?{p_id:id,p_title:title,p_event_date:date,p_details:details,p_map_url:map||null,p_venue:venue,p_call_time:call,p_soundcheck_time:sound,p_show_time:show,p_dress_code:dress,p_contact_name:contact,p_contact_phone:phone,p_notes:notes}:{p_title:title,p_event_date:date,p_details:details,p_map_url:map||null,p_venue:venue,p_call_time:call,p_soundcheck_time:sound,p_show_time:show,p_dress_code:dress,p_contact_name:contact,p_contact_phone:phone,p_notes:notes};const{error}=await s.rpc(rpc,p);if(error)throw error;reset();$('cMsg').textContent=id?'Calendario actualizado':'Evento añadido';await load()}catch(e){console.error(e);$('cMsg').textContent='No se pudo guardar el evento'}finally{button.disabled=false;button.textContent='Añadir al calendario'}};
    load();
    s.channel('calendar-events-admin-v5').on('postgres_changes',{event:'*',schema:'public',table:'calendar_events'},load).subscribe();
  }

  function profileId(){try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')?.id||null}catch(_){return null}}

  function ensureMusicianScreen(){
    if(document.getElementById('calendarScreen'))return document.getElementById('calendarScreen');
    const moduleScreen=document.getElementById('moduleScreen');if(!moduleScreen||!moduleScreen.parentNode)return null;
    style('.calendar-screen{padding-bottom:max(76px,env(safe-area-inset-bottom))}.calendar-inner{width:min(100%,650px);height:100%;margin:0 auto;display:flex;flex-direction:column;padding-top:5px}.calendar-header{text-align:center;margin-bottom:18px;flex:0 0 auto}.calendar-heading{margin:20px 0 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(40px,11vw,68px);font-weight:400;line-height:.9;letter-spacing:-.035em;text-transform:uppercase}.calendar-caption{margin:12px 0 0;color:rgba(244,241,232,.56);font-size:8px;letter-spacing:.30em;text-transform:uppercase}.calendar-list{flex:1;min-height:0;overflow-y:auto;padding:4px 3px 28px 0;scrollbar-width:thin}.calendar-event-card{border:1px solid rgba(229,189,98,.40);background:linear-gradient(105deg,rgba(0,0,0,.54),rgba(28,20,8,.25),rgba(0,0,0,.42));padding:16px;margin-bottom:9px;backdrop-filter:blur(7px)}.calendar-event-day{color:var(--gold);font-size:9px;letter-spacing:.22em;text-transform:uppercase}.calendar-event-title-m{margin-top:7px;color:var(--white);font-family:Georgia,"Times New Roman",serif;font-size:24px;line-height:1.05}.calendar-event-venue{margin-top:8px;color:rgba(244,241,232,.82);font-size:10px;letter-spacing:.08em;text-transform:uppercase}.calendar-time-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:13px}.calendar-time-box{border:1px solid rgba(229,189,98,.24);padding:9px 8px;background:rgba(0,0,0,.22)}.calendar-time-label{display:block;color:rgba(244,241,232,.42);font-size:7px;letter-spacing:.12em;text-transform:uppercase}.calendar-time-value{display:block;margin-top:4px;color:var(--gold-light);font-family:Georgia,serif;font-size:15px}.calendar-event-details-m{margin-top:10px;color:rgba(244,241,232,.70);font-size:10px;line-height:1.55;white-space:pre-wrap}.calendar-map-button{display:block;margin-top:13px;padding:12px 13px;border:1px solid rgba(229,189,98,.62);color:var(--gold-light);text-decoration:none;text-align:center;font-size:9px;letter-spacing:.18em;text-transform:uppercase;background:rgba(0,0,0,.24)}.calendar-empty{text-align:center;color:rgba(244,241,232,.45);font-size:9px;letter-spacing:.16em;text-transform:uppercase;padding:38px 10px}@media(max-width:520px){.calendar-time-grid{grid-template-columns:1fr 1fr}.calendar-time-box:last-child{grid-column:1/-1}}','hn-calendar-musician-v5');
    const screen=document.createElement('section');screen.id='calendarScreen';screen.className='screen calendar-screen';screen.innerHTML='<div class="calendar-inner"><div class="calendar-header"><p class="brand metallic-gold">HAVANA NICE</p><div class="brand-line"></div><h2 class="calendar-heading metallic-gold">Calendario</h2><p class="calendar-caption">Eventos · Fechas de trabajo</p></div><div id="calendarList" class="calendar-list"></div></div>';
    moduleScreen.parentNode.insertBefore(screen,moduleScreen);
    return screen;
  }

  function renderMusician(events){
    const list=document.getElementById('calendarList');if(!list)return;
    list.innerHTML=events.length?events.map(e=>`<article class="calendar-event-card"><div class="calendar-event-day">${esc(fmtDate(e.event_date))}</div><div class="calendar-event-title-m">${esc(e.title)}</div>${e.venue?`<div class="calendar-event-venue">${esc(e.venue)}</div>`:''}<div class="calendar-time-grid">${e.call_time?`<div class="calendar-time-box"><span class="calendar-time-label">Llamada</span><span class="calendar-time-value">${esc(fmtTime(e.call_time))}</span></div>`:''}${e.soundcheck_time?`<div class="calendar-time-box"><span class="calendar-time-label">Sonido</span><span class="calendar-time-value">${esc(fmtTime(e.soundcheck_time))}</span></div>`:''}${e.show_time?`<div class="calendar-time-box"><span class="calendar-time-label">Show</span><span class="calendar-time-value">${esc(fmtTime(e.show_time))}</span></div>`:''}</div>${e.dress_code?`<div class="calendar-event-details-m"><strong>Vestuario:</strong> ${esc(e.dress_code)}</div>`:''}${e.details?`<div class="calendar-event-details-m">${esc(e.details)}</div>`:''}${e.contact_name?`<div class="calendar-event-details-m"><strong>Contacto:</strong> ${esc(e.contact_name)}${e.contact_phone?' · '+esc(e.contact_phone):''}</div>`:''}${e.notes?`<div class="calendar-event-details-m"><strong>Notas:</strong> ${esc(e.notes)}</div>`:''}${mapsUrl(e.map_url)?`<a class="calendar-map-button" href="${esc(mapsUrl(e.map_url))}" target="_blank" rel="noopener noreferrer">Abrir Google Maps ↗</a>`:''}</article>`).join(''):'<div class="calendar-empty">No tienes eventos asignados</div>';
  }

  async function loadMusician(){
    ensureMusicianScreen();
    const id=profileId();if(!id){renderMusician([]);return;}
    const s=await loadSupabase();
    const{data,error}=await s.rpc('get_calendar_events_for_profile',{p_profile_id:id});
    if(error){console.error('HAVANA NICE calendar:',error);renderMusician([]);return;}
    renderMusician(data||[]);
  }

  function startMusician(){
    if(musicianReady)return;
    musicianReady=true;
    const boot=()=>{ensureMusicianScreen();loadMusician();};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
    window.addEventListener('hn:session-ready',()=>loadMusician());
    if(!realtimeStarted){
      realtimeStarted=true;
      loadSupabase().then(s=>s.channel('calendar-musician-v5').on('postgres_changes',{event:'*',schema:'public',table:'calendar_events'},()=>loadMusician()).on('postgres_changes',{event:'*',schema:'public',table:'calendar_event_recipients'},()=>loadMusician()).subscribe());
    }
    const observer=new MutationObserver(()=>{ensureMusicianScreen();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  function boot(){if(isAdmin())initAdmin();else startMusician();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
