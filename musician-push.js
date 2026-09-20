/* HAVANA NICE — MUSICIAN PUSH V4
   Android behavior preserved. On iPhone/iPad, notification activation is
   shown only when Web Push capability is actually available. Older iOS
   versions keep full app access without a blocking unsupported prompt.
*/
(function(){
  'use strict';

  const VAPID_PUBLIC_KEY='BHkgUtLWxuO9fa1YAC6T9g0vh6mzggiPGk7zgZ-y6bbYSUy1uUWIXA7Oa8tZIcSopDMpbn7cdfGS6V_DS6cxdao';
  const PROMPT_ID='hnIOSPushPrompt';
  const STYLE_ID='hnIOSPushPromptStyle';
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const hasWebPush=()=>('serviceWorker'in navigator)&&('Notification'in window)&&('PushManager'in window);

  let busy=false;

  function username(){
    try{
      const raw=sessionStorage.getItem('hn_profile')||'';
      if(!raw)return'';
      try{return String(JSON.parse(raw)?.username||'').trim()}catch(_){return String(raw).trim()}
    }catch(_){return''}
  }

  function vapidBytes(value){
    let s=value.replace(/-/g,'+').replace(/_/g,'/');
    while(s.length%4)s+='=';
    const b=atob(s),a=new Uint8Array(b.length);
    for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);
    return a;
  }

  async function registerPush(){
    const user=username();
    if(!user||busy||!hasWebPush()||Notification.permission!=='granted')return false;
    busy=true;
    try{
      const reg=await navigator.serviceWorker.ready;
      if(!reg.pushManager)throw new Error('PushManager no disponible');
      let sub=await reg.pushManager.getSubscription();
      if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:vapidBytes(VAPID_PUBLIC_KEY)});
      const json=sub.toJSON();
      const client=window.hnSupabase;
      if(!client||typeof client.rpc!=='function')throw new Error('Supabase no disponible');
      const {data,error}=await client.rpc('register_musician_push_subscription',{
        p_username:user,
        p_endpoint:json.endpoint,
        p_p256dh:json.keys&&json.keys.p256dh,
        p_auth:json.keys&&json.keys.auth
      });
      if(error)throw error;
      if(data&&data.ok===false)throw new Error(data.error||'No se pudo registrar Push');
      closeIOSPrompt();
      return true;
    }catch(error){
      console.warn('[HN-Push]',error);
      setPromptStatus('No se pudo completar el registro de notificaciones. Vuelve a intentarlo.');
      return false;
    }finally{busy=false}
  }

  function closeIOSPrompt(){document.getElementById(PROMPT_ID)?.remove()}

  function setPromptStatus(message){
    const el=document.querySelector(`#${PROMPT_ID} .hn-push-status`);
    if(el)el.textContent=message||'';
  }

  function installIOSPromptStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #${PROMPT_ID}{position:fixed;inset:0;z-index:250000;display:flex;align-items:center;justify-content:center;padding:22px;}
      #${PROMPT_ID} .hn-push-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.84);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);}
      #${PROMPT_ID} .hn-push-card{position:relative;width:min(100%,410px);padding:27px 22px 22px;border:1px solid rgba(229,189,98,.78);background:#050605;color:#f4f1e8;box-shadow:0 18px 60px rgba(0,0,0,.58);text-align:center;}
      #${PROMPT_ID} .hn-push-icon{width:56px;height:56px;margin:0 auto 15px;border:1px solid rgba(229,189,98,.72);border-radius:50%;display:grid;place-items:center;color:#fff1a8;font:400 22px Georgia,serif;letter-spacing:.04em;background:rgba(229,189,98,.06);}
      #${PROMPT_ID} .hn-push-eyebrow{font-size:9px;letter-spacing:.26em;text-transform:uppercase;color:#e5bd62;}
      #${PROMPT_ID} h2{margin:9px 0 10px;color:#fff1a8;font:400 27px Georgia,serif;letter-spacing:.02em;}
      #${PROMPT_ID} p{margin:0 auto;color:rgba(244,241,232,.7);font-size:12px;line-height:1.55;max-width:310px;}
      #${PROMPT_ID} .hn-push-status{min-height:34px;margin-top:12px;color:#e9c779;font-size:10px;line-height:1.45;letter-spacing:.04em;}
      #${PROMPT_ID} .hn-push-activate{width:100%;height:50px;margin-top:10px;border:1px solid #e5bd62;background:rgba(229,189,98,.08);color:#fff1a8;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;}
      #${PROMPT_ID} .hn-push-activate:active{transform:scale(.985)}
      #${PROMPT_ID} .hn-push-activate:disabled{opacity:.55}
    `;
    document.head.appendChild(style);
  }

  function shouldShowIOSPrompt(){
    if(!isIOS||!username()||!hasWebPush())return false;
    if(Notification.permission==='granted')return false;
    return true;
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
        <div class="hn-push-status"></div>
        <button class="hn-push-activate" type="button">ACTIVAR</button>
      </section>`;
    document.body.appendChild(wrap);
    const button=wrap.querySelector('.hn-push-activate');
    button.addEventListener('click',async()=>{
      if(button.disabled)return;

      if(!isStandalone()){
        setPromptStatus('Abre HAVANA NICE desde el icono instalado en la pantalla de inicio del iPhone.');
        return;
      }
      if(Notification.permission==='denied'){
        setPromptStatus('Las notificaciones están bloqueadas. Actívalas desde Ajustes > Notificaciones > HAVANA NICE.');
        return;
      }

      button.disabled=true;
      button.textContent='ACTIVANDO…';
      setPromptStatus('');
      try{
        let permission=Notification.permission;
        if(permission==='default')permission=await Notification.requestPermission();
        if(permission!=='granted'){
          setPromptStatus('iPhone no concedió el permiso de notificaciones.');
          button.disabled=false;
          button.textContent='ACTIVAR';
          return;
        }
        const ok=await registerPush();
        if(!ok){button.disabled=false;button.textContent='ACTIVAR'}
      }catch(error){
        console.warn('[HN-Push] iOS permission',error);
        setPromptStatus('No fue posible abrir el permiso de iPhone.');
        button.disabled=false;
        button.textContent='ACTIVAR';
      }
    });
  }

  function afterSessionReady(){
    if(!isIOS){
      if(hasWebPush()&&Notification.permission==='granted')registerPush();
      return;
    }

    if(!hasWebPush()){
      closeIOSPrompt();
      return;
    }

    if(Notification.permission==='granted')registerPush();
    else setTimeout(showIOSPrompt,250);
  }

  function init(){
    if('serviceWorker'in navigator){
      navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(error=>console.warn('[HN-Push] sw',error));
    }

    document.addEventListener('click',event=>{
      const login=event.target.closest&&event.target.closest('#loginButton,#login');
      if(!login)return;
      if(isIOS){setTimeout(afterSessionReady,450);return}
      if(hasWebPush()&&Notification.permission==='default')Notification.requestPermission().then(registerPush).catch(()=>{});
      else registerPush();
    },true);

    window.addEventListener('hn:session-ready',afterSessionReady);
    window.addEventListener('hn:session-logout',closeIOSPrompt);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)afterSessionReady()});
    window.addEventListener('online',()=>{if(hasWebPush()&&Notification.permission==='granted')registerPush()});

    setTimeout(afterSessionReady,500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
