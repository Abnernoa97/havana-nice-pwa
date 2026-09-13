/* HAVANA NICE — ADMIN SUMMARY V2 / COUNTS ONLY */
(function(){
  'use strict';
  if(window.__hnAdminSummaryV2)return;
  window.__hnAdminSummaryV2=true;

  const $=id=>document.getElementById(id);

  function style(){
    if($('hn-summary-v2-style'))return;
    const s=document.createElement('style');
    s.id='hn-summary-v2-style';
    s.textContent=`
      .hn-summary-v2-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
      @media(max-width:460px){.hn-summary-v2-grid{grid-template-columns:1fr 1fr}.hn-summary-v2-grid .stat:last-child{grid-column:auto}}
    `;
    document.head.appendChild(s);
  }

  function ensureFields(){
    const wrap=document.querySelector('.hn-summary-card .stats');
    if(!wrap||$('hnSummaryEvents'))return false;
    const grid=document.createElement('div');
    grid.className='hn-summary-v2-grid';
    grid.innerHTML=`
      <div class="stat"><div id="hnSummaryEvents" class="stat-number">—</div><div class="stat-label">Eventos</div></div>
      <div class="stat"><div id="hnSummaryText" class="stat-number">—</div><div class="stat-label">Chat escrito</div></div>
      <div class="stat"><div id="hnSummaryAudio" class="stat-number">—</div><div class="stat-label">Chat de audio</div></div>
      <div class="stat"><div id="hnSummaryPhotos" class="stat-number">—</div><div class="stat-label">Fotos</div></div>
      <div class="stat"><div id="hnSummaryVideos" class="stat-number">—</div><div class="stat-label">Videos</div></div>`;
    wrap.insertAdjacentElement('afterend',grid);
    return true;
  }

  async function load(){
    if(!ensureFields())return;
    try{
      let c=window.hnAdminSupabase||null;
      if(!c){setTimeout(load,500);return}
      const [events,chat,notifications]=await Promise.all([
        c.from('calendar_events').select('id',{count:'exact',head:true}),
        c.rpc('admin_list_chat_messages'),
        c.rpc('admin_list_notifications')
      ]);

      const messages=Array.isArray(chat.data)?chat.data:[];
      const notes=Array.isArray(notifications.data)?notifications.data:[];
      let text=0,audio=0,photos=0,videos=0;

      messages.forEach(m=>{
        if(m.message_type==='audio'){audio++;return}
        if(m.message_type==='media'){
          const urls=Array.isArray(m.media_urls)?m.media_urls:[];
          const types=Array.isArray(m.media_types)?m.media_types:[];
          urls.forEach((_,i)=>{if(types[i]==='video')videos++;else photos++});
          return;
        }
        text++;
      });

      notes.forEach(n=>{
        const urls=Array.isArray(n.image_urls)&&n.image_urls.length?n.image_urls:(n.image_url?[n.image_url]:[]);
        photos+=urls.length;
      });

      if($('hnSummaryEvents'))$('hnSummaryEvents').textContent=events.error?'—':String(events.count??0);
      if($('hnSummaryText'))$('hnSummaryText').textContent=String(text);
      if($('hnSummaryAudio'))$('hnSummaryAudio').textContent=String(audio);
      if($('hnSummaryPhotos'))$('hnSummaryPhotos').textContent=String(photos);
      if($('hnSummaryVideos'))$('hnSummaryVideos').textContent=String(videos);
    }catch(e){
      console.warn('HN summary counts',e);
    }
  }

  function wait(){
    if(!document.querySelector('.hn-summary-card')){setTimeout(wait,300);return}
    style();
    ensureFields();
    load();
  }

  wait();
})();
