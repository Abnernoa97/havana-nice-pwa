/* HAVANA NICE — CHAT PRESENCE V5
   Realtime typing + sending state over Supabase Broadcast.
   No database rows, no polling and no chat transport ownership.
*/
(()=>{
  'use strict';
  const CHANNEL='hn-chat-typing-v3';
  const HEARTBEAT_MS=750;
  const REMOTE_TIMEOUT_MS=2600;
  const SEND_GRACE_MS=500;
  let sb=null,ch=null,input=null,indicator=null,compose=null,heartbeat=null,expiryTimer=null;
  let localState='idle',localMeta={},sendingGraceUntil=0;
  const remote=Object.create(null);

  function profile(){try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')}catch(_){return null}}
  function myId(){return String(profile()?.id||'')}
  function myName(){const p=profile()||{};return String(p.sender_name||p.name||p.full_name||p.username||'MIEMBRO').trim()||'MIEMBRO'}
  function findInput(){return document.querySelector('#hn-chat-screen .hn-chat-input')||document.querySelector('.hn-chat-input')||document.querySelector('#hn-chat-screen textarea')||document.querySelector('.hn-chat-compose textarea')}
  function chatIsOpen(){return !!document.querySelector('#hn-chat-screen.is-active')}

  function ensure(){
    const el=findInput();if(!el)return false;
    const box=el.closest('.hn-chat-compose')||document.querySelector('.hn-chat-compose');if(!box)return false;
    input=el;compose=box;
    if(!indicator||!document.body.contains(indicator)){
      indicator=document.createElement('div');
      indicator.id='hn-chat-typing-indicator';
      indicator.setAttribute('aria-live','polite');
      indicator.style.cssText='display:none;grid-column:1 / -1!important;min-height:17px;padding:0 4px;margin:0 0 2px;color:#315f50;font-size:10px;font-weight:700;letter-spacing:.04em;line-height:17px;pointer-events:none';
      box.insertBefore(indicator,box.firstChild);
    }
    if(input.dataset.hnPresenceV5!=='1'){
      input.dataset.hnPresenceV5='1';
      input.addEventListener('input',onInput,{passive:true});
      input.addEventListener('blur',()=>{if(localState==='typing')setLocal('idle')},{passive:true});
      input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&localState==='typing')setLocal('idle')});
    }
    if(box.dataset.hnPresenceV5!=='1'){
      box.dataset.hnPresenceV5='1';
      box.addEventListener('submit',onSubmit,{capture:true});
    }
    return true;
  }

  function namesText(names,singular,plural){
    if(names.length===1)return names[0]+' '+singular;
    if(names.length===2)return names[0]+' y '+names[1]+' '+plural;
    return names[0]+', '+names[1]+' y '+(names.length-2)+' más '+plural;
  }

  function actionText(item){
    const name=item.name||'MIEMBRO',count=Math.max(1,Number(item.count)||1);
    if(item.state==='typing')return name+' está escribiendo…';
    if(item.state==='message')return name+' está enviando un mensaje…';
    if(item.state==='voice')return name+' está enviando una nota de voz…';
    if(item.state==='photo')return name+' está enviando '+(count===1?'una foto':count+' fotos')+'…';
    if(item.state==='video')return name+' está enviando '+(count===1?'un video':count+' videos')+'…';
    if(item.state==='media')return name+' está enviando '+(count===1?'un archivo':count+' archivos')+'…';
    return '';
  }

  function render(){
    if(!indicator)return;
    const me=myId(),now=Date.now();
    Object.keys(remote).forEach(id=>{if(now-remote[id].at>REMOTE_TIMEOUT_MS)delete remote[id]});
    const items=Object.values(remote).filter(x=>String(x.id)!==me&&x.state&&x.state!=='idle');
    let text='';
    if(items.length){
      const states=[...new Set(items.map(x=>x.state))];
      if(states.length===1&&states[0]==='typing'){
        text=namesText([...new Set(items.map(x=>x.name).filter(Boolean))],'está escribiendo…','están escribiendo…');
      }else if(states.length===1&&states[0]==='message'){
        text=namesText([...new Set(items.map(x=>x.name).filter(Boolean))],'está enviando un mensaje…','están enviando mensajes…');
      }else if(items.length<=2){
        text=items.map(actionText).filter(Boolean).join('  ·  ');
      }else{
        const first=actionText(items[0]);text=first+(first?'  ·  ':'')+(items.length-1)+' más activos…';
      }
    }
    indicator.textContent=text;
    indicator.style.display=text&&chatIsOpen()?'block':'none';
  }

  function scheduleExpiry(){
    clearTimeout(expiryTimer);const now=Date.now(),times=Object.values(remote).map(x=>x.at+REMOTE_TIMEOUT_MS).filter(t=>t>now);
    if(!times.length){expiryTimer=null;render();return}
    expiryTimer=setTimeout(()=>{expiryTimer=null;render();scheduleExpiry()},Math.max(0,Math.min(...times)-now+15));
  }

  function receive(message){
    const d=message?.payload||{};if(!d.id||String(d.id)===myId())return;
    const state=String(d.state||(d.typing?'typing':'idle'));
    if(state==='idle')delete remote[String(d.id)];
    else remote[String(d.id)]={id:d.id,name:d.name||'MIEMBRO',state,count:Number(d.count)||1,at:Date.now()};
    ensure();render();scheduleExpiry();
  }

  async function broadcastState(){
    if(!ch||!myId())return;
    const state=localState;
    try{await ch.send({type:'broadcast',event:'typing',payload:{id:myId(),name:myName(),state,typing:state==='typing',count:Number(localMeta.count)||1}})}catch(_){}
  }

  function startHeartbeat(){
    clearInterval(heartbeat);heartbeat=null;
    if(localState==='idle')return;
    heartbeat=setInterval(()=>{
      if(localState==='typing'&&(!input||!String(input.value||'').trim())){setLocal('idle');return}
      syncSendingFromDom();
      if(localState!=='idle')broadcastState();
    },HEARTBEAT_MS);
  }

  function setLocal(state,meta={}){
    const next=String(state||'idle');
    const changed=next!==localState||Number(meta.count||1)!==Number(localMeta.count||1);
    localState=next;localMeta=meta||{};
    if(next==='idle'){clearInterval(heartbeat);heartbeat=null}
    else startHeartbeat();
    if(changed||next==='idle')broadcastState();
  }

  function onInput(){
    ensure();if(!input||!String(input.value||'').trim()){if(localState==='typing')setLocal('idle');return}
    if(!localState.startsWith('send')&&localState!=='message'&&localState!=='photo'&&localState!=='video'&&localState!=='media'&&localState!=='voice')setLocal('typing');
  }

  function detectSendState(){
    const screen=document.getElementById('hn-chat-screen');
    const recording=screen?.querySelector('.hn-chat-recording.is-pending');
    if(recording)return {state:'voice',count:1};
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
    const send=detectSendState();sendingGraceUntil=Date.now()+SEND_GRACE_MS;setLocal(send.state,{count:send.count});
    setTimeout(syncSendingFromDom,SEND_GRACE_MS+30);
  }

  function syncSendingFromDom(){
    if(!['message','photo','video','media','voice'].includes(localState))return;
    if(Date.now()<sendingGraceUntil)return;
    const outgoing=document.querySelector('#hn-chat-screen .hn-chat-row[data-chat-key="outgoing"]');
    if(!outgoing)setLocal('idle');
  }

  function connect(){
    sb=window.hnSupabase||window.hnMusicianSupabase||window.supabaseClient||window.supabase||null;
    if(!sb){setTimeout(connect,500);return}
    if(!ch){
      ch=sb.channel(CHANNEL);
      ch.on('broadcast',{event:'typing'},receive);
      ch.subscribe(()=>ensure());
    }
    ensure();render();scheduleExpiry();
    if(!window.__hnPresenceObserverV5){
      window.__hnPresenceObserverV5=true;
      new MutationObserver(()=>{ensure();syncSendingFromDom();render()}).observe(document.body,{childList:true,subtree:true});
    }
  }

  window.addEventListener('hn:chat-media-upload-progress',()=>{if(['photo','video','media'].includes(localState))broadcastState()});
  window.addEventListener('pagehide',()=>setLocal('idle'),{passive:true});
  window.addEventListener('beforeunload',()=>setLocal('idle'),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setLocal('idle');else{ensure();render();scheduleExpiry()}},{passive:true});
  connect();
})();
