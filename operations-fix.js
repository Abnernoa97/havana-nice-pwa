/* HAVANA NICE — OPERATIONS UI FIX
   Removes the MY DAY home panel without removing Show Day functionality.
   Show Day remains accessible from today's Calendar event.
*/
(function(){
  'use strict';
  function init(){
    const panel=document.getElementById('hnMyDay');
    if(panel)panel.remove();
    const style=document.createElement('style');style.id='hnOperationsFixStyle';style.textContent='.hn-showday-action{display:block;width:100%;margin-top:11px;padding:12px 13px;border:1px solid rgba(229,189,98,.62);color:#fff1a8;background:rgba(0,0,0,.24);font-size:9px;letter-spacing:.18em;text-transform:uppercase;cursor:pointer}.hn-showday-action:active{opacity:.8}';document.head.appendChild(style);
    function decorate(){
      document.querySelectorAll('.calendar-event-card').forEach(card=>{
        if(card.querySelector('.hn-showday-action'))return;
        const date=card.querySelector('.calendar-event-day')?.textContent||'';
        const today=new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
        if(!date.toLowerCase().includes('hoy')&&!date.toLowerCase().includes(today.toLowerCase()))return;
        const button=document.createElement('button');button.type='button';button.className='hn-showday-action';button.textContent='Show Day';
        button.onclick=function(e){e.preventDefault();e.stopPropagation();const show=document.getElementById('hnOpenShow');if(show)show.click()};
        card.appendChild(button);
      });
    }
    decorate();
    window.addEventListener('hn-calendar-updated',()=>setTimeout(decorate,100));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
