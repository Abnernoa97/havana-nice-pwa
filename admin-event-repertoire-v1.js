/* HAVANA NICE — ADMIN EVENT REPERTOIRE V1
   Event-specific setlist inside the existing Admin Repertoire card.
   Admin only. Does not modify the musician repertoire UI or the master repertoire logic.
*/
(function(){
  'use strict';
  if(window.__hnAdminEventRepertoireV1)return;
  window.__hnAdminEventRepertoireV1=true;

  const PANEL_ID='hnEventRepertoireAdmin';
  const STYLE_ID='hnAdminEventRepertoireStyle';
  let client=null;
  let events=[];
  let songs=[];
  let items=[];
  let selectedEventId='';
  let started=false;

  const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  function getClient(){
    if(window.hnAdminSupabase&&typeof window.hnAdminSupabase.rpc==='function')return window.hnAdminSupabase;
    return null;
  }

  function localToday(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function formatDate(value){
    if(!value)return '';
    try{
      return new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value+'T12:00:00')).replace('.','').toUpperCase();
    }catch(_){return String(value)}
  }

  function findRepertoireCard(){
    return [...document.querySelectorAll('.dashboard>.card')].find(card=>card.querySelector('.card-head h1')?.textContent.trim()==='Repertorio')||null;
  }

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #${PANEL_ID}{margin:0 0 26px;border:1px solid #dfd3ba;background:#f4efe5;color:#151713;box-shadow:0 12px 34px rgba(0,0,0,.16)}
      #${PANEL_ID} *{box-sizing:border-box}
      #${PANEL_ID} .hn-er-top{padding:20px 20px 16px;border-bottom:1px solid #d7ccb5;background:#faf7f0}
      #${PANEL_ID} .hn-er-kicker{font-size:9px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#6b5425}
      #${PANEL_ID} .hn-er-heading{margin:6px 0 0;font:600 28px/1.05 Georgia,"Times New Roman",serif;color:#16351f}
      #${PANEL_ID} .hn-er-copy{margin-top:7px;font-size:9px;line-height:1.45;letter-spacing:.11em;text-transform:uppercase;color:#746f64}
      #${PANEL_ID} .hn-er-controls{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr) auto;gap:8px;padding:16px 20px;border-bottom:1px solid #d7ccb5}
      #${PANEL_ID} label{display:block;margin:0 0 5px;font-size:8px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#6d675c}
      #${PANEL_ID} select{width:100%;height:46px;border:1px solid #b8aa8c;background:#fff;color:#171916;padding:0 11px;font-size:12px;outline:none}
      #${PANEL_ID} select:focus{border-color:#7b5b1d;box-shadow:0 0 0 2px rgba(123,91,29,.10)}
      #${PANEL_ID} .hn-er-add-button{align-self:end;height:46px;min-width:100px;border:1px solid #16351f;background:#16351f;color:#fff7dc;padding:0 15px;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
      #${PANEL_ID} .hn-er-add-button:disabled{opacity:.45;cursor:wait}
      #${PANEL_ID} .hn-er-event-meta{padding:0 20px 15px;color:#5d5a52;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
      #${PANEL_ID} .hn-er-summary{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;padding:18px 20px 12px;background:#ede5d7;border-top:1px solid #d7ccb5}
      #${PANEL_ID} .hn-er-count strong{display:block;font:600 38px/1 Georgia,"Times New Roman",serif;color:#16351f}
      #${PANEL_ID} .hn-er-count span{display:block;margin-top:5px;font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#6b665d}
      #${PANEL_ID} .hn-er-pending{font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#725b2b;text-align:right}
      #${PANEL_ID} .hn-er-progress{height:7px;margin:0 20px 18px;background:#d8cdb8;overflow:hidden}
      #${PANEL_ID} .hn-er-progress>span{display:block;height:100%;width:0;background:#16351f;transition:width .18s ease}
      #${PANEL_ID} .hn-er-message{min-height:18px;padding:0 20px 9px;color:#7b3229;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
      #${PANEL_ID} .hn-er-list{padding:0 12px 14px}
      #${PANEL_ID} .hn-er-item{display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:12px;min-height:72px;padding:10px 8px;border-top:1px solid #d9cfbd;background:#fffdf8;transition:opacity .15s ease,background .15s ease}
      #${PANEL_ID} .hn-er-item:first-child{border-top:0}
      #${PANEL_ID} .hn-er-check{width:42px;height:42px;border:2px solid #16351f;background:#fff;color:#16351f;display:grid;place-items:center;padding:0;font-size:24px;font-weight:900;line-height:1;letter-spacing:0;text-transform:none}
      #${PANEL_ID} .hn-er-check[aria-pressed="true"]{background:#16351f;color:#fff7dc}
      #${PANEL_ID} .hn-er-check:disabled{opacity:.55;cursor:wait}
      #${PANEL_ID} .hn-er-info{min-width:0}
      #${PANEL_ID} .hn-er-title{font-size:18px;font-weight:800;line-height:1.15;letter-spacing:.015em;color:#151713;overflow-wrap:anywhere}
      #${PANEL_ID} .hn-er-artist{margin-top:4px;font-size:10px;line-height:1.2;letter-spacing:.08em;text-transform:uppercase;color:#777166}
      #${PANEL_ID} .hn-er-item.is-done{background:#e8e3d9}
      #${PANEL_ID} .hn-er-item.is-done .hn-er-title{text-decoration-line:line-through;text-decoration-thickness:2px;text-decoration-color:#16351f;color:#77756e}
      #${PANEL_ID} .hn-er-item.is-done .hn-er-artist{text-decoration-line:line-through;color:#97938b}
      #${PANEL_ID} .hn-er-remove{border:0;background:transparent;color:#8c4e45;padding:9px 7px;font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
      #${PANEL_ID} .hn-er-empty{padding:28px 12px;text-align:center;color:#777166;font-size:10px;letter-spacing:.11em;text-transform:uppercase}
      .hn-er-general-label{margin:0 0 12px;padding-top:2px;color:#e5bd62;font-size:9px;font-weight:700;letter-spacing:.20em;text-transform:uppercase}
      @media(max-width:700px){
        #${PANEL_ID} .hn-er-top{padding:18px 15px 14px}
        #${PANEL_ID} .hn-er-heading{font-size:25px}
        #${PANEL_ID} .hn-er-controls{grid-template-columns:1fr;padding:14px 15px}
        #${PANEL_ID} .hn-er-add-button{width:100%}
        #${PANEL_ID} .hn-er-event-meta{padding:0 15px 14px}
        #${PANEL_ID} .hn-er-summary{padding:16px 15px 11px}
        #${PANEL_ID} .hn-er-progress{margin:0 15px 16px}
        #${PANEL_ID} .hn-er-message{padding:0 15px 8px}
        #${PANEL_ID} .hn-er-list{padding:0 8px 10px}
        #${PANEL_ID} .hn-er-item{grid-template-columns:46px minmax(0,1fr);gap:10px;padding:10px 7px}
        #${PANEL_ID} .hn-er-title{font-size:17px}
        #${PANEL_ID} .hn-er-remove{grid-column:2;justify-self:start;padding:3px 0 8px}
      }
    `;
    document.head.appendChild(style);
  }

  function panel(){
    return document.getElementById(PANEL_ID);
  }

  function setMessage(message){
    const el=document.getElementById('hnErMessage');
    if(el)el.textContent=message||'';
  }

  function installPanel(){
    if(panel())return true;
    const card=findRepertoireCard();
    if(!card)return false;
    const host=card.querySelector(':scope > .hn-admin-body')||card;
    const block=document.createElement('section');
    block.id=PANEL_ID;
    block.setAttribute('aria-label','Repertorio del evento');
    block.innerHTML=`
      <div class="hn-er-top">
        <div class="hn-er-kicker">Repertorio del evento</div>
        <h2 class="hn-er-heading">Lista del día</h2>
        <div class="hn-er-copy">Selecciona el evento, agrega las canciones y marca cada una al terminar.</div>
      </div>
      <div class="hn-er-controls">
        <div>
          <label for="hnErEventSelect">Evento</label>
          <select id="hnErEventSelect" aria-label="Seleccionar evento"><option value="">Cargando eventos…</option></select>
        </div>
        <div>
          <label for="hnErSongSelect">Añadir canción</label>
          <select id="hnErSongSelect" aria-label="Seleccionar canción"><option value="">Cargando repertorio…</option></select>
        </div>
        <button id="hnErAdd" class="hn-er-add-button" type="button">Añadir</button>
      </div>
      <div id="hnErEventMeta" class="hn-er-event-meta"></div>
      <div class="hn-er-summary">
        <div class="hn-er-count"><strong id="hnErCount">0 / 0</strong><span>Realizadas</span></div>
        <div id="hnErPending" class="hn-er-pending">0 pendientes</div>
      </div>
      <div class="hn-er-progress" aria-hidden="true"><span id="hnErProgress"></span></div>
      <div id="hnErMessage" class="hn-er-message" aria-live="polite"></div>
      <div id="hnErList" class="hn-er-list"><div class="hn-er-empty">Selecciona un evento</div></div>
    `;
    host.insertBefore(block,host.firstChild);

    const addSong=host.querySelector('.add-song');
    if(addSong&&!host.querySelector('.hn-er-general-label')){
      const label=document.createElement('div');
      label.className='hn-er-general-label';
      label.textContent='Repertorio general';
      host.insertBefore(label,addSong);
    }

    document.getElementById('hnErEventSelect')?.addEventListener('change',async event=>{
      selectedEventId=String(event.target.value||'');
      renderEventMeta();
      await loadItems();
    });
    document.getElementById('hnErAdd')?.addEventListener('click',addSelectedSong);
    return true;
  }

  function chooseDefaultEvent(){
    if(selectedEventId&&events.some(event=>String(event.id)===selectedEventId))return;
    const today=localToday();
    const future=events.find(event=>String(event.event_date||'')>=today);
    selectedEventId=String((future||events[events.length-1]||{}).id||'');
  }

  function renderEventOptions(){
    const select=document.getElementById('hnErEventSelect');
    if(!select)return;
    if(!events.length){
      select.innerHTML='<option value="">No hay eventos en Calendario</option>';
      select.disabled=true;
      selectedEventId='';
      return;
    }
    select.disabled=false;
    select.innerHTML=events.map(event=>{
      const selected=String(event.id)===selectedEventId?' selected':'';
      const venue=String(event.venue||'').trim();
      const label=`${formatDate(event.event_date)} · ${event.title||'Evento'}${venue?' · '+venue:''}`;
      return `<option value="${esc(event.id)}"${selected}>${esc(label)}</option>`;
    }).join('');
  }

  function renderSongOptions(){
    const select=document.getElementById('hnErSongSelect');
    if(!select)return;
    if(!songs.length){
      select.innerHTML='<option value="">No hay canciones disponibles</option>';
      select.disabled=true;
      return;
    }
    select.disabled=false;
    select.innerHTML='<option value="">Selecciona una canción…</option>'+songs.map(song=>{
      const artist=String(song.song_artist||'').trim();
      const hidden=song.song_active===false?' · OCULTA':'';
      return `<option value="${esc(song.song_id)}">${esc(song.song_title||'Sin título')}${artist?' · '+esc(artist):''}${hidden}</option>`;
    }).join('');
  }

  function renderEventMeta(){
    const meta=document.getElementById('hnErEventMeta');
    if(!meta)return;
    const event=events.find(row=>String(row.id)===selectedEventId);
    if(!event){meta.textContent='';return}
    const parts=[formatDate(event.event_date),event.venue].filter(Boolean);
    meta.textContent=parts.join(' · ');
  }

  function renderItems(){
    const list=document.getElementById('hnErList');
    const count=document.getElementById('hnErCount');
    const pending=document.getElementById('hnErPending');
    const progress=document.getElementById('hnErProgress');
    if(!list||!count||!pending||!progress)return;

    const done=items.filter(item=>item.completed).length;
    const total=items.length;
    count.textContent=`${done} / ${total}`;
    pending.textContent=`${Math.max(0,total-done)} pendientes`;
    progress.style.width=total?`${Math.round(done/total*100)}%`:'0%';

    if(!selectedEventId){
      list.innerHTML='<div class="hn-er-empty">Selecciona un evento</div>';
      return;
    }
    if(!items.length){
      list.innerHTML='<div class="hn-er-empty">Aún no has agregado canciones a este evento</div>';
      return;
    }

    list.innerHTML=items.map(item=>`
      <div class="hn-er-item${item.completed?' is-done':''}" data-item-id="${esc(item.item_id)}">
        <button class="hn-er-check" type="button" aria-label="${item.completed?'Marcar como pendiente':'Marcar como realizada'}" aria-pressed="${item.completed?'true':'false'}" data-action="toggle" data-id="${esc(item.item_id)}">${item.completed?'✓':''}</button>
        <div class="hn-er-info">
          <div class="hn-er-title">${esc(item.song_title||'')}</div>
          ${item.song_artist?`<div class="hn-er-artist">${esc(item.song_artist)}</div>`:''}
        </div>
        <button class="hn-er-remove" type="button" data-action="remove" data-id="${esc(item.item_id)}">Quitar</button>
      </div>
    `).join('');

    list.querySelectorAll('[data-action="toggle"]').forEach(button=>button.addEventListener('click',()=>toggleItem(button.dataset.id)));
    list.querySelectorAll('[data-action="remove"]').forEach(button=>button.addEventListener('click',()=>removeItem(button.dataset.id)));
  }

  async function loadBase(){
    client=getClient();
    if(!client)return;
    setMessage('');
    const [eventResult,songResult]=await Promise.all([
      client.rpc('admin_list_calendar_events'),
      client.rpc('admin_list_repertoire_v2')
    ]);
    if(eventResult.error){console.warn('[HN Event Repertoire] events',eventResult.error);setMessage('No se pudieron cargar los eventos');return}
    if(songResult.error){console.warn('[HN Event Repertoire] songs',songResult.error);setMessage('No se pudo cargar el repertorio');return}
    events=Array.isArray(eventResult.data)?eventResult.data:[];
    songs=Array.isArray(songResult.data)?songResult.data:[];
    chooseDefaultEvent();
    renderEventOptions();
    renderSongOptions();
    renderEventMeta();
    await loadItems();
  }

  async function loadItems(){
    items=[];
    renderItems();
    if(!client||!selectedEventId)return;
    const {data,error}=await client.rpc('admin_list_event_repertoire',{p_event_id:selectedEventId});
    if(error){console.warn('[HN Event Repertoire] list',error);setMessage('No se pudo cargar la lista del evento');return}
    items=Array.isArray(data)?data:[];
    setMessage('');
    renderItems();
  }

  async function addSelectedSong(){
    if(!client||!selectedEventId){setMessage('Selecciona un evento');return}
    const select=document.getElementById('hnErSongSelect');
    const button=document.getElementById('hnErAdd');
    const songId=String(select?.value||'');
    if(!songId){setMessage('Selecciona una canción');return}
    if(button)button.disabled=true;
    setMessage('Añadiendo…');
    const {error}=await client.rpc('admin_add_event_repertoire_song',{p_event_id:selectedEventId,p_song_id:songId});
    if(button)button.disabled=false;
    if(error){console.warn('[HN Event Repertoire] add',error);setMessage('No se pudo añadir la canción');return}
    if(select)select.value='';
    await loadItems();
  }

  async function toggleItem(itemId){
    const item=items.find(row=>String(row.item_id)===String(itemId));
    if(!item||!client)return;
    const button=document.querySelector(`#${PANEL_ID} .hn-er-check[data-id="${CSS.escape(String(itemId))}"]`);
    if(button)button.disabled=true;
    const next=!item.completed;
    const {error}=await client.rpc('admin_set_event_repertoire_item_completed',{p_item_id:itemId,p_completed:next});
    if(error){
      console.warn('[HN Event Repertoire] toggle',error);
      setMessage('No se pudo actualizar la canción');
      if(button)button.disabled=false;
      return;
    }
    item.completed=next;
    item.completed_at=next?new Date().toISOString():null;
    setMessage('');
    renderItems();
  }

  async function removeItem(itemId){
    const item=items.find(row=>String(row.item_id)===String(itemId));
    if(!item||!client)return;
    if(!confirm(`¿Quitar "${item.song_title||'esta canción'}" del repertorio de este evento?`))return;
    setMessage('Quitando…');
    const {error}=await client.rpc('admin_delete_event_repertoire_item',{p_item_id:itemId});
    if(error){console.warn('[HN Event Repertoire] remove',error);setMessage('No se pudo quitar la canción');return}
    await loadItems();
  }

  async function start(){
    if(started)return;
    if(!installPanel()){
      setTimeout(start,120);
      return;
    }
    client=getClient();
    if(!client){
      setTimeout(start,120);
      return;
    }
    const {data:{session}}=await client.auth.getSession();
    if(!session)return;
    const {data:isAdmin}=await client.rpc('admin_is_admin');
    if(isAdmin!==true)return;
    started=true;
    await loadBase();
  }

  function reset(){
    started=false;
    events=[];
    songs=[];
    items=[];
    selectedEventId='';
    renderEventOptions();
    renderSongOptions();
    renderEventMeta();
    renderItems();
  }

  async function init(){
    installStyle();
    installPanel();
    for(let attempt=0;attempt<30&&!getClient();attempt++)await new Promise(resolve=>setTimeout(resolve,100));
    client=getClient();
    if(!client)return;
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT'||!session){reset();return}
      setTimeout(start,0);
    });
    await start();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();