/* HAVANA NICE — iOS INSTALL GUIDE V3 */
(function(){
  'use strict';
  const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!isIOS)return;
  const isStandalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(isStandalone)return;

  function addIOSMeta(){
    if(!document.querySelector('link[rel="apple-touch-icon"]')){const link=document.createElement('link');link.rel='apple-touch-icon';link.href='./havana-nice-icon-192.png';document.head.appendChild(link)}
    if(!document.querySelector('meta[name="apple-mobile-web-app-title"]')){const title=document.createElement('meta');title.name='apple-mobile-web-app-title';title.content='HAVANA NICE';document.head.appendChild(title)}
    if(!document.querySelector('link[rel="manifest"]')){const manifest=document.createElement('link');manifest.rel='manifest';manifest.href='./manifest.json';document.head.appendChild(manifest)}
  }

  function showGuide(){
    if(document.getElementById('hnIOSInstallGuide'))return;
    const wrap=document.createElement('div');wrap.id='hnIOSInstallGuide';
    wrap.innerHTML=`<div class="hn-ios-backdrop"></div><section class="hn-ios-card" role="dialog" aria-modal="true" aria-labelledby="hnIOSInstallTitle"><button class="hn-ios-close" type="button" aria-label="Cerrar">×</button><div class="hn-ios-eyebrow">HAVANA NICE</div><h2 id="hnIOSInstallTitle">INSTALAR COMO APP</h2><p class="hn-ios-copy">Toca el botón y abre el menú de Compartir. Ahí selecciona <strong>Agregar a Inicio</strong>.</p><button class="hn-ios-share-button" type="button">ABRIR COMPARTIR</button><p class="hn-ios-note">Si no aparece el menú, usa el botón Compartir de Safari y selecciona Agregar a Inicio. Después abre HAVANA NICE desde su nuevo icono.</p></section>`;
    const style=document.createElement('style');style.id='hn-ios-install-style';style.textContent=`#hnIOSInstallGuide{position:fixed;inset:0;z-index:200000;display:flex;align-items:center;justify-content:center;padding:22px}.hn-ios-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}.hn-ios-card{position:relative;width:min(100%,420px);padding:26px 22px 20px;border:1px solid rgba(229,189,98,.75);background:#050605;color:#f4f1e8;box-shadow:0 18px 60px rgba(0,0,0,.55)}.hn-ios-eyebrow{color:#e5bd62;font-size:9px;letter-spacing:.28em;text-transform:uppercase}.hn-ios-card h2{margin:9px 35px 10px 0;color:#fff1a8;font:400 28px Georgia,serif;letter-spacing:.03em}.hn-ios-copy,.hn-ios-note{color:rgba(244,241,232,.72);font-size:12px;line-height:1.5}.hn-ios-note{font-size:10px;color:rgba(244,241,232,.48);margin-top:14px}.hn-ios-close{position:absolute;top:9px;right:10px;width:38px;height:38px;border:0;background:transparent;color:#fff1a8;font-size:28px;line-height:1}.hn-ios-share-button{width:100%;height:50px;margin-top:10px;border:1px solid #e5bd62;background:rgba(0,0,0,.25);color:#fff1a8;font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase}`;document.head.appendChild(style);document.body.appendChild(wrap);
    const close=()=>wrap.remove();wrap.querySelector('.hn-ios-close').addEventListener('click',close);wrap.querySelector('.hn-ios-backdrop').addEventListener('click',close);
    wrap.querySelector('.hn-ios-share-button').addEventListener('click',async()=>{try{if(navigator.share){await navigator.share({title:'HAVANA NICE',text:'Instalar HAVANA NICE como app',url:location.href});return}}catch(e){if(e?.name==='AbortError')return}close();});
  }

  function installButtons(){
    if(document.getElementById('hnIOSInstallButton'))return;
    const style=document.createElement('style');style.id='hn-ios-install-button-style';style.textContent=`#hnIOSInstallButton,#hnIOSHomeInstallButton{display:block;width:min(100%,400px);height:46px;margin:12px auto 0;border:1px solid rgba(229,189,98,.55);background:rgba(0,0,0,.28);color:#fff1a8;font-size:9px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;cursor:pointer}#hnIOSInstallButton:active,#hnIOSHomeInstallButton:active{transform:scale(.985)}`;document.head.appendChild(style);
    const make=(id,label)=>{const b=document.createElement('button');b.id=id;b.type='button';b.textContent=label;b.setAttribute('aria-label','Instalar HAVANA NICE como app en iPhone');b.addEventListener('click',showGuide);return b};
    const loginArea=document.querySelector('.login-area');const lb=make('hnIOSInstallButton','INSTALAR COMO APP');if(loginArea)loginArea.appendChild(lb);
    const homeInner=document.getElementById('homeScreen')?.querySelector('.screen-inner');const hb=make('hnIOSHomeInstallButton','INSTALAR HAVANA NICE COMO APP');if(homeInner)homeInner.appendChild(hb);
  }
  function init(){addIOSMeta();installButtons()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
