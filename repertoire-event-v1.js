/* HAVANA NICE — MUSICIAN EVENT REPERTOIRE V3
   Read-only event setlists as separate accordions inside musician Repertoire.
   Adds one native Back level for an opened event accordion.
   Additive layer only: does not alter master repertoire rendering or editing.
*/
(function(){
  'use strict';
  if(window.__hnMusicianEventRepertoireV3)return;
  window.__hnMusicianEventRepertoireV3=true;
  window.__hnMusicianEventRepertoireV2=true;

  const STYLE_ID='hnMusicianEventRepertoireStyle';
  const CARD_ID='hnMusicianEventRepertoire';
  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';

  let client=null;
  let clientPromise=null;
  let channel=null;
  let groups=[];
  let openEventId='';
  let eventHistoryArmed=false;
  let ready=false;
  let syncing=false;
  let syncTimer=null;
  let screenObserver=null;
  let classObserver=null;

  function profile(){
    try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')}catch(_){return null}
  }
  function profileId(){return profile()?.id||null}
  function logged(){return !!profileId()}

  function getClient(){
    if(client&&typeof client.rpc==='function')return Promise.resolve(client);
    if(window.hnSupabase&&typeof window.hnSupabase.rpc==='function'){client=window.hnSupabase;return Promise.resolve(client)}
    if(!clientPromise){
      clientPromise=import('https://esm.sh/@supabase/supabase-js@2').then(function(m){
        client=m.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
        return client;
      });
    }
    return clientPromise;
  }

  function esc(value){
    var div=document.createElement('div');
    div.textContent=String(value==null?'':value);
    return div.innerHTML;
  }

  function today(){
    var d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  function fmtDate(value){
    if(!value)return '';
    try{
      return new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short'}).format(new Date(value+'T12:00:00')).replace('.','').toUpperCase();
    }catch(_){return String(value)}
  }

  function installStyle(){
    document.getElementById(STYLE_ID)?.remove();
    var style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .hn-rep-screen #${CARD_ID}{margin:14px 0 8px;text-align:left}
      .hn-rep-screen .hn-mer-stack{display:grid;gap:8px}
      .hn-rep-screen .hn-mer-card{border:1px solid rgba(229,189,98,.60);background:linear-gradient(180deg,rgba(13,16,12,.92),rgba(4,6,4,.90));overflow:hidden}
      .hn-rep-screen .hn-mer-toggle{width:100%;min-height:68px;border:0;background:transparent;color:#f4f1e8;padding:14px 15px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;text-align:left}
      .hn-rep-screen .hn-mer-kicker{display:block;color:#e5bd62;font-size:8px;font-weight:700;letter-spacing:.22em;text-transform:uppercase}
      .hn-rep-screen .hn-mer-event{display:block;margin-top:6px;color:#f4f1e8;font:18px/1.05 Georgia,"Times New Roman",serif;letter-spacing:.02em}
      .hn-rep-screen .hn-mer-meta{display:block;margin-top:6px;color:rgba(244,241,232,.56);font-size:8px;letter-spacing:.12em;text-transform:uppercase}
      .hn-rep-screen .hn-mer-arrow{width:36px;height:36px;border:1px solid rgba(229,189,98,.42);display:grid;place-items:center;color:#fff1a8;font-size:18px;line-height:1;transition:transform .18s ease,background .18s ease}
      .hn-rep-screen .hn-mer-card.is-open .hn-mer-arrow{transform:rotate(180deg);background:rgba(229,189,98,.06)}
      .hn-rep-screen .hn-mer-body{display:none;border-top:1px solid rgba(229,189,98,.24);padding:14px}
      .hn-rep-screen .hn-mer-card.is-open .hn-mer-body{display:block}
      .hn-rep-screen .hn-mer-summary{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:8px}
      .hn-rep-screen .hn-mer-count{color:#fff1a8;font:24px/1 Georgia,"Times New Roman",serif}
      .hn-rep-screen .hn-mer-count-label{display:block;margin-top:4px;color:rgba(244,241,232,.42);font-size:7px;letter-spacing:.13em;text-transform:uppercase}
      .hn-rep-screen .hn-mer-pending{color:rgba(244,241,232,.68);font-size:8px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;text-align:right}
      .hn-rep-screen .hn-mer-progress{height:4px;margin-bottom:12px;background:rgba(229,189,98,.14);overflow:hidden}
      .hn-rep-screen .hn-mer-progress>span{display:block;height:100%;background:#e5bd62;transition:width .18s ease}
      .hn-rep-screen .hn-mer-list{border-top:1px solid rgba(255,255,255,.07)}
      .hn-rep-screen .hn-mer-row{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:11px;min-height:58px;padding:9px 2px;border-bottom:1px solid rgba(255,255,255,.07)}
      .hn-rep-screen .hn-mer-box{width:30px;height:30px;border:1.5px solid #e5bd62;display:grid;place-items:center;color:#020302;background:transparent;font-size:18px;font-weight:900;line-height:1}
      .hn-rep-screen .hn-mer-row.is-done .hn-mer-box{background:#e5bd62;color:#020302}
      .hn-rep-screen .hn-mer-song-title{color:#f4f1e8;font-size:11px;font-weight:600;line-height:1.22;letter-spacing:.07em;text-transform:uppercase}
      .hn-rep-screen .hn-mer-song-artist{margin-top:3px;color:rgba(244,241,232,.46);font-size:8px;line-height:1.2;letter-spacing:.08em;text-transform:uppercase}
      .hn-rep-screen .hn-mer-row.is-done .hn-mer-song-title{text-decoration:line-through;text-decoration-thickness:1.5px;text-decoration-color:#e5bd62;color:rgba(244,241,232,.42)}
      .hn-rep-screen .hn-mer-row.is-done .hn-mer-song-artist{text-decoration:line-through;color:rgba(244,241,232,.28)}
      .hn-rep-screen .hn-mer-special{display:inline-block;margin-top:4px;color:#e5bd62;font-size:6px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}
      .hn-rep-screen .hn-mer-empty{padding:20px 6px;color:rgba(244,241,232,.42);font-size:8px;line-height:1.45;letter-spacing:.12em;text-align:center;text-transform:uppercase}
      .hn-rep-screen .hn-mer-loading{border:1px solid rgba(229,189,98,.60);padding:15px;color:rgba(244,241,232,.42);font-size:8px;letter-spacing:.13em;text-transform:uppercase;text-align:center}
      @media(max-width:380px){
        .hn-rep-screen .hn-mer-toggle{padding:13px 12px}
        .hn-rep-screen .hn-mer-event{font-size:16px}
        .hn-rep-screen .hn-mer-body{padding:12px}
      }
    `;
    document.head.appendChild(style);
  }

  function parseRows(rows){
    var byEvent=new Map();
    (rows||[]).forEach(function(row){
      var id=String(row.event_id||'');
      if(!id)return;
      if(!byEvent.has(id)){
        byEvent.set(id,{
          event_id:row.event_id,
          event_title:row.event_title||'Evento',
          event_date:row.event_date||'',
          event_venue:row.event_venue||'',
          items:[]
        });
      }
      if(row.item_id){
        byEvent.get(id).items.push({
          item_id:row.item_id,
          song_id:row.song_id,
          song_title:row.song_title||'',
          song_artist:row.song_artist||'',
          item_position:Number(row.item_position)||0,
          completed:row.completed===true,
          completed_at:row.completed_at||null
        });
      }
    });
    groups=[...byEvent.values()].sort(function(a,b){
      return String(a.event_date||'').localeCompare(String(b.event_date||''));
    });
    if(openEventId&&!groups.some(function(group){return String(group.event_id)===String(openEventId)}))openEventId='';
  }

  function visibleGroups(){
    if(!groups.length)return [];
    var created=groups.filter(function(group){return Array.isArray(group.items)&&group.items.length>0});
    if(!created.length)return [];
    var now=today();
    var future=created.filter(function(group){return String(group.event_date||'')>=now});
    return future.length?future:[created[created.length-1]];
  }

  function groupBodyMarkup(group){
    var done=group.items.filter(function(item){return item.completed}).length;
    var total=group.items.length;
    var pending=Math.max(0,total-done);

    if(!total){
      return '<div class="hn-mer-summary"><div><div class="hn-mer-count">0 / 0</div><span class="hn-mer-count-label">Realizadas</span></div><div class="hn-mer-pending">0 pendientes</div></div>'+
        '<div class="hn-mer-progress"><span style="width:0%"></span></div>'+
        '<div class="hn-mer-empty">Todavía no hay canciones asignadas a este evento.</div>';
    }

    return '<div class="hn-mer-summary"><div><div class="hn-mer-count">'+done+' / '+total+'</div><span class="hn-mer-count-label">Realizadas</span></div><div class="hn-mer-pending">'+pending+' pendientes</div></div>'+
      '<div class="hn-mer-progress"><span style="width:'+(total?Math.round(done/total*100):0)+'%"></span></div>'+
      '<div class="hn-mer-list">'+group.items.map(function(item){
        return '<div class="hn-mer-row'+(item.completed?' is-done':'')+'">'+
          '<div class="hn-mer-box">'+(item.completed?'✓':'')+'</div>'+
          '<div><div class="hn-mer-song-title">'+esc(item.song_title||'')+'</div>'+
          (item.song_artist?'<div class="hn-mer-song-artist">'+esc(item.song_artist)+'</div>':'')+
          (!item.song_id?'<div class="hn-mer-special">Canción especial</div>':'')+
          '</div></div>';
      }).join('')+'</div>';
  }

  function cardMarkup(group){
    var done=group.items.filter(function(item){return item.completed}).length;
    var total=group.items.length;
    var isOpen=String(openEventId)===String(group.event_id);
    var meta=[fmtDate(group.event_date),group.event_venue,done+' / '+total].filter(Boolean).join(' · ');
    return '<section class="hn-mer-card'+(isOpen?' is-open':'')+'" data-event-id="'+esc(group.event_id)+'">'+
      '<button class="hn-mer-toggle" type="button" aria-expanded="'+(isOpen?'true':'false')+'" data-event-id="'+esc(group.event_id)+'">'+
        '<span><span class="hn-mer-kicker">Repertorio del evento</span><span class="hn-mer-event">'+esc(group.event_title||'Evento')+'</span><span class="hn-mer-meta">'+esc(meta)+'</span></span>'+
        '<span class="hn-mer-arrow">⌄</span>'+
      '</button>'+
      '<div class="hn-mer-body">'+groupBodyMarkup(group)+'</div>'+
    '</section>';
  }

  function armEventHistory(id){
    try{
      var nextState=Object.assign({},history.state||{},{hnRepertoire:true,hnEventRepertoire:id});
      if(eventHistoryArmed){
        history.replaceState(nextState,'',location.href);
      }else{
        history.pushState(nextState,'',location.href);
        eventHistoryArmed=true;
      }
    }catch(_){}
  }

  function closeEventFromTap(){
    if(eventHistoryArmed){
      try{history.back();return}catch(_){}
    }
    eventHistoryArmed=false;
    openEventId='';
    renderCards();
  }

  function bindCards(root){
    root.querySelectorAll('.hn-mer-toggle').forEach(function(toggle){
      toggle.onclick=function(event){
        event.preventDefault();
        event.stopPropagation();
        var id=String(toggle.dataset.eventId||'');
        if(String(openEventId)===id){
          closeEventFromTap();
          return;
        }
        openEventId=id;
        armEventHistory(id);
        renderCards();
      };
    });
  }

  function handleNativeBack(event){
    var screen=document.getElementById('moduleScreen');
    if(!screen||!screen.classList.contains('is-active')||!screen.querySelector('.hn-rep-screen'))return false;

    var stateEventId=String(event?.state?.hnEventRepertoire||'');
    if(stateEventId){
      openEventId=stateEventId;
      eventHistoryArmed=true;
      renderCards();
      return true;
    }

    if(eventHistoryArmed||openEventId){
      eventHistoryArmed=false;
      openEventId='';
      renderCards();
      return true;
    }
    return false;
  }

  function renderCards(){
    var screen=document.getElementById('moduleScreen');
    var inner=screen?.querySelector('.hn-rep-screen');
    if(!inner)return;

    var root=document.getElementById(CARD_ID);
    if(!root){
      root=document.createElement('div');
      root.id=CARD_ID;
      var topBack=inner.querySelector('.hn-r-back-top');
      if(topBack&&topBack.nextSibling)inner.insertBefore(root,topBack.nextSibling);
      else if(topBack)topBack.insertAdjacentElement('afterend',root);
      else{
        var head=inner.querySelector('.hn-r-head');
        if(head&&head.nextSibling)inner.insertBefore(root,head.nextSibling);
        else inner.prepend(root);
      }
    }

    if(!ready){
      root.innerHTML='<div class="hn-mer-loading">Cargando repertorios de eventos…</div>';
      return;
    }

    var visible=visibleGroups();
    if(!visible.length){
      root.innerHTML='<div class="hn-mer-loading">No tienes eventos asignados.</div>';
      return;
    }

    root.innerHTML='<div class="hn-mer-stack">'+visible.map(cardMarkup).join('')+'</div>';
    bindCards(root);
  }

  async function sync(){
    if(syncing||!logged())return;
    syncing=true;
    try{
      client=await getClient();
      var id=profileId();
      if(!id){groups=[];openEventId='';ready=true;renderCards();return}
      var result=await client.rpc('get_event_repertoire_for_profile',{p_profile_id:id});
      if(result.error){
        console.error('[HN Event Repertoire Musician]',result.error);
        return;
      }
      parseRows(Array.isArray(result.data)?result.data:[]);
      ready=true;
      renderCards();
    }catch(error){
      console.error('[HN Event Repertoire Musician]',error);
    }finally{
      syncing=false;
    }
  }

  function scheduleSync(){
    clearTimeout(syncTimer);
    syncTimer=setTimeout(sync,90);
  }

  function subscribe(){
    if(!client)return;
    if(channel)try{client.removeChannel(channel)}catch(_){}
    channel=client.channel('hn-event-repertoire-musician-v2-'+String(profileId()||'none'))
      .on('postgres_changes',{event:'*',schema:'public',table:'calendar_events'},scheduleSync)
      .on('postgres_changes',{event:'*',schema:'public',table:'calendar_event_recipients'},scheduleSync)
      .subscribe(function(status){if(status==='SUBSCRIBED')scheduleSync()});
  }

  async function start(){
    if(!logged())return;
    installStyle();
    try{client=await getClient()}catch(error){console.error('[HN Event Repertoire Musician] client',error);return}
    ready=false;
    await sync();
    subscribe();
    renderCards();
  }

  function stop(){
    clearTimeout(syncTimer);
    if(channel&&client)try{client.removeChannel(channel)}catch(_){}
    channel=null;
    groups=[];
    openEventId='';
    eventHistoryArmed=false;
    ready=false;
    document.getElementById(CARD_ID)?.remove();
  }

  function installObservers(){
    var screen=document.getElementById('moduleScreen');
    if(!screen)return;

    if(!screenObserver){
      screenObserver=new MutationObserver(function(){
        if(!screen.querySelector('.hn-rep-screen'))return;
        if(!document.getElementById(CARD_ID))renderCards();
      });
      screenObserver.observe(screen,{childList:true,subtree:true});
    }

    if(!classObserver){
      classObserver=new MutationObserver(function(){
        if(!screen.classList.contains('is-active')){
          openEventId='';
          eventHistoryArmed=false;
        }else if(screen.querySelector('.hn-rep-screen')){
          renderCards();
          scheduleSync();
        }
      });
      classObserver.observe(screen,{attributes:true,attributeFilter:['class']});
    }
  }

  function init(){
    installStyle();
    installObservers();
    if(logged())start();

    window.addEventListener('hn:session-ready',function(){
      stop();
      start();
    });
    window.addEventListener('hn:session-logout',stop);
    window.addEventListener('online',function(){if(logged())scheduleSync()});
    document.addEventListener('visibilitychange',function(){if(!document.hidden&&logged())scheduleSync()});
    window.hnEventRepertoireHandlePopstate=handleNativeBack;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();