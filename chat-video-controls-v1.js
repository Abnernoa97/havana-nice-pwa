/* HAVANA NICE — CHAT VIDEO CONTROLS V1 */
(function(){
  'use strict';
  const STYLE_ID='hn-chat-video-controls-v1-style';
  const BOUND='data-hn-video-controls-v1';
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
      .hn-chat-video-controls-v1{position:absolute;left:12px;right:12px;bottom:12px;z-index:4;display:flex;align-items:center;gap:9px;padding:9px 11px;border:1px solid rgba(229,189,98,.34);background:rgba(0,0,0,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-sizing:border-box;}
      .hn-chat-video-time-v1{min-width:82px;color:#f3d77c;font:500 10px/1 Arial,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:.04em;text-align:right;white-space:nowrap;}
      .hn-chat-video-seek-v1{flex:1;min-width:70px;height:20px;margin:0;appearance:none;-webkit-appearance:none;background:transparent;accent-color:#d9b45f;cursor:pointer;}
      .hn-chat-video-seek-v1::-webkit-slider-runnable-track{height:3px;background:rgba(244,241,232,.28);border-radius:3px;}
      .hn-chat-video-seek-v1::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:12px;height:12px;margin-top:-4.5px;border:1px solid #fff1a8;border-radius:50%;background:#d9b45f;}
      .hn-chat-video-seek-v1::-moz-range-track{height:3px;background:rgba(244,241,232,.28);border-radius:3px;}
      .hn-chat-video-seek-v1::-moz-range-thumb{width:12px;height:12px;border:1px solid #fff1a8;border-radius:50%;background:#d9b45f;}
      .hn-chat-video-lightbox{position:fixed!important;}
    `;
    document.head.appendChild(style);
  }

  function enhance(lightbox){
    if(!lightbox||!lightbox.classList.contains('hn-chat-video-lightbox'))return;
    const video=lightbox.querySelector('video');
    if(!video||lightbox.hasAttribute(BOUND))return;
    lightbox.setAttribute(BOUND,'1');
    const controls=document.createElement('div');
    controls.className='hn-chat-video-controls-v1';
    controls.innerHTML='<input class="hn-chat-video-seek-v1" type="range" min="0" max="1000" value="0" step="1" aria-label="Posición del video"><span class="hn-chat-video-time-v1">0:00 / 0:00</span>';
    lightbox.appendChild(controls);
    const seek=controls.querySelector('.hn-chat-video-seek-v1');
    const time=controls.querySelector('.hn-chat-video-time-v1');
    let seeking=false;
    const refresh=()=>{
      const duration=Number(video.duration)||0,current=Number(video.currentTime)||0;
      seek.value=duration?String(Math.round((current/duration)*1000)):'0';
      time.textContent=`${formatTime(current)} / ${formatTime(duration)}`;
    };
    video.addEventListener('loadedmetadata',refresh);
    video.addEventListener('durationchange',refresh);
    video.addEventListener('timeupdate',()=>{if(!seeking)refresh();});
    video.addEventListener('ended',refresh);
    seek.addEventListener('pointerdown',e=>{e.stopPropagation();seeking=true;});
    seek.addEventListener('pointerup',e=>{e.stopPropagation();seeking=false;});
    seek.addEventListener('click',e=>e.stopPropagation());
    seek.addEventListener('input',e=>{
      e.stopPropagation();
      const duration=Number(video.duration)||0;
      if(duration){video.currentTime=(Number(seek.value)/1000)*duration;refresh();}
    });
    controls.addEventListener('click',e=>e.stopPropagation());
    refresh();
  }

  function scan(){document.querySelectorAll('.hn-chat-video-lightbox').forEach(enhance);}

  function install(){
    installStyles();
    scan();
    if(observer)return;
    observer=new MutationObserver(scan);
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
