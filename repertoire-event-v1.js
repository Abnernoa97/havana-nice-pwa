/* HAVANA NICE — MUSICIAN EVENT REPERTOIRE V1
   Read-only event setlist accordion inside the existing musician Repertoire screen.
   Additive layer only: does not alter master repertoire rendering or editing.
*/
(function(){
  'use strict';
  if(window.__hnMusicianEventRepertoireV1)return;
  window.__hnMusicianEventRepertoireV1=true;

  const STYLE_ID='hnMusicianEventRepertoireStyle';
  const CARD_ID='hnMusicianEventRepertoire';
  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';

  let client=null;
  let clientPromise=null;
  let channel=null;
  let groups=[];
  let selectedEventId='';
  let ready=false;
  let expanded=false;
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
    if(document.getElementById(STYLE_ID))return;
    var style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .hn-rep-screen #${CARD_ID}{margin:14px 0 8px;border:1px solid rgba(229,189,98,.60);background:linear-gradient(180deg,rgba(13,16,12,.92),rgba(4,6,4,.90));text-align:left}
      .hn-rep-screen .hn-mer-toggle{width:100%;min-height:68px;border:0;background:transparent;color:#f4f1e8;padding:14px 15px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;text-align:left}
      .hn-rep-screen .hn-mer-kicker{display:block;color:#e5bd62;font-size:8px;font-weight:700;letter-spacing:.22em;text-transform:uppercase}
      .hn-rep-screen .hn-mer-event{display:block;margin-top:6px;color:#f4f1e8;font:18px/1.05 Georgia,"Times New Roman",serif;letter-spacing:.02em}
      .hn-rep-screen .hn-mer-meta{display:block;margin-top:6px;color:rgba(244,241,232,.56);font-size:8px;letter-spacing:.12em;text-transform:uppercase}
      .hn-rep-screen .hn-mer-arrow{width:36px;height:36px;border:1px solid rgba(229,189,98,.42);display:grid;place-items:center;color:#fff1a8;font-size:18px;line-height:1;transition:transform .18s ease}
      .hn-rep-screen #${CARD_ID}.is-open .hn-mer-arrow{transform:rotate(180deg)}
      .hn-rep-screen .hn-mer-body{display:none;border-top:1px solid rgba(229,189,98,.24);padding:14px}
      .hn-rep-screen #${CARD_ID}.is-open .hn-mer-body{display:block}
      .hn-rep-screen .hn-mer-event-select-wrap{margin-bottom:12px}
      .hn-rep-screen .hn-mer-event-select-label{display:block;margin:0 0 5px;color:rgba(244,241,232,.44);font-size:7px;letter-spacing:.14em;text-transform:uppercase}
      .hn-rep-screen .hn-mer-select{width:100%;height:42px;border:1px solid rgba(229,189,98,.42);background:#0a0c09;color:#f4f1e8;padding:0 10px;font-size:10px;letter-spacing:.04em;outline:none}
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
      .hn-rep-screen .hn-mer-loading{padding:15px;color:rgba(244,241,232,.42);font-size:8px;letter-spacing:.13em;text-transform:uppercase;text-align:center}
      @media(max-width:380px){
        .hn-rep-screen .hn-mer-toggle{padding:13px 12px}
        .hn-rep-screen .hn-mer-event{font-size:16px}
        .hn-rep-screen .hn-mer-body{padding:12px}
      }
    `;
    document.head.appendChild(style);
  }

  function currentGroup(){
    return groups.find(function(group){return String(group.event_id)===String(selectedEventId)})||null;
  }

  function chooseEvent(){
    if(selectedEventId&&groups.some(function(group){return String(group.event_id)===String(selectedEventId)}))return;
    if(!groups.length){selectedEventId='';return}
    var now=today();
    var upcoming=groups.filter(function(group){return String(group.event_date||'')>=now});
    var withItems=upcoming.find(function(group){return group.items.length>0});
    selectedEventId=String((withItems||upcoming[0]||groups[groups.length-1]).event_id||'');
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
    chooseEvent();
  }

  function availableGroups(){
    if(!groups.length)return [];
    var now=today();
    var future=groups.filter(function(group){return String(group.event_date||'')>=now});
    return future.length?future:[groups[groups.length-1]];
  }

  function cardMarkup(){
    var group=currentGroup();
    var count=group?group.items.filter(function(item){return item.completed}).length:0;
    var total=group?group.items.length:0;
    var title=group?(group.event_title||'Evento'):(ready?'Sin evento asignado':'Cargando…');
    var meta=group?[fmtDate(group.event_date),group.event_venue,count+' / '+total].filter(Boolean).join(' · '):(ready?'Sin repertorio de evento':'');
    return '<button class="hn-mer-toggle" type="button" aria-expanded="'+(expanded?'true':'false')+'">'+
      '<span><span class="hn-mer-kicker">Repertorio del evento</span><span class="hn-mer-event">'+esc(title)+'</span><span class="hn-mer-meta">'+esc(meta)+'</span></span>'+
      '<span class="hn-mer-arrow">⌄</span></button>'+
      '<div class="hn-mer-body">'+bodyMarkup()+'</div>';
  }

  function bodyMarkup(){
    if(!ready)return '<div class="hn-mer-loading">Cargando repertorio del evento…</div>';
    var activeGroups=availableGroups();
    var group=currentGroup();
    if(!group)return '<div class="hn-mer-empty">No tienes eventos asignados.</div>';

    var done=group.items.filter(function(item){return item.completed}).length;
    var total=group.items.length;
    var pending=Math.max(0,total-done);
    var select='';
    if(activeGroups.length>1){
      select='<div class="hn-mer-event-select-wrap"><label class="hn-mer-event-select-label" for="hnMerEventSelect">Evento</label><select id="hnMerEventSelect" class="hn-mer-select">'+activeGroups.map(function(event){
        return '<option value="'+esc(event.event_id)+'"'+(String(event.event_id)===String(selectedEventId)?' selected':'')+'>'+esc(fmtDate(event.event_date)+' · '+event.event_title+(event.event_venue?' · '+event.event_venue:''))+'</option>';
      }).join('')+'</select></div>';
    }

    if(!total){
      return select+'<div class="hn-mer-summary"><div><div class="hn-mer-count">0 / 0</div><span class="hn-mer-count-label">Realizadas</span></div><div class="hn-mer-pending">0 pendientes</div></div><div class="hn-mer-progress"><span style="width:0%"></span></div><div class="hn-mer-empty">Todavía no hay canciones asignadas a este evento.</div>';
    }

    return select+
      '<div class="hn-mer-summary"><div><div class="hn-mer-count">'+done+' / '+total+'</div><span class="hn-mer-count-label">Realizadas</span></div><div class="hn-mer-pending">'+pending+' pendientes</div></div>'+
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

  function bindCard(card){
    var toggle=card.querySelector('.hn-mer-toggle');
    if(toggle){
      toggle.onclick=function(event){
        event.preventDefault();
        event.stopPropagation();
        expanded=!expanded;
        renderCard();
      };
    }
    var select=card.querySelector('#hnMerEventSelect');
    if(select){
      select.onchange=function(event){
        selectedEventId=String(event.target.value||'');
        renderCard();
      };
    }
  }

  function renderCard(){
    var screen=document.getElementById('moduleScreen');
    var inner=screen?.querySelector('.hn-rep-screen');
    if(!inner)return;

    var card=document.getElementById(CARD_ID);
    if(!card){
      card=document.createElement('section');
      card.id=CARD_ID;
      card.className=expanded?'is-open':'';
      var topBack=inner.querySelector('.hn-r-back-top');
      if(topBack&&topBack.nextSibling)inner.insertBefore(card,topBack.nextSibling);
      else if(topBack)topBack.insertAdjacentElement('afterend',card);
      else{
        var head=inner.querySelector('.hn-r-head');
        if(head&&head.nextSibling)inner.insertBefore(card,head.nextSibling);
        else inner.prepend(card);
      }
    }
    card.classList.toggle('is-open',expanded);
    card.innerHTML=cardMarkup();
    bindCard(card);
  }

  async function sync(){
    if(syncing||!logged())return;
    syncing=true;
    try{
      client=await getClient();
      var id=profileId();
      if(!id){groups=[];selectedEventId='';ready=true;renderCard();return}
      var result=await client.rpc('get_event_repertoire_for_profile',{p_profile_id:id});
      if(result.error){
        console.error('[HN Event Repertoire Musician]',result.error);
        return;
      }
      parseRows(Array.isArray(result.data)?result.data:[]);
      ready=true;
      renderCard();
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
    channel=client.channel('hn-event-repertoire-musician-v1-'+String(profileId()||'none'))
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
    renderCard();
  }

  function stop(){
    clearTimeout(syncTimer);
    if(channel&&client)try{client.removeChannel(channel)}catch(_){}
    channel=null;
    groups=[];
    selectedEventId='';
    ready=false;
    expanded=false;
    document.getElementById(CARD_ID)?.remove();
  }

  function installObservers(){
    var screen=document.getElementById('moduleScreen');
    if(!screen)return;

    if(!screenObserver){
      screenObserver=new MutationObserver(function(){
        if(screen.querySelector('.hn-rep-screen'))renderCard();
      });
      screenObserver.observe(screen,{childList:true,subtree:true});
    }

    if(!classObserver){
      classObserver=new MutationObserver(function(){
        if(!screen.classList.contains('is-active')){
          expanded=false;
        }else if(screen.querySelector('.hn-rep-screen')){
          renderCard();
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
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();