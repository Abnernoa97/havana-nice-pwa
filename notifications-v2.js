import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase=createClient('https://xzfradccsxonmauinecl.supabase.co','sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9');
const state={items:[],started:false};
const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

function injectUI(){
 if(document.getElementById('hnNotificationsRoot'))return;
 const style=document.createElement('style');
 style.textContent=`#hnNotificationsRoot{position:fixed;right:max(18px,env(safe-area-inset-right));top:max(74px,calc(env(safe-area-inset-top) + 60px));z-index:9999;font-family:Arial,sans-serif}#hnNotifyButton{width:46px;height:46px;border:1px solid rgba(229,189,98,.72);background:rgba(0,0,0,.58);color:#fff1a8;border-radius:50%;backdrop-filter:blur(10px);font-size:18px;position:relative;cursor:pointer}#hnNotifyCount{position:absolute;right:-3px;top:-4px;min-width:17px;height:17px;padding:0 4px;border-radius:10px;background:#e5bd62;color:#020302;font:700 9px/17px Arial;text-align:center;display:none}#hnNotifyPanel{position:fixed;right:18px;top:132px;width:min(350px,calc(100vw - 36px));max-height:65vh;overflow:auto;border:1px solid rgba(229,189,98,.65);background:rgba(2,3,2,.96);backdrop-filter:blur(18px);display:none;box-shadow:0 18px 60px rgba(0,0,0,.55)}#hnNotifyPanel.open{display:block}.hn-n-head{padding:18px;border-bottom:1px solid rgba(229,189,98,.22);font:14px Georgia,serif;letter-spacing:.18em;color:#fff1a8;text-transform:uppercase}.hn-n-item{padding:17px 18px;border-bottom:1px solid rgba(255,255,255,.08)}.hn-n-title{color:#f4f1e8;font-size:12px;letter-spacing:.12em;text-transform:uppercase}.hn-n-message{margin-top:8px;color:rgba(244,241,232,.72);font-size:12px;line-height:1.5}.hn-n-date{margin-top:9px;color:rgba(244,241,232,.36);font-size:8px;letter-spacing:.12em;text-transform:uppercase}.hn-n-empty{padding:24px 18px;color:rgba(244,241,232,.42);font-size:10px;letter-spacing:.12em;text-transform:uppercase;text-align:center}#hnNotifyToast{position:fixed;left:50%;bottom:max(92px,calc(env(safe-area-inset-bottom) + 78px));transform:translate(-50%,20px);width:min(390px,calc(100vw - 36px));padding:16px 18px;border:1px solid rgba(229,189,98,.7);background:rgba(2,3,2,.94);color:#f4f1e8;opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;z-index:10000;backdrop-filter:blur(14px)}#hnNotifyToast.show{opacity:1;transform:translate(-50%,0)}#hnNotifyToast strong{display:block;color:#fff1a8;font-size:11px;letter-spacing:.12em;text-transform:uppercase}.hn-toast-msg{margin-top:6px;font-size:11px;line-height:1.45;color:rgba(244,241,232,.72)}`;
 document.head.appendChild(style);
 const root=document.createElement('div');root.id='hnNotificationsRoot';
 root.innerHTML='<button id="hnNotifyButton" aria-label="Notifications">♢<span id="hnNotifyCount"></span></button><div id="hnNotifyPanel"><div class="hn-n-head">Notifications</div><div id="hnNotifyList"></div></div><div id="hnNotifyToast"></div>';
 document.body.appendChild(root);
 document.getElementById('hnNotifyButton').onclick=()=>document.getElementById('hnNotifyPanel').classList.toggle('open');
}
function render(){
 const list=document.getElementById('hnNotifyList'),count=document.getElementById('hnNotifyCount');if(!list)return;
 count.textContent=state.items.length>99?'99+':state.items.length;count.style.display=state.items.length?'block':'none';
 list.innerHTML=state.items.length?state.items.map(n=>`<article class="hn-n-item"><div class="hn-n-title">${esc(n.title)}</div><div class="hn-n-message">${esc(n.message)}</div><div class="hn-n-date">${new Date(n.created_at).toLocaleString()}</div></article>`).join(''):'<div class="hn-n-empty">No notifications</div>';
}
function toast(n){const t=document.getElementById('hnNotifyToast');if(!t)return;t.innerHTML=`<strong>${esc(n.title)}</strong><div class="hn-toast-msg">${esc(n.message)}</div>`;t.classList.add('show');clearTimeout(window.__hnToastTimer);window.__hnToastTimer=setTimeout(()=>t.classList.remove('show'),4500)}
async function load(){
 const{data,error}=await supabase.from('notifications').select('id,title,message,created_at').order('created_at',{ascending:false});
 if(!error){
  const previous=state.items.map(x=>x.id);state.items=data||[];render();
  if(state.started&&previous.length&&state.items.length&&state.items[0].id!==previous[0])toast(state.items[0]);
 }
}
async function start(){
 if(state.started||!sessionStorage.getItem('hn_profile'))return;
 state.started=true;injectUI();await load();
 supabase.channel('hn-notifications-live-v2')
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications'},p=>{state.items=[p.new,...state.items.filter(x=>x.id!==p.new.id)];render();toast(p.new)})
  .on('postgres_changes',{event:'DELETE',schema:'public',table:'notifications'},p=>{state.items=state.items.filter(x=>x.id!==p.old.id);render()})
  .subscribe();
 setInterval(()=>{if(sessionStorage.getItem('hn_profile'))load()},2000);
}
start();
const hnWait=setInterval(()=>{if(sessionStorage.getItem('hn_profile'))start();if(state.started)clearInterval(hnWait)},500);