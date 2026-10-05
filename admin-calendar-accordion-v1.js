/* HAVANA NICE — ADMIN CALENDAR FORM ACCORDION V1
   Presentation-only layer for Admin Calendar.
   Keeps existing event cards visible and wraps only the existing add/edit form.
*/
(function(){
  'use strict';
  if(window.__hnAdminCalendarFormAccordionV1)return;
  window.__hnAdminCalendarFormAccordionV1=true;

  const STYLE_ID='hnAdminCalendarFormAccordionStyle';
  const BOX_ID='hnAdminCalendarFormAccordion';
  let attempts=0;
  let timer=null;

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #${BOX_ID}{margin:0 0 16px;border:1px solid rgba(229,189,98,.38);background:#080a07;overflow:hidden}
      #${BOX_ID} .hn-cfa-head{width:100%;min-height:60px;border:0;background:linear-gradient(100deg,rgba(229,189,98,.07),rgba(0,0,0,.08));color:#f4f1e8;padding:13px 15px;display:flex;align-items:center;justify-content:space-between;gap:14px;text-align:left}
      #${BOX_ID} .hn-cfa-copy{min-width:0}
      #${BOX_ID} .hn-cfa-title{display:block;font:19px/1.08 Georgia,"Times New Roman",serif;color:#f4f1e8}
      #${BOX_ID} .hn-cfa-sub{display:block;margin-top:5px;color:#85867f;font-size:8px;line-height:1.35;letter-spacing:.12em;text-transform:uppercase}
      #${BOX_ID} .hn-cfa-arrow{width:32px;height:32px;flex:0 0 32px;border:1px solid #70501d;display:grid;place-items:center;color:#e5bd62;font-size:16px;line-height:1;transition:transform .18s ease,background .18s ease}
      #${BOX_ID}.is-open>.hn-cfa-head .hn-cfa-arrow{transform:rotate(180deg);background:rgba(229,189,98,.07)}
      #${BOX_ID} .hn-cfa-body{display:none;padding:14px;border-top:1px solid rgba(229,189,98,.18)}
      #${BOX_ID}.is-open>.hn-cfa-body{display:block}
      #${BOX_ID} .calendar-form{margin-top:0!important}
      #${BOX_ID} .calendar-actions{margin-top:10px!important}
      @media(max-width:760px){
        #${BOX_ID}{margin-bottom:13px}
        #${BOX_ID} .hn-cfa-head{min-height:56px;padding:12px}
        #${BOX_ID} .hn-cfa-title{font-size:18px}
        #${BOX_ID} .hn-cfa-body{padding:11px}
      }
    `;
    document.head.appendChild(style);
  }

  function findHost(){
    const card=document.getElementById('calendarAdminCard');
    if(!card)return null;
    return card.querySelector(':scope > .hn-admin-body')||card;
  }

  function setOpen(open){
    const box=document.getElementById(BOX_ID);
    if(!box)return;
    box.classList.toggle('is-open',!!open);
    box.querySelector(':scope > .hn-cfa-head')?.setAttribute('aria-expanded',String(!!open));
  }

  function setup(){
    if(document.getElementById(BOX_ID))return true;

    const host=findHost();
    if(!host)return false;

    const form=host.querySelector(':scope > .calendar-form')||host.querySelector('.calendar-form');
    const actions=host.querySelector(':scope > .calendar-actions')||host.querySelector('.calendar-actions');
    const msg=document.getElementById('cMsg');
    const list=document.getElementById('cList');

    if(!form||!actions||!msg||!list)return false;

    installStyle();

    const box=document.createElement('section');
    box.id=BOX_ID;

    const head=document.createElement('button');
    head.type='button';
    head.className='hn-cfa-head';
    head.setAttribute('aria-expanded','false');
    head.innerHTML='<span class="hn-cfa-copy"><span class="hn-cfa-title">Añadir evento nuevo</span><span class="hn-cfa-sub">Crear o editar una ficha del calendario</span></span><span class="hn-cfa-arrow" aria-hidden="true">⌄</span>';

    const body=document.createElement('div');
    body.className='hn-cfa-body';

    head.addEventListener('click',()=>setOpen(!box.classList.contains('is-open')));

    box.append(head,body);
    host.insertBefore(box,list);
    body.append(form,actions,msg);

    list.addEventListener('click',event=>{
      const edit=event.target.closest('.cedit');
      if(edit)setOpen(true);
    },true);

    return true;
  }

  function boot(){
    if(setup())return;
    attempts++;
    if(attempts<100)timer=setTimeout(boot,100);
  }

  function init(){
    installStyle();
    boot();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();