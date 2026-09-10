/* HAVANA NICE — OPERATIONS V1
   Personalized home, Show Day and complete event sheet.
   Titles in English. Internal information in Spanish.
*/
(function(){
  'use strict';
  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  const DAY_NAMES=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const MONTH_NAMES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const time=v=>v?String(v).slice(0,5):'';
  const dateText=v=>{if(!v)return '';const d=new Date(v+'T00:00:00');return `${DAY_NAMES[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]} de ${d.getFullYear()}`;};
  const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const maps=v=>/^https?:\/\//i.test(String(v||'').trim())?String(v).trim():'';
  function client(){return import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(m=>m.createClient(SUPABASE_URL,SUPABASE_KEY));}
  function style(){if($('hnOperationsStyle'))return;const s=document.createElement('style');s.id='hnOperationsStyle';s.textContent=`
    .hn-myday{margin:-7px 0 22px;border:1px solid rgba(229,189,98,.62);background:linear-gradient(105deg,rgba(0,0,0,.66),rgba(35,25,8,.27),rgba(0,0,0,.52));backdrop-filter:blur(9px);padding:15px 16px;position:relative;overflow:hidden}
    .hn-myday::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 90% 0%,rgba(229,189,98,.10),transparent 40%);pointer-events:none}
    .hn-myday-kicker{color:var(--gold);font-size:8px;letter-spacing:.28em;text-transform:uppercase}
    .hn-myday-title{margin-top:7px;color:var(--white);font:400 25px/1.05 Georgia,'Times New Roman',serif;text-transform:uppercase}
    .hn-myday-date{margin-top:7px;color:rgba(244,241,232,.56);font-size:8px;letter-spacing:.12em;text-transform:uppercase}
    .hn-myday-venue{margin-top:8px;color:rgba(244,241,232,.78);font-size:10px;letter-spacing:.08em;text-transform:uppercase}
    .hn-myday-actions{display:flex;gap:7px;margin-top:13px;flex-wrap:wrap}
    .hn-myday-btn{flex:1;min-width:125px;padding:11px 10px;border:1px solid rgba(229,189,98,.55);background:rgba(0,0,0,.25);color:var(--gold-light);font-size:8px;letter-spacing:.18em;text-transform:uppercase}
    .hn-myday-btn.primary{background:linear-gradient(105deg,rgba(111,75,20,.35),rgba(255,221,130,.10),rgba(111,75,20,.35));border-color:var(--gold)}
    .hn-myday-alert{margin-top:11px;padding:9px 10px;border-left:2px solid var(--gold);background:rgba(229,189,98,.07);color:#fff1a8;font-size:8px;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}
    .hn-op-screen{padding-bottom:max(76px,env(safe-area-inset-bottom))!important}
    .hn-op-inner{width:min(100%,650px);height:100%;margin:0 auto;display:flex;flex-direction:column;padding-top:5px}
    .hn-op-head{text-align:center;flex:0 0 auto;margin-bottom:18px}
    .hn-op-heading{margin:20px 0 0;font:400 clamp(40px,11vw,68px)/.9 Georgia,'Times New Roman',serif;letter-spacing:-.035em;text-transform:uppercase}
    .hn-op-caption{margin:12px 0 0;color:rgba(244,241,232,.56);font-size:8px;letter-spacing:.30em;text-transform:uppercase}
    .hn-op-scroll{flex:1;min-height:0;overflow-y:auto;padding:3px 3px 28px 0}
    .hn-op-block{border:1px solid rgba(229,189,98,.38);background:linear-gradient(105deg,rgba(0,0,0,.55),rgba(28,20,8,.22),rgba(0,0,0,.42));padding:15px;margin-bottom:9px}
    .hn-op-label{color:rgba(244,241,232,.42);font-size:7px;letter-spacing:.20em;text-transform:uppercase}
    .hn-op-value{margin-top:5px;color:var(--white);font-size:11px;line-height:1.45}
    .hn-op-big{margin-top:6px;color:var(--gold-light);font:400 27px/1 Georgia,serif;text-transform:uppercase}
    .hn-op-timegrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
    .hn-op-time{border:1px solid rgba(229,189,98,.24);padding:10px;background:rgba(0,0,0,.22)}
    .hn-op-time strong{display:block;margin-top:5px;color:var(--gold-light);font:400 17px Georgia,serif}
    .hn-op-actions{display:grid;gap:8px;margin-bottom:10px}
    .hn-op-link{display:block;text-align:center;text-decoration:none;padding:13px;border:1px solid rgba(229,189,98,.62);color:var(--gold-light);background:rgba(0,0,0,.24);font-size:9px;letter-spacing:.18em;text-transform:uppercase}
    .hn-check{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);color:rgba(244,241,232,.78);font-size:10px}
    .hn-check:last-child{border-bottom:0}
    .hn-check input{width:17px;height:17px;accent-color:#e5bd62}
    .hn-check.done span{text-decoration:line-through;opacity:.42}
    .hn-op-back{display:block;width:100%;margin-top:8px;padding:12px;border:1px solid rgba(229,189,98,.45);background:rgba(0,0,0,.24);color:rgba(244,241,232,.72);font-size:9px;letter-spacing:.18em;text-transform:uppercase}
    @media(max-width:520px){.hn-op-timegrid{grid-template-columns:1fr 1fr}.hn-op-time:last-child{grid-column:1/-1}}
  `;document.head.appendChild(s)}
  function closeScreens(){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('is-active'));}
  function home(){closeScreens();$('homeScreen')?.classList.add('is-active');}
  function makeScreen(id,title,caption){if($(id))return $(id);const s=document.createElement('section');s.id=id;s.className='screen hn-op-screen';s.innerHTML=`<div class="hn-op-inner"><div class="hn-op-head"><p class="brand metallic-gold">HAVANA NICE</p><div class="brand-line"></div><h2 class="hn-op-heading metallic-gold">${title}</h2><p class="hn-op-caption">${caption}</p></div><div id="${id}Body" class="hn-op-scroll"></div><button id="${id}Back" class="hn-op-back" type="button">Volver</button></div>`;document.getElementById('experience')?.appendChild(s);$(id+'Back').onclick=home;return s;}
  async function init(){
    if(!$('homeScreen')||!document.querySelector('.modules'))return;
    style();
    const homeInner=document.querySelector('#homeScreen .home-inner');if(!homeInner)return;
    if(!$('hnMyDay')){const panel=document.createElement('section');panel.id='hnMyDay';panel.className='hn-myday';panel.setAttribute('aria-label','Mi día');const welcome=homeInner.querySelector('.welcome');welcome?.after(panel);}
    const eventScreen=makeScreen('eventDetailsScreen','Event Details','Ficha completa del evento');
    const showScreen=makeScreen('showDayScreen','Show Day','Modo de trabajo para hoy');
    let db;try{db=await client();}catch(e){console.error(e);return;}
    let events=[];
    async function load(){const{data,error}=await db.from('calendar_events').select('id,title,event_date,details,map_url,venue,call_time,soundcheck_time,show_time,dress_code,contact_name,contact_phone,notes,created_at,updated_at').order('event_date',{ascending:true});if(error){console.error('[HN-Operations]',error);return}events=data||[];renderHome();renderCalendarBridge();}
    function nextEvent(){const today=todayKey();return events.find(e=>e.event_date>=today)||null;}
    function renderHome(){const p=$('hnMyDay');if(!p)return;const e=nextEvent();if(!e){p.innerHTML=`<div class="hn-myday-kicker">MY DAY</div><div class="hn-myday-title">Sin eventos próximos</div><div class="hn-myday-date">El calendario está al día</div>`;return;}const today=e.event_date===todayKey();p.innerHTML=`<div class="hn-myday-kicker">MY DAY</div><div class="hn-myday-title">${esc(e.title)}</div><div class="hn-myday-date">${esc(dateText(e.event_date))}${today?' · HOY':''}</div>${e.venue?`<div class="hn-myday-venue">${esc(e.venue)}</div>`:''}<div class="hn-myday-actions"><button class="hn-myday-btn primary" id="hnOpenEvent" type="button">Event Details</button>${today?'<button class="hn-myday-btn" id="hnOpenShow" type="button">Show Day</button>':''}</div><div id="hnAlertSlot"></div>`;$('hnOpenEvent')?.addEventListener('click',()=>openEvent(e));$('hnOpenShow')?.addEventListener('click',()=>openShow(e));updateAlerts();}
    async function updateAlerts(){const slot=$('hnAlertSlot');if(!slot)return;try{const{data,error}=await db.from('notifications').select('id').order('created_at',{ascending:false}).limit(50);if(error||!data)return;let read=[];try{read=JSON.parse(localStorage.getItem('hn_notifications_read_v1')||'[]')}catch(_){}const unread=data.filter(x=>!read.includes(x.id)).length;if(unread)slot.innerHTML=`<div class="hn-myday-alert" id="hnAlertsButton">ALERTS · ${unread} pendiente${unread===1?'':'s'}</div>`;$('hnAlertsButton')?.addEventListener('click',()=>{const m=[...document.querySelectorAll('.module')].find(x=>x.querySelector('.module-title')?.textContent.trim().toUpperCase()==='NOTIFICACIONES');m?.click();});}catch(_){}}
    function openEvent(e){const body=$('eventDetailsScreenBody');if(!body)return;body.innerHTML=`<div class="hn-op-block"><div class="hn-op-label">Evento</div><div class="hn-op-big">${esc(e.title)}</div><div class="hn-op-value">${esc(dateText(e.event_date))}</div>${e.venue?`<div class="hn-op-value">${esc(e.venue)}</div>`:''}</div>${(e.call_time||e.soundcheck_time||e.show_time)?`<div class="hn-op-block"><div class="hn-op-timegrid">${e.call_time?`<div class="hn-op-time"><span class="hn-op-label">Llamada</span><strong>${esc(time(e.call_time))}</strong></div>`:''}${e.soundcheck_time?`<div class="hn-op-time"><span class="hn-op-label">Sonido</span><strong>${esc(time(e.soundcheck_time))}</strong></div>`:''}${e.show_time?`<div class="hn-op-time"><span class="hn-op-label">Show</span><strong>${esc(time(e.show_time))}</strong></div>`:''}</div></div>`:''}${e.dress_code?`<div class="hn-op-block"><div class="hn-op-label">DRESS CODE · Vestuario</div><div class="hn-op-value">${esc(e.dress_code)}</div></div>`:''}${e.details?`<div class="hn-op-block"><div class="hn-op-label">Información</div><div class="hn-op-value">${esc(e.details)}</div></div>`:''}${e.contact_name||e.contact_phone?`<div class="hn-op-block"><div class="hn-op-label">Contacto</div><div class="hn-op-value">${esc(e.contact_name||'')}${e.contact_phone?`<br>${esc(e.contact_phone)}`:''}</div></div>`:''}${e.notes?`<div class="hn-op-block"><div class="hn-op-label">Notas internas</div><div class="hn-op-value">${esc(e.notes)}</div></div>`:''}<div class="hn-op-actions">${maps(e.map_url)?`<a class="hn-op-link" href="${esc(maps(e.map_url))}" target="_blank" rel="noopener">IR AL LUGAR · GOOGLE MAPS ↗</a>`:''}${e.contact_phone?`<a class="hn-op-link" href="tel:${esc(e.contact_phone.replace(/[^+\d]/g,''))}">CONTACTAR · ${esc(e.contact_name||'CONTACTO')} ↗</a>`:''}</div>`;closeScreens();eventScreen.classList.add('is-active');}
    function openShow(e){const body=$('showDayScreenBody');if(!body)return;const key='hn_showday_'+e.id;let checks={};try{checks=JSON.parse(localStorage.getItem(key)||'{}')}catch(_){}const items=[['ready','Instrumentos y equipo listos'],['dress','Vestuario listo'],['leave','Salida hacia el venue'],['arrive','Llegada al venue'],['sound','Prueba de sonido realizada'],['show','Show listo']];body.innerHTML=`<div class="hn-op-block"><div class="hn-op-label">HOY · SHOW DAY</div><div class="hn-op-big">${esc(e.title)}</div><div class="hn-op-value">${e.venue?esc(e.venue)+' · ':''}${esc(dateText(e.event_date))}</div></div>${(e.call_time||e.soundcheck_time||e.show_time)?`<div class="hn-op-block"><div class="hn-op-timegrid">${e.call_time?`<div class="hn-op-time"><span class="hn-op-label">Llamada</span><strong>${esc(time(e.call_time))}</strong></div>`:''}${e.soundcheck_time?`<div class="hn-op-time"><span class="hn-op-label">Sonido</span><strong>${esc(time(e.soundcheck_time))}</strong></div>`:''}${e.show_time?`<div class="hn-op-time"><span class="hn-op-label">Show</span><strong>${esc(time(e.show_time))}</strong></div>`:''}</div></div>`:''}${e.dress_code?`<div class="hn-op-block"><div class="hn-op-label">DRESS CODE</div><div class="hn-op-value">${esc(e.dress_code)}</div></div>`:''}${e.details?`<div class="hn-op-block"><div class="hn-op-label">Información</div><div class="hn-op-value">${esc(e.details)}</div></div>`:''}${e.notes?`<div class="hn-op-block"><div class="hn-op-label">Notas</div><div class="hn-op-value">${esc(e.notes)}</div></div>`:''}${e.contact_name||e.contact_phone?`<div class="hn-op-block"><div class="hn-op-label">Contacto</div><div class="hn-op-value">${esc(e.contact_name||'')}${e.contact_phone?`<br>${esc(e.contact_phone)}`:''}</div></div>`:''}<div class="hn-op-block"><div class="hn-op-label">Checklist</div>${items.map(([id,label])=>`<label class="hn-check ${checks[id]?'done':''}"><input type="checkbox" data-check="${id}" ${checks[id]?'checked':''}><span>${label}</span></label>`).join('')}</div><div class="hn-op-actions">${maps(e.map_url)?`<a class="hn-op-link" href="${esc(maps(e.map_url))}" target="_blank" rel="noopener">IR AL LUGAR · GOOGLE MAPS ↗</a>`:''}${e.contact_phone?`<a class="hn-op-link" href="tel:${esc(e.contact_phone.replace(/[^+\d]/g,''))}">LLAMAR · ${esc(e.contact_name||'CONTACTO')} ↗</a>`:''}</div>`;body.querySelectorAll('[data-check]').forEach(input=>input.addEventListener('change',()=>{checks[input.dataset.check]=input.checked;localStorage.setItem(key,JSON.stringify(checks));input.closest('.hn-check')?.classList.toggle('done',input.checked)}));closeScreens();showScreen.classList.add('is-active');}
    function renderCalendarBridge(){document.querySelectorAll('.calendar-event-card').forEach(card=>{if(card.dataset.hnEventBound)return;const e=events.find(x=>x.id===card.dataset.eventId);if(!e)return;card.dataset.hnEventBound='1';card.style.cursor='pointer';card.addEventListener('click',ev=>{if(ev.target.closest('a'))return;openEvent(e);});});}
    window.hnOpenEvent=openEvent;window.hnOpenShow=openShow;window.hnCalendarEvents=()=>events;
    load();db.channel('hn-operations-calendar').on('postgres_changes',{event:'*',schema:'public',table:'calendar_events'},()=>load()).subscribe();setInterval(load,5000);setInterval(updateAlerts,5000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();