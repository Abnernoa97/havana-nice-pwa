/* HAVANA NICE — CHAT MEDIA LIGHTBOX V4
   Photos + videos. Native back returns to the chat without closing the chat screen.
*/
(function(){
  'use strict';
  if(window.__hnChatMediaLightboxV4)return;
  window.__hnChatMediaLightboxV4=true;

  const STYLE='hn-chat-media-lightbox-v4-style';
  let overlay=null, image=null, video=null, historyArmed=false, closingFromHistory=false;

  function ensure(){
    if(overlay)return;
    const style=document.createElement('style');
    style.id=STYLE;
    style.textContent=`
      #hnChatMediaLightboxV4{position:fixed;inset:0;z-index:300000;display:none;background:rgba(0,0,0,.97);padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);box-sizing:border-box;touch-action:none;overflow:hidden;}
      #hnChatMediaLightboxV4.is-open{display:block;}
      #hnChatMediaLightboxV4 img,#hnChatMediaLightboxV4 video{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:block;width:auto;height:auto;max-width:calc(100vw - 20px);max-height:calc(100dvh - 20px);object-fit:contain;object-position:center center;user-select:none;-webkit-user-drag:none;outline:none;margin:0;}
      #hnChatMediaLightboxV4 [hidden]{display:none!important;}
      #hnChatMediaLightboxV4 video{cursor:pointer;background:#000;}
      #hnChatMediaLightboxV4 .hn-chat-media-lb-close{position:absolute;top:max(14px,calc(env(safe-area-inset-top) + 8px));right:max(14px,calc(env(safe-area-inset-right) + 8px));width:46px;height:46px;border:1px solid rgba(229,189,98,.8);border-radius:50%;background:rgba(0,0,0,.62);color:#fff1a8;font-size:29px;line-height:1;display:flex;align-items:center;justify-content:center;z-index:300010;}
    `;
    document.head.appendChild(style);
    overlay=document.createElement('div');
    overlay.id='hnChatMediaLightboxV4';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Contenido multimedia a pantalla completa');
    overlay.innerHTML='<button class="hn-chat-media-lb-close" type="button" aria-label="Cerrar">×</button><img alt=""><video playsinline preload="metadata" hidden></video>';
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
    image.alt='';
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.hidden=true;
  }

  function open(src,type){
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
      image.alt='';
      image.src=src;
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
    open(src,'image');
  },true);

  document.addEventListener('click',function(e){
    const source=e.target.closest('.hn-chat-media-item video');
    if(!source)return;
    const src=source.currentSrc||source.src;
    if(!src)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    open(src,'video');
  },true);

  window.addEventListener('popstate',function(e){
    if(!historyArmed)return;
    closingFromHistory=true;
    close(false);
    closingFromHistory=false;
    e.stopImmediatePropagation();
  },true);

  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&overlay?.classList.contains('is-open'))close(true);});
})();
