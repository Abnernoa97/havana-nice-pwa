/* HAVANA NICE — CHAT REALTIME HISTORY GUARD V1 */
(()=>{
'use strict';
const TABLE='chat_messages';
let busy=false,lastSignature='';
const profile=()=>{try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')}catch(_){return null}};
const myId=()=>String(profile()?.id||'');
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const client=()=>window.hnSupabase||window.hnMusicianSupabase||window.supabaseClient||window.supabase||null;
const list=()=>document.querySelector('#hn-chat-screen .hn-chat-list');
const active=()=>!!document.querySelector('#hn-chat-screen.is-active');
const time=ts=>{try{return new Intl.DateTimeFormat('es-MX',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts))}catch(_){return ''}};
const day=ts=>{const d=new Date(ts),n=new Date(),same=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();if(same(d,n))return 'HOY';const y=new Date(n);y.setDate(n.getDate()-1);if(same(d,y))return 'AYER';return new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase()};
function render(rows){const el=list();if(!el)return;if(!rows.length){el.innerHTML='<div class="hn-chat-empty">Aún no hay mensajes</div>';return}let last='';el.innerHTML=rows.map(m=>{const d=day(m.created_at);let h=d!==last?`<div class="hn-chat-day">${esc(d)}</div>`:'';last=d;const mine=String(m.profile_id||'')===myId();let body='';if(m.message_type==='audio'&&m.audio_url){body=`<div class="hn-chat-audio-label"><span class="hn-chat-audio-icon">🎙</span><span>NOTA DE VOZ</span></div><audio class="hn-chat-audio-native" controls preload="metadata" src="${esc(m.audio_url)}"></audio>`}else if(m.message_type==='media'&&Array.isArray(m.media_urls)){body=(m.message?`<div class="hn-chat-text">${esc(m.message)}</div>`:'')+`<div class="hn-chat-media-grid">${m.media_urls.map((u,i)=>Array.isArray(m.media_types)&&m.media_types[i]==='video'?`<div class="hn-chat-media-item"><video controls preload="metadata" src="${esc(u)}"></video></div>`:`<div class="hn-chat-media-item"><img loading="lazy" src="${esc(u)}" alt="Foto compartida"></div>`).join('')}</div>`}else body=`<div class="hn-chat-text">${esc(m.message)}</div>`;return h+`<div class="hn-chat-row ${mine?'mine':'other'}"><div class="hn-chat-bubble" data-message-id="${esc(m.id)}"><div class="hn-chat-sender">${esc(m.sender_name||'MIEMBRO')}</div>${body}<div class="hn-chat-time">${esc(time(m.created_at))}</div></div></div>`}).join('');el.scrollTop=el.scrollHeight}
async function sync(){const el=list(),c=client();if(!el||!c||busy)return;busy=true;try{const {data,error}=await c.from(TABLE).select('id,profile_id,sender_name,message,created_at,message_type,audio_url,audio_duration,media_urls,media_types').order('created_at',{ascending:true}).limit(1000);if(error||!Array.isArray(data))return;const sig=data.map(x=>String(x.id)).join('|');const dom=[...el.querySelectorAll('.hn-chat-bubble[data-message-id]')].map(x=>String(x.dataset.messageId||'')).join('|');if(sig!==dom||sig!==lastSignature){lastSignature=sig;render(data)}}catch(_){}finally{busy=false}}
function boot(){if(!client()){setTimeout(boot,500);return}setTimeout(sync,800);setInterval(()=>{if(active())sync()},2000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(sync,150)});window.addEventListener('focus',()=>setTimeout(sync,150))}
boot();
})();
