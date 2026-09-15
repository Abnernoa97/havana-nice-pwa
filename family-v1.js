/* HAVANA NICE — FAMILIA HAVANA NICE / ORIGINAL EDITORIAL */
(() => {
  'use strict';

  const FAMILY = [
    { name:'FER & NOA', role:'HAVANA NICE', key:'fer-noa' },
    { name:'ORLYS SHOW', role:'MÚSICO', key:'orly-show' },
    { name:'JALI', role:'MÚSICO', key:'jali' },
    { name:'RAFA', role:'MÚSICO', key:'rafa' },
    { name:'ANDY REY', role:'MÚSICO', key:'andy-rey' }
  ];
  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  const MEDIA_ENDPOINT=`${SUPABASE_URL}/functions/v1/family-profile-media-v1`;
  const DEVICE_MODULE='./musician-device-access-v1.js?v=43ddfa619ebbd4a631cc4b54afb127372bbaa938';

  let familyScreen=null;
  let profileScreen=null;
  let previousScreen=null;
  let familyHistory=false;
  let profileHistory=false;
  let db=null;
  let realtimeChannel=null;
  const profileCache=new Map();

  const home=()=>document.getElementById('homeScreen');
  const username=()=>{try{return String(JSON.parse(sessionStorage.getItem('hn_profile')||'{}').username||'').trim().toLowerCase()}catch(_){return ''}};
  const ownKey=()=>({fer:'fer-noa',orly:'orly-show',jali:'jali',rafa:'rafa',andy:'andy-rey'})[username()]||null;
  const mediaUrl=p=>{if(!p)return '';if(/^https?:\/\//i.test(p))return p;return `${SUPABASE_URL}/storage/v1/object/public/family-media/${p.split('/').map(encodeURIComponent).join('/')}`};

  function ensureStyles(){
    if(document.getElementById('family-profile-inline-style'))return;
    const s=document.createElement('style');s.id='family-profile-inline-style';s.textContent=`
      .family-screen{padding-bottom:max(76px,env(safe-area-inset-bottom))}
      .family-inner{width:min(100%,650px);height:100%;margin:0 auto;display:flex;flex-direction:column;padding-top:5px}
      .family-header{flex:0 0 auto;text-align:center;margin-bottom:22px}.family-caption{margin:20px 0 0;color:rgba(244,241,232,.56);font-size:8px;letter-spacing:.30em;text-transform:uppercase}
      .family-list{flex:1;min-height:0;overflow-y:auto;padding:4px 3px 28px 0;scrollbar-width:thin;scrollbar-color:rgba(229,189,98,.55) transparent}
      .family-member{position:relative;width:100%;min-height:78px;display:flex;align-items:center;gap:17px;padding:14px 18px;margin-bottom:9px;border:1px solid rgba(229,189,98,.50);border-radius:0;background:linear-gradient(105deg,rgba(0,0,0,.58),rgba(20,14,5,.28),rgba(0,0,0,.46));color:var(--white);text-align:left;backdrop-filter:blur(8px)}
      .family-member:active{transform:scale(.985)}.family-number{width:27px;flex:0 0 27px;color:var(--gold);font-family:Georgia,"Times New Roman",serif;font-size:13px}.family-copy{flex:1;min-width:0}.family-name{display:block;color:var(--white);font-family:Georgia,"Times New Roman",serif;font-size:20px;font-weight:400;letter-spacing:.05em;line-height:1.1;text-transform:uppercase}.family-role{display:block;margin-top:7px;color:rgba(244,241,232,.43);font-size:8px;letter-spacing:.22em;text-transform:uppercase}.family-arrow{color:var(--gold-light);font-size:23px;line-height:1}.family-footer{flex:0 0 auto;padding-top:7px}.family-footer .back-button{width:100%}
      .family-profile-screen{padding-bottom:max(76px,env(safe-area-inset-bottom));overflow-y:auto}.family-profile-inner{width:min(100%,650px);min-height:100%;margin:0 auto}.family-profile-cover{position:relative;height:190px;border:1px solid rgba(229,189,98,.42);border-radius:12px 12px 0 0;background:linear-gradient(135deg,#102219,#18271d,#050806);overflow:visible;background-position:center;background-size:cover}.family-profile-cover::after{content:'';position:absolute;inset:0;border-radius:12px 12px 0 0;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.58));pointer-events:none}.family-profile-avatar{position:absolute;left:24px;bottom:-56px;z-index:3;width:112px;height:112px;border:2px solid var(--gold);border-radius:50%;background:rgba(5,10,7,.9);box-shadow:0 0 0 5px rgba(2,3,2,.65),0 10px 28px rgba(0,0,0,.42);background-position:center;background-size:cover;background-repeat:no-repeat}.family-profile-edit{position:absolute;z-index:5;width:30px;height:30px;display:grid;place-items:center;border:1px solid rgba(229,189,98,.85);border-radius:50%;background:rgba(4,8,6,.92);color:var(--gold-light);box-shadow:0 4px 12px rgba(0,0,0,.38);font-size:14px;line-height:1;padding:0;cursor:pointer}.family-profile-cover-edit{right:12px;bottom:12px}.family-profile-avatar-edit{right:-3px;bottom:4px}.family-profile-edit[hidden]{display:none!important}.family-profile-upload-input{display:none!important}.family-profile-status{min-height:18px;margin:14px 0 0;color:rgba(244,241,232,.52);font-size:9px;letter-spacing:.08em;text-transform:uppercase}.family-profile-status.error{color:#e5a6a6}.family-profile-status.success{color:var(--gold-light)}.family-profile-content{padding:72px 16px 28px}.family-profile-name{margin:0;color:var(--white);font-family:Georgia,"Times New Roman",serif;font-size:30px;font-weight:400;letter-spacing:.04em;line-height:1.05;text-transform:uppercase}.family-profile-role{margin:9px 0 0;color:rgba(244,241,232,.46);font-size:8px;letter-spacing:.22em;text-transform:uppercase}.family-profile-bio-box{margin-top:28px;min-height:105px;padding:18px;border:1px solid rgba(229,189,98,.25);border-radius:12px;background:rgba(0,0,0,.25)}.family-profile-bio-title{margin:0 0 13px;color:var(--gold);font-size:8px;font-weight:500;letter-spacing:.20em;text-transform:uppercase}.family-profile-bio{min-height:52px;color:rgba(244,241,232,.68);font-size:13px;line-height:1.55;white-space:pre-wrap}.family-profile-placeholder{color:rgba(244,241,232,.20);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.family-profile-back{width:100%;margin-top:16px}
      @media(max-width:520px){.family-member{min-height:70px}.family-profile-cover{height:155px}.family-profile-avatar{left:18px;bottom:-48px;width:96px;height:96px}.family-profile-content{padding-top:62px}.family-profile-name{font-size:25px}.family-profile-edit{width:28px;height:28px;font-size:13px}}
    `;document.head.appendChild(s);
  }

  async function getDb(){
    if(db)return db;
    try{const m=await import('https://esm.sh/@supabase/supabase-js@2');db=m.createClient(SUPABASE_URL,SUPABASE_KEY);return db}catch(e){console.error('[HN Family] Supabase init',e);return null}
  }

  function clearMedia(){
    if(!profileScreen)return;
    const cover=profileScreen.querySelector('.family-profile-cover');const avatar=profileScreen.querySelector('.family-profile-avatar');
    if(cover)cover.style.backgroundImage='';if(avatar)avatar.style.backgroundImage='';
  }
  function applyRow(row){
    if(!profileScreen)return;
    const cover=profileScreen.querySelector('.family-profile-cover');const avatar=profileScreen.querySelector('.family-profile-avatar');
    if(cover)cover.style.backgroundImage=row?.cover_path?`url("${mediaUrl(row.cover_path)}")`:'';
    if(avatar)avatar.style.backgroundImage=row?.avatar_path?`url("${mediaUrl(row.avatar_path)}")`:'';
  }
  async function loadRow(key){
    const client=await getDb();if(!client)return null;
    try{const {data,error}=await client.from('family_profiles').select('id,member_key,name,role,bio,avatar_path,cover_path,active,sort_order,updated_at').eq('member_key',key).maybeSingle();if(error){console.error('[HN Family] profile read',error);return null}if(data)profileCache.set(key,data);return data}catch(e){console.error('[HN Family] profile read',e);return null}
  }

  function setStatus(text,type=''){const el=profileScreen?.querySelector('.family-profile-status');if(el){el.textContent=text||'';el.className=`family-profile-status${type?` ${type}`:''}`}}

  function optimize(file,maxW,maxH){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('No fue posible leer la imagen'));r.onload=()=>{const i=new Image();i.onerror=()=>reject(new Error('Imagen no válida'));i.onload=()=>{const scale=Math.min(1,maxW/i.width,maxH/i.height),c=document.createElement('canvas');c.width=Math.max(1,Math.round(i.width*scale));c.height=Math.max(1,Math.round(i.height*scale));const x=c.getContext('2d');if(!x)return reject(new Error('No fue posible procesar la imagen'));x.drawImage(i,0,0,c.width,c.height);c.toBlob(b=>b?resolve(new File([b],`family-${Date.now()}.webp`,{type:'image/webp'})):reject(new Error('No fue posible preparar la imagen')),'image/webp',.84)};i.src=r.result};r.readAsDataURL(file)})}

  async function upload(mediaType,file){
    const index=Number(profileScreen?.dataset.familyIndex||0),person=FAMILY[index];if(!person||ownKey()!==person.key)return;
    if(!file||!/^image\/(jpeg|png|webp)$/i.test(file.type)){setStatus('Solo JPG, PNG o WebP.','error');return}
    if(file.size>10*1024*1024){setStatus('La imagen debe pesar menos de 10 MB.','error');return}
    let localUrl='';try{
      setStatus('Preparando imagen…');const optimized=await optimize(file,mediaType==='avatar'?700:1800,mediaType==='avatar'?700:1000);localUrl=URL.createObjectURL(optimized);const target=profileScreen.querySelector(mediaType==='avatar'?'.family-profile-avatar':'.family-profile-cover');if(target)target.style.backgroundImage=`url("${localUrl}")`;
      const mod=await import(DEVICE_MODULE),token=mod.getDeviceToken(),user=username();if(!token||!user)throw new Error('Sesión de músico no disponible');
      const form=new FormData();form.append('username',user);form.append('device_token',token);form.append('member_key',person.key);form.append('media_type',mediaType);form.append('file',optimized,optimized.name);
      const response=await fetch(MEDIA_ENDPOINT,{method:'POST',body:form,cache:'no-store'});let result=null;try{result=await response.json()}catch(_){ }
      if(!response.ok||!result?.ok)throw new Error(result?.error||'No fue posible guardar la imagen');
      const row=result.profile||null;if(row)profileCache.set(person.key,row);applyRow(row);setStatus(mediaType==='avatar'?'Foto de perfil actualizada.':'Foto de portada actualizada.','success');setTimeout(()=>setStatus(''),2800)
    }catch(e){setStatus(e?.message||'No fue posible guardar la imagen.','error')}finally{if(localUrl)URL.revokeObjectURL(localUrl)}
  }

  function buildProfile(){
    if(profileScreen)return profileScreen;ensureStyles();profileScreen=document.createElement('section');profileScreen.id='familyProfileScreen';profileScreen.className='screen family-profile-screen';profileScreen.innerHTML=`
      <div class="family-profile-inner"><div class="family-profile-cover" aria-label="Foto de portada"><button class="family-profile-edit family-profile-cover-edit" type="button" data-edit-media="cover" aria-label="Cambiar foto de portada" hidden>✎</button><div class="family-profile-avatar" aria-label="Foto de perfil"><button class="family-profile-edit family-profile-avatar-edit" type="button" data-edit-media="avatar" aria-label="Cambiar foto de perfil" hidden>✎</button></div></div>
      <div class="family-profile-content"><h1 class="family-profile-name"></h1><p class="family-profile-role"></p><input class="family-profile-upload-input" data-media-type="avatar" type="file" accept="image/jpeg,image/png,image/webp"><input class="family-profile-upload-input" data-media-type="cover" type="file" accept="image/jpeg,image/png,image/webp"><p class="family-profile-status" aria-live="polite"></p><section class="family-profile-bio-box"><h2 class="family-profile-bio-title">BIOGRAFÍA</h2><div class="family-profile-bio"><span class="family-profile-placeholder">Espacio reservado para la biografía</span></div></section><button class="back-button family-profile-back" type="button">Volver</button></div></div>`;
    document.querySelector('.experience')?.appendChild(profileScreen);
    profileScreen.querySelector('.family-profile-back')?.addEventListener('click',()=>closeProfile(true));
    profileScreen.querySelectorAll('[data-edit-media]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();profileScreen.querySelector(`.family-profile-upload-input[data-media-type="${b.dataset.editMedia}"]`)?.click()}));
    profileScreen.querySelectorAll('.family-profile-upload-input').forEach(input=>input.addEventListener('change',async()=>{const f=input.files?.[0];if(f)await upload(input.dataset.mediaType,f);input.value=''}));
    return profileScreen;
  }

  async function openProfile(index,fromPop=false){
    buildProfile();const person=FAMILY[index]||FAMILY[0];profileScreen.dataset.familyIndex=String(index);profileScreen.querySelector('.family-profile-name').textContent=person.name;profileScreen.querySelector('.family-profile-role').textContent=person.role;profileScreen.querySelector('.family-profile-bio').innerHTML='<span class="family-profile-placeholder">Espacio reservado para la biografía</span>';profileScreen.querySelectorAll('[data-edit-media]').forEach(b=>b.hidden=ownKey()!==person.key);setStatus('');clearMedia();
    const cached=profileCache.get(person.key);if(cached)applyRow(cached);const row=await loadRow(person.key);if(profileScreen.dataset.familyIndex===String(index)){if(row)applyRow(row);else if(!cached)clearMedia();const bio=profileScreen.querySelector('.family-profile-bio');if(row?.bio)bio.textContent=row.bio;}
    document.querySelectorAll('.screen').forEach(x=>x.classList.remove('is-active'));profileScreen.classList.add('is-active');profileScreen.scrollTop=0;
    if(!fromPop&&!profileHistory){history.pushState({hnFamilyProfile:true,index},'',location.href);profileHistory=true}
  }
  function closeProfile(button=false){if(!profileScreen?.classList.contains('is-active'))return;profileScreen.classList.remove('is-active');familyScreen?.classList.add('is-active');if(button&&profileHistory){profileHistory=false;history.back()}else if(!button)profileHistory=false}

  function buildFamily(){
    if(familyScreen)return familyScreen;ensureStyles();familyScreen=document.createElement('section');familyScreen.id='familyScreen';familyScreen.className='screen family-screen';familyScreen.innerHTML=`<div class="screen-inner family-inner"><div class="family-header"><p class="brand metallic-gold">HAVANA NICE</p><div class="brand-line"></div><p class="family-caption">The Family</p></div><div class="family-list">${FAMILY.map((p,i)=>`<button class="family-member" type="button" data-family-index="${i}"><span class="family-number">0${i+1}</span><span class="family-copy"><span class="family-name">${p.name}</span><span class="family-role">${p.role}</span></span><span class="family-arrow">›</span></button>`).join('')}</div><div class="family-footer"><button id="familyBackButton" class="back-button" type="button">Volver</button></div></div>`;
    document.querySelector('.experience')?.appendChild(familyScreen);familyScreen.querySelector('#familyBackButton')?.addEventListener('click',()=>closeFamily(true));familyScreen.addEventListener('click',e=>{const b=e.target.closest('.family-member');if(!b)return;e.preventDefault();e.stopPropagation();openProfile(Number(b.dataset.familyIndex))},true);return familyScreen;
  }
  function openFamily(fromPop=false){buildFamily();if(!fromPop)previousScreen=[...document.querySelectorAll('.screen.is-active')].find(x=>x!==familyScreen)||home();document.querySelectorAll('.screen').forEach(x=>{if(x!==familyScreen)x.classList.remove('is-active')});familyScreen.classList.add('is-active');if(!fromPop&&!familyHistory){history.pushState({hnFamily:true},'',location.href);familyHistory=true}}
  function closeFamily(button=false){if(!familyScreen?.classList.contains('is-active'))return;familyScreen.classList.remove('is-active');document.querySelectorAll('.screen').forEach(x=>x.classList.remove('is-active'));(previousScreen||home())?.classList.add('is-active');if(button&&familyHistory){familyHistory=false;history.back()}else if(!button)familyHistory=false}

  function subscribe(){if(!db||realtimeChannel)return;realtimeChannel=db.channel('family-profiles-realtime').on('postgres_changes',{event:'*',schema:'public',table:'family_profiles'},payload=>{const row=payload.new;if(row?.member_key)profileCache.set(row.member_key,row);const current=FAMILY[Number(profileScreen?.dataset.familyIndex||-1)];if(current&&row?.member_key===current.key)applyRow(row)}).subscribe()}

  async function init(){
    const modules=document.querySelector('.modules');if(!modules)return;const module=[...modules.querySelectorAll('.module')].find(el=>/FAMILIA|MÚSICOS|MUSICOS/i.test(el.textContent||''));if(!module)return;module.dataset.module='FAMILIA';module.querySelector('.module-number')?.replaceChildren(document.createTextNode('04'));module.querySelector('.module-title')?.replaceChildren(document.createTextNode('FAMILIA HAVANA NICE'));module.querySelector('.module-subtitle')?.replaceChildren(document.createTextNode('THE FAMILY'));module.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openFamily(false)},true);window.addEventListener('popstate',()=>{if(profileScreen?.classList.contains('is-active'))closeProfile(false);else if(familyScreen?.classList.contains('is-active'))closeFamily(false)});db=await getDb();subscribe();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();