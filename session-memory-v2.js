/* HAVANA NICE — LAST MUSICIAN MEMORY v2
   Remembers only the last successfully validated musician on this device.
   Device authorization is validated server-side before restoring the session.
   Direct app routes: #chat and #notifications.
*/
(function(){
  'use strict';

  const KEY='hn_last_musician_v1';
  const DEVICE_MODULE='./musician-device-access-v1.js?v=180733417c2b7f261249394d43ba1b1c4a82b1af';
  let restoring=false;
  let pendingRoute='';
  let routeTimer=null;

  function readSaved(){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw)return null;
      const saved=JSON.parse(raw);
      return saved&&typeof saved.username==='string'&&saved.username.trim()?saved:null;
    }catch(_){return null;}
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
    }catch(_){return null;}
  }

  function notifySession(type,profile){
    try{window.dispatchEvent(new CustomEvent(type,{detail:profile||null}));}catch(_){}
  }

  function normalizeRoute(value){
    const route=String(value||'').trim().toLowerCase().replace(/^#/,'');
    return route==='chat'||route==='notifications'?route:'';
  }

  function routeFromLocation(){
    return normalizeRoute(location.hash);
  }

  function clearRouteFromUrl(){
    if(!routeFromLocation())return;
    try{history.replaceState(history.state,'',location.pathname+location.search);}catch(_){}
  }

  function findRouteButton(route){
    const modules=[...document.querySelectorAll('.module')];
    if(route==='notifications'){
      return modules.find(module=>{
        const title=module.querySelector('.module-title');
        return title&&title.textContent.trim().toUpperCase()==='NOTIFICACIONES';
      })||null;
    }
    if(route==='chat'){
      return modules.find(module=>/CHAT DE INFORMACIÓN|CHAT DE INFORMACION/i.test(module.textContent||''))||null;
    }
    return null;
  }

  function applyRoute(){
    if(!pendingRoute||!getProfile())return false;
    const button=findRouteButton(pendingRoute);
    if(!button)return false;

    pendingRoute='';
    clearTimeout(routeTimer);
    routeTimer=null;
    clearRouteFromUrl();

    try{
      button.click();
      return true;
    }catch(error){
      console.warn('HAVANA NICE route failed:',error);
      return false;
    }
  }

  function queueRoute(route){
    route=normalizeRoute(route);
    if(!route)return;
    pendingRoute=route;

    if(applyRoute())return;

    clearTimeout(routeTimer);
    let attempts=0;
    const retry=()=>{
      attempts++;
      if(applyRoute()||attempts>=50){routeTimer=null;return;}
      routeTimer=setTimeout(retry,100);
    };
    routeTimer=setTimeout(retry,100);
  }

  function installRouting(){
    const initial=routeFromLocation();
    if(initial)pendingRoute=initial;

    window.addEventListener('hashchange',()=>{
      const route=routeFromLocation();
      if(route)queueRoute(route);
    });

    if('serviceWorker'in navigator){
      navigator.serviceWorker.addEventListener('message',event=>{
        const data=event&&event.data;
        if(!data||data.type!=='HN_ROUTE')return;
        const route=normalizeRoute(data.route);
        if(route)queueRoute(route);
      });
    }

    window.addEventListener('hn:session-ready',()=>{
      if(pendingRoute)queueRoute(pendingRoute);
    });

    if(pendingRoute)queueRoute(pendingRoute);
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
      if(pendingRoute)queueRoute(pendingRoute);
      return;
    }

    const saved=readSaved();
    if(!saved)return;

    restoring=true;
    const supabase=await waitForSupabase();
    if(!supabase){restoring=false;return;}

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
          if(pendingRoute)queueRoute(pendingRoute);
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
      pendingRoute='';
      clearTimeout(routeTimer);
      routeTimer=null;
      notifySession('hn:session-logout');
    },false);
  }

  function init(){
    installRouting();
    watchSuccessfulLogin();
    watchLogout();
    restore();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();