/* HAVANA NICE — CHAT PRESENCE V6
   Realtime typing / recording / sending state over Supabase Broadcast.
   One lightweight channel, no database rows, no global MutationObserver.
*/
(()=>{
  'use strict';
  if(window.__hnChatPresenceV6)return;
  window.__hnChatPresenceV6=true;

  const CHANNEL='hn-chat-presence-v1';
  const EVENT='activity';
  const HEARTBEAT_MS=1000;
  const REMOTE_TIMEOUT_MS=4200;
  const SEND_MIN_MS=900;

  let sb=null,ch=null,channelStatus='CLOSED',reconnectTimer=null;
  let input=null,compose=null,mic=null,indicator=null,heartbeat=null,expiryTimer=null;
  let localState='idle',localMeta={},minimumUntil=0;
  const remote=new Map();

  function profile(){try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')}catch(_){return null}}
  function myId(){return String(profile()?.id||'')}
  function myName(){const p=profile()||{};return String(p.sender_name||p.name||p.full_name||p.username||'MIEMBRO').trim()||'MIEMBRO'}
  function chatIsOpen(){return !!document.querySelector('#hn-chat-screen.is-active')}
  function findInput(){return document.querySelector('#hn-chat-screen .hn-chat-input')}

  function ensureIndicator(){
    if(!compose)return;
    if(indicator&&indicator.isConnected)return;
    indicator=document.createElement('div');
    indicator.id='hn-chat-typing-indicator';
    indicator.setAttribute('aria-live','polite');
    indicator.style.cssText='display:block!important;grid-column:1 / -1!important;height:17px!important;min-height:17px!important;padding:0 4px!important;margin:0 0 2px!important;color:#315f50!important;font-size:10px!important;font-weight:700!important;letter-spacing:.02em!important;line-height:17px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;pointer-events:none!important;visibility:hidden;opacity:0;transition:opacity .12s linear';
    compose.insertBefore(indicator,compose.firstChild);
  }

  function bindUi(){
    const el=findInput();if(!el)return false;
    const box=el.closest('.hn-chat-compose');if(!box)return false;
    input=el;compose=box;mic=box.querySelector('.hn-chat-mic');ensureIndicator();

    if(input.dataset.hnPresenceV6!=='1'){
      input.dataset.hnPresenceV6='1';
      input.addEventListener('input',onInput,{passive:true});
      input.addEventListener('blur',()=>{if(localState==='typing')setLocal('idle')},{passive:true});
      input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&localState==='typing')setLocal('idle')});
    }
    if(box.dataset.hnPresenceV6!=='1'){
      box.dataset.hnPresenceV6='1';
      box.addEventListener('submit',onSubmit,{capture:true});
    }
    if(mic&&mic.dataset.hnPresenceV6!=='1'){
      mic.dataset.hnPresenceV6='1';
      mic.addEventListener('click',onMicClick,{passive:true});
    }
    render();
    return true;
  }

  function namesText(names,singular,plural){
    if(names.length===1)return `${names[0]} ${singular}`;
    if(names.length===2)return `${names[0]} y ${names[1]} ${plural}`;
    return `${names[0]}, ${names[1]} y ${names.length-2} más ${plural}`;
  }

  function actionText(item){
    const name=item.name||'MIEMBRO',count=Math.max(1,Number(item.count)||1);
    switch(item.state){
      case 'typing':return `${name} está escribiendo…`;
      case 'recording':return `${name} está grabando una nota de voz…`;
      case 'message':return `${name} está enviando un mensaje…`;
      case 'voice':return `${name} está enviando una nota de voz…`;
      case 'photo':return `${name} está enviando ${count===1?'una foto':count+' fotos'}…`;
      case 'video':return `${name} está enviando ${count===1?'un video':count+' videos'}…`;
      case 'media':return `${name} está enviando ${count===1?'un archivo':count+' archivos'}…`;
      default:return '';
    }
  }

  function render(){
    if(!indicator)return;
    const now=Date.now(),me=myId();
    for(const [id,item] of remote){if(now-item.at>REMOTE_TIMEOUT_MS)remote.delete(id)}
    const items=[...remote.values()].filter(x=>String(x.id)!==me&&x.state&&x.state!=='idle');
    let text='';
    if(items.length){
      const states=[...new Set(items.map(x=>x.state))];
      if(states.length===1&&states[0]==='typing')text=namesText([...new Set(items.map(x=>x.name).filter(Boolean))],'está escribiendo…','están escribiendo…');
      else if(states.length===1&&states[0]==='recording')text=namesText([...new Set(items.map(x=>x.name).filter(Boolean))],'está grabando una nota de voz…','están grabando notas de voz…');
      else if(states.length===1&&states[0]==='message')text=namesText([...new Set(items.map(x=>x.name).filter(Boolean))],'está enviando un mensaje…','están enviando mensajes…');
      else if(items.length<=2)text=items.map(actionText).filter(Boolean).join('  ·  ');
      else text=`${actionText(items[0])}  ·  ${items.length-1} más activos…`;
    }
    indicator.textContent=text;
    const visible=!!text&&chatIsOpen();
    indicator.style.visibility=visible?'visible':'hidden';
    indicator.style.opacity=visible?'1':'0';
  }

  function scheduleExpiry(){
    clearTimeout(expiryTimer);expiryTimer=null;
    const now=Date.now(),times=[...remote.values()].map(x=>x.at+REMOTE_TIMEOUT_MS).filter(t=>t>now);
    if(!times.length){render();return}
    expiryTimer=setTimeout(()=>{expiryTimer=null;render();scheduleExpiry()},Math.max(20,Math.min(...times)-now+20));
  }

  function receive(message){
    const d=message?.payload||{};if(!d.id||String(d.id)===myId())return;
    const state=String(d.state||'idle');
    if(state==='idle')remote.delete(String(d.id));
    else remote.set(String(d.id),{id:String(d.id),name:String(d.name||'MIEMBRO'),state,count:Number(d.count)||1,at:Date.now()});
    bindUi();render();scheduleExpiry();
  }

  function broadcastNow(){
    if(!ch||channelStatus!=='SUBSCRIBED'||!myId())return;
    try{ch.send({type:'broadcast',event:EVENT,payload:{id:myId(),name:myName(),state:localState,count:Number(localMeta.count)||1}}).catch(()=>{})}catch(_){}
  }

  function startHeartbeat(){
    clearInterval(heartbeat);heartbeat=null;
    if(localState==='idle')return;
    heartbeat=setInterval(()=>{syncLocalFromUi();if(localState!=='idle')broadcastNow()},HEARTBEAT_MS);
  }

  function setLocal(state,meta={}){
    const next=String(state||'idle');
    const nextCount=Number(meta.count)||1;
    const changed=next!==localState||nextCount!==(Number(localMeta.count)||1);
    localState=next;localMeta=meta||{};
    if(next==='idle'){clearInterval(heartbeat);heartbeat=null}else startHeartbeat();
    if(changed||next==='idle')broadcastNow();
  }

  function onInput(){
    bindUi();
    const hasText=!!String(input?.value||'').trim();
    if(!hasText){if(localState==='typing')setLocal('idle');return}
    if(!['recording','message','voice','photo','video','media'].includes(localState))setLocal('typing');
  }

  function detectSendState(){
    const screen=document.getElementById('hn-chat-screen');
    if(screen?.querySelector('.hn-chat-recording.is-pending'))return {state:'voice',count:1};
    const items=[...(screen?.querySelectorAll('.hn-chat-media-pending .hn-chat-pending-item')||[])];
    if(items.length){
      const videos=items.filter(x=>x.classList.contains('hn-video-card-shell')).length;
      const photos=items.length-videos;
      if(photos&&videos)return {state:'media',count:items.length};
      if(videos)return {state:'video',count:videos};
      return {state:'photo',count:photos};
    }
    return {state:'message',count:1};
  }

  function onSubmit(){
    const send=detectSendState();
    minimumUntil=Date.now()+SEND_MIN_MS;
    setLocal(send.state,{count:send.count});
    setTimeout(syncLocalFromUi,SEND_MIN_MS+80);
  }

  function onMicClick(){
    setTimeout(()=>{
      bindUi();
      if(mic?.classList.contains('is-recording'))setLocal('recording');
      else if(localState==='recording')setLocal('idle');
    },80);
    setTimeout(()=>{
      bindUi();
      if(mic?.classList.contains('is-recording'))setLocal('recording');
      else if(localState==='recording')setLocal('idle');
    },650);
  }

  function syncLocalFromUi(){
    if(document.hidden||!chatIsOpen()){if(localState!=='idle')setLocal('idle');return}
    bindUi();
    if(mic?.classList.contains('is-recording')){if(localState!=='recording')setLocal('recording');return}
    if(localState==='recording'){setLocal('idle');return}
    if(['message','voice','photo','video','media'].includes(localState)){
      if(Date.now()<minimumUntil)return;
      const outgoing=document.querySelector('#hn-chat-screen .hn-chat-row[data-chat-key="outgoing"]');
      if(outgoing)return;
      setLocal(document.activeElement===input&&String(input?.value||'').trim()?'typing':'idle');
    }
  }

  function scheduleReconnect(){
    clearTimeout(reconnectTimer);
    reconnectTimer=setTimeout(()=>{disconnect(false);connect()},1200);
  }

  function disconnect(sendIdle=true){
    if(sendIdle&&localState!=='idle'){const previous=localState;localState='idle';broadcastNow();localState=previous}
    const old=ch;ch=null;channelStatus='CLOSED';
    if(old&&sb){try{Promise.resolve(sb.removeChannel(old)).catch(()=>{})}catch(_){}}
  }

  function connect(){
    sb=window.hnSupabase||window.hnMusicianSupabase||window.supabaseClient||null;
    if(!sb?.channel){setTimeout(connect,300);return}
    if(ch)return;
    channelStatus='JOINING';
    ch=sb.channel(CHANNEL,{config:{broadcast:{self:false,ack:false}}});
    ch.on('broadcast',{event:EVENT},receive);
    ch.subscribe(status=>{
      channelStatus=status;
      if(status==='SUBSCRIBED'){
        clearTimeout(reconnectTimer);bindUi();broadcastNow();render();
      }else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))scheduleReconnect();
    });
  }

  function chatEntryClick(e){
    const target=e.target?.closest?.('.hn-chat-module,.module');if(!target)return;
    if(!/CHAT DE INFORMACI[ÓO]N/i.test(target.textContent||''))return;
    setTimeout(bindUi,0);setTimeout(bindUi,80);setTimeout(()=>{bindUi();render()},260);
  }

  document.addEventListener('click',chatEntryClick,true);
  window.addEventListener('hn:chat-media-upload-progress',()=>{if(['photo','video','media'].includes(localState))broadcastNow()});
  window.addEventListener('hn:session-ready',()=>{connect();setTimeout(bindUi,100)});
  window.addEventListener('hn:session-logout',()=>{setLocal('idle');remote.clear();render()});
  window.addEventListener('pagehide',()=>setLocal('idle'),{passive:true});
  window.addEventListener('beforeunload',()=>setLocal('idle'),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setLocal('idle');else{connect();bindUi();render();scheduleExpiry()}},{passive:true});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{connect();bindUi()},{once:true});
  else{connect();bindUi()}
})();
