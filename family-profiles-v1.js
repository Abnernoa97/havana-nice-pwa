/* HAVANA NICE — FAMILY PROFILE SHELL / UI ONLY */
(() => {
  'use strict';

  const PROFILE_DATA = [
    { name:'FER & NOA', role:'HAVANA NICE', bio:'' },
    { name:'ORLYS SHOW', role:'MÚSICO', bio:'' },
    { name:'JALI', role:'MÚSICO', bio:'' },
    { name:'RAFA', role:'MÚSICO', bio:'' },
    { name:'ANDY REY', role:'MÚSICO', bio:'' }
  ];

  let profileScreen = null;
  let profileHistoryArmed = false;
  let activeIndex = 0;

  const esc = v => String(v ?? '').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

  function ensureStyles(){
    if(document.getElementById('family-profile-v1-style')) return;
    const style=document.createElement('style');
    style.id='family-profile-v1-style';
    style.textContent=`
      .hn-family-profile{position:absolute;inset:0;display:none;overflow-y:auto;padding-bottom:max(76px,env(safe-area-inset-bottom));box-sizing:border-box}
      .hn-family-profile.is-active{display:block}
      .hn-family-profile-inner{width:min(100%,650px);min-height:100%;margin:0 auto}
      .hn-family-profile-top{position:relative;height:190px;margin:0 -1px 0;overflow:visible;background:rgba(0,0,0,.32);border:1px solid rgba(229,189,98,.22);border-radius:14px 14px 0 0}
      .hn-family-profile-cover{position:absolute;inset:0;background:linear-gradient(135deg,rgba(9,25,17,.96),rgba(20,35,25,.72),rgba(0,0,0,.88));border-radius:14px 14px 0 0}
      .hn-family-profile-cover:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.58))}
      .hn-family-profile-avatar{position:absolute;left:24px;bottom:-56px;width:112px;height:112px;border-radius:50%;box-sizing:border-box;border:2px solid #d9b45f;background:#0a110d;box-shadow:0 8px 28px rgba(0,0,0,.42),0 0 0 5px rgba(0,0,0,.32);z-index:2}
      .hn-family-profile-content{padding:72px 16px 28px}
      .hn-family-profile-name{margin:0;color:#eee9df;font-family:Georgia,"Times New Roman",serif;font-size:30px;font-weight:400;letter-spacing:.04em;text-transform:uppercase}
      .hn-family-profile-role{margin:8px 0 0;color:rgba(244,241,232,.43);font-size:8px;letter-spacing:.22em;text-transform:uppercase}
      .hn-family-profile-section{margin-top:28px;padding:18px;border:1px solid rgba(229,189,98,.22);border-radius:12px;background:rgba(0,0,0,.28)}
      .hn-family-profile-label{margin:0 0 10px;color:#d9b45f;font-size:8px;font-weight:500;letter-spacing:.18em;text-transform:uppercase}
      .hn-family-profile-bio{min-height:88px;color:rgba(244,241,232,.72);font-size:13px;line-height:1.55;white-space:pre-wrap}
      .hn-family-profile-bio:empty:after{content:' ';display:block}
      .hn-family-profile-back{width:100%;margin-top:16px}
      @media(max-width:520px){.hn-family-profile-top{height:155px}.hn-family-profile-avatar{width:96px;height:96px;left:18px;bottom:-48px}.hn-family-profile-content{padding-top:62px}.hn-family-profile-name{font-size:25px}}
    `;
    document.head.appendChild(style);
  }

  function build(){
    if(profileScreen) return profileScreen;
    ensureStyles();
    profileScreen=document.createElement('section');
    profileScreen.id='hnFamilyProfile';
    profileScreen.className='hn-family-profile';
    profileScreen.innerHTML=`<div class="hn-family-profile-inner"><div class="hn-family-profile-top"><div class="hn-family-profile-cover" aria-label="Foto de portada vacía"></div><div class="hn-family-profile-avatar" aria-label="Foto de perfil vacía"></div></div><div class="hn-family-profile-content"><h1 class="hn-family-profile-name"></h1><div class="hn-family-profile-role"></div><section class="hn-family-profile-section"><h2 class="hn-family-profile-label">BIOGRAFÍA</h2><div class="hn-family-profile-bio"></div></section><button class="back-button hn-family-profile-back" type="button">Volver</button></div></div>`;
    document.querySelector('.experience')?.appendChild(profileScreen);
    profileScreen.querySelector('.hn-family-profile-back').addEventListener('click',()=>closeProfile(true));
    return profileScreen;
  }

  function render(index){
    const p=PROFILE_DATA[index];
    if(!p) return;
    activeIndex=index;
    const name=profileScreen.querySelector('.hn-family-profile-name');
    const role=profileScreen.querySelector('.hn-family-profile-role');
    const bio=profileScreen.querySelector('.hn-family-profile-bio');
    if(name)name.textContent=p.name;
    if(role)role.textContent=p.role;
    if(bio)bio.textContent=p.bio;
    profileScreen.scrollTop=0;
  }

  function openProfile(index,fromPopState=false){
    build();
    render(index);
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('is-active'));
    profileScreen.classList.add('is-active');
    if(!fromPopState&&!profileHistoryArmed){history.pushState({hnFamilyProfile:true,index},'',location.href);profileHistoryArmed=true;}
  }

  function closeProfile(fromButton=false){
    if(!profileScreen?.classList.contains('is-active'))return;
    profileScreen.classList.remove('is-active');
    document.getElementById('familyScreen')?.classList.add('is-active');
    if(fromButton&&profileHistoryArmed){profileHistoryArmed=false;history.back();}
    else if(!fromButton)profileHistoryArmed=false;
  }

  function wire(){
    const family=document.getElementById('familyScreen');
    if(!family||family.dataset.hnProfileBound==='1')return;
    family.dataset.hnProfileBound='1';
    family.addEventListener('click',e=>{
      const button=e.target.closest('.family-member');
      if(!button)return;
      e.preventDefault();e.stopPropagation();
      const index=Number(button.dataset.familyIndex);
      if(Number.isInteger(index))openProfile(index,false);
    },true);
  }

  window.addEventListener('popstate',()=>{
    if(profileScreen?.classList.contains('is-active'))closeProfile(false);
  });

  function init(){build();wire();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,50);
})();