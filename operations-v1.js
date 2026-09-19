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

  function applyFamilyRoles(root=document){
    root.querySelectorAll?.('.family-member').forEach(card=>{
      const name=card.querySelector('.family-name')?.textContent?.trim().toUpperCase();
      const role=card.querySelector('.family-role');
      if(role&&FAMILY_ROLES[name])role.textContent=FAMILY_ROLES[name];
    });
  }

  function initFamilyRoles(){
    applyFamilyRoles();
    new MutationObserver(()=>applyFamilyRoles()).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initFamilyRoles,{once:true});
  else initFamilyRoles();
})();