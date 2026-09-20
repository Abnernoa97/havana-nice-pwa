/* HAVANA NICE — CHAT MIC ICON V3 / CLASSIC 55 INLINE */
(()=>{
  'use strict';
  const STYLE_ID='hn-chat-mic-icon-v2-style';
  const MIC=`<svg class="hn-vintage-mic-v3" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <path d="M12 4h16c3.3 0 6 2.7 6 6v8c0 5.5-4.5 10-10 10h-8C10.5 28 6 23.5 6 18v-8c0-3.3 2.7-6 6-6Z"/>
    <path d="M9 9h22M8 13h24M8 17h24M9 21h22M11 25h18"/>
    <path d="M14 5v21M20 5v23M26 5v21"/>
    <path d="M3.5 15v3.5C3.5 27.6 10.9 35 20 35s16.5-7.4 16.5-16.5V15"/>
    <path d="M20 35v3M14 38h12"/>
  </svg>`;

  function install(){
    let s=document.getElementById(STYLE_ID);
    if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}
    s.textContent=`
      html body #hn-chat-screen button.hn-chat-mic{
        font-size:0!important;
        color:#fff!important;
        background-image:none!important;
        background-color:#1d201e!important;
      }
      html body #hn-chat-screen button.hn-chat-mic.is-recording{
        color:#fff!important;
        background-image:none!important;
        background-color:#8d2929!important;
      }
      html body #hn-chat-screen button.hn-chat-mic > svg.hn-vintage-mic-v3{
        display:block!important;
        opacity:1!important;
        visibility:visible!important;
        width:31px!important;
        height:31px!important;
        flex:0 0 31px!important;
        fill:none!important;
        stroke:#fff!important;
        stroke-width:1.8!important;
        stroke-linecap:round!important;
        stroke-linejoin:round!important;
        pointer-events:none!important;
      }
      html body #hn-chat-screen button.hn-chat-mic::before,
      html body #hn-chat-screen button.hn-chat-mic::after{
        content:none!important;
        display:none!important;
      }
    `;

    const mic=document.querySelector('#hn-chat-screen .hn-chat-mic');
    if(!mic)return;
    if(!mic.querySelector('svg.hn-vintage-mic-v3'))mic.innerHTML=MIC;
    mic.setAttribute('aria-label',mic.classList.contains('is-recording')?'Enviar nota de voz':'Grabar nota de voz');
    mic.setAttribute('title',mic.classList.contains('is-recording')?'Enviar nota de voz':'Grabar nota de voz');
  }

  const observer=new MutationObserver(install);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
