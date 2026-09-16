/* HAVANA NICE — CALENDAR RECIPIENTS V4 */
(function(){
  'use strict';
  const URL='https://xzfradccsxonmauinecl.supabase.co';
  const KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  let clientPromise=null,channel=null,active=[],selected=new Set(),currentEventId=null,started=false;
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const admin=()=>document.title.includes('ADMIN')||!!document.getElementById('loginCard');
  function sb(){if(window.hnAdminSupabase&&typeof window.hnAdminSupabase.rpc==='function')return Promise.resolve(window.hnAdminSupabase);if(window.hnSupabase&&typeof window.hnSupabase.rpc==='function')return Promise.resolve(window.hnSupabase);if(!clientPromise)clientPromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(m=>m.createClient(URL,KEY));return clientPromise}
  if(admin())initAdmin();else initMusician();

  async function initAdmin(){
    if(started)return;started=true;
    const card=await waitForCard();if(!card)return;
    const s=await sb();
    const style=document.createElement('style');style.textContent='#calendarRecipients{margin-top:10px;padding:12px;border:1px solid #3d321e;background:#070806}.cr-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.cr-title{color:#e5bd62;font-size:9px;letter-spacing:.14em;text-transform:uppercase}.cr-actions{display:flex;gap:6px;flex-wrap:wrap}.cr-actions button{font-size:8px;padding:7px 9px}.cr-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}.cr-item{display:flex;align-items:center;gap:8px;border:1px solid #292a27;padding:9px;background:#050605;min-height:42px}.cr-item input{width:17px;height:17px;flex:0 0 17px}.cr-name{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#f4f1e8}.cr-help{font-size:8px;color:#777;margin-top:8px;line-height:1.4}.cr-empty{font-size:8px;color:#777;padding:10px 0}.cr-count{color:#9b9b96;font-size:8px;letter-spacing:.08em}@media(max-width:600px){.cr-list{grid-template-columns:1fr}}';document.head.appendChild(style);
    const box=document.createElement('div');box.id='calendarRecipients';box.innerHTML='<div class="cr-head"><div><div class="cr-title">Quién recibe esta fecha</div><div class="cr-count" id="crCount">0 seleccionados</div></div><div class="cr-actions"><button type="button" id="crAll">Todos</button><button type="button" id="crNone">Ninguno</button></div></div><div id="crList" class="cr-list"></div><div class="cr-help">Solo los músicos seleccionados verán esta fecha y sus detalles en su Calendario.</div>';
    card.querySelector('.calendar-form')?.insertAdjacentElement('afterend',box);const list=box.querySelector('#crList'),count=box.querySelector('#crCount');
    async function loadActive(){const{data,error}=await s.rpc('admin_list_musicians');if(error){list.innerHTML='<div class="cr-empty">Inicia sesión de administración para cargar los músicos.</div>';return}active=(data||[]).filter(x=>x.active&&String(x.role||'').toLowerCase()!=='admin');render()}
    function render(){list.innerHTML=active.length?active.map(p=>`<label class="cr-item"><input type="checkbox" class="cr-check" value="${esc(p.id)}"><span class="cr-name">${esc(p.username)}</span></label>`).join(''):'<div class="cr-empty">No hay músicos activos.</div>';list.querySelectorAll('.cr-check').forEach(x=>{x.checked=selected.has(x.value);x.addEventListener('change',()=>{if(x.checked)selected.add(x.value);else selected.delete(x.value);updateCount()})});updateCount()}
    function updateCount(){count.textContent=`${selected.size} seleccionado${selected.size===1?'':'s'}`}
    function setAll(on){selected=new Set(on?active.map(x=>String(x.id)):[]);render()}
    box.querySelector('#crAll').onclick=()=>setAll(true);box.querySelector('#crNone').onclick=()=>setAll(false);
    async function getRecipients(id){const{data,error}=await s.rpc('admin_list_calendar_recipients',{p_event_id:id});return error?[]:(data||[])}
    async function selectForEvent(id){currentEventId=id;const rows=await getRecipients(id);selected=new Set(rows.map(x=>String(x.profile_id)));render()}
    document.addEventListener('click',e=>{const b=e.target.closest('.cedit');if(b)setTimeout(()=>selectForEvent(b.dataset.id),0);const cancel=e.target.closest('#cCancel');if(cancel){currentEventId=null;selected=new Set(active.map(x=>String(x.id)));render()}},true);
    async function saveRecipients(eventId,ids){if(!eventId)return;const{error}=await s.rpc('admin_save_calendar_recipients',{p_event_id:eventId,p_profile_ids:ids});if(error)throw error}
    function wrapSave(){const save=document.getElementById('cSave');if(!save||save.dataset.crWrapped==='1')return;save.dataset.crWrapped='1';const original=save.onclick;save.onclick=async function(){const beforeId=currentEventId,titleBefore=document.getElementById('cTitle')?.value?.trim()||'',dateBefore=document.getElementById('cDate')?.value||'',recipients=[...selected];if(!recipients.length){const msg=document.getElementById('cMsg');if(msg)msg.textContent='Selecciona al menos un músico para esta fecha.';return}await original?.call(save);let eventId=beforeId;if(!eventId){const q=await s.rpc('admin_list_calendar_events');const rows=q.data||[];eventId=rows.filter(x=>x.title===titleBefore&&x.event_date===dateBefore).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0]?.id}try{if(!eventId)throw new Error('event_id_missing');await saveRecipients(eventId,recipients);const msg=document.getElementById('cMsg');if(msg)msg.textContent=beforeId?'Calendario y destinatarios actualizados':'Evento creado y enviado a los músicos seleccionados';currentEventId=null;window.dispatchEvent(new CustomEvent('hn-calendar-admin-updated',{detail:{eventId}}))}catch(err){console.error('[HN calendar recipients]',err);const msg=document.getElementById('cMsg');if(msg)msg.textContent='El evento se guardó, pero no se pudieron guardar sus destinatarios.'}}
    }
    await loadActive();selected=new Set(active.map(x=>String(x.id)));render();wrapSave();
    channel=s.channel('calendar-recipients-admin-live').on('postgres_changes',{event:'*',schema:'public',table:'calendar_events'},()=>{if(!currentEventId)loadActive()}).on('postgres_changes',{event:'*',schema:'public',table:'calendar_event_recipients'},()=>{if(currentEventId)selectForEvent(currentEventId)}).on('postgres_changes',{event:'*',schema:'public',table:'profiles'},()=>loadActive()).subscribe();
    new MutationObserver(wrapSave).observe(card,{childList:true,subtree:true});
  }
  function waitForCard(){return new Promise(resolve=>{const find=()=>{const card=document.getElementById('calendarAdminCard'),save=document.getElementById('cSave');if(card&&save){resolve(card);return}setTimeout(find,250)};find()})}

  async function initMusician(){
    const module=[...document.querySelectorAll('.module[data-module]')].find(x=>x.dataset.module==='CALENDARIO DE EVENTOS');if(!module)return;
    const s=await sb();
    const style=document.createElement('style');style.textContent='#calendarList{visibility:hidden!important}';document.head.appendChild(style);
    const session=()=>{try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')}catch(_){return null}};
    let applying=false;
    async function filter(){const id=session()?.id;if(!id)return null;const{data,error}=await s.rpc('get_calendar_events_for_profile',{p_profile_id:id});if(error){console.error('Calendar recipients error',error);return null}return data||[]}
    function renderFiltered(rows){const list=document.getElementById('calendarList');if(!list||rows===null)return;const ids=new Set(rows.map(x=>String(x.id)));list.querySelectorAll('.calendar-event-card').forEach(card=>{card.style.display=ids.has(String(card.dataset.eventId))?'':''});const empty=list.querySelector('.calendar-empty');if(empty)empty.style.display=rows.length?'none':'';list.style.setProperty('visibility','visible','important')}
    async function apply(){if(applying)return;applying=true;try{const rows=await filter();if(rows!==null)renderFiltered(rows)}finally{applying=false}}
    window.addEventListener('hn-calendar-updated',apply);window.addEventListener('hn:session-ready',apply);
    const target=document.getElementById('calendarList');if(target)new MutationObserver(()=>apply()).observe(target,{childList:true,subtree:true});
    s.channel('calendar-recipients-live').on('postgres_changes',{event:'*',schema:'public',table:'calendar_events'},apply).on('postgres_changes',{event:'*',schema:'public',table:'calendar_event_recipients'},apply).subscribe();
    apply();
  }
})();
