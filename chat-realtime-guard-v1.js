/* HAVANA NICE — CHAT REALTIME HISTORY GUARD V2 */
(()=>{
'use strict';
let timer=null;
const reconcile=()=>{try{if(typeof window.hnChatReconcile==='function')window.hnChatReconcile()}catch(_){}};
function schedule(delay){clearTimeout(timer);timer=setTimeout(reconcile,delay)}
function boot(){if(typeof window.hnChatReconcile!=='function'){setTimeout(boot,500);return}schedule(1200);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(150)});window.addEventListener('focus',()=>schedule(150));window.addEventListener('pageshow',()=>schedule(150));setInterval(()=>{if(!document.hidden)reconcile()},60000)}
boot();
})();