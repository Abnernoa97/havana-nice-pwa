/* HAVANA NICE — CALENDAR EXPAND
   Instant accordion interaction for musician calendar cards.
   Keeps expanded state across realtime/polling re-renders.
*/
(function(){
  'use strict';
  const openIds=new Set();
  function injectStyle(){
    if(document.getElementById('hnCalendarExpandStyle'))return;
    const s=document.createElement('style');
    s.id='hnCalendarExpandStyle';
    s.textContent=`
      .calendar-event-card{cursor:pointer;position:relative;transition:border-color .16s ease,background .16s ease}
      .calendar-event-card::after{content:'+';position:absolute;top:14px;right:14px;color:var(--gold);font-size:17px;line-height:1;font-family:Georgia,serif;opacity:.8;transition:transform .16s ease}
      .calendar-event-card.is-expanded::after{content:'−';transform:none}
      .calendar-event-card:not(.is-expanded) .calendar-event-details-m,.calendar-event-card:not(.is-expanded) .calendar-map-button{display:none}
      .calendar-event-card.is-expanded{border-color:rgba(229,189,98,.72)}
    `;
    document.head.appendChild(s);
  }
  function restore(){
    document.querySelectorAll('.calendar-event-card[data-event-id]').forEach(card=>{
      card.classList.toggle('is-expanded',openIds.has(card.dataset.eventId));
    });
  }
  function init(){
    injectStyle();
    document.addEventListener('click',function(event){
      const card=event.target.closest('.calendar-event-card');
      if(!card)return;
      if(event.target.closest('a,button,input,textarea,select'))return;
      const id=card.dataset.eventId;
      if(!id)return;
      if(openIds.has(id))openIds.delete(id);else openIds.add(id);
      card.classList.toggle('is-expanded',openIds.has(id));
    },false);
    window.addEventListener('hn-calendar-updated',restore);
    restore();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
