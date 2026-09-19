/* HAVANA NICE — APP UI / DEVICE GATE
   Legacy filename kept for compatibility. No calendar data ownership here.
*/
(function(){'use strict';function installDeviceGate(){const b=document.getElementById('loginButton'),i=document.getElementById('username');if(!b||!i||b.dataset.hnDeviceGate==='1')return;b.dataset.hnDeviceGate='1';let busy=false;const msg=t=>{const e=document.getElementById('loginMessage');if(e)e.textContent=t||''};async function h(){if(busy)return;const u=i.value.trim();if(!u){msg('Escribe tu nombre');return}busy=true;b.disabled=true;msg('Verificando acceso...');try{const m=await import('./musician-device-access-v1.js?v=180733417c2b7f261249394d43ba1b1c4a82b1af6'),r=await m.requestAccess(u);if(r.status==='authorized'){const p=r.profile,s={id:p.id,username:p.username,role:p.role};sessionStorage.setItem('hn_profile',JSON.stringify(s));try{localStorage.setItem('hn_last_musician_v1',JSON.stringify(s))}catch(_){}document.getElementById('welcomeName')&&(document.getElementById('welcomeName').textContent=p.username||'');document.getElementById('welcomeRole')&&(document.getElementById('welcomeRole').textContent=p.role||'Músico de HAVANA NICE');document.getElementById('loginScreen')?.classList.remove('is-active');document.getElementById('homeScreen')?.classList.add('is-active');window.dispatchEvent(new CustomEvent('hn:session-ready',{detail:s}));msg('');return}msg(r.status==='pending'?'Acceso pendiente de autorización del administrador':r.message||'Acceso no autorizado')}catch(e){console.error(e);msg('No fue posible verificar el acceso')}finally{b.disabled=false;busy=false}}b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();h()},true);i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();b.click()}},true)}
function init(){const s=document.createElement('style');s.textContent='.module,.hn-chat-module,.calendar-event-card,.hn-chat-bubble,.hn-chat-input,.hn-chat-send,.hn-chat-recording,.hn-chat-pending-item,.hn-chat-media-item{border-radius:12px!important}';document.head.appendChild(s);installDeviceGate();if(!document.getElementById('hnMusicianBackgroundScript')){const x=document.createElement('script');x.id='hnMusicianBackgroundScript';x.src='./musician-background-v1.js?v=ec04a9e0e86e09e9a3c45df501957b282c8297ec';document.body.appendChild(x)}}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})();
(function(){var s=document.createElement('script');s.src='./session-memory-v2.js?v=20260916-stable';s.async=false;document.head.appendChild(s)})();
(function(){var s=document.createElement('script');s.src='./chat-typing-v2.js?v=70a94193937be7ab27a714e00fde8efe34503edb';s.async=false;document.head.appendChild(s)})();
(function(){var s=document.createElement('script');s.src='./ios-install-v1.js?v=72b630c25c9dbca9220acdebdab48bc002191f9d';s.async=false;document.head.appendChild(s)})();
(function(){var s=document.createElement('script');s.src='./chat-media-v13.js?v=4d4618ed670bc752451b24dcaffa613d7e0da680';s.async=false;document.head.appendChild(s)})();
(function(){var s=document.createElement('script');s.src='./chat-media-fix-v1.js?v=90a1afd6882864bd0f423ab0459550af8a23794c';s.async=false;document.head.appendChild(s)})();
(function(){var s=document.createElement('script');s.src='./chat-keyboard-v1.js?v=c8d8dc241c0ab17d471af96badbdb40cd89915af';s.async=false;document.head.appendChild(s)})();

