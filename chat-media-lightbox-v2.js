/* HAVANA NICE — CHAT MEDIA LIGHTBOX V2 */
(function(){
  'use strict';
  if(window.__hnChatMediaLightboxV2)return;
  window.__hnChatMediaLightboxV2=true;

  const STYLE='hn-chat-media-lightbox-v2-style';
  let overlay=null, image=null;

  function ensure(){
    if(overlay)return;
    const style=document.createElement('style');
    style.id=STYLE;
    style.textContent=`
      #hnChatMediaLightboxV2{position:fixed;inset:0;z-index:300000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.97);padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);touch-action:none;}
      #hnChatMediaLightboxV2.is-open{display:flex;}
      #hnChatMediaLightboxV2 img{display:block;width:auto;height:auto;max-width:100vw;max-height:100dvh;object-fit:contain;user-select:none;-webkit-user-drag:none;}
      #hnChatMediaLightboxV2 .hn-chat-media-lb-close{position:absolute;top:max(14px,calc(env(safe-area-inset-top) + 8px));right:max(14px,calc(env(safe-area-inset-right) + 8px));width:46px;height:46px;border:1px solid rgba(229,189,98,.8);border-radius:50%;background:rgba(0,0,0,.62);color:#fff1a8;font-size:29px;line-height:1;display:flex;align-items:center;justify-content:center;z-index:2;}
    `;
    document.head.appendChild(style);
    overlay=document.createElement('div');
    overlay.id='hnChatMediaLightboxV2';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Foto a pantalla completa');
    overlay.innerHTML='<button class="hn-chat-media-lb-close" type="button" aria-label="Cerrar foto">×</button><img alt="Foto a pantalla completa">';
    document.body.appendChild(overlay);
    image=overlay.querySelector('img');
    overlay.querySelector('.hn-chat-media-lb-close').addEventListener('click',close);
    overlay.addEventListener('click',function(e){if(e.target===overlay)close()});
  }

  function open(src,alt){
    if(!src)return;
    ensure();
    image.src=src;
    image.alt=alt||'Foto a pantalla completa';
    overlay.classList.add('is-open');
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';
  }

  function close(){
    if(!overlay)return;
    overlay.classList.remove('is-open');
    image.removeAttribute('src');
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
    open(src,img?.alt||'Foto');
  },true);

  document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
})();
