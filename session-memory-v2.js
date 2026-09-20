/* HAVANA NICE — LAST MUSICIAN MEMORY v2
   Remembers only the last successfully validated musician on this device.
   Device authorization is validated server-side before restoring the session.
   Push launch intents are routed into the existing app after session restore.
*/
(function(){
  'use strict';

  const KEY='hn_last_musician_v1';
  const DEVICE_MODULE='./musician-device-access-v1.js?v=180733417c2b7f261249394d43ba1b1c4a82b1af';
  let restoring=false;
  let pendingLaunch='';
  let launchTimer=null;

  function readSaved(){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw)return null;
      const saved=JSON.parse(raw);
      return saved&&typeof saved.username==='string'&&saved.username.trim()
        ? saved
        : null;
    }catch(_){
      return null;
    }
  }

  function save(profile){
    if(!profile||!profile.username)return;
    try{
      localStorage.setItem(KEY,JSON.stringify({
        id:profile.id||null,
        username:profile.username,
        role:profile.role||'Músico de HAVANA NICE'
      }));
    }catch(_){}
  }

  function clear(){
    try{localStorage.removeItem(KEY);}catch(_){}
  }

  function getProfile(){
    try{
      const raw=sessionStorage.getItem('hn_profile');
      return raw?JSON.parse(raw):null;
    }catch(_){
      return null;
    }
  }

  function notifySession(type,profile){
    try{window.dispatchEvent(new CustomEvent(type,{detail:profile||null}));}catch(_){}
  }

  function isStandalone(){
    try{
      return window.matchMedia?.('(display-mode: standalone)').matches===true||window.navigator.standalone===true;
    }catch(_){
      return false;
    }
  }

  function replyClientMode(event,nonce){
    if(!nonce)return;
    const payload={
      type:'HN_CLIENT_MODE_RESPONSE',
      nonce,
      standalone:isStandalone(),
      visibility:document.visibilityState||''
    };
    try{
      if(event?.source&&typeof event.source.postMessage==='function'){
        event.source.postMessage(payload);
        return;
      }
    }catch(_){}
    try{navigator.serviceWorker.controller?.postMessage(payload);}catch(_){}
  }

  function normalizeLaunch(value){
    const section=String(value||'').trim().toLowerCase();
    return section==='notifications'||section==='chat'?section:'';
  }

  function launchFromUrl(value){
    try{
      const url=new URL(value||location.href,location.href);
      return normalizeLaunch(url.searchParams.get('open'));
    }catch(_){
      return '';
    }
  }

  function clearLaunchUrl(){
    try{
      const url=new URL(location.href);
      if(!url.searchParams.has('open'))return;
      url.searchParams.delete('open');
      history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    }catch(_){}
  }

  function findLaunchTarget(section){
    const modules=[...document.querySelectorAll('.module')];
    if(section==='notifications'){
      return modules.find(module=>{
        const title=module.querySelector('.module-title');
        return title&&title.textContent.trim().toUpperCase()==='NOTIFICACIONES';
      })||null;
    }
    if(section==='chat'){
      return modules.find(module=>/CHAT DE INFORMACIÓN|CHAT DE INFORMACION/i.test(module.textContent||''))||null;
    }
    return null;
  }

  function tryLaunch(){
    if(!pendingLaunch||!getProfile())return false;
    const target=findLaunchTarget(pendingLaunch);
    if(!target)return false;
    const section=pendingLaunch;
    pendingLaunch='';
    clearInterval(launchTimer);
    launchTimer=null;
    clearLaunchUrl();
    try{target.click();return true;}catch(error){
      console.warn('HAVANA NICE push route failed:',section,error);
      pendingLaunch=section;
      return false;
    }
  }

  function queueLaunch(section){
    section=normalizeLaunch(section);
    if(!section)return;
    pendingLaunch=section;
    if(tryLaunch())return;
    clearInterval(launchTimer);
    let tries=0;
    launchTimer=setInterval(()=>{
      tries++;
      if(tryLaunch()||tries>=80){clearInterval(launchTimer);launchTimer=null;}
    },100);
  }

  function installLaunchRouting(){
    const initial=launchFromUrl(location.href);
    if(initial)pendingLaunch=initial;

    if('serviceWorker'in navigator){
      navigator.serviceWorker.addEventListener('message',event=>{
        const data=event&&event.data;
        if(!data)return;

        if(data.type==='HN_QUERY_CLIENT_MODE'){
          replyClientMode(event,data.nonce);
          return;
        }

        if(data.type!=='HN_PUSH_OPEN')return;
        const section=normalizeLaunch(data.section)||launchFromUrl(data.url);
        if(section)queueLaunch(section);
      });
    }

    window.addEventListener('hn:session-ready',()=>{
      if(pendingLaunch)queueLaunch(pendingLaunch);
    });

    if(pendingLaunch)queueLaunch(pendingLaunch);
  }

  function waitForSupabase(timeoutMs=8000){
    return new Promise(resolve=>{
      const started=Date.now();
      const check=()=>{
        if(window.hnSupabase)return resolve(window.hnSupabase);
        if(Date.now()-started>=timeoutMs)return resolve(null);
        setTimeout(check,100);
      };
      check();
    });
  }

  function enterHome(profile){
    const login=document.getElementById('loginScreen');
    const home=document.getElementById('homeScreen');
    const name=document.getElementById('welcomeName');
    const role=document.getElementById('welcomeRole');
    if(!login||!home||!name||!role)return false;

    name.textContent=profile.username||'';
    role.textContent=profile.role||'Músico de HAVANA NICE';
    login.classList.remove('is-active');
    home.classList.add('is-active');
    notifySession('hn:session-ready',profile);
    return true;
  }

  async function restore(){
    if(restoring)return;
    if(getProfile()){
      if(pendingLaunch)queueLaunch(pendingLaunch);
      return;
    }

    const saved=readSaved();
    if(!saved)return;

    restoring=true;
    const supabase=await waitForSupabase();

    if(!supabase){
      restoring=false;
      return;
    }

    try{
      const mod=await import(DEVICE_MODULE);
      const validation=await mod.validateSession(saved.username);
      if(validation?.error||!validation?.data?.length||validation.data[0].status!=='authorized'){
        clear();
        sessionStorage.removeItem('hn_profile');
        return;
      }

      const row=validation.data[0];
      const current={
        id:row.profile_id,
        username:row.username,
        role:row.role
      };

      sessionStorage.setItem('hn_profile',JSON.stringify(current));
      save(current);
      enterHome(current);
    }catch(error){
      console.warn('HAVANA NICE last musician restore failed:',error);
      clear();
      sessionStorage.removeItem('hn_profile');
    }finally{
      restoring=false;
    }
  }

  function watchSuccessfulLogin(){
    const button=document.getElementById('loginButton');
    if(!button)return;

    button.addEventListener('click',()=>{
      let checks=0;
      const timer=setInterval(()=>{
        checks++;
        const profile=getProfile();
        if(profile&&profile.username){
          save(profile);
          if(pendingLaunch)queueLaunch(pendingLaunch);
          clearInterval(timer);
        }
        if(checks>=100)clearInterval(timer);
      },100);
    },false);
  }

  function watchLogout(){
    const button=document.getElementById('logoutButton');
    if(!button)return;
    button.addEventListener('click',()=>{
      clear();
      pendingLaunch='';
      clearInterval(launchTimer);
      launchTimer=null;
      notifySession('hn:session-logout');
    },false);
  }

  function init(){
    installLaunchRouting();
    watchSuccessfulLogin();
    watchLogout();
    restore();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();