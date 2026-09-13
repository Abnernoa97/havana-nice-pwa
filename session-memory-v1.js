/* HAVANA NICE — LAST MUSICIAN MEMORY
   First entry requires the musician name.
   Later entries on the same device validate the remembered musician and enter directly.
   Logout clears the remembered musician so the next entry can choose another.
   No biometric, Passkey, WebAuthn or device credential is used.
*/
(function(){
  'use strict';

  const KEY='hn_last_musician_v1';

  function getSaved(){
    try{
      const raw=localStorage.getItem(KEY);
      const saved=raw?JSON.parse(raw):null;
      return saved&&saved.username?saved:null;
    }catch(_){return null;}
  }

  function setSaved(profile){
    if(!profile||!profile.username)return;
    try{
      localStorage.setItem(KEY,JSON.stringify({
        id:profile.id||null,
        username:profile.username,
        role:profile.role||'Músico de HAVANA NICE',
        updatedAt:new Date().toISOString()
      }));
    }catch(_){}
  }

  function clearSaved(){
    try{localStorage.removeItem(KEY);}catch(_){}
  }

  function showHome(profile){
    const login=document.getElementById('loginScreen');
    const home=document.getElementById('homeScreen');
    const name=document.getElementById('welcomeName');
    const role=document.getElementById('welcomeRole');
    if(!login||!home||!name||!role)return;
    name.textContent=profile.username||'';
    role.textContent=profile.role||'Músico de HAVANA NICE';
    login.classList.remove('is-active');
    home.classList.add('is-active');
  }

  async function validateSaved(){
    const saved=getSaved();
    if(!saved)return;
    const supabase=window.hnSupabase;
    if(!supabase)return;
    try{
      const {data,error}=await supabase.rpc('login_by_username',{p_username:saved.username});
      if(error||!data||!data.length){
        clearSaved();
        sessionStorage.removeItem('hn_profile');
        return;
      }
      const profile=data[0];
      const current={id:profile.id,username:profile.username,role:profile.role};
      sessionStorage.setItem('hn_profile',JSON.stringify(current));
      setSaved(current);
      showHome(current);
    }catch(_){
      // If validation cannot complete, leave the normal login screen visible.
    }
  }

  function captureSuccessfulLogin(){
    const button=document.getElementById('loginButton');
    if(!button)return;
    button.addEventListener('click',()=>{
      let tries=0;
      const timer=setInterval(()=>{
        tries++;
        try{
          const raw=sessionStorage.getItem('hn_profile');
          const profile=raw?JSON.parse(raw):null;
          if(profile&&profile.username){
            setSaved(profile);
            clearInterval(timer);
          }
        }catch(_){}
        if(tries>=40)clearInterval(timer);
      },250);
    },false);
  }

  function handleLogout(){
    const button=document.getElementById('logoutButton');
    if(!button)return;
    button.addEventListener('click',()=>{
      clearSaved();
    },false);
  }

  function init(){
    captureSuccessfulLogin();
    handleLogout();
    if(!sessionStorage.getItem('hn_profile'))validateSaved();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
