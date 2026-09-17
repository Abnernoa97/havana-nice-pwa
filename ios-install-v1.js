/* HAVANA NICE — iOS INSTALL GUIDE V2 */
(function(){
  'use strict';
  const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!isIOS)return;
  const isStandalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(isStandalone)return;

  function addIOSMeta(){
    if(!document.querySelector('link[rel="apple-touch-icon"]')){
      const link=document.createElement('link');
      link.rel='apple-touch-icon';
      link.href='./havana-nice-icon-192.png';
      document.head.appendChild(link);
    }
    if(!document.querySelector('meta[name="apple-mobile-web-app-title"]')){
      const title=document.createElement('meta');
      title.name='apple-mobile-web-app-title';
      title.content='HAVANA NICE';
      document.head.appendChild(title);
    }
    if(!document.querySelector('link[rel="manifest"]')){
      const manifest=document.createElement('link');
      manifest.rel='manifest';
      manifest.href='./manifest.json';
      document.head.appendChild(manifest);
    }
  }

  function showGuide(){
    if(document.getElementById('hnIOSInstallGuide'))return;
    const wrap=document.createElement('div');
    wrap.id='hnIOSInstallGuide';
    wrap.innerHTML=`
      <div class="hn-ios-backdrop" data-close="1"></div>
      <section class="hn-ios-card" role="dialog" aria-modal="true" aria-labelledby="hnIOSInstallTitle">
        <button class="hn-ios-close" type="button" aria-label="Cerrar">×</button>
        <div class="hn-ios-eyebrow">HAVANA NICE</div>
        <h2 id="hnIOSInstallTitle">INSTALAR COMO APP</h2>
        <p class="hn-ios-copy">En iPhone, la instalación se hace desde Safari y después HAVANA NICE se abrirá sin la barra del navegador.</p>
        <ol class="hn-ios-steps">
          <li><b>1.</b><span>Abre esta página en <strong>Safari</strong>.</span></li>
          <li><b>2.</b><span>Toca <strong>Compartir</strong> <span class="hn-ios-share">□↑</span>.</span></li>
          <li><b>3.</b><span>Elige <strong>Agregar a Inicio</strong>.</span></li>
          <li><b>4.</b><span>Activa <strong>Abrir como app web</strong> y toca <strong>Agregar</strong>.</span></li>
        </ol>
        <p class="hn-ios-note">Después de agregarla a Inicio, abre HAVANA NICE desde su nuevo icono. Esa es la versión que funciona como app.</p>
        <button class="hn-ios-done" type="button">ENTENDIDO</button>
      </section>`;
    const style=document.createElement('style');
    style.id='hn-ios-install-style';
    style.textContent=`
      #hnIOSInstallGuide{position:fixed;inset:0;z-index:200000;display:flex;align-items:center;justify-content:center;padding:22px;}
      .hn-ios-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);}
      .hn-ios-card{position:relative;width:min(100%,420px);padding:26px 22px 20px;border:1px solid rgba(229,189,98,.75);background:#050605;color:#f4f1e8;box-shadow:0 18px 60px rgba(0,0,0,.55);}
      .hn-ios-eyebrow{color:#e5bd62;font-size:9px;letter-spacing:.28em;text-transform:uppercase;}
      .hn-ios-card h2{margin:9px 35px 10px 0;color:#fff1a8;font:400 28px Georgia,serif;letter-spacing:.03em;}
      .hn-ios-copy,.hn-ios-note{color:rgba(244,241,232,.7);font-size:12px;line-height:1.5;}
      .hn-ios-steps{list-style:none;margin:18px 0;padding:0;display:grid;gap:12px;}
      .hn-ios-steps li{display:flex;gap:10px;align-items:flex-start;font-size:12px;line-height:1.45;}
      .hn-ios-steps b{color:#e5bd62;min-width:18px;}
      .hn-ios-share{color:#fff1a8;font-size:17px;vertical-align:-2px;}
      .hn-ios-note{font-size:10px;color:rgba(244,241,232,.48);}
      .hn-ios-close{position:absolute;top:9px;right:10px;width:38px;height:38px;border:0;background:transparent;color:#fff1a8;font-size:28px;line-height:1;}
      .hn-ios-done{width:100%;height:48px;margin-top:8px;border:1px solid #e5bd62;background:rgba(0,0,0,.25);color:#fff1a8;font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;}
    `;
    document.head.appendChild(style);document.body.appendChild(wrap);
    const close=()=>wrap.remove();
    wrap.querySelector('.hn-ios-close').addEventListener('click',close);
    wrap.querySelector('.hn-ios-done').addEventListener('click',close);
    wrap.querySelector('.hn-ios-backdrop').addEventListener('click',close);
  }

  function makeButton(id,label){
    if(document.getElementById(id))return null;
    const button=document.createElement('button');
    button.id=id;
    button.type='button';
    button.textContent=label;
    button.setAttribute('aria-label','Ver instrucciones para instalar HAVANA NICE como app en iPhone');
    button.addEventListener('click',showGuide);
    return button;
  }

  function installButtons(){
    if(document.getElementById('hnIOSInstallButton'))return;
    const style=document.createElement('style');
    style.id='hn-ios-install-button-style';
    style.textContent=`
      #hnIOSInstallButton{display:block;width:min(100%,400px);height:46px;margin:12px auto 0;border:1px solid rgba(229,189,98,.45);background:rgba(0,0,0,.28);color:#fff1a8;font-size:9px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;cursor:pointer;}
      #hnIOSInstallButton:active{transform:scale(.985);}
      #hnIOSHomeInstallButton{display:block;width:min(100%,400px);height:42px;margin:13px auto 0;border:1px solid rgba(229,189,98,.55);background:rgba(0,0,0,.24);color:#fff1a8;font-size:9px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;}
      #hnIOSHomeInstallButton:active{transform:scale(.985);}
    `;
    document.head.appendChild(style);

    const loginArea=document.querySelector('.login-area');
    const loginButton=makeButton('hnIOSInstallButton','INSTALAR COMO APP');
    if(loginArea&&loginButton)loginArea.appendChild(loginButton);

    const homeScreen=document.getElementById('homeScreen');
    const homeInner=homeScreen?.querySelector('.screen-inner');
    const homeButton=makeButton('hnIOSHomeInstallButton','INSTALAR HAVANA NICE COMO APP');
    if(homeInner&&homeButton)homeInner.appendChild(homeButton);
  }

  function init(){addIOSMeta();installButtons();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
