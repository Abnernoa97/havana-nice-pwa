/* HAVANA NICE — iOS INSTALL + LAYOUT V4 */
(function(){
  'use strict';
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!isIOS)return;

  function installIOSLayout(){
    if(document.getElementById('hn-ios-layout-style'))return;
    const style=document.createElement('style');
    style.id='hn-ios-layout-style';
    style.textContent=`
      html,body{height:100%;min-height:100%;}
      .screen{box-sizing:border-box!important;-webkit-box-sizing:border-box!important;max-width:100vw;max-height:100dvh;overflow:hidden;overscroll-behavior:none;}
      .screen.is-active{z-index:10!important;}
      .screen:not(.is-active){z-index:0!important;visibility:hidden!important;pointer-events:none!important;}
      #calendarScreen{box-sizing:border-box!important;-webkit-box-sizing:border-box!important;overflow:hidden!important;}
      #calendarScreen.is-active{z-index:20!important;}
      #moduleScreen:not(.is-active){z-index:0!important;}
      #moduleScreen.is-active{z-index:20!important;}
      #homeScreen.is-active{z-index:20!important;}
      #chatScreen.is-active,#hn-chat-screen.is-active{z-index:20!important;}

      /* iPhone home: keep HAVANA NICE / BIENVENIDO / NAME / ROLE visually separated. */
      #homeScreen .home-top{
        top:max(18px,env(safe-area-inset-top))!important;
        left:max(20px,env(safe-area-inset-left))!important;
        right:max(20px,env(safe-area-inset-right))!important;
        align-items:flex-start!important;
        z-index:40!important;
        pointer-events:auto!important;
      }
      #homeScreen .home-brand{
        font-size:18px!important;
        line-height:1!important;
        letter-spacing:.15em!important;
      }
      #homeScreen .home-inner{
        position:relative!important;
        z-index:1!important;
        width:min(100%,720px)!important;
        margin:0 auto!important;
        padding-top:58px!important;
      }
      #homeScreen .hn-home-profile-wrap,
      #homeScreen .hn-home-profile-button{
        position:relative!important;
        z-index:41!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }
      #homeScreen .welcome{
        margin:0 0 18px!important;
        text-align:center!important;
      }
      #homeScreen .welcome-small{
        margin:0 0 9px!important;
        font-size:9px!important;
        line-height:1.25!important;
        letter-spacing:.38em!important;
      }
      #homeScreen .welcome-name{
        margin:0!important;
        font-size:clamp(46px,13vw,74px)!important;
        line-height:.92!important;
        letter-spacing:-.035em!important;
      }
      #homeScreen .welcome-role{
        margin:10px 0 0!important;
        font-size:9px!important;
        line-height:1.45!important;
        letter-spacing:.20em!important;
      }
      #homeScreen .modules{gap:8px!important;}
      #homeScreen .module{
        min-height:68px!important;
        padding:11px 16px!important;
      }
      #homeScreen .module-subtitle{margin-top:4px!important;}

      @media(max-height:720px){
        #homeScreen .home-inner{padding-top:48px!important;}
        #homeScreen .welcome{margin-bottom:13px!important;}
        #homeScreen .welcome-small{margin-bottom:6px!important;}
        #homeScreen .welcome-name{font-size:clamp(42px,12vw,64px)!important;}
        #homeScreen .welcome-role{margin-top:7px!important;}
        #homeScreen .modules{gap:6px!important;}
        #homeScreen .module{min-height:60px!important;padding:9px 14px!important;}
        #homeScreen .module-subtitle{margin-top:3px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  const isStandalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  installIOSLayout();
  if(isStandalone)return;

  function addAppleIcon(){
    if(document.querySelector('link[rel="apple-touch-icon"]'))return;
    const link=document.createElement('link');
    link.rel='apple-touch-icon';
    link.href='./havana-nice-icon-192.png';
    document.head.appendChild(link);
    const title=document.createElement('meta');
    title.name='apple-mobile-web-app-title';
    title.content='HAVANA NICE';
    document.head.appendChild(title);
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
        <h2 id="hnIOSInstallTitle">INSTALAR EN IPHONE</h2>
        <p class="hn-ios-copy">En iPhone, Safari no muestra un botón automático de instalación. Hazlo desde Compartir:</p>
        <ol class="hn-ios-steps">
          <li><b>1.</b><span>Abre esta página en <strong>Safari</strong>.</span></li>
          <li><b>2.</b><span>Toca <strong>Compartir</strong> <span class="hn-ios-share">□↑</span>.</span></li>
          <li><b>3.</b><span>Elige <strong>Agregar a Inicio</strong>.</span></li>
          <li><b>4.</b><span>Activa <strong>Abrir como app web</strong> y toca <strong>Agregar</strong>.</span></li>
        </ol>
        <p class="hn-ios-note">Si estás en Chrome u otro navegador del iPhone, abre el mismo enlace en Safari para instalarla.</p>
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

  function installButton(){
    if(document.getElementById('hnIOSInstallButton'))return;
    const button=document.createElement('button');
    button.id='hnIOSInstallButton';
    button.type='button';
    button.textContent='INSTALAR EN IPHONE';
    button.setAttribute('aria-label','Ver instrucciones para instalar HAVANA NICE en iPhone');
    button.addEventListener('click',showGuide);
    const style=document.createElement('style');
    style.textContent=`#hnIOSInstallButton{display:block;width:min(100%,400px);height:46px;margin:12px auto 0;border:1px solid rgba(229,189,98,.45);background:rgba(0,0,0,.28);color:#fff1a8;font-size:9px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;cursor:pointer;}#hnIOSInstallButton:active{transform:scale(.985);}`;
    document.head.appendChild(style);
    const loginArea=document.querySelector('.login-area');
    if(loginArea){loginArea.appendChild(button);return;}
    const loginScreen=document.getElementById('loginScreen');
    if(loginScreen){const inner=loginScreen.querySelector('.screen-inner')||loginScreen;inner.appendChild(button);return;}
    document.body.appendChild(button);
  }

  function init(){addAppleIcon();installButton();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();