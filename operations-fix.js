/* HAVANA NICE — OPERATIONS UI FIX
   Removes the MY DAY home panel without removing Show Day functionality.
   Show Day remains accessible from today's Calendar event.
*/
(function(){
  'use strict';

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
    import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(function(mod){
      window.hnMusicianSupabase = mod.createClient(urlMatch[1], keyMatch[1]);
      done(window.hnMusicianSupabase);
    }).catch(function(){});
  }

  function init(){
    const panel = document.getElementById('hnMyDay');
    if(panel) panel.remove();
    const style = document.createElement('style');
    style.id = 'hnOperationsFixStyle';
    style.textContent = '.hn-showday-action{display:block;width:100%;margin-top:11px;padding:12px 13px;border:1px solid rgba(229,189,98,.62);color:#fff1a8;background:rgba(0,0,0,.24);font-size:9px;letter-spacing:.18em;text-transform:uppercase;cursor:pointer}.hn-showday-action:active{opacity:.8}';
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
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

/* Last-musician memory. Loaded separately so the frozen authentication and realtime modules remain untouched. */
(function(){ var s=document.createElement('script'); s.src='./session-memory-v2.js?v=20260913'; s.async=false; document.head.appendChild(s); })();

/* Chat typing indicator loader. The indicator is isolated from chat_messages and uses Supabase Presence. */
(function(){
  var s=document.createElement('script');
  s.src='./chat-typing-v1.js?v=1';
  s.async=false;
  document.head.appendChild(s);
})();
