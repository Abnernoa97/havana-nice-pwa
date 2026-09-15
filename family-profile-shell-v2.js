/* HAVANA NICE — FAMILY PROFILE SHELL V3
   Self-service media only: each musician can edit their own avatar and cover.
   Bio remains read-only for musicians and is managed separately.
*/
(() => {
  'use strict';

  const SUPABASE_URL = 'https://xzfradccsxonmauinecl.supabase.co';
  const MEDIA_ENDPOINT = `${SUPABASE_URL}/functions/v1/family-profile-media-v1`;
  const FAMILY_KEYS = ['fer-noa','orly-show','jali','rafa','andy-rey'];
  const FALLBACK = [
    { name:'FER & NOA', role:'HAVANA NICE' },
    { name:'ORLYS SHOW', role:'MÚSICO' },
    { name:'JALI', role:'MÚSICO' },
    { name:'RAFA', role:'MÚSICO' },
    { name:'ANDY REY', role:'MÚSICO' }
  ];
  const USER_TO_MEMBER = { fer:'fer-noa', orly:'orly-show', jali:'jali', rafa:'rafa', andy:'andy-rey' };

  let profileScreen = null;
  let profileHistoryArmed = false;
  let currentIndex = 0;
  let profiles = [];
  let realtimeChannel = null;
  let boundFamily = null;
  let supabase = null;
  let loadingPromise = null;

  const getSessionProfile = () => {
    try { return JSON.parse(sessionStorage.getItem('hn_profile') || 'null'); } catch (_) { return null; }
  };

  const memberKeyForCurrentUser = () => {
    const p = getSessionProfile();
    return p?.username ? USER_TO_MEMBER[String(p.username).trim().toLowerCase()] || null : null;
  };

  const publicUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const url = supabase?.storage.from('family-media').getPublicUrl(path)?.data?.publicUrl;
    return url || `${SUPABASE_URL}/storage/v1/object/public/family-media/${path}`;
  };

  function ensureStyles() {
    if (document.getElementById('family-profile-shell-v3-style')) return;
    const style = document.createElement('style');
    style.id = 'family-profile-shell-v3-style';
    style.textContent = `
      .hn-family-profile{position:absolute;inset:0;display:none;overflow-y:auto;padding-bottom:max(76px,env(safe-area-inset-bottom));box-sizing:border-box;z-index:30}
      .hn-family-profile.is-active{display:block}
      .hn-family-profile-inner{width:min(100%,650px);min-height:100%;margin:0 auto}
      .hn-family-profile-top{position:relative;height:190px;margin:0 -1px;overflow:visible;background:#07100b;border:1px solid rgba(229,189,98,.22);border-radius:14px 14px 0 0}
      .hn-family-profile-cover{position:absolute;inset:0;background:linear-gradient(135deg,#102219,#18271d,#050806) center/cover no-repeat;border-radius:14px 14px 0 0}
      .hn-family-profile-cover:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.62));border-radius:14px 14px 0 0}
      .hn-family-profile-avatar{position:absolute;left:24px;bottom:-56px;width:112px;height:112px;border-radius:50%;box-sizing:border-box;border:2px solid #d9b45f;background:#0a110d center/cover no-repeat;box-shadow:0 8px 28px rgba(0,0,0,.42),0 0 0 5px rgba(0,0,0,.32);z-index:2;overflow:hidden}
      .hn-family-profile-avatar img{display:block;width:100%;height:100%;object-fit:cover;border-radius:50%}
      .hn-family-profile-content{padding:72px 16px 28px}
      .hn-family-profile-name{margin:0;color:#eee9df;font-family:Georgia,"Times New Roman",serif;font-size:30px;font-weight:400;letter-spacing:.04em;text-transform:uppercase}
      .hn-family-profile-role{margin:8px 0 0;color:rgba(244,241,232,.43);font-size:8px;letter-spacing:.22em;text-transform:uppercase}
      .hn-family-profile-section{margin-top:28px;padding:18px;border:1px solid rgba(229,189,98,.22);border-radius:12px;background:rgba(0,0,0,.28)}
      .hn-family-profile-label{margin:0 0 10px;color:#d9b45f;font-size:8px;font-weight:500;letter-spacing:.18em;text-transform:uppercase}
      .hn-family-profile-bio{min-height:40px;color:rgba(244,241,232,.72);font-size:13px;line-height:1.55;white-space:pre-wrap}
      .hn-family-profile-actions{display:flex;gap:9px;margin-top:14px;flex-wrap:wrap}
      .hn-family-profile-edit{flex:1;min-width:145px;padding:11px 12px;border:1px solid rgba(229,189,98,.55);border-radius:12px;background:rgba(0,0,0,.25);color:#fff1a8;font-size:8px;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}
      .hn-family-profile-edit:disabled{opacity:.55;cursor:wait}
      .hn-family-profile-input{display:none}
      .hn-family-profile-status{margin:10px 0 0;min-height:12px;color:rgba(244,241,232,.52);font-size:9px;line-height:1.4}
      .hn-family-profile-back{width:100%;margin-top:16px}
      @media(max-width:520px){.hn-family-profile-top{height:155px}.hn-family-profile-avatar{width:96px;height:96px;left:18px;bottom:-48px}.hn-family-profile-content{padding-top:62px}.hn-family-profile-name{font-size:25px}}
    `;
    document.head.appendChild(style);
  }

  function build() {
    if (profileScreen) return profileScreen;
    ensureStyles();
    profileScreen=document.createElement('section');
    profileScreen.id='hnFamilyProfile';
    profileScreen.className='screen hn-family-profile';
    profileScreen.innerHTML=`
      <div class="hn-family-profile-inner">
        <div class="hn-family-profile-top">
          <div class="hn-family-profile-cover" aria-label="Foto de portada"></div>
          <div class="hn-family-profile-avatar" aria-label="Foto de perfil"></div>
        </div>
        <div class="hn-family-profile-content">
          <h1 class="hn-family-profile-name"></h1>
          <div class="hn-family-profile-role"></div>
          <section class="hn-family-profile-section">
            <h2 class="hn-family-profile-label">BIOGRAFÍA</h2>
            <div class="hn-family-profile-bio"></div>
            <div class="hn-family-profile-actions" hidden>
              <button class="hn-family-profile-edit" type="button" data-media="avatar">Cambiar foto de perfil</button>
              <button class="hn-family-profile-edit" type="button" data-media="cover">Cambiar foto de portada</button>
              <input class="hn-family-profile-input" type="file" accept="image/jpeg,image/png,image/webp" data-media="avatar">
              <input class="hn-family-profile-input" type="file" accept="image/jpeg,image/png,image/webp" data-media="cover">
            </div>
            <p class="hn-family-profile-status" aria-live="polite"></p>
          </section>
          <button class="back-button hn-family-profile-back" type="button">Volver</button>
        </div>
      </div>`;
    document.querySelector('.experience')?.appendChild(profileScreen);
    profileScreen.querySelector('.hn-family-profile-back').addEventListener('click',()=>closeProfile(true));
    profileScreen.querySelectorAll('[data-media]').forEach((el)=>{
      if(el.tagName==='BUTTON') el.addEventListener('click',()=>profileScreen.querySelector(`input[data-media="${el.dataset.media}"]`)?.click());
      if(el.tagName==='INPUT') el.addEventListener('change',()=>handleUpload(el.dataset.media,el.files?.[0]));
    });
    return profileScreen;
  }

  async function waitForSupabase(timeoutMs=10000){
    if(window.hnSupabase)return window.hnSupabase;
    return await new Promise(resolve=>{
      const start=Date.now();
      const check=()=>{
        if(window.hnSupabase)return resolve(window.hnSupabase);
        if(Date.now()-start>=timeoutMs)return resolve(null);
        setTimeout(check,100);
      };
      check();
    });
  }

  async function loadProfiles(){
    if(loadingPromise)return loadingPromise;
    loadingPromise=(async()=>{
      const sb=await waitForSupabase();
      if(!sb)return;
      supabase=sb;
      const {data,error}=await supabase.from('family_profiles').select('id,member_key,name,role,bio,avatar_path,cover_path,active,sort_order,updated_at').eq('active',true).in('member_key',FAMILY_KEYS).order('sort_order',{ascending:true});
      if(error){console.warn('HAVANA NICE family profiles load:',error);return;}
      profiles=data||[];
      refreshVisibleProfile();
    })().finally(()=>{loadingPromise=null;});
    return loadingPromise;
  }

  function subscribeRealtime(){
    if(!supabase||realtimeChannel)return;
    realtimeChannel=supabase.channel('family-profile-media-v1')
      .on('postgres_changes',{event:'*',schema:'public',table:'family_profiles'},payload=>{
        const row=payload.new||payload.old;
        if(!row?.member_key)return;
        if(payload.eventType==='DELETE')profiles=profiles.filter(p=>p.member_key!==row.member_key);
        else{
          const i=profiles.findIndex(p=>p.member_key===row.member_key);
          if(i>=0)profiles[i]={...profiles[i],...row};
          else if(row.active)profiles.push(row);
        }
        refreshVisibleProfile();
      }).subscribe();
  }

  function render(index){
    const p=profiles[index]||{...FALLBACK[index],bio:'',avatar_path:null,cover_path:null,member_key:FAMILY_KEYS[index]};
    currentIndex=index;
    const cover=profileScreen.querySelector('.hn-family-profile-cover');
    const avatar=profileScreen.querySelector('.hn-family-profile-avatar');
    profileScreen.querySelector('.hn-family-profile-name').textContent=p.name||'';
    profileScreen.querySelector('.hn-family-profile-role').textContent=p.role||'';
    profileScreen.querySelector('.hn-family-profile-bio').textContent=p.bio||'';
    cover.style.backgroundImage=p.cover_path?`url("${publicUrl(p.cover_path)}")`:'linear-gradient(135deg,#102219,#18271d,#050806)';
    avatar.replaceChildren();
    if(p.avatar_path){
      const img=new Image();
      img.alt='Foto de perfil';
      img.decoding='async';
      img.onload=()=>{ if(currentIndex===index) avatar.appendChild(img); };
      img.onerror=()=>{};
      img.src=publicUrl(p.avatar_path);
    }
    const canEdit=memberKeyForCurrentUser()===p.member_key;
    profileScreen.querySelector('.hn-family-profile-actions').hidden=!canEdit;
    profileScreen.querySelector('.hn-family-profile-status').textContent='';
    profileScreen.scrollTop=0;
  }

  function refreshVisibleProfile(){if(profileScreen?.classList.contains('is-active'))render(currentIndex);}

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

  async function compressImage(file,mediaType){
    if(!file)throw new Error('No se seleccionó imagen');
    if(!/^image\/(jpeg|png|webp)$/i.test(file.type))throw new Error('Solo JPG, PNG o WebP');
    const max=mediaType==='avatar'?700:1800;
    const bitmap=await createImageBitmap(file);
    const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close?.();
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No fue posible preparar la imagen')),'image/webp',.82));
    return new File([blob],`${mediaType}.webp`,{type:'image/webp'});
  }

  async function handleUpload(mediaType,originalFile){
    const p=profiles[currentIndex];
    const session=getSessionProfile();
    const expected=memberKeyForCurrentUser();
    if(!p||!session||expected!==p.member_key)return;
    if(!originalFile)return;
    const status=profileScreen.querySelector('.hn-family-profile-status');
    const buttons=[...profileScreen.querySelectorAll('.hn-family-profile-edit')];
    buttons.forEach(b=>b.disabled=true);
    const previewUrl=URL.createObjectURL(originalFile);
    const cover=profileScreen.querySelector('.hn-family-profile-cover');
    const avatar=profileScreen.querySelector('.hn-family-profile-avatar');
    if(mediaType==='cover')cover.style.backgroundImage=`url("${previewUrl}")`;
    else{
      avatar.replaceChildren();
      const img=new Image();
      img.alt='Vista previa de foto de perfil';
      img.onload=()=>avatar.appendChild(img);
      img.src=previewUrl;
    }
    status.textContent='Preparando imagen...';
    try{
      const file=await compressImage(originalFile,mediaType);
      const deviceMod=await import('./musician-device-access-v1.js?v=180733417c2b7f261249394d43ba1b1c4a82b1af');
      const deviceToken=deviceMod.getDeviceToken();
      const form=new FormData();
      form.append('username',session.username);
      form.append('device_token',deviceToken);
      form.append('member_key',p.member_key);
      form.append('media_type',mediaType);
      form.append('file',file);
      status.textContent='Guardando...';
      const response=await fetch(MEDIA_ENDPOINT,{method:'POST',body:form,cache:'no-store'});
      const result=await response.json().catch(()=>({}));
      if(!response.ok||!result.ok)throw new Error(result.error||'No fue posible guardar la imagen');
      const i=profiles.findIndex(row=>row.member_key===p.member_key);
      if(i>=0)profiles[i]=result.profile;
      render(currentIndex);
      status.textContent=mediaType==='avatar'?'Foto de perfil actualizada.':'Foto de portada actualizada.';
    }catch(error){
      console.error('HAVANA NICE family profile upload:',error);
      status.textContent=error?.message||'No fue posible actualizar la imagen.';
    }finally{
      URL.revokeObjectURL(previewUrl);
      buttons.forEach(b=>b.disabled=false);
      const input=profileScreen.querySelector(`input[data-media="${mediaType}"]`);
      if(input)input.value='';
    }
  }

  function wireFamily(){
    const family=document.getElementById('familyScreen');
    if(!family||boundFamily===family)return false;
    boundFamily=family;
    family.addEventListener('click',e=>{
      const button=e.target.closest('.family-member');
      if(!button)return;
      e.preventDefault();e.stopPropagation();
      const index=Number(button.dataset.familyIndex);
      if(Number.isInteger(index))openProfile(index,false);
    },true);
    return true;
  }

  window.addEventListener('hn-family-ready',()=>{wireFamily();loadProfiles();});
  window.addEventListener('popstate',()=>{if(profileScreen?.classList.contains('is-active'))closeProfile(false);});

  async function init(){
    build();
    wireFamily();
    await loadProfiles();
    subscribeRealtime();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();