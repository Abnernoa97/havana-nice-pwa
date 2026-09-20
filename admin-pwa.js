/* HAVANA NICE — ADMIN INSTALLABLE PWA / UNIFIED SW */
(function(){
  'use strict';
  let deferredPrompt=null;
  function installButton(){
    if(document.getElementById('hnInstallAdmin'))return;
    const b=document.createElement('button');
    b.id='hnInstallAdmin';b.type='button';b.textContent='INSTALAR APP';
    b.style.cssText='display:none;width:100%;height:44px;margin:0 0 12px;border:1px solid #8c6424;background:#070806;color:#fff1a8;text-transform:uppercase;letter-spacing:.14em;font-size:9px;cursor:pointer';
    const target=document.querySelector('.wrap');
    if(target)target.insertBefore(b,target.children[1]||null);
    b.onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;b.style.display='none'};
  }
  function register(){
    if(!('serviceWorker'in navigator))return;
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>reg.update()).catch(e=>console.warn('HN Unified SW',e));
  }
  function loadRepertoireReferenceLinks(){
    if(document.getElementById('hnRepertoireReferenceAdmin'))return;
    const script=document.createElement('script');
    script.id='hnRepertoireReferenceAdmin';
    script.src='./repertoire-reference-admin-v1.js?v=20260920-1';
    document.body.appendChild(script);
  }
  function init(){
    const link=document.createElement('link');link.rel='manifest';link.href='./admin-manifest.json?v=2';document.head.appendChild(link);
    const meta=document.createElement('meta');meta.name='theme-color';meta.content='#020302';document.head.appendChild(meta);
    installButton();register();loadRepertoireReferenceLinks();
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;const b=document.getElementById('hnInstallAdmin');if(b)b.style.display='block'});
  window.addEventListener('appinstalled',()=>{const b=document.getElementById('hnInstallAdmin');if(b)b.style.display='none';deferredPrompt=null});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();