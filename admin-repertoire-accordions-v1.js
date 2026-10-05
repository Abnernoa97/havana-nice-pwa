/* HAVANA NICE — ADMIN REPERTOIRE INNER ACCORDIONS V1
   Presentation-only layer inside the existing Admin Repertoire card.
   Wraps existing Event Repertoire and General Repertoire DOM without replacing their logic.
*/
(function(){
  'use strict';
  if(window.__hnAdminRepertoireInnerAccordionsV1)return;
  window.__hnAdminRepertoireInnerAccordionsV1=true;

  const STYLE_ID='hnAdminRepertoireInnerAccordionsStyle';
  const ROOT_ID='hnAdminRepertoireInnerAccordions';
  let attempts=0;
  let retryTimer=null;

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #${ROOT_ID}{display:grid;gap:10px}
      #${ROOT_ID} .hn-ria-section{border:1px solid rgba(229,189,98,.38);background:#080a07;overflow:hidden}
      #${ROOT_ID} .hn-ria-head{width:100%;min-height:62px;border:0;background:linear-gradient(100deg,rgba(229,189,98,.07),rgba(0,0,0,.08));color:#f4f1e8;padding:14px 15px;display:flex;align-items:center;justify-content:space-between;gap:14px;text-align:left}
      #${ROOT_ID} .hn-ria-copy{min-width:0}
      #${ROOT_ID} .hn-ria-title{display:block;font:20px/1.08 Georgia,"Times New Roman",serif;color:#f4f1e8}
      #${ROOT_ID} .hn-ria-sub{display:block;margin-top:5px;color:#85867f;font-size:8px;line-height:1.35;letter-spacing:.12em;text-transform:uppercase}
      #${ROOT_ID} .hn-ria-arrow{width:32px;height:32px;flex:0 0 32px;border:1px solid #70501d;display:grid;place-items:center;color:#e5bd62;font-size:16px;line-height:1;transition:transform .18s ease,background .18s ease}
      #${ROOT_ID} .hn-ria-section.is-open>.hn-ria-head .hn-ria-arrow{transform:rotate(180deg);background:rgba(229,189,98,.07)}
      #${ROOT_ID} .hn-ria-body{display:none;padding:12px 14px 14px;border-top:1px solid rgba(229,189,98,.18)}
      #${ROOT_ID} .hn-ria-section.is-open>.hn-ria-body{display:block}
      #${ROOT_ID} #hnEventRepertoireAdmin{margin:0!important}
      #${ROOT_ID} .hn-ria-general-body>.hn-er-general-label{display:none!important}
      #${ROOT_ID} .hn-ria-general-body>.add-song{margin-top:0!important}
      @media(max-width:760px){
        #${ROOT_ID}{gap:9px}
        #${ROOT_ID} .hn-ria-head{min-height:58px;padding:13px 12px}
        #${ROOT_ID} .hn-ria-title{font-size:18px}
        #${ROOT_ID} .hn-ria-body{padding:10px 11px 12px}
      }
    `;
    document.head.appendChild(style);
  }

  function findRepertoireBody(){
    const cards=[...document.querySelectorAll('.dashboard>.card')];
    const card=cards.find(node=>node.querySelector(':scope > .card-head h1')?.textContent.trim()==='Repertorio');
    return card?.querySelector(':scope > .hn-admin-body')||null;
  }

  function makeSection(kind,title,subtitle){
    const section=document.createElement('section');
    section.className='hn-ria-section';
    section.dataset.kind=kind;

    const head=document.createElement('button');
    head.type='button';
    head.className='hn-ria-head';
    head.setAttribute('aria-expanded','false');
    head.innerHTML='<span class="hn-ria-copy"><span class="hn-ria-title"></span><span class="hn-ria-sub"></span></span><span class="hn-ria-arrow" aria-hidden="true">⌄</span>';
    head.querySelector('.hn-ria-title').textContent=title;
    head.querySelector('.hn-ria-sub').textContent=subtitle;

    const body=document.createElement('div');
    body.className='hn-ria-body'+(kind==='general'?' hn-ria-general-body':'');

    head.addEventListener('click',()=>{
      const root=document.getElementById(ROOT_ID);
      if(!root)return;
      const willOpen=!section.classList.contains('is-open');
      root.querySelectorAll('.hn-ria-section').forEach(other=>{
        other.classList.remove('is-open');
        other.querySelector(':scope > .hn-ria-head')?.setAttribute('aria-expanded','false');
      });
      if(willOpen){
        section.classList.add('is-open');
        head.setAttribute('aria-expanded','true');
      }
    });

    section.append(head,body);
    return {section,body};
  }

  function setup(){
    if(document.getElementById(ROOT_ID))return true;

    const host=findRepertoireBody();
    const eventPanel=document.getElementById('hnEventRepertoireAdmin');
    const addSong=host?.querySelector(':scope > .add-song');
    const songMsg=document.getElementById('songMsg');
    const songList=document.getElementById('songList');

    if(!host||!eventPanel||!addSong||!songMsg||!songList)return false;

    installStyle();

    const root=document.createElement('div');
    root.id=ROOT_ID;

    const eventSection=makeSection(
      'event',
      'Repertorio del evento',
      'Selecciona canciones, especiales y controla el avance del evento'
    );
    const generalSection=makeSection(
      'general',
      'Repertorio general',
      'Agrega, edita, oculta o elimina canciones del repertorio maestro'
    );

    host.insertBefore(root,eventPanel);
    root.append(eventSection.section,generalSection.section);

    eventSection.body.appendChild(eventPanel);

    const generalLabel=host.querySelector(':scope > .hn-er-general-label');
    if(generalLabel)generalSection.body.appendChild(generalLabel);
    generalSection.body.append(addSong,songMsg,songList);

    return true;
  }

  function boot(){
    if(setup())return;
    attempts++;
    if(attempts<80)retryTimer=setTimeout(boot,100);
  }

  function init(){
    installStyle();
    boot();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();