/* HAVANA NICE — CHAT TYPING V3
   Persistent typing state with heartbeat.
   Isolated from chat_messages.
*/
(()=>{
  'use strict';
  const CHANNEL='hn-chat-typing-v3';
  const HEARTBEAT_MS=700;
  const REMOTE_TIMEOUT_MS=2200;
  let sb=null,ch=null,input=null,indicator=null;
  let active=false,heartbeat=null;
  const remote=Object.create(null);
  function profile(){try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')}catch(_){return null}}
  function myId(){return String(profile()?.id||'')}
  function myName(){const p=profile()||{};return String(p.sender_name||p.name||p.full_name||p.username||'MIEMBRO').trim()||'MIEMBRO'}
  function findInput(){return document.querySelector('#hn-chat-screen .hn-chat-input')||document.querySelector('.hn-chat-input')||document.querySelector('#hn-chat-screen textarea')||document.querySelector('.hn-chat-compose textarea')}
  function ensure(){const el=findInput();if(!el)return false;const box=el.closest('.hn-chat-compose')||document.querySelector('.hn-chat-compose');if(!box)return false;input=el;if(!indicator||!document.body.contains(indicator)){indicator=document.createElement('div');indicator.id='hn-chat-typing-indicator';indicator.style.cssText='display:none;min-height:16px;padding:0 2px;margin:0 0 1px;color:rgba(244,241,232,.58);font-size:9px;font-weight:500;letter-spacing:.13em;text-transform:uppercase;line-height:16px;pointer-events:none';box.insertBefore(indicator,box.firstChild)}if(input.dataset.hnTypingV3!=='1'){input.dataset.hnTypingV3='1';input.addEventListener('input',onInput,{passive:true});input.addEventListener('blur',stopTyping,{passive:true});input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey)stopTyping()})}return true}
  function render(){if(!indicator)return;const now=Date.now(),me=myId();Object.keys(remote).forEach(id=>{if(now-remote[id].at>REMOTE_TIMEOUT_MS)delete remote[id]});const names=[...new Set(Object.values(remote).filter(x=>String(x.id)!==me).map(x=>x.name).filter(Boolean))];if(names.length===1)indicator.textContent=names[0]+' está escribiendo…';else if(names.length===2)indicator.textContent=names[0]+' y '+names[1]+' están escribiendo…';else if(names.length>2)indicator.textContent=names[0]+', '+names[1]+' y '+(names.length-2)+' más están escribiendo…';else indicator.textContent='';indicator.style.display=names.length?'block':'none'}
  function receive(message){const d=message?.payload||{};if(!d.id||String(d.id)===myId())return;if(d.typing)remote[String(d.id)]={id:d.id,name:d.name||'MIEMBRO',at:Date.now()};else delete remote[String(d.id)];ensure();render()}
  async function broadcast(typing){if(!ch||!myId())return;try{await ch.send({type:'broadcast',event:'typing',payload:{id:myId(),name:myName(),typing:!!typing}})}catch(_){} }
  function startHeartbeat(){clearInterval(heartbeat);heartbeat=setInterval(()=>{if(active)broadcast(true)},HEARTBEAT_MS)}
  function stopTyping(){clearInterval(heartbeat);heartbeat=null;if(active){active=false;broadcast(false)}}
  function onInput(){ensure();if(!input||!String(input.value||'').trim()){stopTyping();return}if(!active){active=true;broadcast(true);startHeartbeat()}}
  function connect(){sb=window.hnSupabase||window.hnMusicianSupabase||window.supabaseClient||window.supabase||null;if(!sb){setTimeout(connect,500);return}if(!ch){ch=sb.channel(CHANNEL);ch.on('broadcast',{event:'typing'},receive);ch.subscribe(()=>ensure())}ensure();render();if(!window.__hnTypingObserver){window.__hnTypingObserver=true;new MutationObserver(()=>ensure()).observe(document.body,{childList:true,subtree:true})}setInterval(render,500)}
  window.addEventListener('pagehide',stopTyping,{passive:true});window.addEventListener('beforeunload',stopTyping,{passive:true});
  connect();
})();
