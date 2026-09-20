/* HAVANA NICE — OPERATIONS V2 / COMPATIBILITY ONLY
   Calendar V5 is the single owner of calendar data and Realtime.
   Legacy Operations polling, duplicate calendar queries, duplicate Supabase
   client/channel, My Day, Event Details and Show Day bridge were unreachable
   in the current UI and are intentionally retired here.
*/
(function(){
  'use strict';
  window.__hnOperationsV2=true;

  const FAMILY_ROLES={
    'FER & NOA':'HAVANA NICE',
    'ORLYS SHOW':'PERCUSIONISTA Y DIRECTOR MUSICAL',
    'JALI':'PRESIDENTE DE JATIBONICO',
    'RAFA':'ALCALDE DE SANTA FE',
    'ANDY REY':'GERENTE DE LIVERPOOL'
  };

  function applyHomeLabels(){
    const subtitle=document.querySelector('.module[data-module="CALENDARIO DE EVENTOS"] .module-subtitle');
    if(subtitle)subtitle.textContent='TODOS LOS DETALLES';
  }

  function applyFamilyRoles(){
    const cards=[...document.querySelectorAll('.family-member')];
    if(!cards.length)return false;
    cards.forEach(card=>{
      const name=card.querySelector('.family-name')?.textContent?.trim().toUpperCase();
      const role=card.querySelector('.family-role');
      const next=FAMILY_ROLES[name];
      if(role&&next&&role.textContent!==next)role.textContent=next;
    });
    return true;
  }

  function installFamilyRoles(){
    applyHomeLabels();
    if(applyFamilyRoles())return;
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(applyFamilyRoles()||tries>=40)clearInterval(timer);
    },250);
  }

  function installFamilyProfileBackFix(){
    if(document.documentElement.dataset.hnFamilyProfileBackFix==='1')return;
    document.documentElement.dataset.hnFamilyProfileBackFix='1';
    document.addEventListener('click',event=>{
      const button=event.target?.closest?.('.family-profile-back');
      if(!button)return;
      event.preventDefault();
      event.stopImmediatePropagation();

      // The Family module already owns a two-level history stack:
      // Home -> Family list -> Member profile. Let its popstate handler
      // consume only the profile entry instead of the button clearing the
      // profile flag first and accidentally consuming the Family level too.
      if(history.state?.hnFamilyProfile){
        try{history.back();return}catch(_){ }
      }

      // Safe fallback for profiles opened without a pushed history entry.
      document.getElementById('hnFamilyProfileScreen')?.classList.remove('is-active');
      document.getElementById('hnFamilyScreen')?.classList.add('is-active');
    },true);
  }

  function init(){
    installFamilyRoles();
    installFamilyProfileBackFix();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
