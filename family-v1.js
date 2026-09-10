(() => {
  'use strict';

  const FAMILY = [
    { name: 'FER & NOA', role: 'HAVANA NICE' },
    { name: 'ORLY CHO', role: 'MÚSICO' },
    { name: 'JALI', role: 'MÚSICO' },
    { name: 'RAFA', role: 'MÚSICO' },
    { name: 'ANDY REY', role: 'MÚSICO' }
  ];

  function ready() {
    const homeScreen = document.getElementById('homeScreen');
    const homeModules = document.querySelector('.modules');
    if (!homeScreen || !homeModules) return;

    const module = Array.from(homeModules.querySelectorAll('.module')).find((el) => {
      const number = el.querySelector('.module-number')?.textContent?.trim();
      const title = el.querySelector('.module-title')?.textContent?.trim().toUpperCase();
      return number === '04' || title === 'MÚSICOS' || title === 'MUSICOS';
    });
    if (!module) return;

    module.dataset.module = 'FAMILIA';
    const title = module.querySelector('.module-title');
    const subtitle = module.querySelector('.module-subtitle');
    if (title) title.textContent = 'Familia';
    if (subtitle) subtitle.textContent = 'Familia de HAVANA NICE';

    const screen = document.createElement('section');
    screen.id = 'familyScreen';
    screen.className = 'screen family-screen';
    screen.innerHTML = `
      <div class="screen-inner family-inner">
        <div class="family-header">
          <p class="brand metallic-gold">HAVANA NICE</p>
          <div class="brand-line"></div>
          <h2 class="family-heading metallic-gold">Familia de HAVANA NICE</h2>
          <p class="family-caption">The Family</p>
        </div>
        <div class="family-list">
          ${FAMILY.map((person, index) => `
            <button class="family-member" type="button" data-family-index="${index}">
              <span class="family-number">0${index + 1}</span>
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

    document.getElementById('experience')?.appendChild(screen);

    const style = document.createElement('style');
    style.id = 'family-v1-style';
    style.textContent = `
      .family-screen { padding-bottom: max(76px, env(safe-area-inset-bottom)); }
      .family-inner { width: min(100%, 650px); height: 100%; margin: 0 auto; display: flex; flex-direction: column; padding-top: 5px; }
      .family-header { flex: 0 0 auto; text-align: center; margin-bottom: 22px; }
      .family-heading { margin: 20px 0 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(31px, 8.8vw, 58px); font-weight: 400; line-height: .92; letter-spacing: -.035em; text-transform: uppercase; }
      .family-caption { margin: 12px 0 0; color: rgba(244,241,232,.56); font-size: 8px; letter-spacing: .30em; text-transform: uppercase; }
      .family-list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 3px 28px 0; scrollbar-width: thin; scrollbar-color: rgba(229,189,98,.55) transparent; }
      .family-list::-webkit-scrollbar { width: 3px; }
      .family-list::-webkit-scrollbar-track { background: transparent; }
      .family-list::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #fff1a8, #8c6424); }
      .family-member { position: relative; width: 100%; min-height: 78px; display: flex; align-items: center; gap: 17px; padding: 14px 18px; margin-bottom: 9px; border: 1px solid rgba(229,189,98,.50); border-radius: 0; background: linear-gradient(105deg, rgba(0,0,0,.58), rgba(20,14,5,.28), rgba(0,0,0,.46)); color: var(--white); text-align: left; backdrop-filter: blur(8px); transition: background .3s ease, border-color .3s ease, transform .2s ease; }
      .family-member:hover { border-color: var(--gold-light); background: linear-gradient(105deg, rgba(111,75,20,.25), rgba(0,0,0,.38), rgba(111,75,20,.20)); }
      .family-member:active { transform: scale(.985); }
      .family-number { width: 27px; flex: 0 0 27px; color: var(--gold); font-family: Georgia, "Times New Roman", serif; font-size: 13px; letter-spacing: .08em; }
      .family-copy { flex: 1; min-width: 0; }
      .family-name { display: block; color: var(--white); font-family: Georgia, "Times New Roman", serif; font-size: 20px; font-weight: 400; letter-spacing: .05em; line-height: 1.1; text-transform: uppercase; }
      .family-role { display: block; margin-top: 7px; color: rgba(244,241,232,.43); font-size: 8px; letter-spacing: .22em; text-transform: uppercase; }
      .family-arrow { color: var(--gold-light); font-size: 23px; font-weight: 300; line-height: 1; }
      .family-footer { flex: 0 0 auto; padding-top: 7px; }
      @media (max-height: 700px) { .family-member { min-height: 65px; } .family-role { display: none; } .family-header { margin-bottom: 12px; } }
    `;
    document.head.appendChild(style);

    const showFamily = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelectorAll('.screen').forEach((el) => el.classList.remove('is-active'));
      screen.classList.add('is-active');
    };

    module.addEventListener('click', showFamily, true);

    screen.querySelector('#familyBackButton')?.addEventListener('click', () => {
      screen.classList.remove('is-active');
      homeScreen.classList.add('is-active');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  } else {
    ready();
  }
})();
