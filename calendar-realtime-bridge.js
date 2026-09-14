/* HAVANA NICE — CALENDAR REALTIME BRIDGE
   Uses the existing window.hnSupabase client created by index.html.
   Purpose: keep the musician calendar in sync immediately when Admin
   creates, edits, deletes, or changes event recipients.
*/
(function(){
  'use strict';
  let channel=null;
  let reconnectTimer=null;
  let started=false;

  const esc=v=>String(v??'').replace(/[&<>\'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmtDate=value=>{if(!value)return '';const d=new Date(value+'T00:00:00');return new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d)};
  const fmtTime=value=>value?String(value).slice(0,5):'';
  const mapsUrl=url=>{const v=String(url??'').trim();return /^https?:\/\//i.test(v)?v:''};

  function getProfileId(){
    try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')?.id||null}catch(_){return null}
  }

  async function refreshCalendar(){
    const client=window.hnSupabase;
    const list=document.getElementById('calendarList');
    if(!client||!list)return;
    const profileId=getProfileId();
    if(!profileId)return;
    const{data,error}=await client.rpc('get_calendar_events_for_profile',{p_profile_id:profileId});
    if(error){console.warn('HN calendar realtime refresh',error);return;}
    const events=data||[];
    list.innerHTML=events.length?events.map(e=>`<article class="calendar-event-card" data-event-id="${e.id}"><div class="calendar-event-day">${esc(fmtDate(e.event_date))}</div><div class="calendar-event-title-m">${esc(e.title)}</div>${e.venue?`<div class="calendar-event-venue">${esc(e.venue)}</div>`:''}${(e.call_time||e.soundcheck_time||e.show_time)?`<div class="calendar-time-grid">${e.call_time?`<div class="calendar-time-box"><span class="calendar-time-label">Llamada</span><span class="calendar-time-value">${esc(fmtTime(e.call_time))}</span></div>`:''}${e.soundcheck_time?`<div class="calendar-time-box"><span class="calendar-time-label">Sonido</span><span class="calendar-time-value">${esc(fmtTime(e.soundcheck_time))}</span></div>`:''}${e.show_time?`<div class="calendar-time-box"><span class="calendar-time-label">Show</span><span class="calendar-time-value">${esc(fmtTime(e.show_time))}</span></div>`:''}</div>`:''}${e.dress_code?`<div class="calendar-event-details-m"><strong>Vestuario:</strong> ${esc(e.dress_code)}</div>`:''}${e.details?`<div class="calendar-event-details-m">${esc(e.details)}</div>`:''}${e.contact_name?`<div class="calendar-event-details-m"><strong>Contacto:</strong> ${esc(e.contact_name)}${e.contact_phone?' · '+esc(e.contact_phone):''}</div>`:''}${e.notes?`<div class="calendar-event-details-m"><strong>Notas:</strong> ${esc(e.notes)}</div>`:''}${mapsUrl(e.map_url)?`<a class="calendar-map-button" href="${esc(mapsUrl(e.map_url))}" target="_blank" rel="noopener">Ir al lugar · Google Maps ↗</a>`:''}</article>`).join(''):'<div class="calendar-empty">No hay eventos programados</div>';
    const module=document.querySelector('.module[data-module="CALENDARIO DE EVENTOS"]');
    if(module){const sub=module.querySelector('.module-subtitle');if(sub)sub.textContent=events.length?(events.length+' evento'+(events.length===1?'':'s')):'Sin eventos programados';}
    window.dispatchEvent(new CustomEvent('hn-calendar-updated',{detail:{events,source:'realtime'}}));
  }

  async function subscribe(){
    const client=window.hnSupabase;
    if(!client)return;
    try{if(channel)await client.removeChannel(channel)}catch(_){}
    channel=client.channel('hn-calendar-realtime-bridge')
      .on('postgres_changes',{event:'*',schema:'public',table:'calendar_events'},()=>refreshCalendar())
      .on('postgres_changes',{event:'*',schema:'public',table:'calendar_event_recipients'},()=>refreshCalendar())
      .subscribe(status=>{
        if(status==='SUBSCRIBED')refreshCalendar();
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
          clearTimeout(reconnectTimer);
          reconnectTimer=setTimeout(()=>subscribe(),2500);
        }
      });
  }

  function boot(){
    if(started)return;
    if(!window.hnSupabase){setTimeout(boot,250);return;}
    started=true;
    refreshCalendar();
    subscribe();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
