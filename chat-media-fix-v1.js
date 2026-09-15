/* HAVANA NICE — CHAT MEDIA DISPLAY FIX V1 */
(function(){
  'use strict';
  const STYLE_ID='hn-chat-media-fix-v1';
  function install(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .hn-chat-media-grid{align-items:start!important;}
      .hn-chat-media-grid .hn-chat-media-item{width:min(100%,280px)!important;height:190px!important;min-height:0!important;max-height:190px!important;}
      .hn-chat-media-grid .hn-chat-media-item img,
      .hn-chat-media-grid .hn-chat-media-item video,
      .hn-chat-media-grid .hn-chat-photo-button,
      .hn-chat-media-grid .hn-chat-photo-button img{width:100%!important;height:100%!important;max-width:100%!important;max-height:190px!important;object-fit:cover!important;}
      .hn-chat-media-grid:has(> .hn-chat-media-item:only-child){width:min(100%,280px)!important;max-width:100%!important;}
      .hn-chat-media-grid:has(> .hn-chat-media-item:only-child) .hn-chat-media-item{width:100%!important;height:190px!important;max-width:100%!important;}
      .hn-chat-bubble:has(.hn-chat-media-grid){max-width:min(88%,300px)!important;padding:4px!important;}
      @media (min-width:600px){
        .hn-chat-media-grid .hn-chat-media-item{width:240px!important;height:180px!important;max-height:180px!important;}
        .hn-chat-media-grid .hn-chat-media-item img,
        .hn-chat-media-grid .hn-chat-media-item video,
        .hn-chat-media-grid .hn-chat-photo-button,
        .hn-chat-media-grid .hn-chat-photo-button img{max-height:180px!important;}
        .hn-chat-bubble:has(.hn-chat-media-grid){max-width:510px!important;}
      }
    `;
    document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
