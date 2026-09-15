/* HAVANA NICE — OPERATIONS UI FIX
   Removes the MY DAY home panel without removing Show Day functionality.
   Show Day remains accessible from today's Calendar event.
*/
(function(){
  'use strict';

  function installDeviceGate(){
    const button=document.getElementById('loginButton');
    const input=document.getElementById('username');
    if(!button||!input||button.dataset.hnDeviceGate==='1')return;
    button.dataset.hnDeviceGate='1';
    let busy=false;
    const setMessage=t=>{const el=document.getElementById('loginMessage');if(el)el.textContent=t||'';};
    const finish=()=>{button.disabled=false;busy=false;};
    async function handle(){
      if(busy)return;
      const username=input.value.trim();
      if(!username){setMessage('Escribe tu nombre');return;}
      busy=true;button.disabled=true;setMessage('Verificando acceso...');
      try{
        const mod=await import('./musician-device-access-v1.js?v=180733417c2b7f261249394d43ba1b1c4a82b1af');
        const result=await mod.requestAccess(username);
        if(result.status==='authorized'){
          const p=result.profile;
          const saved={id:p.id,username:p.username,role:p.role};
          sessionStorage.setItem('hn_profile',JSON.stringify(saved));
          try{localStorage.setItem('hn_last_musician_v1',JSON.stringify(saved));}catch(_){ }
          const name=document.getElementById('welcomeName');
          const role=document.getElementById('welcomeRole');
          if(name)name.textContent=p.username||'';
          if(role)role.textContent=p.role||'Músico de HAVANA NICE';
          document.getElementById('loginScreen')?.classList.remove('is-active');
          document.getElementById('homeScreen')?.classList.add('is-active');
          setMessage('');
          return;
        }
        if(result.status==='pending'){setMessage('Acceso pendiente de autorización del administrador');return;}
        setMessage(result.message||'Acceso no autorizado');
      }catch(error){
        console.error('HAVANA NICE device access error:',error);
        setMessage('No fue posible verificar el acceso');
      }finally{finish();}
    }
    button.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();handle();},true);
    input.addEventListener('keydown',function(e){
      if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();button.click();}
    },true);
  }

  function ensureMusicianSupabase(done){
    if(window.hnMusicianSupabase){
      done(window.hnMusicianSupabase);
      return;
    }
    const script = [...document.querySelectorAll('script[type="module"]')].find(function(s){ return s.textContent && s.textContent.includes('SUPABASE_PUBLISHABLE_KEY'); });
    if(!script) return;
    const urlMatch = script.textContent.match(/const\s+SUPABASE_URL\s*=\s*["']([^"']+)["']/);
    const keyMatch = script.textContent.match(/const\s+SUPABASE_PUBLISHABLE_KEY\s*=\s*["']([^"']+)["']/);
    if(!urlMatch || !keyMatch) return;
    import('https://esm.sh/@supabase/supabase-js@2').then(function(mod){
      window.hnMusicianSupabase = mod.createClient(urlMatch[1], keyMatch[1]);
      done(window.hnMusicianSupabase);
    }).catch(function(){});
  }

  function init(){
    const panel = document.getElementById('hnMyDay');
    if(panel) panel.remove();
    const style = document.createElement('style');
    style.id = 'hnOperationsFixStyle';
    style.textContent = '.hn-showday-action{display:block;width:100%;margin-top:11px;padding:12px 13px;border:1px solid rgba(229,189,98,.62);border-radius:10px;color:#fff1a8;background:rgba(0,0,0,.24);font-size:9px;letter-spacing:.18em;text-transform:uppercase;cursor:pointer}.hn-showday-action:active{opacity:.8}.module,.hn-chat-module,.calendar-event-card,.hn-chat-bubble,.hn-chat-input,.hn-chat-send,.hn-chat-recording,.hn-chat-pending-item,.hn-chat-media-item{border-radius:10px!important}';
    document.head.appendChild(style);
    function decorate(){
      document.querySelectorAll('.calendar-event-card').forEach(function(card){
        if(card.querySelector('.hn-showday-action')) return;
        const date = card.querySelector('.calendar-event-day')?.textContent || '';
        const today = new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
        if(!date.toLowerCase().includes('hoy') && !date.toLowerCase().includes(today.toLowerCase())) return;
        const button = document.createElement('button');
        button.type='button'; button.className='hn-showday-action'; button.textContent='Show Day';
        button.onclick=function(e){e.preventDefault();e.stopPropagation();const show=document.getElementById('hnOpenShow');if(show)show.click();};
        card.appendChild(button);
      });
    }
    decorate();
    window.addEventListener('hn-calendar-updated',function(){setTimeout(decorate,100);});
    ensureMusicianSupabase(function(){
      if(!document.getElementById('hnMusicianBackgroundScript')){
        const bg=document.createElement('script'); bg.id='hnMusicianBackgroundScript'; bg.src='./musician-background-v1.js?v=global2'; document.body.appendChild(bg);
      }
    });
    if(!document.getElementById('hnChatMediaLightboxScript')){
      const lb=document.createElement('script');
      lb.id='hnChatMediaLightboxScript';
      lb.src='./chat-media-lightbox-v2.js?v=8653eb4f9a04346a99c88632fff36b10875f5150';
      document.body.appendChild(lb);
    }
    if(!document.getElementById('hnChatVideoControlsScript')){
      const controls=document.createElement('script');
      controls.id='hnChatVideoControlsScript';
      controls.src='./chat-video-controls-v1.js?v=0f538e980d6ce8bc2ac5f89d08541478316b1ba2';
      document.body.appendChild(controls);
    }
  }

  installDeviceGate();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

(function(){ var s=document.createElement('script'); s.src='./session-memory-v2.js?v=20260913'; s.async=false; document.head.appendChild(s); })();

(function(){
  var s=document.createElement('script');
  s.src='./chat-typing-v2.js?v=3';
  s.async=false;
  document.head.appendChild(s);
})();

/* Realtime remains primary. This guard only reconciles on lifecycle events and once per minute as a safety net. */
(function(){
  var s=document.createElement('script');
  s.src='./chat-realtime-guard-v1.js?v=2';
  s.async=false;
  document.head.appendChild(s);
})();

(function(){
  var s=document.createElement('script');
  s.src='./ios-install-v1.js?v=1';
  s.async=false;
  document.head.appendChild(s);
})();

(function(){
  var s=document.createElement('script');
  s.src='./chat-media-fix-v1.js?v=2';
  s.async=false;
  document.head.appendChild(s);
})();
