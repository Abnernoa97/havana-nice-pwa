/* HAVANA NICE — CHAT MEDIA LIGHTBOX V3
   Photos + videos. Native back returns to the chat without closing the chat screen.
*/
(function(){
  'use strict';
  if(window.__hnChatMediaLightboxV3)return;
  window.__hnChatMediaLightboxV3=true;

  const STYLE='hn-chat-media-lightbox-v3-style';
  let overlay=null, image=null, video=null, historyArmed=false, closingFromHistory=false;

  function ensure(){
    if(overlay)return;
    const style=document.createElement('style');
    style.id=STYLE;
    style.textContent=`
      #hnChatMediaLightboxV3{position:fixed;inset:0;z-index:300000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.97);padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);touch-action:none;}
      #hnChatMediaLightboxV3.is-open{display:flex;}
      #hnChatMediaLightboxV3 img,#hnChatMediaLightboxV3 video{display:block;width:auto;height:auto;max-width:100vw;max-height:100dvh;object-fit:contain;user-select:none;-webkit-user-drag:none;outline:none;}
      #hnChatMediaLightboxV3 video{cursor:pointer;background:#000;}
      #hnChatMediaLightboxV3 .hn-chat-media-lb-close{position:absolute;top:max(14px,calc(env(safe-area-inset-top) + 8px));right:max(14px,calc(env(safe-area-inset-right) + 8px));width:46px;height:46px;border:1px solid rgba(229,189,98,.8);border-radius:50%;background:rgba(0,0,0,.62);color:#fff1a8;font-size:29px;line-height:1;display:flex;align-items:center;justify-content:center;z-index:2;}
    `;
    document.head.appendChild(style);
    overlay=document.createElement('div');
    overlay.id='hnChatMediaLightboxV3';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Contenido multimedia a pantalla completa');
    overlay.innerHTML='<button class="hn-chat-media-lb-close" type="button" aria-label="Cerrar">×</button><img alt="Foto a pantalla completa"><video playsinline preload="metadata" hidden></video>';
    document.body.appendChild(overlay);
    image=overlay.querySelector('img');
    video=overlay.querySelector('video');
    overlay.querySelector('.hn-chat-media-lb-close').addEventListener('click',function(){close(true);});
    overlay.addEventListener('click',function(e){if(e.target===overlay)close(true);});
    video.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      if(video.paused)video.play().catch(function(){});else video.pause();
    });
  }

  function clearMedia(){
    if(!image||!video)return;
    image.hidden=false;
    image.removeAttribute('src');
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.hidden=true;
  }

  function open(src,type,alt){
    if(!src)return;
    ensure();
    clearMedia();
    if(type==='video'){
      image.hidden=true;
      video.hidden=false;
      video.src=src;
      video.load();
      video.play().catch(function(){});
    }else{
      image.hidden=false;
      image.src=src;
      image.alt=alt||'Foto a pantalla completa';
    }
    overlay.classList.add('is-open');
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';
    if(!historyArmed){
      historyArmed=true;
      try{history.pushState(Object.assign({},history.state,{hnChatMediaLightbox:true}),'',location.href);}catch(_){historyArmed=false;}
    }
  }

  function close(useHistory){
    if(!overlay||!overlay.classList.contains('is-open'))return;
    if(useHistory&&historyArmed&&!closingFromHistory){
      closingFromHistory=true;
      try{history.back();return;}catch(_){closingFromHistory=false;}
    }
    historyArmed=false;
    closingFromHistory=false;
    overlay.classList.remove('is-open');
    clearMedia();
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
  }

  document.addEventListener('click',function(e){
    const button=e.target.closest('.hn-chat-photo-button');
    if(!button)return;
    const img=button.querySelector('img');
    const src=img?.currentSrc||img?.src||button.dataset.src;
    if(!src)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    open(src,'image',img?.alt||'Foto');
  },true);

  document.addEventListener('click',function(e){
    const source=e.target.closest('.hn-chat-media-item video');
    if(!source)return;
    const src=source.currentSrc||source.src;
    if(!src)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    open(src,'video','Video a pantalla completa');
  },true);

  // Capture phase is intentional: chat-v2 also listens for popstate. We must consume
  // the media history entry first so native Back returns to the chat, not out of chat.
  window.addEventListener('popstate',function(e){
    if(!historyArmed)return;
    closingFromHistory=true;
    close(false);
    closingFromHistory=false;
    e.stopImmediatePropagation();
  },true);

  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&overlay?.classList.contains('is-open'))close(true);});
})();
