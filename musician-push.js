/* HAVANA NICE — MUSICIAN PUSH V2
   Android behavior preserved. iPhone/iPad installed PWA gets a first-run
   notification permission prompt after musician session is ready.
*/
(function(){
  'use strict';

  const VAPID_PUBLIC_KEY='BHkgUtLWxuO9fa1YAC6T9g0vh6mzggiPGk7zgZ-y6bbYSUy1uUWIXA7Oa8tZIcSopDMpbn7cdfGS6V_DS6cxdao';
  const PROMPT_ID='hnIOSPushPrompt';
  const STYLE_ID='hnIOSPushPromptStyle';
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;

  let busy=false;
  let last='';

  function profile(){
    try{return sessionStorage.getItem('hn_profile')||''}catch(_){return ''}
  }

  function vapidBytes(value){
    let s=value.replace(/-/g,'+').replace(/_/g,'/');
    while(s.length%4)s+='=';
    const b=atob(s),a=new Uint8Array(b.length);
    for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);
    return a;
  }

  async function registerPush(){
    const username=profile();
    if(!username||busy||!('serviceWorker'in navigator)||!('Notification'in window)||Notification.permission!=='granted')return;
    busy=true;
    try{
      const reg=await navigator.serviceWorker.ready;
      const manager=reg.pushManager;
      if(!manager)return;
      let sub=await manager.getSubscription();
      if(!sub){
        sub=await manager.subscribe({userVisibleOnly:true,applicationServerKey:vapidBytes(VAPID_PUBLIC_KEY)});
      }
      const json=sub.toJSON();
      const client=window.hnSupabase;
      if(client&&typeof client.rpc==='function'){
        await client.rpc('register_musician_push_subscription',{
          p_username:username,
          p_endpoint:json.endpoint,
          p_p256dh:json.keys&&json.keys.p256dh,
          p_auth:json.keys&&json.keys.auth
        });
      }
      last=username;
      closeIOSPrompt();
    }catch(error){
      console.warn('[HN-Push]',error);
    }finally{
      busy=false;
    }
  }

  function closeIOSPrompt(){
    document.getElementById(PROMPT_ID)?.remove();
  }

  function installIOSPromptStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #${PROMPT_ID}{position:fixed;inset:0;z-index:250000;display:flex;align-items:center;justify-content:center;padding:22px;}
      #${PROMPT_ID} .hn-push-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);}
      #${PROMPT_ID} .hn-push-card{position:relative;width:min(100%,410px);padding:27px 22px 22px;border:1px solid rgba(229,189,98,.78);background:#050605;color:#f4f1e8;box-shadow:0 18px 60px rgba(0,0,0,.58);text-align:center;}
      #${PROMPT_ID} .hn-push-icon{width:56px;height:56px;margin:0 auto 15px;border:1px solid rgba(229,189,98,.72);border-radius:50%;display:grid;place-items:center;color:#fff1a8;font:400 22px Georgia,serif;letter-spacing:.04em;background:rgba(229,189,98,.06);}
      #${PROMPT_ID} .hn-push-eyebrow{font-size:9px;letter-spacing:.26em;text-transform:uppercase;color:#e5bd62;}
      #${PROMPT_ID} h2{margin:9px 0 10px;color:#fff1a8;font:400 27px Georgia,serif;letter-spacing:.02em;}
      #${PROMPT_ID} p{margin:0 auto;color:rgba(244,241,232,.7);font-size:12px;line-height:1.55;max-width:310px;}
      #${PROMPT_ID} .hn-push-activate{width:100%;height:50px;margin-top:20px;border:1px solid #e5bd62;background:rgba(229,189,98,.08);color:#fff1a8;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;}
      #${PROMPT_ID} .hn-push-activate:active{transform:scale(.985);}
      #${PROMPT_ID} .hn-push-activate:disabled{opacity:.55;}
    `;
    document.head.appendChild(style);
  }

  function shouldShowIOSPrompt(){
    return isIOS&&isStandalone()&&profile()&&('Notification'in window)&&Notification.permission==='default';
  }

  function showIOSPrompt(){
    if(!shouldShowIOSPrompt()||document.getElementById(PROMPT_ID))return;
    installIOSPromptStyle();
    const wrap=document.createElement('div');
    wrap.id=PROMPT_ID;
    wrap.innerHTML=`
      <div class="hn-push-backdrop"></div>
      <section class="hn-push-card" role="dialog" aria-modal="true" aria-labelledby="hnPushTitle">
        <div class="hn-push-icon">HN</div>
        <div class="hn-push-eyebrow">HAVANA NICE</div>
        <h2 id="hnPushTitle">ACTIVAR NOTIFICACIONES</h2>
        <p>Recibe mensajes del Chat de Información y avisos importantes del equipo.</p>
        <button class="hn-push-activate" type="button">ACTIVAR</button>
      </section>`;
    document.body.appendChild(wrap);
    const button=wrap.querySelector('.hn-push-activate');
    button.addEventListener('click',async()=>{
      if(button.disabled)return;
      button.disabled=true;
      button.textContent='ACTIVANDO…';
      try{
        const permission=await Notification.requestPermission();
        if(permission==='granted'){
          await registerPush();
          closeIOSPrompt();
          return;
        }
        closeIOSPrompt();
      }catch(error){
        console.warn('[HN-Push] iOS permission',error);
        button.disabled=false;
        button.textContent='ACTIVAR';
      }
    });
  }

  function afterSessionReady(){
    if(Notification.permission==='granted')registerPush();
    else if(shouldShowIOSPrompt())setTimeout(showIOSPrompt,350);
  }

  function init(){
    if(!('serviceWorker'in navigator))return;
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(error=>console.warn('[HN-Push] sw',error)).finally(()=>{
      document.addEventListener('click',event=>{
        const button=event.target.closest&&event.target.closest('#loginButton,#login');
        if(!button)return;
        if(isIOS){
          setTimeout(afterSessionReady,400);
          return;
        }
        if('Notification'in window&&Notification.permission==='default'){
          Notification.requestPermission().then(registerPush).catch(()=>{});
        }else registerPush();
      },true);

      window.addEventListener('hn:session-ready',afterSessionReady);
      window.addEventListener('hn:session-logout',()=>{last='';closeIOSPrompt()});
      document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(Notification.permission==='granted')registerPush();else showIOSPrompt()}});
      window.addEventListener('online',()=>{if(Notification.permission==='granted')registerPush()});

      if(Notification.permission==='granted')registerPush();
      else showIOSPrompt();
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
