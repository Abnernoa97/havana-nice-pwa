/* HAVANA NICE — CALENDAR RECIPIENTS V1 */
(function(){
  'use strict';
  const URL='https://xzfradccsxonmauinecl.supabase.co';
  const KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  let clientPromise=null;
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  function sb(){if(!clientPromise)clientPromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(m=>m.createClient(URL,KEY));return clientPromise;}
  const admin=()=>document.title.includes('ADMIN')||!!document.getElementById('loginCard');
  if(admin()) initAdmin(); else initMusician();

  async function initAdmin(){
    let active=[], selected=new Set(), currentEventId=null;
    const wait=()=>new Promise(resolve=>{const find=()=>{const card=document.getElementById('calendarAdminCard');const save=document.getElementById('cSave');if(card&&save){resolve({card,save});return}setTimeout(find,250)};find()});
    const {card,save}=await wait();
    const s=await sb();
    const style=document.createElement('style');style.textContent=`#calendarRecipients{margin-top:10px;padding:12px;border:1px solid #3d321e;background:#070806}.cr-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.cr-title{color:#e5bd62;font-size:9px;letter-spacing:.14em;text-transform:uppercase}.cr-actions{display:flex;gap:6px;flex-wrap:wrap}.cr-actions button{font-size:8px;padding:7px 9px}.cr-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}.cr-item{display:flex;align-items:center;gap:8px;border:1px solid #292a27;padding:9px;background:#050605;min-height:42px}.cr-item input{width:17px;height:17px;flex:0 0 17px}.cr-name{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#f4f1e8}.cr-help{font-size:8px;color:#777;margin-top:8px;line-height:1.4}.cr-empty{font-size:8px;color:#777;padding:10px 0}.cr-count{color:#9b9b96;font-size:8px;letter-spacing:.08em}@media(max-width:600px){.cr-list{grid-template-columns:1fr}}`;document.head.appendChild(style);
    const box=document.createElement('div');box.id='calendarRecipients';box.innerHTML='<div class="cr-head"><div><div class="cr-title">Quién recibe esta fecha</div><div class="cr-count" id="crCount">0 seleccionados</div></div><div class="cr-actions"><button type="button" id="crAll">Todos</button><button type="button" id="crNone">Ninguno</button></div></div><div id="crList" class="cr-list"></div><div class="cr-help">Solo los músicos seleccionados verán esta fecha y sus detalles en su Calendario.</div>';
    const form=card.querySelector('.calendar-form');form.insertAdjacentElement('afterend',box);
    const list=box.querySelector('#crList'),count=box.querySelector('#crCount');
    async function loadActive(){const{data,error}=await s.rpc('admin_list_musicians');if(error){list.innerHTML='<div class="cr-empty">Inicia sesión de administración para cargar los músicos.</div>';return false}active=(data||[]).filter(x=>x.active);render();return true;}
    function render(){list.innerHTML=active.length?active.map(p=>`<label class="cr-item"><input type="checkbox" class="cr-check" value="${p.id}"><span class="cr-name">${esc(p.username)}</span></label>`).join(''):'<div class="cr-empty">No hay músicos activos.</div>';list.querySelectorAll('.cr-check').forEach(x=>{x.checked=selected.has(x.value);x.addEventListener('change',()=>{if(x.checked)selected.add(x.value);else selected.delete(x.value);updateCount()})});updateCount();}
    function updateCount(){count.textContent=`${selected.size} seleccionado${selected.size===1?'':'s'}`;}
    function setAll(on){selected=new Set(on?active.map(x=>x.id):[]);render();}
    box.querySelector('#crAll').onclick=()=>setAll(true);box.querySelector('#crNone').onclick=()=>setAll(false);
    async function getRecipients(id){const{data,error}=await s.rpc('admin_list_calendar_recipients',{p_event_id:id});if(error)return[];return data||[];}
    async function selectForEvent(id){currentEventId=id;const rows=await getRecipients(id);selected=new Set(rows.map(x=>x.profile_id));render();}
    document.addEventListener('click',e=>{const b=e.target.closest('.cedit');if(b)setTimeout(()=>selectForEvent(b.dataset.id),0);const cancel=e.target.closest('#cCancel');if(cancel)setTimeout(()=>{currentEventId=null;selected=new Set(active.map(x=>x.id));render();},0);},true);
    function getFields(){const $=id=>document.getElementById(id);return{title:$('cTitle').value.trim(),date:$('cDate').value,venue:$('cVenue').value.trim(),call:$('cCall').value||null,sound:$('cSound').value||null,show:$('cShow').value||null,details:$('cDetails').value.trim(),dress:$('cDress').value.trim(),contact:$('cContact').value.trim(),phone:$('cPhone').value.trim(),notes:$('cNotes').value.trim(),map:$('cMap').value.trim()};}
    function wrapSave(){if(save.dataset.crWrapped==='1')return;save.dataset.crWrapped='1';const original=save.onclick;save.onclick=async function(){const beforeId=currentEventId;const fields=getFields();const recipients=[...selected];if(!fields.title||!fields.date){original?.call(save);return;}if(!recipients.length){const msg=document.getElementById('cMsg');if(msg)msg.textContent='Selecciona al menos un músico para esta fecha.';return;}save.disabled=true;save.textContent=beforeId?'Guardando…':'Añadiendo…';try{let eventId=beforeId;const rpc=beforeId?'admin_update_calendar_event':'admin_create_calendar_event';const params=beforeId?{p_id:beforeId,p_title:fields.title,p_event_date:fields.date,p_details:fields.details,p_map_url:fields.map||null,p_venue:fields.venue,p_call_time:fields.call,p_soundcheck_time:fields.sound,p_show_time:fields.show,p_dress_code:fields.dress,p_contact_name:fields.contact,p_contact_phone:fields.phone,p_notes:fields.notes}:{p_title:fields.title,p_event_date:fields.date,p_details:fields.details,p_map_url:fields.map||null,p_venue:fields.venue,p_call_time:fields.call,p_soundcheck_time:fields.sound,p_show_time:fields.show,p_dress_code:fields.dress,p_contact_name:fields.contact,p_contact_phone:fields.phone,p_notes:fields.notes};const{data,error}=await s.rpc(rpc,params);if(error)throw error;eventId=eventId||(data?.id||data?.[0]?.id);if(!eventId){const q=await s.rpc('admin_list_calendar_events');const rows=q.data||[];eventId=rows.filter(x=>x.title===fields.title&&x.event_date===fields.date).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0]?.id;}if(!eventId)throw new Error('event_id_missing');const{error:saveError}=await s.rpc('admin_save_calendar_recipients',{p_event_id:eventId,p_profile_ids:recipients});if(saveError)throw saveError;const msg=document.getElementById('cMsg');if(msg)msg.textContent=beforeId?'Calendario y destinatarios actualizados':'Evento creado y enviado a los músicos seleccionados';currentEventId=null;selected=new Set(active.map(x=>x.id));if(document.getElementById('cCancel'))document.getElementById('cCancel').click();render();setTimeout(()=>location.reload(),350);}catch(err){console.error(err);const msg=document.getElementById('cMsg');if(msg)msg.textContent='No se pudo guardar la fecha o sus destinatarios.';}finally{save.disabled=false;save.textContent='Añadir al calendario';}};}
    await loadActive();selected=new Set(active.map(x=>x.id));render();wrapSave();
    s.auth.onAuthStateChange(async(event,session)=>{if(session){await loadActive();if(!currentEventId)selected=new Set(active.map(x=>x.id));render();}});
    setInterval(async()=>{if(document.getElementById('app')&&!document.getElementById('app').classList.contains('hidden'))await loadActive();},15000);
    new MutationObserver(()=>wrapSave()).observe(card,{childList:true,subtree:true});
  }

  async function initMusician(){
    const module=[...document.querySelectorAll('.module[data-module]')].find(x=>x.dataset.module==='CALENDARIO DE EVENTOS');if(!module)return;
    const s=await sb();
    const session=()=>{try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')}catch(_){return null}};
    const profile=()=>session()?.id||null;
    let applying=false;
    async function filter(){const id=profile();if(!id)return[];const{data,error}=await s.rpc('get_calendar_events_for_profile',{p_profile_id:id});if(error){console.error('Calendar recipients error',error);return[];}return data||[];}
    function renderFiltered(rows){const list=document.getElementById('calendarList');if(!list)return;const byId=new Set(rows.map(x=>x.id));list.querySelectorAll('.calendar-event-card').forEach(card=>{card.style.display=byId.has(card.dataset.eventId)?'':'none'});const empty=list.querySelector('.calendar-empty');if(empty)empty.style.display=rows.length?'none':'';}
    async function apply(){if(applying)return;applying=true;try{renderFiltered(await filter());}finally{applying=false;}}
    window.addEventListener('hn-calendar-updated',apply);
    const observer=new MutationObserver(()=>apply());const target=document.getElementById('calendarList');if(target)observer.observe(target,{childList:true,subtree:true});
    try{s.channel('calendar-recipient-sync').on('postgres_changes',{event:'*',schema:'public',table:'calendar_event_recipients'},()=>apply()).subscribe();}catch(e){console.warn('calendar recipient realtime',e)}
    setTimeout(apply,700);setInterval(apply,30000);
  }
})();
