/* HAVANA NICE — CALENDAR EXPAND V4
   Reliable accordion interaction for musician calendar cards.
   Google Maps stays visible even when the accordion is collapsed.
   Uses a real touch button for iPhone instead of a pseudo-element only.
*/
(function(){
  'use strict';

  const openIds=new Set();
  const BUTTON_CLASS='hn-calendar-expand-button';

  function injectStyle(){
    if(document.getElementById('hnCalendarExpandStyle'))return;
    const s=document.createElement('style');
    s.id='hnCalendarExpandStyle';
    s.textContent=`
      .calendar-event-card{cursor:pointer;position:relative;transition:border-color .16s ease,background .16s ease;padding-right:54px!important}
      .calendar-event-card:not(.is-expanded) .calendar-time-grid,
      .calendar-event-card:not(.is-expanded) .calendar-event-details-m{display:none!important}
      .calendar-event-card.is-expanded{border-color:rgba(229,189,98,.72)}
      .calendar-event-card .calendar-map-button{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:8px!important;
        margin-top:12px!important;
        padding:11px 13px!important;
        border:1px solid rgba(229,189,98,.62)!important;
        color:var(--gold-light)!important;
        background:rgba(0,0,0,.22)!important;
        text-align:center!important;
        text-transform:uppercase!important;
        letter-spacing:.14em!important;
        font-size:9px!important;
        font-weight:600!important;
        line-height:1.2!important;
        text-decoration:none!important;
        cursor:pointer!important;
      }
      .calendar-event-card .calendar-map-button::after{content:'↗';font-size:12px!important;letter-spacing:0!important}
      .${BUTTON_CLASS}{
        position:absolute!important;top:8px!important;right:8px!important;
        width:42px!important;height:42px!important;margin:0!important;padding:0!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        border:0!important;border-radius:50%!important;background:transparent!important;
        color:var(--gold)!important;font:400 25px/1 Georgia,serif!important;
        -webkit-appearance:none!important;appearance:none!important;
        touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;
        z-index:4!important;
      }
      .${BUTTON_CLASS}:active{background:rgba(229,189,98,.10)!important}
    `;
    document.head.appendChild(s);
  }

  function hash(value){
    let h=2166136261;
    for(let i=0;i<value.length;i++){
      h^=value.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return (h>>>0).toString(36);
  }

  function ensureEventId(card,index){
    if(card.dataset.eventId)return card.dataset.eventId;
    const day=card.querySelector('.calendar-event-day')?.textContent?.trim()||'';
    const title=card.querySelector('.calendar-event-title-m')?.textContent?.trim()||'';
    const venue=card.querySelector('.calendar-event-venue')?.textContent?.trim()||'';
    const id='calendar-'+hash(`${day}|${title}|${venue}|${index}`);
    card.dataset.eventId=id;
    return id;
  }

  function normalizeMapLink(card){
    const link=card.querySelector('.calendar-map-button');
    if(!link)return;
    const href=String(link.getAttribute('href')||'').trim();
    if(!href)return;
    link.textContent='Llegar al evento';
    link.setAttribute('aria-label','Llegar al evento en Google Maps');
  }

  function applyState(card,id){
    const expanded=openIds.has(id);
    card.classList.toggle('is-expanded',expanded);
    const button=card.querySelector('.'+BUTTON_CLASS);
    if(button){
      button.textContent=expanded?'−':'+';
      button.setAttribute('aria-expanded',expanded?'true':'false');
      button.setAttribute('aria-label',expanded?'Ocultar información del evento':'Ver información del evento');
    }
  }

  function toggle(card){
    if(!card)return;
    const cards=[...document.querySelectorAll('.calendar-event-card')];
    const id=ensureEventId(card,Math.max(0,cards.indexOf(card)));
    if(openIds.has(id))openIds.delete(id);else openIds.add(id);
    applyState(card,id);
  }

  function decorate(){
    document.querySelectorAll('.calendar-event-card').forEach((card,index)=>{
      const id=ensureEventId(card,index);
      normalizeMapLink(card);
      let button=card.querySelector('.'+BUTTON_CLASS);
      if(!button){
        button=document.createElement('button');
        button.type='button';
        button.className=BUTTON_CLASS;
        button.addEventListener('click',event=>{
          event.preventDefault();
          event.stopPropagation();
          toggle(card);
        });
        card.appendChild(button);
      }
      applyState(card,id);
    });
  }

  function init(){
    injectStyle();
    decorate();

    document.addEventListener('click',event=>{
      const card=event.target.closest?.('.calendar-event-card');
      if(!card)return;
      if(event.target.closest('a,button,input,textarea,select'))return;
      toggle(card);
    },false);

    window.addEventListener('hn-calendar-updated',decorate);

    const observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>[...m.addedNodes].some(node=>node.nodeType===1&&(node.matches?.('.calendar-event-card')||node.querySelector?.('.calendar-event-card')))))decorate();
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
