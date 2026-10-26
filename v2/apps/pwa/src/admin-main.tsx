import React from 'react';
import {createRoot} from 'react-dom/client';
import AdminApp from './AdminApp';
import './admin.css';

// One administrator PWA from the same HAVANA NICE V2 source and deployment.
// Admin navigation and private API responses MUST remain network-only.
createRoot(document.getElementById('admin-root')!).render(
  <React.StrictMode><AdminApp/></React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'})
    .then(registration=>registration.update()).catch(()=>{});
}

// The current administrator shell contains no editable privileged forms.
// When adding edit forms later, preserve drafts before any automatic reload.
// A fresh installed PWA loads the newest bundle on every foreground visit.
let checking=false;
async function checkAdminUpdate() {
  if (checking || document.hidden) return;
  const current=document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.getAttribute('src');
  if (!current?.startsWith('/assets/')) return;
  checking=true;
  try {
    const response=await fetch('/admin.html',{cache:'no-store'});
    if (!response.ok) return;
    const latest=new DOMParser().parseFromString(await response.text(),'text/html')
      .querySelector<HTMLScriptElement>('script[type="module"][src]')?.getAttribute('src');
    if(latest?.startsWith('/assets/') && latest!==current) window.location.reload();
  } catch { /* Offline: retain active state and try again on reconnection. */ }
  finally { checking=false; }
}
window.addEventListener('pageshow',()=>void checkAdminUpdate());
window.addEventListener('online',()=>void checkAdminUpdate());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void checkAdminUpdate();});
window.setInterval(()=>void checkAdminUpdate(),60_000);
