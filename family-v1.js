/* HAVANA NICE — FAMILIA HAVANA NICE / ORIGINAL EDITORIAL */
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

  const home = () => document.getElementById('homeScreen');

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
    window.addEventListener('popstate',() => {
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

    module.addEventListener('click',(event) => {
      event.preventDefault();
      event.stopPropagation();
      openFamily(false);
    },true);

    wireNativeBack();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',init,{once:true});
  } else {
    init();
  }
})();