/* Prominent upload progress UI. Transport stays in Chat Media V13; this is visual only. */
(function(){'use strict';
  const STYLE_ID='hn-chat-upload-progress-ui';
  function installStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
    #hn-chat-screen .hn-chat-row[data-chat-key="outgoing"] .hn-chat-bubble{position:relative!important;overflow:hidden!important}
    #hn-chat-screen .hn-chat-upload-visual{position:absolute!important;inset:0!important;z-index:30!important;pointer-events:none!important;display:flex!important;align-items:center!important;justify-content:center!important;background:linear-gradient(180deg,rgba(0,0,0,.10),rgba(0,0,0,.22))!important}
    #hn-chat-screen .hn-chat-upload-badge{min-width:92px!important;height:92px!important;padding:0 12px!important;border-radius:50%!important;border:2px solid rgba(255,241,168,.92)!important;background:rgba(2,3,2,.74)!important;box-shadow:0 4px 24px rgba(0,0,0,.45),inset 0 0 18px rgba(229,189,98,.08)!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important}
    #hn-chat-screen .hn-chat-upload-percent{color:#fff1a8!important;font:600 30px/1 Arial,sans-serif!important;letter-spacing:-.03em!important;text-shadow:0 1px 8px rgba(0,0,0,.6)!important}
    #hn-chat-screen .hn-chat-upload-label{margin-top:7px!important;color:rgba(244,241,232,.78)!important;font:600 8px/1 Arial,sans-serif!important;letter-spacing:.20em!important;text-transform:uppercase!important}
    #hn-chat-screen .hn-chat-upload-track{position:absolute!important;left:10px!important;right:10px!important;bottom:8px!important;height:6px!important;border-radius:999px!important;background:rgba(255,255,255,.18)!important;overflow:hidden!important;box-shadow:0 1px 4px rgba(0,0,0,.35)!important}
    #hn-chat-screen .hn-chat-upload-fill{display:block!important;height:100%!important;width:0;border-radius:inherit!important;background:linear-gradient(90deg,#b9822f,#fff1a8,#d9b45f)!important;transition:width .16s linear!important;box-shadow:0 0 10px rgba(255,241,168,.42)!important}
    #hn-chat-screen .hn-chat-row[data-chat-key="outgoing"] .hn-chat-time{font-size:10px!important;font-weight:700!important;letter-spacing:.10em!important;color:#fff1a8!important}
  `;document.head.appendChild(s)}
  function render(percent){installStyle();const bubble=document.querySelector('#hn-chat-screen .hn-chat-row[data-chat-key="outgoing"] .hn-chat-bubble');if(!bubble)return;let visual=bubble.querySelector('.hn-chat-upload-visual');if(!visual){visual=document.createElement('div');visual.className='hn-chat-upload-visual';visual.innerHTML='<div class="hn-chat-upload-badge"><div class="hn-chat-upload-percent">1%</div><div class="hn-chat-upload-label">ENVIANDO</div></div><div class="hn-chat-upload-track"><span class="hn-chat-upload-fill"></span></div>';bubble.appendChild(visual)}const value=Math.max(1,Math.min(100,Math.round(Number(percent)||0)));const number=visual.querySelector('.hn-chat-upload-percent'),fill=visual.querySelector('.hn-chat-upload-fill');if(number)number.textContent=value+'%';if(fill)fill.style.width=value+'%'}
  window.addEventListener('hn:chat-media-upload-progress',e=>render(e?.detail?.percent));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installStyle,{once:true});else installStyle();
})();

/* Clean Luxury Chat: static cream surface, lightweight cards, background video paused in Chat. */
(function(){'use strict';
  const STYLE_ID='hn-chat-clean-luxury-v2';
  let chatObserver=null,rootObserver=null,inChat=false,videoWasPlaying=false;
  function installStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
    #hn-chat-screen{background:#f4f0e8!important;background-image:none!important;color:#25211c!important;padding:max(8px,env(safe-area-inset-top)) 12px max(10px,env(safe-area-inset-bottom))!important}
    #hn-chat-screen .hn-chat-head{display:none!important}
    #hn-chat-screen .hn-chat-wrap{width:min(100%,760px)!important;padding:0!important}
    #hn-chat-screen .hn-chat-list{padding:2px 2px 12px!important;scrollbar-width:none!important}
    #hn-chat-screen .hn-chat-day{margin:12px 0 8px!important;color:#8d857a!important;font-size:9px!important;font-weight:600!important;letter-spacing:.14em!important}
    #hn-chat-screen .hn-chat-row{margin:8px 0!important}
    #hn-chat-screen .hn-chat-bubble{max-width:92%!important;border-radius:20px!important;border:1px solid #e4ded5!important;background:#fff!important;color:#27231e!important;box-shadow:0 1px 2px rgba(43,34,24,.05)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;padding:11px 13px 9px!important}
    #hn-chat-screen .hn-chat-row.mine .hn-chat-bubble{max-width:86%!important;background:#174d3b!important;border-color:#174d3b!important;color:#fff!important;box-shadow:none!important}
    #hn-chat-screen .hn-chat-bubble.hn-chat-selected{outline:2px solid rgba(23,77,59,.18)!important;box-shadow:none!important}
    #hn-chat-screen .hn-chat-sender{margin:0 0 7px!important;color:#315f50!important;font-size:10px!important;font-weight:700!important;letter-spacing:.02em!important;text-transform:none!important}
    #hn-chat-screen .hn-chat-row.mine .hn-chat-sender{color:#d9c488!important}
    #hn-chat-screen .hn-chat-text{color:#2b2722!important;font-size:15px!important;line-height:1.42!important}
    #hn-chat-screen .hn-chat-row.mine .hn-chat-text{color:#fff!important}
    #hn-chat-screen .hn-chat-time{margin-top:7px!important;color:#918b82!important;font-size:9px!important;letter-spacing:.02em!important}
    #hn-chat-screen .hn-chat-row.mine .hn-chat-time{color:rgba(255,255,255,.62)!important}
    #hn-chat-screen .hn-chat-quoted{border-left:3px solid #315f50!important;background:#f3f0eb!important;border-radius:10px!important}
    #hn-chat-screen .hn-chat-row.mine .hn-chat-quoted{border-left-color:#d9c488!important;background:rgba(255,255,255,.09)!important}
    #hn-chat-screen .hn-chat-quoted-sender{color:#315f50!important}
    #hn-chat-screen .hn-chat-row.mine .hn-chat-quoted-sender{color:#e5d39b!important}
    #hn-chat-screen .hn-chat-quoted-text,#hn-chat-screen .hn-chat-reply-text{color:#766f66!important}
    #hn-chat-screen .hn-chat-row.mine .hn-chat-quoted-text{color:rgba(255,255,255,.72)!important}
    #hn-chat-screen .hn-chat-media-bubble,#hn-chat-screen .hn-chat-bubble:has(.hn-chat-media-grid){padding:6px!important;overflow:hidden!important}
    #hn-chat-screen .hn-chat-media-grid{gap:5px!important;margin:0!important}
    #hn-chat-screen .hn-chat-media-item{border:0!important;border-radius:15px!important;background:#ece8e1!important;overflow:hidden!important}
    #hn-chat-screen .hn-chat-photo-button,#hn-chat-screen .hn-video-card{border-radius:15px!important;overflow:hidden!important}
    #hn-chat-screen .hn-chat-media-item img,#hn-chat-screen .hn-chat-photo-button img{border-radius:15px!important;max-height:360px!important}
    #hn-chat-screen .hn-video-card-shell{border-radius:15px!important}
    #hn-chat-screen .hn-video-card-play-overlay{background:rgba(28,31,29,.72)!important;border-color:rgba(255,255,255,.78)!important;box-shadow:none!important}
    #hn-chat-screen .hn-chat-audio-label{color:#315f50!important;font-size:11px!important;font-weight:700!important;letter-spacing:.08em!important}
    #hn-chat-screen .hn-chat-row.mine .hn-chat-audio-label{color:#fff!important}
    #hn-chat-screen .hn-chat-audio-icon{color:#b79a56!important}
    #hn-chat-screen .hn-chat-audio-play{border-color:#315f50!important;background:#f7f4ef!important;color:#174d3b!important}
    #hn-chat-screen .hn-chat-row.mine .hn-chat-audio-play{border-color:rgba(255,255,255,.48)!important;background:rgba(255,255,255,.08)!important;color:#fff!important}
    #hn-chat-screen .hn-chat-audio-progress{background:#d7d2ca!important;accent-color:#315f50!important}
    #hn-chat-screen .hn-chat-row.mine .hn-chat-audio-progress{background:rgba(255,255,255,.22)!important;accent-color:#fff!important}
    #hn-chat-screen .hn-chat-audio-duration{color:#7e776e!important}
    #hn-chat-screen .hn-chat-row.mine .hn-chat-audio-duration{color:rgba(255,255,255,.68)!important}
    #hn-chat-screen .hn-chat-reply{border:1px solid #ddd7ce!important;border-radius:14px!important;background:#fff!important;margin-bottom:7px!important;overflow:hidden!important}
    #hn-chat-screen .hn-chat-reply-line{background:#315f50!important}
    #hn-chat-screen .hn-chat-reply-label{color:#315f50!important}
    #hn-chat-screen .hn-chat-reply-close{color:#665f57!important}
    #hn-chat-screen .hn-chat-compose{display:grid!important;grid-template-columns:minmax(0,1fr) 94px!important;gap:9px!important;padding:9px 0 0!important;border-top:1px solid #ddd7ce!important;background:#f4f0e8!important;align-items:end!important}
    #hn-chat-screen .hn-chat-input-wrap{grid-column:1!important;min-width:0!important}
    #hn-chat-screen .hn-chat-input{min-height:58px!important;max-height:124px!important;padding:17px 104px 13px 17px!important;border:1px solid #d9d3ca!important;border-radius:29px!important;background:#fff!important;color:#29251f!important;font-size:16px!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    #hn-chat-screen .hn-chat-input::placeholder{color:#9a938a!important}
    #hn-chat-screen .hn-chat-mic,#hn-chat-screen .hn-chat-attach{bottom:8px!important;width:42px!important;height:42px!important;border:0!important;border-radius:50%!important;background:#1d201e!important;color:#fff!important;box-shadow:none!important}
    #hn-chat-screen .hn-chat-mic{right:8px!important}
    #hn-chat-screen .hn-chat-attach{right:56px!important}
    #hn-chat-screen .hn-chat-mic.is-recording{background:#8d2929!important;color:#fff!important}
    #hn-chat-screen .hn-chat-send{grid-column:2!important;width:94px!important;min-height:58px!important;height:58px!important;margin:0!important;border:0!important;border-radius:29px!important;background:#1d201e!important;color:#fff!important;font-size:11px!important;font-weight:700!important;letter-spacing:.08em!important;box-shadow:none!important}
    #hn-chat-screen .hn-chat-send:disabled{background:#d8d2c9!important;color:#aaa39a!important;opacity:1!important}
    #hn-chat-screen .hn-chat-media-pending,#hn-chat-screen .hn-chat-recording,#hn-chat-screen .hn-chat-reply{grid-column:1 / -1!important}
    #hn-chat-screen .hn-chat-recording{min-height:48px!important;border:1px solid #ddd7ce!important;border-radius:14px!important;background:#fff!important;color:#2d2924!important}
    #hn-chat-screen .hn-chat-recording-status{color:#315f50!important}
    #hn-chat-screen .hn-chat-pending-item{border:1px solid #ddd7ce!important;border-radius:14px!important;background:#fff!important}
    #hn-chat-screen .hn-chat-pending-remove{border:0!important;background:#1d201e!important;color:#fff!important}
    #hn-chat-screen .hn-chat-empty{color:#8f877d!important}
    #hn-chat-screen .hn-chat-upload-badge{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    @media(max-width:430px){
      #hn-chat-screen{padding-left:9px!important;padding-right:9px!important}
      #hn-chat-screen .hn-chat-compose{grid-template-columns:minmax(0,1fr) 86px!important;gap:7px!important}
      #hn-chat-screen .hn-chat-send{width:86px!important;font-size:10px!important}
      #hn-chat-screen .hn-chat-input{padding-left:15px!important;padding-right:101px!important}
    }
  `;document.head.appendChild(s)}
  function sync(){const chat=document.getElementById('hn-chat-screen'),video=document.getElementById('backgroundVideo');const active=!!chat?.classList.contains('is-active');if(active&&!inChat){inChat=true;if(video){videoWasPlaying=!video.paused;try{video.pause()}catch(_){}video.setAttribute('data-hn-chat-paused','1')}}else if(!active&&inChat){inChat=false;if(video){video.removeAttribute('data-hn-chat-paused');if(videoWasPlaying){try{const p=video.play();if(p?.catch)p.catch(()=>{})}catch(_){}}}videoWasPlaying=false}}
  function bind(){installStyle();const chat=document.getElementById('hn-chat-screen');if(!chat)return false;if(chatObserver)chatObserver.disconnect();chatObserver=new MutationObserver(sync);chatObserver.observe(chat,{attributes:true,attributeFilter:['class']});sync();return true}
  function boot(){installStyle();if(bind())return;rootObserver=new MutationObserver(()=>{if(bind()){rootObserver.disconnect();rootObserver=null}});rootObserver.observe(document.documentElement,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* Minimal reference-style composer. Visual override only; chat logic stays untouched. */
(function(){'use strict';
  const STYLE_ID='hn-chat-minimal-composer-v1';
  function install(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
    #hn-chat-screen .hn-chat-compose{display:grid!important;grid-template-columns:minmax(0,1fr) 94px!important;gap:8px!important;align-items:center!important;padding:8px 0 max(8px,env(safe-area-inset-bottom))!important;border-top:0!important;background:transparent!important;box-shadow:none!important;min-height:0!important}
    #hn-chat-screen .hn-chat-input-wrap{grid-column:1!important;display:grid!important;grid-template-columns:54px minmax(0,1fr) 46px!important;gap:8px!important;align-items:center!important;position:static!important;min-width:0!important}
    #hn-chat-screen .hn-chat-input{grid-column:2!important;grid-row:1!important;width:100%!important;height:54px!important;min-height:54px!important;max-height:54px!important;margin:0!important;padding:0 17px!important;border:1px solid #d8d2c8!important;border-radius:999px!important;background:#fff!important;color:#29251f!important;font-size:16px!important;line-height:1.2!important;resize:none!important;overflow:hidden!important;box-shadow:none!important;box-sizing:border-box!important}
    #hn-chat-screen .hn-chat-input::placeholder{color:#9a938a!important;opacity:1!important}
    #hn-chat-screen .hn-chat-attach,#hn-chat-screen .hn-chat-mic{position:static!important;inset:auto!important;transform:none!important;margin:0!important;border:0!important;background:#171817!important;color:#fff!important;box-shadow:none!important;display:flex!important;align-items:center!important;justify-content:center!important}
    #hn-chat-screen .hn-chat-attach{grid-column:1!important;grid-row:1!important;width:54px!important;height:54px!important;border-radius:50%!important;font-size:28px!important;font-weight:300!important}
    #hn-chat-screen .hn-chat-mic{grid-column:3!important;grid-row:1!important;width:46px!important;height:46px!important;border-radius:50%!important;font-size:20px!important}
    #hn-chat-screen .hn-chat-mic.is-recording{background:#8d2929!important;color:#fff!important}
    #hn-chat-screen .hn-chat-send{grid-column:2!important;grid-row:1!important;width:94px!important;height:54px!important;min-height:54px!important;margin:0!important;padding:0 14px!important;border:0!important;border-radius:999px!important;background:#171817!important;color:#fff!important;font-size:13px!important;font-weight:700!important;letter-spacing:0!important;text-transform:none!important;box-shadow:none!important}
    #hn-chat-screen .hn-chat-send:disabled{background:#d8d2c9!important;color:#a49d94!important;opacity:1!important}
    #hn-chat-screen .hn-chat-media-pending,#hn-chat-screen .hn-chat-recording,#hn-chat-screen .hn-chat-reply{grid-column:1 / -1!important}
    @media(max-width:390px){
      #hn-chat-screen .hn-chat-compose{grid-template-columns:minmax(0,1fr) 84px!important;gap:6px!important}
      #hn-chat-screen .hn-chat-input-wrap{grid-template-columns:48px minmax(0,1fr) 42px!important;gap:6px!important}
      #hn-chat-screen .hn-chat-attach{width:48px!important;height:48px!important}
      #hn-chat-screen .hn-chat-mic{width:42px!important;height:42px!important}
      #hn-chat-screen .hn-chat-input{height:50px!important;min-height:50px!important;max-height:50px!important;padding:0 14px!important;font-size:15px!important}
      #hn-chat-screen .hn-chat-send{width:84px!important;height:50px!important;min-height:50px!important;font-size:12px!important}
    }
  `;document.head.appendChild(s)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

/* Chat lifecycle reconciliation lives here instead of a separate patch file. */
(function(){'use strict';let timer=null;const reconcile=()=>{try{if(typeof window.hnChatReconcile==='function')window.hnChatReconcile()}catch(_){}};const schedule=delay=>{clearTimeout(timer);timer=setTimeout(reconcile,delay)};function boot(){if(typeof window.hnChatReconcile!=='function'){setTimeout(boot,500);return}schedule(1200);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(150)});window.addEventListener('focus',()=>schedule(150));window.addEventListener('pageshow',()=>schedule(150))}boot()})();