/* HAVANA NICE — FAMILIA / CHAT-STYLE NAVIGATION */
(() => {
  'use strict';

  const FAMILY = [
    { name: 'FER & NOA', role: 'HAVANA NICE' },
    { name: 'ORLYS SHOW', role: 'MÚSICO' },
    { name: 'JALI', role: 'MÚSICO' },
    { name: 'RAFA', role: 'MÚSICO' },
    { name: 'ANDY REY', role: 'MÚSICO' }
  ];

  let familyScreen = null;
  let historyArmed = false;
  let previousScreen = null;
  let videoWasMuted = true;

  function home() {
    return document.getElementById('homeScreen');
  }

  function buildFamily() {
    if (familyScreen) return familyScreen;

    const style = document.createElement('style');
    style.id = 'hn-family-styles';
    style.textContent = `
      .family-screen { padding-bottom:max(76px, env(safe-area-inset-bottom)); }
      .family-inner { width:min(100%, 650px); height:100%; margin:0 auto; display:flex; flex-direction:column; padding-top:5px; }
      .family-header { flex:0 0 auto; text-align:center; margin-bottom:18px; }
      .family-heading { margin:20px 0 0; font-family:Georgia,"Times New Roman",serif; font-size:clamp(40px,11vw,68px); font-weight:400; line-height:.9; letter-spacing:-.035em; text-transform:uppercase; }
      .family-caption { margin:12px 0 0; color:rgba(244,241,232,.56); font-size:8px; letter-spacing:.30em; text-transform:uppercase; }
      .family-list { flex:1; min-height:0; overflow-y:auto; padding:4px 3px 28px 0; scrollbar-width:thin; scrollbar-color:rgba(229,189,98,.55) transparent; }
      .family-list::-webkit-scrollbar { width:3px; }
      .family-list::-webkit-scrollbar-thumb { background:linear-gradient(180deg,#fff1a8,#8c6424); }
      .family-member { border:1px solid rgba(229,189,98,.40); background:linear-gradient(105deg,rgba(0,0,0,.54),rgba(28,20,8,.25),rgba(0,0,0,.42)); padding:16px; margin-bottom:9px; backdrop-filter:blur(7px); }
      .family-member-name { color:var(--white); font-family:Georgia,"Times New Roman",serif; font-size:24px; line-height:1.05; text-transform:uppercase; }
      .family-member-role { margin-top:8px; color:rgba(244,241,232,.70); font-size:9px; letter-spacing:.18em; text-transform:uppercase; }
      .family-back { flex:0 0 auto; width:100%; height:44px; margin-top:8px; border:1px solid rgba(229,189,98,.35); border-radius:0; background:rgba(0,0,0,.25); color:rgba(244,241,232,.72); font-size:9px; letter-spacing:.2em; text-transform:uppercase; }
    `;
    document.head.appendChild(style);

    familyScreen = document.createElement('section');
    familyScreen.className = 'screen family-screen';
    familyScreen.id = 'familyScreen';
    familyScreen.innerHTML = `
      <div class="family-inner">
        <div class="family-header">
          <p class="brand metallic-gold">HAVANA NICE</p>
          <div class="brand-line"></div>
          <h2 class="family-heading metallic-gold">Familia</h2>
          <p class="family-caption">Equipo · HAVANA NICE</p>
        </div>
        <div class="family-list">
          ${FAMILY.map(person => `<article class="family-member"><div class="family-member-name">${person.name}</div><div class="family-member-role">${person.role}</div></article>`).join('')}
        </div>
        <button id="familyBackButton" class="family-back" type="button">VOLVER</button>
      </div>
    `;

    document.querySelector('.experience')?.appendChild(familyScreen);

    familyScreen.querySelector('#familyBackButton').addEventListener('click', () => closeFamily(true));
    return familyScreen;
  }

  function openFamily(fromPopState = false) {
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
      history.pushState({ hnFamily: true }, '', location.href);
      historyArmed = true;
    }
  }

  function closeFamily(fromButton = false) {
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

  function init() {
    const modules = document.querySelector('.modules');
    if (!modules) return;

    let module = [...modules.querySelectorAll('.module')]
      .find(el => /FAMILIA/i.test(el.textContent || ''));

    if (!module) return;

    module.dataset.module = 'FAMILIA';
    const number = module.querySelector('.module-number');
    const title = module.querySelector('.module-title');
    const subtitle = module.querySelector('.module-subtitle');
    if (number) number.textContent = '04';
    if (title) title.textContent = 'FAMILIA HAVANA NICE';
    if (subtitle) subtitle.textContent = 'EQUIPO HAVANA NICE';

    module.addEventListener('click', () => openFamily(false));

    window.addEventListener('popstate', () => {
      if (familyScreen?.classList.contains('is-active')) closeFamily(false);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
