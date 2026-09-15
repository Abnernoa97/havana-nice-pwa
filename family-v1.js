/* HAVANA NICE — FAMILIA HAVANA NICE / ORIGINAL EDITORIAL */
(() => {
  'use strict';

  const FAMILY = [
    { name: 'FER & NOA', role: 'HAVANA NICE', key: 'fer-noa' },
    { name: 'ORLYS SHOW', role: 'MÚSICO', key: 'orly-show' },
    { name: 'JALI', role: 'MÚSICO', key: 'jali' },
    { name: 'RAFA', role: 'MÚSICO', key: 'rafa' },
    { name: 'ANDY REY', role: 'MÚSICO', key: 'andy-rey' }
  ];

  const PROFILE_MEDIA_ENDPOINT = 'https://xzfradccsxonmauinecl.supabase.co/functions/v1/family-profile-media-v1';
  const SUPABASE_URL = 'https://xzfradccsxonmauinecl.supabase.co';
  const DEVICE_MODULE = './musician-device-access-v1.js?v=43ddfa619ebbd4a631cc4b54afb127372bbaa938';

  let familyScreen = null;
  let profileScreen = null;
  let historyArmed = false;
  let profileHistoryArmed = false;
  let previousScreen = null;
  let videoWasMuted = true;
  let profileCache = new Map();

  const home = () => document.getElementById('homeScreen');

  function ensureProfileStyles() {
    if (document.getElementById('family-profile-inline-style')) return;
    const style = document.createElement('style');
    style.id = 'family-profile-inline-style';
    style.textContent = `
      .family-profile-screen { padding-bottom:max(76px,env(safe-area-inset-bottom)); overflow-y:auto; }
      .family-profile-inner { width:min(100%,650px); min-height:100%; margin:0 auto; }
      .family-profile-cover { position:relative; height:190px; border:1px solid rgba(229,189,98,.42); border-radius:12px 12px 0 0; background:linear-gradient(135deg,#102219,#18271d,#050806); overflow:visible; background-position:center; background-size:cover; }
      .family-profile-cover::after { content:''; position:absolute; inset:0; border-radius:12px 12px 0 0; background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.58)); pointer-events:none; }
      .family-profile-avatar { position:absolute; left:24px; bottom:-56px; z-index:3; width:112px; height:112px; border:2px solid var(--gold); border-radius:50%; background:rgba(5,10,7,.9); box-shadow:0 0 0 5px rgba(2,3,2,.65),0 10px 28px rgba(0,0,0,.42); background-position:center; background-size:cover; background-repeat:no-repeat; }
      .family-profile-edit { position:absolute; z-index:5; width:30px; height:30px; display:grid; place-items:center; border:1px solid rgba(229,189,98,.85); border-radius:50%; background:rgba(4,8,6,.92); color:var(--gold-light); box-shadow:0 4px 12px rgba(0,0,0,.38); font-size:14px; line-height:1; padding:0; cursor:pointer; }
      .family-profile-cover-edit { right:12px; bottom:12px; }
      .family-profile-avatar-edit { right:-3px; bottom:4px; }
      .family-profile-edit:active { transform:scale(.94); }
      .family-profile-edit[hidden] { display:none!important; }
      .family-profile-upload-input { display:none!important; }
      .family-profile-status { min-height:18px; margin:14px 0 0; color:rgba(244,241,232,.52); font-size:9px; letter-spacing:.08em; text-transform:uppercase; }
      .family-profile-status.error { color:#e5a6a6; }
      .family-profile-status.success { color:var(--gold-light); }
      .family-profile-content { padding:72px 16px 28px; }
      .family-profile-name { margin:0; color:var(--white); font-family:Georgia,"Times New Roman",serif; font-size:30px; font-weight:400; letter-spacing:.04em; line-height:1.05; text-transform:uppercase; }
      .family-profile-role { margin:9px 0 0; color:rgba(244,241,232,.46); font-size:8px; letter-spacing:.22em; text-transform:uppercase; }
      .family-profile-bio-box { margin-top:28px; min-height:105px; padding:18px; border:1px solid rgba(229,189,98,.25); border-radius:12px; background:rgba(0,0,0,.25); }
      .family-profile-bio-title { margin:0 0 13px; color:var(--gold); font-size:8px; font-weight:500; letter-spacing:.20em; text-transform:uppercase; }
      .family-profile-bio { min-height:52px; color:rgba(244,241,232,.68); font-size:13px; line-height:1.55; white-space:pre-wrap; }
      .family-profile-placeholder { color:rgba(244,241,232,.20); font-size:10px; letter-spacing:.12em; text-transform:uppercase; }
      .family-profile-back { width:100%; margin-top:16px; }
      @media(max-width:520px){
        .family-profile-cover{height:155px}
        .family-profile-avatar{left:18px;bottom:-48px;width:96px;height:96px}
        .family-profile-content{padding-top:62px}
        .family-profile-name{font-size:25px}
        .family-profile-edit{width:28px;height:28px;font-size:13px}
      }
    `;
    document.head.appendChild(style);
  }

  function getSessionProfile() {
    try {
      const raw = sessionStorage.getItem('hn_profile');
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function currentUsername() {
    return String(getSessionProfile()?.username || '').trim().toLowerCase();
  }

  function memberKeyForUsername(username) {
    const key = String(username || '').trim().toLowerCase();
    return ({ fer:'fer-noa', orly:'orly-show', jali:'jali', rafa:'rafa', andy:'andy-rey' })[key] || null;
  }

  function isOwnProfile(memberKey) {
    return memberKeyForUsername(currentUsername()) === memberKey;
  }

  function publicMediaUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/family-media/${path.split('/').map(encodeURIComponent).join('/')}`;
  }

  function applyProfileMedia(row) {
    if (!profileScreen || !row) return;
    const cover = profileScreen.querySelector('.family-profile-cover');
    const avatar = profileScreen.querySelector('.family-profile-avatar');
    if (cover) cover.style.backgroundImage = row.cover_path ? `url("${publicMediaUrl(row.cover_path)}")` : '';
    if (avatar) avatar.style.backgroundImage = row.avatar_path ? `url("${publicMediaUrl(row.avatar_path)}")` : '';
  }

  async function loadProfileRow(memberKey) {
    const sb = window.hnSupabase;
    if (!sb) return null;
    try {
      const { data, error } = await sb.from('family_profiles')
        .select('id,member_key,name,role,bio,avatar_path,cover_path,active,sort_order,updated_at')
        .eq('member_key', memberKey)
        .maybeSingle();
      if (error || !data) return null;
      profileCache.set(memberKey, data);
      return data;
    } catch (_) { return null; }
  }

  function setStatus(text, type='') {
    const el = profileScreen?.querySelector('.family-profile-status');
    if (!el) return;
    el.textContent = text || '';
    el.className = `family-profile-status${type ? ` ${type}` : ''}`;
  }

  function createImagePreview(file, maxWidth, maxHeight, quality=.84) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No fue posible leer la imagen'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Imagen no válida'));
        img.onload = () => {
          const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('No fue posible procesar la imagen'));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => {
            if (!blob) return reject(new Error('No fue posible preparar la imagen'));
            resolve(new File([blob], `family-${Date.now()}.webp`, { type:'image/webp' }));
          }, 'image/webp', quality);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadProfileImage(mediaType, file) {
    const personIndex = Number(profileScreen?.dataset.familyIndex || 0);
    const person = FAMILY[personIndex] || FAMILY[0];
    if (!isOwnProfile(person.key)) return;

    if (!file || !/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setStatus('Solo JPG, PNG o WebP.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus('La imagen debe pesar menos de 10 MB.', 'error');
      return;
    }

    const cover = profileScreen.querySelector('.family-profile-cover');
    const avatar = profileScreen.querySelector('.family-profile-avatar');
    const target = mediaType === 'avatar' ? avatar : cover;
    let optimized;
    try {
      setStatus('Preparando imagen…');
      optimized = await createImagePreview(file, mediaType === 'avatar' ? 700 : 1800, mediaType === 'avatar' ? 700 : 1000);
      const localUrl = URL.createObjectURL(optimized);
      if (mediaType === 'avatar' && target) target.style.backgroundImage = `url("${localUrl}")`;
      if (mediaType === 'cover' && target) target.style.backgroundImage = `url("${localUrl}")`;

      const mod = await import(DEVICE_MODULE);
      const token = mod.getDeviceToken();
      const username = currentUsername();
      if (!username || !token) throw new Error('Sesión de músico no disponible');

      const form = new FormData();
      form.append('username', username);
      form.append('device_token', token);
      form.append('member_key', person.key);
      form.append('media_type', mediaType);
      form.append('file', optimized, optimized.name);

      const response = await fetch(PROFILE_MEDIA_ENDPOINT, { method:'POST', body:form, cache:'no-store' });
      let result = null;
      try { result = await response.json(); } catch (_) {}
      if (!response.ok || !result?.ok) throw new Error(result?.error || 'No fue posible guardar la imagen');

      profileCache.set(person.key, result.profile || result);
      applyProfileMedia(result.profile || result);
      setStatus(mediaType === 'avatar' ? 'Foto de perfil actualizada.' : 'Foto de portada actualizada.', 'success');
      setTimeout(() => setStatus(''), 2800);
      URL.revokeObjectURL(localUrl);
    } catch (error) {
      setStatus(error?.message || 'No fue posible guardar la imagen.', 'error');
    }
  }

  function openFilePicker(mediaType) {
    const input = profileScreen?.querySelector(`.family-profile-upload-input[data-media-type="${mediaType}"]`);
    input?.click();
  }

  function buildProfile() {
    if (profileScreen) return profileScreen;
    ensureProfileStyles();

    profileScreen = document.createElement('section');
    profileScreen.id = 'familyProfileScreen';
    profileScreen.className = 'screen family-profile-screen';
    profileScreen.innerHTML = `
      <div class="family-profile-inner">
        <div class="family-profile-cover" aria-label="Foto de portada">
          <button class="family-profile-edit family-profile-cover-edit" type="button" aria-label="Cambiar foto de portada" title="Cambiar foto de portada" data-edit-media="cover" hidden>✎</button>
          <div class="family-profile-avatar" aria-label="Foto de perfil">
            <button class="family-profile-edit family-profile-avatar-edit" type="button" aria-label="Cambiar foto de perfil" title="Cambiar foto de perfil" data-edit-media="avatar" hidden>✎</button>
          </div>
        </div>
        <div class="family-profile-content">
          <h1 class="family-profile-name"></h1>
          <p class="family-profile-role"></p>
          <input class="family-profile-upload-input" data-media-type="avatar" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Seleccionar foto de perfil">
          <input class="family-profile-upload-input" data-media-type="cover" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Seleccionar foto de portada">
          <p class="family-profile-status" aria-live="polite"></p>
          <section class="family-profile-bio-box">
            <h2 class="family-profile-bio-title">BIOGRAFÍA</h2>
            <div class="family-profile-bio"><span class="family-profile-placeholder">Espacio reservado para la biografía</span></div>
          </section>
          <button class="back-button family-profile-back" type="button">Volver</button>
        </div>
      </div>
    `;

    document.querySelector('.experience')?.appendChild(profileScreen);
    profileScreen.querySelector('.family-profile-back')?.addEventListener('click', () => closeProfile(true));

    profileScreen.querySelectorAll('[data-edit-media]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openFilePicker(button.dataset.editMedia);
      });
    });

    profileScreen.querySelectorAll('.family-profile-upload-input').forEach(input => {
      input.addEventListener('change', async event => {
        const file = event.target.files?.[0];
        if (file) await uploadProfileImage(input.dataset.mediaType, file);
        input.value = '';
      });
    });

    return profileScreen;
  }

  async function openProfile(index, fromPopState = false) {
    buildProfile();
    const person = FAMILY[index] || FAMILY[0];
    profileScreen.dataset.familyIndex = String(index);
    profileScreen.querySelector('.family-profile-name').textContent = person.name;
    profileScreen.querySelector('.family-profile-role').textContent = person.role;
    profileScreen.querySelector('.family-profile-bio').innerHTML = '<span class="family-profile-placeholder">Espacio reservado para la biografía</span>';
    profileScreen.querySelectorAll('[data-edit-media]').forEach(button => { button.hidden = !isOwnProfile(person.key); });
    setStatus('');

    const cached = profileCache.get(person.key);
    applyProfileMedia(cached || null);
    if (!cached) {
      const row = await loadProfileRow(person.key);
      if (row && profileScreen.dataset.familyIndex === String(index)) {
        applyProfileMedia(row);
        profileScreen.querySelector('.family-profile-bio').textContent = row.bio || '';
        if (!row.bio) profileScreen.querySelector('.family-profile-bio').innerHTML = '<span class="family-profile-placeholder">Espacio reservado para la biografía</span>';
      }
    } else if (cached.bio) {
      profileScreen.querySelector('.family-profile-bio').textContent = cached.bio;
    }

    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('is-active'));
    profileScreen.classList.add('is-active');
    profileScreen.scrollTop = 0;

    if (!fromPopState && !profileHistoryArmed) {
      history.pushState({ hnFamilyProfile:true, index }, '', location.href);
      profileHistoryArmed = true;
    }
  }

  function closeProfile(fromButton = false) {
    if (!profileScreen?.classList.contains('is-active')) return;
    profileScreen.classList.remove('is-active');
    familyScreen?.classList.add('is-active');
    if (fromButton && profileHistoryArmed) {
      profileHistoryArmed = false;
      history.back();
    } else if (!fromButton) {
      profileHistoryArmed = false;
    }
  }

  function buildFamily() {
    if (familyScreen) return familyScreen;

    if (!document.getElementById('family-v1-style')) {
      const style = document.createElement('style');
      style.id = 'family-v1-style';
      style.textContent = `
        .family-screen { padding-bottom:max(76px,env(safe-area-inset-bottom)); }
        .family-inner { width:min(100%,650px); height:100%; margin:0 auto; display:flex; flex-direction:column; padding-top:5px; }
        .family-header { flex:0 0 auto; text-align:center; margin-bottom:22px; }
        .family-caption { margin:20px 0 0; color:rgba(244,241,232,.56); font-size:8px; letter-spacing:.30em; text-transform:uppercase; }
        .family-list { flex:1; min-height:0; overflow-y:auto; padding:4px 3px 28px 0; scrollbar-width:thin; scrollbar-color:rgba(229,189,98,.55) transparent; }
        .family-list::-webkit-scrollbar { width:3px; }
        .family-list::-webkit-scrollbar-track { background:transparent; }
        .family-list::-webkit-scrollbar-thumb { background:linear-gradient(180deg,#fff1a8,#8c6424); }
        .family-member { position:relative; width:100%; min-height:78px; display:flex; align-items:center; gap:17px; padding:14px 18px; margin-bottom:9px; border:1px solid rgba(229,189,98,.50); border-radius:0; background:linear-gradient(105deg,rgba(0,0,0,.58),rgba(20,14,5,.28),rgba(0,0,0,.46)); color:var(--white); text-align:left; backdrop-filter:blur(8px); transition:background .3s ease,border-color .3s ease,transform .2s ease; }
        .family-member:hover { border-color:var(--gold-light); background:linear-gradient(105deg,rgba(111,75,20,.25),rgba(0,0,0,.38),rgba(111,75,20,.20)); }
        .family-member:active { transform:scale(.985); }
        .family-number { width:27px; flex:0 0 27px; color:var(--gold); font-family:Georgia,"Times New Roman",serif; font-size:13px; letter-spacing:.08em; }
        .family-copy { flex:1; min-width:0; }
        .family-name { display:block; color:var(--white); font-family:Georgia,"Times New Roman",serif; font-size:20px; font-weight:400; letter-spacing:.05em; line-height:1.1; text-transform:uppercase; }
        .family-role { display:block; margin-top:7px; color:rgba(244,241,232,.43); font-size:8px; letter-spacing:.22em; text-transform:uppercase; }
        .family-arrow { color:var(--gold-light); font-size:23px; font-weight:300; line-height:1; }
        .family-footer { flex:0 0 auto; padding-top:7px; }
        .family-footer .back-button { width:100%; }
        @media (max-height:700px) { .family-member{min-height:65px;} .family-role{display:none;} .family-header{margin-bottom:12px;} }
      `;
      document.head.appendChild(style);
    }

    familyScreen = document.createElement('section');
    familyScreen.id = 'familyScreen';
    familyScreen.className = 'screen family-screen';
    familyScreen.innerHTML = `
      <div class="screen-inner family-inner">
        <div class="family-header">
          <p class="brand metallic-gold">HAVANA NICE</p>
          <div class="brand-line"></div>
          <p class="family-caption">The Family</p>
        </div>
        <div class="family-list">
          ${FAMILY.map((person,index) => `
            <button class="family-member" type="button" data-family-index="${index}">
              <span class="family-number">0${index+1}</span>
              <span class="family-copy">
                <span class="family-name">${person.name}</span>
                <span class="family-role">${person.role}</span>
              </span>
              <span class="family-arrow">›</span>
            </button>
          `).join('')}
        </div>
        <div class="family-footer">
          <button id="familyBackButton" class="back-button" type="button">Volver</button>
        </div>
      </div>
    `;

    document.querySelector('.experience')?.appendChild(familyScreen);
    familyScreen.querySelector('#familyBackButton')?.addEventListener('click',() => closeFamily(true));
    familyScreen.addEventListener('click', event => {
      const button = event.target.closest('.family-member');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      const index = Number(button.dataset.familyIndex);
      if (Number.isInteger(index)) openProfile(index, false);
    }, true);

    return familyScreen;
  }

  function openFamily(fromPopState=false) {
    buildFamily();
    if (!fromPopState) {
      previousScreen = [...document.querySelectorAll('.screen.is-active')]
        .find(screen => screen !== familyScreen) || home();
    }
    document.querySelectorAll('.screen').forEach(screen => {
      if (screen !== familyScreen) screen.classList.remove('is-active');
    });
    familyScreen.classList.add('is-active');

    const video = document.getElementById('backgroundVideo');
    if (video) {
      videoWasMuted = video.muted;
      video.muted = true;
      video.play?.().catch(() => {});
    }

    if (!fromPopState && !historyArmed) {
      history.pushState({ hnFamily:true },'',location.href);
      historyArmed = true;
    }
  }

  function closeFamily(fromButton=false) {
    if (!familyScreen?.classList.contains('is-active')) return;
    familyScreen.classList.remove('is-active');
    const target = previousScreen || home();
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('is-active'));
    target?.classList.add('is-active');

    const video = document.getElementById('backgroundVideo');
    if (video) video.muted = videoWasMuted;

    if (fromButton && historyArmed) {
      historyArmed = false;
      history.back();
    } else if (!fromButton) {
      historyArmed = false;
    }
  }

  function wireNativeBack() {
    window.addEventListener('popstate', () => {
      if (profileScreen?.classList.contains('is-active')) {
        closeProfile(false);
        return;
      }
      if (familyScreen?.classList.contains('is-active')) closeFamily(false);
    });
  }

  function init() {
    const modules = document.querySelector('.modules');
    if (!modules) return;
    const module = [...modules.querySelectorAll('.module')]
      .find(el => /FAMILIA|MÚSICOS|MUSICOS/i.test(el.textContent || ''));
    if (!module) return;

    module.dataset.module = 'FAMILIA';
    module.querySelector('.module-number')?.replaceChildren(document.createTextNode('04'));
    module.querySelector('.module-title')?.replaceChildren(document.createTextNode('FAMILIA HAVANA NICE'));
    module.querySelector('.module-subtitle')?.replaceChildren(document.createTextNode('THE FAMILY'));

    module.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openFamily(false);
    }, true);

    wireNativeBack();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();