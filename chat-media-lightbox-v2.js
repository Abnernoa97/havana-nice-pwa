/* HAVANA NICE — CHAT MEDIA LIGHTBOX V6
   Photos + videos. Native back closes fullscreen and returns to the chat.
   iOS return transition is isolated to prevent a one-frame flash of the chat media.
*/
(function(){
  'use strict';
  if(window.__hnChatMediaLightboxV6)return;
  window.__hnChatMediaLightboxV6=true;

  const STYLE='hn-chat-media-lightbox-v6-style';
  const HISTORY_KEY='hnChatMediaLightbox';
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  let overlay=null, image=null, video=null;
  let historyArmed=false;
  let handlingHistory=false;

  function ensure(){
    if(overlay)return;
    const style=document.createElement('style');
    style.id=STYLE;
    style.textContent=`
      #hnChatMediaLightboxV6{position:fixed;inset:0;z-index:300000;display:none;background:rgba(0,0,0,.97);padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);box-sizing:border-box;touch-action:none;overflow:hidden;}
      #hnChatMediaLightboxV6.is-open{display:block;}
      #hnChatMediaLightboxV6 img,#hnChatMediaLightboxV6 video{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:block;width:auto;height:auto;max-width:calc(100vw - 20px);max-height:calc(100dvh - 20px);object-fit:contain;object-position:center center;user-select:none;-webkit-user-drag:none;outline:none;margin:0;}
      #hnChatMediaLightboxV6 [hidden]{display:none!important;}
      #hnChatMediaLightboxV6 video{cursor:pointer;background:#000;}
      #hnChatMediaLightboxV6 .hn-chat-media-lb-close{position:absolute;top:max(14px,calc(env(safe-area-inset-top) + 8px));right:max(14px,calc(env(safe-area-inset-right) + 8px));width:46px;height:46px;border:1px solid rgba(229,189,98,.8);border-radius:50%;background:rgba(0,0,0,.62);color:#fff1a8;font-size:29px;line-height:1;display:flex;align-items:center;justify-content:center;z-index:300010;}
      #hn-chat-screen.hn-ios-lb-returning{visibility:hidden!important;}
    `;
    document.head.appendChild(style);
    overlay=document.createElement('div');
    overlay.id='hnChatMediaLightboxV6';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Contenido multimedia a pantalla completa');
    overlay.innerHTML='<button class="hn-chat-media-lb-close" type="button" aria-label="Cerrar">×</button><img alt=""><video playsinline preload="metadata" hidden></video>';
    document.body.appendChild(overlay);
    image=overlay.querySelector('img');
    video=overlay.querySelector('video');
    overlay.querySelector('.hn-chat-media-lb-close').addEventListener('click',function(){closeFromUser();});
    overlay.addEventListener('click',function(e){if(e.target===overlay)closeFromUser();});
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

  function armHistory(){
    if(historyArmed)return;
    const state=Object.assign({},history.state||{});
    state[HISTORY_KEY]=true;
    try{
      history.pushState(state,'',location.href);
      historyArmed=true;
    }catch(_){
      historyArmed=false;
    }
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
    armHistory();
  }

  function finishClose(){
    historyArmed=false;
    overlay?.classList.remove('is-open');
    clearMedia();
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
  }

  function hideIOSReturnFrame(){
    if(!isIOS)return;
    const chat=document.getElementById('hn-chat-screen');
    if(chat)chat.classList.add('hn-ios-lb-returning');
  }

  function revealIOSReturnFrame(){
    if(!isIOS)return;
    const chat=document.getElementById('hn-chat-screen');
    if(!chat)return;
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        chat.classList.remove('hn-ios-lb-returning');
      });
    });
  }

  function closeFromHistory(){
    if(!overlay?.classList.contains('is-open'))return;
    handlingHistory=true;
    hideIOSReturnFrame();
    finishClose();
    revealIOSReturnFrame();
    handlingHistory=false;
  }

  function closeFromUser(){
    if(!overlay?.classList.contains('is-open'))return;
    if(historyArmed&&!handlingHistory){
      handlingHistory=true;
      try{
        history.back();
        return;
      }catch(_){
        handlingHistory=false;
      }
    }
    hideIOSReturnFrame();
    finishClose();
    revealIOSReturnFrame();
    handlingHistory=false;
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
    const isLightboxState=!!e.state?.[HISTORY_KEY];
    if(!overlay?.classList.contains('is-open'))return;
    if(historyArmed||isLightboxState||handlingHistory){
      handlingHistory=true;
      closeFromHistory();
      e.stopImmediatePropagation();
    }
  },true);

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&overlay?.classList.contains('is-open'))closeFromUser();
  });
})();
