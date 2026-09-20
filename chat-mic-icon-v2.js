/* HAVANA NICE — CHAT MIC ICON V2 / CLASSIC 55 STYLE ONLY */
(()=>{
  'use strict';
  const STYLE_ID='hn-chat-mic-icon-v2-style';
  function install(){
    if(!document.getElementById(STYLE_ID)){
      const s=document.createElement('style');
      s.id=STYLE_ID;
      s.textContent=`
        html body #hn-chat-screen button.hn-chat-mic{
          font-size:0!important;
          color:transparent!important;
          background-color:#1d201e!important;
          background-image:url('./vintage-mic-shure.svg?v=2')!important;
          background-repeat:no-repeat!important;
          background-position:center!important;
          background-size:30px 30px!important;
        }
        html body #hn-chat-screen button.hn-chat-mic.is-recording{
          background-color:#8d2929!important;
          background-image:url('./vintage-mic-shure.svg?v=2')!important;
        }
        html body #hn-chat-screen button.hn-chat-mic > *{
          display:none!important;
          opacity:0!important;
          visibility:hidden!important;
        }
        html body #hn-chat-screen button.hn-chat-mic::before,
        html body #hn-chat-screen button.hn-chat-mic::after{
          content:none!important;
          display:none!important;
        }
      `;
      document.head.appendChild(s);
    }
    const mic=document.querySelector('#hn-chat-screen .hn-chat-mic');
    if(mic){
      mic.setAttribute('aria-label','Grabar nota de voz');
      mic.setAttribute('title','Grabar nota de voz');
    }
  }
  const observer=new MutationObserver(install);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
