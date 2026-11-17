/* HAVANA NICE — PAST CALENDAR EVENTS V1
   Visual-only treatment for musician calendar cards whose event date is before today.
   Keeps accordion, map link, details and event data fully functional.
*/
(function(){
  'use strict';
  if(window.__hnPastCalendarEventsV1)return;
  window.__hnPastCalendarEventsV1=true;

  const STYLE_ID='hnPastCalendarEventsStyle';
  let midnightTimer=null;

  function localDateKey(date=new Date()){
    return [
      date.getFullYear(),
      String(date.getMonth()+1).padStart(2,'0'),
      String(date.getDate()).padStart(2,'0')
    ].join('-');
  }

  function isPastEvent(value){
    const date=String(value||'').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date)&&date<localDateKey();
  }

  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .calendar-event-card.hn-event-completed{
        position:relative!important;
        border-color:rgba(173,137,79,.44)!important;
        background:
          linear-gradient(105deg,rgba(46,31,17,.72),rgba(75,53,29,.36),rgba(18,13,9,.72))!important;
        box-shadow:
          inset 0 0 0 1px rgba(213,177,111,.05),
          inset 0 0 34px rgba(115,75,37,.12)!important;
      }
      .calendar-event-card.hn-event-completed .calendar-event-day{
        color:rgba(208,171,105,.82)!important;
      }
      .calendar-event-card.hn-event-completed .calendar-event-title-m{
        color:rgba(235,222,194,.88)!important;
        text-shadow:0 1px 0 rgba(0,0,0,.35)!important;
      }
      .calendar-event-card.hn-event-completed .calendar-event-venue,
      .calendar-event-card.hn-event-completed .calendar-event-details-m{
        color:rgba(217,203,176,.62)!important;
      }
      .calendar-event-card.hn-event-completed .calendar-time-box{
        border-color:rgba(176,137,78,.22)!important;
        background:rgba(43,30,17,.30)!important;
      }
      .calendar-event-card.hn-event-completed .calendar-time-label{
        color:rgba(216,197,162,.40)!important;
      }
      .calendar-event-card.hn-event-completed .calendar-time-value{
        color:rgba(225,197,142,.78)!important;
      }
      .calendar-event-card.hn-event-completed .calendar-map-button{
        border-color:rgba(176,137,78,.42)!important;
        color:rgba(230,204,151,.82)!important;
        background:rgba(44,30,17,.28)!important;
      }
      .calendar-event-card.hn-event-completed .hn-calendar-expand-button{
        color:rgba(219,180,111,.76)!important;
      }
      .calendar-event-card.hn-event-completed::after{
        content:"EVENTO\A REALIZADO";
        white-space:pre;
        position:absolute;
        top:46px;
        right:13px;
        z-index:3;
        width:84px;
        min-height:44px;
        display:grid;
        place-items:center;
        padding:5px 7px 4px;
        border:2px solid rgba(151,74,52,.72);
        outline:1px solid rgba(151,74,52,.38);
        outline-offset:2px;
        border-radius:3px;
        color:rgba(183,91,62,.86);
        background:rgba(31,20,14,.08);
        box-shadow:inset 0 0 0 1px rgba(151,74,52,.18);
        font-family:"Courier New",Courier,monospace;
        font-size:7px;
        font-weight:800;
        line-height:1.22;
        letter-spacing:.14em;
        text-align:center;
        text-transform:uppercase;
        transform:rotate(-7deg);
        transform-origin:center;
        opacity:.92;
        pointer-events:none;
        user-select:none;
      }
      .calendar-event-card.hn-event-completed.is-expanded::after{
        opacity:.72;
      }
      @media(max-width:420px){
        .calendar-event-card.hn-event-completed::after{
          top:44px;
          right:11px;
          width:78px;
          min-height:41px;
          font-size:6.5px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function decorate(){
    document.querySelectorAll('.calendar-event-card[data-event-date]').forEach(card=>{
      card.classList.toggle('hn-event-completed',isPastEvent(card.dataset.eventDate));
    });
  }

  function scheduleMidnightRefresh(){
    clearTimeout(midnightTimer);
    const now=new Date();
    const next=new Date(now);
    next.setHours(24,0,2,0);
    midnightTimer=setTimeout(()=>{
      decorate();
      scheduleMidnightRefresh();
    },Math.max(1000,next.getTime()-now.getTime()));
  }

  function init(){
    injectStyle();
    decorate();
    window.addEventListener('hn-calendar-updated',decorate);
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)decorate();
    });
    scheduleMidnightRefresh();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();