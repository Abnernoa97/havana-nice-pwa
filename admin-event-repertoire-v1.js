/* HAVANA NICE — ADMIN EVENT REPERTOIRE V3
   Event-specific setlist inside the existing Admin Repertoire card.
   Admin only. Multi-select + event-only custom songs + touch reorder.
   Does not modify musician UI or master repertoire behavior.
*/
(function(){
  'use strict';
  if(window.__hnAdminEventRepertoireV3)return;
  window.__hnAdminEventRepertoireV3=true;
  window.__hnAdminEventRepertoireV2=true;

  const PANEL_ID='hnEventRepertoireAdmin';
  const STYLE_ID='hnAdminEventRepertoireStyle';
  let client=null;
  let events=[];
  let songs=[];
  let items=[];
  let selectedEventId='';
  let selectedSongIds=new Set();
  let started=false;
  let reorderSaving=false;

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
    document.getElementById(STYLE_ID)?.remove();
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #${PANEL_ID}{margin:0 0 26px;border:1px solid #dfd3ba;background:#f4efe5;color:#151713;box-shadow:0 12px 34px rgba(0,0,0,.16)}
      #${PANEL_ID} *{box-sizing:border-box}
      #${PANEL_ID} .hn-er-top{padding:20px 20px 16px;border-bottom:1px solid #d7ccb5;background:#faf7f0}
      #${PANEL_ID} .hn-er-kicker{font-size:9px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#6b5425}
      #${PANEL_ID} .hn-er-heading{margin:6px 0 0;font:600 28px/1.05 Georgia,"Times New Roman",serif;color:#16351f}
      #${PANEL_ID} .hn-er-copy{margin-top:7px;font-size:9px;line-height:1.45;letter-spacing:.11em;text-transform:uppercase;color:#746f64}
      #${PANEL_ID} .hn-er-event-block{padding:16px 20px 14px;border-bottom:1px solid #d7ccb5}
      #${PANEL_ID} label,#${PANEL_ID} .hn-er-label{display:block;margin:0 0 6px;font-size:8px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#6d675c}
      #${PANEL_ID} select,#${PANEL_ID} input[type="text"]{width:100%;height:46px;border:1px solid #b8aa8c;background:#fff;color:#171916;padding:0 11px;font-size:12px;outline:none}
      #${PANEL_ID} select:focus,#${PANEL_ID} input[type="text"]:focus{border-color:#7b5b1d;box-shadow:0 0 0 2px rgba(123,91,29,.10)}
      #${PANEL_ID} .hn-er-event-meta{margin-top:9px;color:#5d5a52;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
      #${PANEL_ID} .hn-er-picker{padding:16px 20px;border-bottom:1px solid #d7ccb5;background:#fbf8f2}
      #${PANEL_ID} .hn-er-picker-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:9px}
      #${PANEL_ID} .hn-er-picker-title{font:600 20px/1.1 Georgia,"Times New Roman",serif;color:#16351f}
      #${PANEL_ID} .hn-er-selected-count{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#725b2b;text-align:right}
      #${PANEL_ID} .hn-er-search{margin-bottom:8px}
      #${PANEL_ID} .hn-er-picker-actions{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px}
      #${PANEL_ID} .hn-er-mini{min-height:34px;border:1px solid #aa9a7a;background:#fff;color:#4e493f;padding:7px 10px;font-size:8px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
      #${PANEL_ID} .hn-er-choices{max-height:330px;overflow:auto;border:1px solid #c5b89e;background:#fff;-webkit-overflow-scrolling:touch}
      #${PANEL_ID} .hn-er-choice{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:9px;min-height:58px;padding:8px 10px;border-top:1px solid #e2dacb;cursor:pointer}
      #${PANEL_ID} .hn-er-choice:first-child{border-top:0}
      #${PANEL_ID} .hn-er-choice:active{background:#f2ede4}
      #${PANEL_ID} .hn-er-choice input{appearance:none;-webkit-appearance:none;width:28px;height:28px;margin:0;border:2px solid #16351f;background:#fff;display:grid;place-items:center}
      #${PANEL_ID} .hn-er-choice input:checked{background:#16351f}
      #${PANEL_ID} .hn-er-choice input:checked::after{content:"✓";color:#fff7dc;font-size:18px;font-weight:900;line-height:1}
      #${PANEL_ID} .hn-er-choice-title{font-size:15px;font-weight:800;line-height:1.18;color:#151713}
      #${PANEL_ID} .hn-er-choice-artist{margin-top:3px;font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:#777166}
      #${PANEL_ID} .hn-er-add-button{width:100%;min-height:48px;margin-top:9px;border:1px solid #16351f;background:#16351f;color:#fff7dc;padding:0 15px;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
      #${PANEL_ID} .hn-er-add-button:disabled{opacity:.42;cursor:not-allowed}
      #${PANEL_ID} .hn-er-custom{padding:16px 20px;border-bottom:1px solid #d7ccb5;background:#f2ecdf}
      #${PANEL_ID} .hn-er-custom-title{font:600 18px/1.1 Georgia,"Times New Roman",serif;color:#16351f;margin-bottom:4px}
      #${PANEL_ID} .hn-er-custom-copy{font-size:8px;line-height:1.4;letter-spacing:.10em;text-transform:uppercase;color:#746f64;margin-bottom:10px}
      #${PANEL_ID} .hn-er-custom-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) auto;gap:8px}
      #${PANEL_ID} .hn-er-custom-button{min-width:105px;border:1px solid #6b5425;background:#fff;color:#16351f;padding:0 13px;font-size:8px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
      #${PANEL_ID} .hn-er-custom-button:disabled{opacity:.45;cursor:wait}
      #${PANEL_ID} .hn-er-summary{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;padding:18px 20px 12px;background:#ede5d7;border-top:1px solid #d7ccb5}
      #${PANEL_ID} .hn-er-count strong{display:block;font:600 38px/1 Georgia,"Times New Roman",serif;color:#16351f}
      #${PANEL_ID} .hn-er-count span{display:block;margin-top:5px;font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#6b665d}
      #${PANEL_ID} .hn-er-pending{font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#725b2b;text-align:right}
      #${PANEL_ID} .hn-er-progress{height:7px;margin:0 20px 18px;background:#d8cdb8;overflow:hidden}
      #${PANEL_ID} .hn-er-progress>span{display:block;height:100%;width:0;background:#16351f;transition:width .18s ease}
      #${PANEL_ID} .hn-er-message{min-height:18px;padding:0 20px 9px;color:#7b3229;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
      #${PANEL_ID} .hn-er-list{padding:0 12px 14px}
      #${PANEL_ID} .hn-er-item{display:grid;grid-template-columns:34px 48px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:72px;padding:10px 8px;border-top:1px solid #d9cfbd;background:#fffdf8;transition:background .15s ease,opacity .15s ease,box-shadow .15s ease}
      #${PANEL_ID} .hn-er-item:first-child{border-top:0}
      #${PANEL_ID} .hn-er-item.is-dragging{opacity:.72;background:#fff6df;box-shadow:0 8px 24px rgba(0,0,0,.18);position:relative;z-index:5}
      #${PANEL_ID} .hn-er-drag{width:30px;height:42px;border:1px solid #b8aa8c;background:#f7f1e5;color:#16351f;display:grid;place-items:center;padding:0;font-size:19px;font-weight:800;line-height:1;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}
      #${PANEL_ID} .hn-er-drag:active{cursor:grabbing;background:#eee3cf}
      #${PANEL_ID} .hn-er-drag:disabled{opacity:.45;cursor:wait}
      #${PANEL_ID} .hn-er-list.is-reordering{user-select:none;-webkit-user-select:none}
      #${PANEL_ID} .hn-er-check{width:42px;height:42px;border:2px solid #16351f;background:#fff;color:#16351f;display:grid;place-items:center;padding:0;font-size:24px;font-weight:900;line-height:1;letter-spacing:0;text-transform:none}
      #${PANEL_ID} .hn-er-check[aria-pressed="true"]{background:#16351f;color:#fff7dc}
      #${PANEL_ID} .hn-er-check:disabled{opacity:.55;cursor:wait}
      #${PANEL_ID} .hn-er-info{min-width:0}
      #${PANEL_ID} .hn-er-title{font-size:18px;font-weight:800;line-height:1.15;letter-spacing:.015em;color:#151713;overflow-wrap:anywhere}
      #${PANEL_ID} .hn-er-artist{margin-top:4px;font-size:10px;line-height:1.2;letter-spacing:.08em;text-transform:uppercase;color:#777166}
      #${PANEL_ID} .hn-er-special{display:inline-block;margin-top:5px;font-size:7px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#8a6322}
      #${PANEL_ID} .hn-er-item.is-done{background:#e8e3d9}
      #${PANEL_ID} .hn-er-item.is-done .hn-er-title{text-decoration-line:line-through;text-decoration-thickness:2px;text-decoration-color:#16351f;color:#77756e}
      #${PANEL_ID} .hn-er-item.is-done .hn-er-artist{text-decoration-line:line-through;color:#97938b}
      #${PANEL_ID} .hn-er-remove{border:0;background:transparent;color:#8c4e45;padding:9px 7px;font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
      #${PANEL_ID} .hn-er-empty{padding:28px 12px;text-align:center;color:#777166;font-size:10px;letter-spacing:.11em;text-transform:uppercase}
      .hn-er-general-label{margin:0 0 12px;padding-top:2px;color:#e5bd62;font-size:9px;font-weight:700;letter-spacing:.20em;text-transform:uppercase}
      @media(max-width:700px){
        #${PANEL_ID} .hn-er-top{padding:18px 15px 14px}
        #${PANEL_ID} .hn-er-heading{font-size:25px}
        #${PANEL_ID} .hn-er-event-block,#${PANEL_ID} .hn-er-picker,#${PANEL_ID} .hn-er-custom{padding-left:15px;padding-right:15px}
        #${PANEL_ID} .hn-er-picker-head{align-items:start;flex-direction:column;gap:4px}
        #${PANEL_ID} .hn-er-selected-count{text-align:left}
        #${PANEL_ID} .hn-er-choices{max-height:360px}
        #${PANEL_ID} .hn-er-custom-grid{grid-template-columns:1fr}
        #${PANEL_ID} .hn-er-custom-button{min-height:46px}
        #${PANEL_ID} .hn-er-summary{padding:16px 15px 11px}
        #${PANEL_ID} .hn-er-progress{margin:0 15px 16px}
        #${PANEL_ID} .hn-er-message{padding:0 15px 8px}
        #${PANEL_ID} .hn-er-list{padding:0 8px 10px}
        #${PANEL_ID} .hn-er-item{grid-template-columns:32px 46px minmax(0,1fr);gap:9px;padding:10px 7px}
        #${PANEL_ID} .hn-er-title{font-size:17px}
        #${PANEL_ID} .hn-er-remove{grid-column:3;justify-self:start;padding:3px 0 8px}
      }
    `;
    document.head.appendChild(style);
  }

  function panel(){return document.getElementById(PANEL_ID)}

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
        <div class="hn-er-copy">Selecciona todas las canciones que quieras y marca cada una al terminar.</div>
      </div>
      <div class="hn-er-event-block">
        <label for="hnErEventSelect">Evento</label>
        <select id="hnErEventSelect" aria-label="Seleccionar evento"><option value="">Cargando eventos…</option></select>
        <div id="hnErEventMeta" class="hn-er-event-meta"></div>
      </div>
      <div class="hn-er-picker">
        <div class="hn-er-picker-head">
          <div class="hn-er-picker-title">Seleccionar canciones</div>
          <div id="hnErSelectedCount" class="hn-er-selected-count">0 seleccionadas</div>
        </div>
        <input id="hnErSearch" class="hn-er-search" type="text" autocomplete="off" placeholder="Buscar canción o artista">
        <div class="hn-er-picker-actions">
          <button id="hnErSelectVisible" class="hn-er-mini" type="button">Marcar visibles</button>
          <button id="hnErClearSelection" class="hn-er-mini" type="button">Limpiar selección</button>
        </div>
        <div id="hnErSongChoices" class="hn-er-choices"><div class="hn-er-empty">Cargando repertorio…</div></div>
        <button id="hnErAddSelected" class="hn-er-add-button" type="button" disabled>Añadir seleccionadas</button>
      </div>
      <div class="hn-er-custom">
        <div class="hn-er-custom-title">Canción nueva / especial</div>
        <div class="hn-er-custom-copy">Solo para este evento. No modifica el repertorio general.</div>
        <div class="hn-er-custom-grid">
          <input id="hnErCustomTitle" type="text" autocomplete="off" placeholder="Nombre de la canción">
          <input id="hnErCustomArtist" type="text" autocomplete="off" placeholder="Artista · opcional">
          <button id="hnErAddCustom" class="hn-er-custom-button" type="button">Añadir especial</button>
        </div>
      </div>
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
      selectedSongIds.clear();
      renderEventMeta();
      renderSongChoices();
      await loadItems();
    });
    document.getElementById('hnErSearch')?.addEventListener('input',renderSongChoices);
    document.getElementById('hnErSelectVisible')?.addEventListener('click',selectVisibleSongs);
    document.getElementById('hnErClearSelection')?.addEventListener('click',()=>{
      selectedSongIds.clear();
      renderSongChoices();
    });
    document.getElementById('hnErAddSelected')?.addEventListener('click',addSelectedSongs);
    document.getElementById('hnErAddCustom')?.addEventListener('click',addCustomSong);
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

  function renderEventMeta(){
    const meta=document.getElementById('hnErEventMeta');
    if(!meta)return;
    const event=events.find(row=>String(row.id)===selectedEventId);
    if(!event){meta.textContent='';return}
    const parts=[formatDate(event.event_date),event.venue].filter(Boolean);
    meta.textContent=parts.join(' · ');
  }

  function filteredSongs(){
    const query=String(document.getElementById('hnErSearch')?.value||'').trim().toLocaleLowerCase('es');
    if(!query)return songs;
    return songs.filter(song=>`${song.song_title||''} ${song.song_artist||''}`.toLocaleLowerCase('es').includes(query));
  }

  function renderSelectionState(){
    const count=document.getElementById('hnErSelectedCount');
    const button=document.getElementById('hnErAddSelected');
    const n=selectedSongIds.size;
    if(count)count.textContent=`${n} seleccionada${n===1?'':'s'}`;
    if(button){
      button.disabled=!selectedEventId||n===0;
      button.textContent=n?`Añadir ${n} seleccionada${n===1?'':'s'}`:'Añadir seleccionadas';
    }
  }

  function renderSongChoices(){
    const box=document.getElementById('hnErSongChoices');
    if(!box)return;
    const rows=filteredSongs();
    if(!songs.length){
      box.innerHTML='<div class="hn-er-empty">No hay canciones en el repertorio general</div>';
      renderSelectionState();
      return;
    }
    if(!rows.length){
      box.innerHTML='<div class="hn-er-empty">No hay coincidencias</div>';
      renderSelectionState();
      return;
    }
    box.innerHTML=rows.map(song=>{
      const id=String(song.song_id);
      const checked=selectedSongIds.has(id)?' checked':'';
      const hidden=song.song_active===false?' · OCULTA':'';
      return `
        <label class="hn-er-choice">
          <input class="hn-er-choice-check" type="checkbox" value="${esc(id)}"${checked}>
          <span>
            <span class="hn-er-choice-title">${esc(song.song_title||'Sin título')}</span>
            ${song.song_artist?`<span class="hn-er-choice-artist">${esc(song.song_artist)}${hidden}</span>`:hidden?`<span class="hn-er-choice-artist">${esc(hidden.replace(/^ · /,''))}</span>`:''}
          </span>
        </label>
      `;
    }).join('');
    box.querySelectorAll('.hn-er-choice-check').forEach(input=>input.addEventListener('change',()=>{
      const id=String(input.value||'');
      if(input.checked)selectedSongIds.add(id);else selectedSongIds.delete(id);
      renderSelectionState();
    }));
    renderSelectionState();
  }

  function selectVisibleSongs(){
    filteredSongs().forEach(song=>selectedSongIds.add(String(song.song_id)));
    renderSongChoices();
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
        <button class="hn-er-drag" type="button" aria-label="Mantén presionado para mover ${esc(item.song_title||'esta canción')}" data-action="drag" data-id="${esc(item.item_id)}">☰</button>
        <button class="hn-er-check" type="button" aria-label="${item.completed?'Marcar como pendiente':'Marcar como realizada'}" aria-pressed="${item.completed?'true':'false'}" data-action="toggle" data-id="${esc(item.item_id)}">${item.completed?'✓':''}</button>
        <div class="hn-er-info">
          <div class="hn-er-title">${esc(item.song_title||'')}</div>
          ${item.song_artist?`<div class="hn-er-artist">${esc(item.song_artist)}</div>`:''}
          ${item.song_id?'':'<div class="hn-er-special">Canción especial</div>'}
        </div>
        <button class="hn-er-remove" type="button" data-action="remove" data-id="${esc(item.item_id)}">Quitar</button>
      </div>
    `).join('');

    list.querySelectorAll('[data-action="toggle"]').forEach(button=>button.addEventListener('click',()=>toggleItem(button.dataset.id)));
    list.querySelectorAll('[data-action="remove"]').forEach(button=>button.addEventListener('click',()=>removeItem(button.dataset.id)));
    bindReorder(list);
  }

  function bindReorder(list){
    list.querySelectorAll('.hn-er-drag').forEach(handle=>{
      handle.addEventListener('contextmenu',event=>event.preventDefault());
      handle.addEventListener('pointerdown',event=>prepareDrag(event,handle,list));
    });
  }

  function prepareDrag(event,handle,list){
    if(reorderSaving||event.button>0)return;
    const row=handle.closest('.hn-er-item');
    if(!row)return;
    event.preventDefault();

    const pointerId=event.pointerId;
    const startX=event.clientX;
    const startY=event.clientY;
    let active=false;
    let finished=false;

    const cleanup=()=>{
      window.removeEventListener('pointermove',move);
      window.removeEventListener('pointerup',end);
      window.removeEventListener('pointercancel',end);
    };

    const timer=setTimeout(()=>{
      if(finished)return;
      active=true;
      row.classList.add('is-dragging');
      list.classList.add('is-reordering');
      try{handle.setPointerCapture(pointerId)}catch(_){}
      try{navigator.vibrate?.(18)}catch(_){}
    },180);

    const move=moveEvent=>{
      if(moveEvent.pointerId!==pointerId||finished)return;
      if(!active){
        if(Math.hypot(moveEvent.clientX-startX,moveEvent.clientY-startY)>12){
          finished=true;
          clearTimeout(timer);
          cleanup();
        }
        return;
      }

      moveEvent.preventDefault();
      const otherRows=[...list.querySelectorAll('.hn-er-item:not(.is-dragging)')];
      const next=otherRows.find(other=>{
        const rect=other.getBoundingClientRect();
        return moveEvent.clientY<rect.top+(rect.height/2);
      });
      if(next)list.insertBefore(row,next);
      else list.appendChild(row);

      const edge=88;
      if(moveEvent.clientY<edge)window.scrollBy(0,-16);
      else if(moveEvent.clientY>window.innerHeight-edge)window.scrollBy(0,16);
    };

    const end=async endEvent=>{
      if(endEvent.pointerId!==pointerId||finished)return;
      finished=true;
      clearTimeout(timer);
      cleanup();

      if(!active)return;

      row.classList.remove('is-dragging');
      list.classList.remove('is-reordering');
      try{handle.releasePointerCapture(pointerId)}catch(_){}

      const orderedIds=[...list.querySelectorAll('.hn-er-item')].map(node=>String(node.dataset.itemId||'')).filter(Boolean);
      const previousIds=items.map(item=>String(item.item_id));
      if(orderedIds.join('|')===previousIds.join('|'))return;

      const byId=new Map(items.map(item=>[String(item.item_id),item]));
      items=orderedIds.map((id,index)=>{
        const item=byId.get(id);
        if(item)item.item_position=index+1;
        return item;
      }).filter(Boolean);

      await persistOrder(orderedIds);
    };

    window.addEventListener('pointermove',move,{passive:false});
    window.addEventListener('pointerup',end);
    window.addEventListener('pointercancel',end);
  }

  async function persistOrder(orderedIds){
    if(!client||!selectedEventId||reorderSaving)return;
    const eventId=selectedEventId;
    reorderSaving=true;

    const eventSelect=document.getElementById('hnErEventSelect');
    if(eventSelect)eventSelect.disabled=true;
    document.querySelectorAll(`#${PANEL_ID} .hn-er-drag`).forEach(button=>button.disabled=true);
    setMessage('Guardando orden…');

    const {error}=await client.rpc('admin_reorder_event_repertoire',{
      p_event_id:eventId,
      p_item_ids:orderedIds
    });

    reorderSaving=false;
    if(eventSelect)eventSelect.disabled=false;
    document.querySelectorAll(`#${PANEL_ID} .hn-er-drag`).forEach(button=>button.disabled=false);

    if(error){
      console.warn('[HN Event Repertoire] reorder',error);
      setMessage('No se pudo guardar el orden');
      await loadItems();
      return;
    }

    setMessage('Orden actualizado');
    setTimeout(()=>{
      const message=document.getElementById('hnErMessage');
      if(message?.textContent==='Orden actualizado')message.textContent='';
    },1400);
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
    renderEventMeta();
    renderSongChoices();
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

  async function addSelectedSongs(){
    if(!client||!selectedEventId){setMessage('Selecciona un evento');return}
    const ids=[...selectedSongIds];
    if(!ids.length){setMessage('Marca al menos una canción');return}
    const button=document.getElementById('hnErAddSelected');
    if(button)button.disabled=true;
    setMessage(`Añadiendo ${ids.length} canción${ids.length===1?'':'es'}…`);
    const {data,error}=await client.rpc('admin_add_event_repertoire_songs',{p_event_id:selectedEventId,p_song_ids:ids});
    if(error){
      console.warn('[HN Event Repertoire] add batch',error);
      setMessage('No se pudieron añadir las canciones');
      renderSelectionState();
      return;
    }
    selectedSongIds.clear();
    const search=document.getElementById('hnErSearch');if(search)search.value='';
    renderSongChoices();
    await loadItems();
    setMessage(`${Number(data)||ids.length} canción${ids.length===1?'':'es'} añadida${ids.length===1?'':'s'}`);
  }

  async function addCustomSong(){
    if(!client||!selectedEventId){setMessage('Selecciona un evento');return}
    const title=document.getElementById('hnErCustomTitle');
    const artist=document.getElementById('hnErCustomArtist');
    const button=document.getElementById('hnErAddCustom');
    const name=String(title?.value||'').trim();
    const performer=String(artist?.value||'').trim();
    if(!name){setMessage('Escribe el nombre de la canción especial');title?.focus();return}
    if(button)button.disabled=true;
    setMessage('Añadiendo canción especial…');
    const {error}=await client.rpc('admin_add_event_repertoire_custom_song',{
      p_event_id:selectedEventId,
      p_title:name,
      p_artist:performer||null
    });
    if(button)button.disabled=false;
    if(error){console.warn('[HN Event Repertoire] custom song',error);setMessage('No se pudo añadir la canción especial');return}
    if(title)title.value='';
    if(artist)artist.value='';
    await loadItems();
    setMessage('Canción especial añadida');
  }

  async function toggleItem(itemId){
    const item=items.find(row=>String(row.item_id)===String(itemId));
    if(!item||!client)return;
    const button=[...document.querySelectorAll(`#${PANEL_ID} .hn-er-check`)].find(el=>String(el.dataset.id)===String(itemId));
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
    if(!installPanel()){setTimeout(start,120);return}
    client=getClient();
    if(!client){setTimeout(start,120);return}
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
    selectedSongIds.clear();
    selectedEventId='';
    renderEventOptions();
    renderEventMeta();
    renderSongChoices();
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