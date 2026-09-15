/* HAVANA NICE — CHAT VIDEO CONTROLS V4 */
(function(){
  'use strict';
  const STYLE_ID='hn-chat-video-controls-v4-style';
  const BOUND='data-hn-video-controls-v4';
  let observer=null;

  function formatTime(value){
    const total=Math.max(0,Math.floor(Number(value)||0));
    const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    if(h)return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .hn-chat-video-controls-v4{position:absolute;left:12px;right:12px;bottom:max(18px,calc(env(safe-area-inset-bottom) + 12px));z-index:300020;display:none;align-items:center;gap:9px;padding:9px 11px;border:1px solid rgba(229,189,98,.45);background:rgba(5,10,7,.90);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-sizing:border-box;border-radius:3px;pointer-events:auto;}
      .hn-chat-video-controls-v4.is-visible{display:flex;}
      .hn-chat-video-time-v4{min-width:82px;color:#f3d77c;font:500 10px/1 Arial,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:.04em;text-align:right;white-space:nowrap;}
      .hn-chat-video-seek-v4{flex:1;min-width:70px;height:24px;margin:0;appearance:none;-webkit-appearance:none;background:transparent;accent-color:#d9b45f;cursor:pointer;touch-action:pan-x;}
      .hn-chat-video-seek-v4::-webkit-slider-runnable-track{height:3px;background:rgba(244,241,232,.28);border-radius:3px;}
      .hn-chat-video-seek-v4::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:14px;height:14px;margin-top:-5.5px;border:1px solid #fff1a8;border-radius:50%;background:#d9b45f;}
      .hn-chat-video-seek-v4::-moz-range-track{height:3px;background:rgba(244,241,232,.28);border-radius:3px;}
      .hn-chat-video-seek-v4::-moz-range-thumb{width:14px;height:14px;border:1px solid #fff1a8;border-radius:50%;background:#d9b45f;}
      .hn-chat-video-controls-v4 input{pointer-events:auto;}
    `;
    document.head.appendChild(style);
  }

  function enhance(lightbox){
    if(!lightbox||lightbox.id!=='hnChatMediaLightboxV4')return;
    const video=lightbox.querySelector('video');
    if(!video||lightbox.hasAttribute(BOUND))return;
    lightbox.setAttribute(BOUND,'1');

    const controls=document.createElement('div');
    controls.className='hn-chat-video-controls-v4';
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label','Controles de video');
    controls.innerHTML='<input class="hn-chat-video-seek-v4" type="range" min="0" max="1000" value="0" step="1" aria-label="Posición del video"><span class="hn-chat-video-time-v4">0:00 / 0:00</span>';
    lightbox.appendChild(controls);

    const seek=controls.querySelector('.hn-chat-video-seek-v4');
    const time=controls.querySelector('.hn-chat-video-time-v4');
    let seeking=false;
    const syncVisibility=()=>controls.classList.toggle('is-visible',!video.hidden&&lightbox.classList.contains('is-open'));
    const refresh=()=>{
      const duration=Number(video.duration)||0;
      const current=Number(video.currentTime)||0;
      seek.value=duration?String(Math.round((current/duration)*1000)):'0';
      time.textContent=`${formatTime(current)} / ${formatTime(duration)}`;
      syncVisibility();
    };

    video.addEventListener('loadedmetadata',refresh);
    video.addEventListener('durationchange',refresh);
    video.addEventListener('timeupdate',()=>{if(!seeking)refresh();});
    video.addEventListener('ended',refresh);
    const mediaObserver=new MutationObserver(syncVisibility);
    mediaObserver.observe(video,{attributes:true,attributeFilter:['hidden']});
    const lightboxObserver=new MutationObserver(syncVisibility);
    lightboxObserver.observe(lightbox,{attributes:true,attributeFilter:['class']});

    const stop=event=>{event.stopPropagation();};
    seek.addEventListener('pointerdown',event=>{stop(event);seeking=true;});
    seek.addEventListener('pointerup',event=>{stop(event);seeking=false;});
    seek.addEventListener('pointercancel',event=>{stop(event);seeking=false;});
    seek.addEventListener('click',stop);
    seek.addEventListener('input',event=>{
      stop(event);
      const duration=Number(video.duration)||0;
      if(duration)video.currentTime=(Number(seek.value)/1000)*duration;
      refresh();
    });
    controls.addEventListener('click',stop);
    controls.addEventListener('pointerdown',stop);
    controls.addEventListener('touchstart',stop,{passive:false});
    refresh();
  }

  function scan(){
    const lightbox=document.getElementById('hnChatMediaLightboxV4');
    if(lightbox)enhance(lightbox);
  }

  function install(){
    installStyles();
    scan();
    if(observer)return;
    observer=new MutationObserver(scan);
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
