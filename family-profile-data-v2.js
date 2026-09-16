/* HAVANA NICE — FAMILY PROFILE DATA V2
   One app, one identity, one cloud profile per musician.
   username -> member_key -> family_profiles -> family-media.
   Server data is the source of truth; browser state is preview only.
*/
(()=>{'use strict';
const API='https://xzfradccsxonmauinecl.supabase.co/functions/v1/family-profile-media-v1';
const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
const MAP={fer:'fer-noa',orly:'orly-show',jali:'jali',rafa:'rafa',andy:'andy-rey'};
let client=null;
let channel=null;
let lastKey='';
const $=s=>document.querySelector(s);
function username(){try{return String(JSON.parse(sessionStorage.getItem('hn_profile')||'{}').username||'').trim().toLowerCase()}catch(_){return ''}}
function keyForUser(){return MAP[username()]||null}
function mediaUrl(path,updated){if(!path)return '';const base=SUPABASE_URL+'/storage/v1/object/public/family-media/'+path.split('/').map(encodeURIComponent).join('/');return base+'?v='+encodeURIComponent(updated||Date.now())}
async function fetchProfile(key){if(!key)return null;const r=await fetch(API+'?member_key='+encodeURIComponent(key),{method:'GET',cache:'no-store',headers:{Accept:'application/json'}});let d={};try{d=await r.json()}catch(_){}if(!r.ok||!d.ok)throw Error(d.error||'No fue posible cargar el perfil');return d.profile||null}
function render(root,row){if(!root||!row)return;const c=root.querySelector('[data-cover]'),a=root.querySelector('[data-avatar]');if(c)c.style.backgroundImage=row.cover_path?`url("${mediaUrl(row.cover_path,row.updated_at)}")`:'';if(a)a.style.backgroundImage=row.avatar_path?`url("${mediaUrl(row.avatar_path,row.updated_at)}")`:'';const n=root.querySelector('.family-profile-name'),r=root.querySelector('.family-profile-role'),b=root.querySelector('.family-profile-bio');if(n)n.textContent=row.name||'';if(r)r.textContent=row.role||'';if(b)b.innerHTML=row.bio?String(row.bio).replace(/\n/g,'<br>'):'<span class="family-profile-placeholder">Biografía próximamente.</span>'}
async function refreshEditor(){const key=keyForUser(),root=$('#hnProfileEditor');if(!key||!root)return;try{const row=await fetchProfile(key);if(row)render(root,row)}catch(e){console.error('[HN family data]',e)}}
async function refreshProfile(key){const root=$('#hnFamilyProfileScreen');if(!key||!root)return;try{const row=await fetchProfile(key);if(row)render(root,row)}catch(e){console.error('[HN family data]',e)}}
async function refreshHome(){const key=keyForUser(),b=$('.hn-home-profile-button');if(!key||!b)return;try{const row=await fetchProfile(key);if(row?.avatar_path)b.style.backgroundImage=`url("${mediaUrl(row.avatar_path,row.updated_at)}")`;else b.style.backgroundImage=''}catch(e){console.error('[HN family data]',e)}}
async function openEditor(push){try{if(typeof window.hnFamilyEditorOpen==='function')await window.hnFamilyEditorOpen(push)}catch(e){console.error(e)}await refreshEditor()}
async function openProfile(key,push){try{if(typeof window.hnFamilyProfileOpen==='function')await window.hnFamilyProfileOpen(key,push)}catch(e){console.error(e)}await refreshProfile(key)}
function subscribe(key){if(!key||channel||key===lastKey)return;lastKey=key;import('https://esm.sh/@supabase/supabase-js@2').then(m=>{client=m.createClient(SUPABASE_URL,SUPABASE_KEY);channel=client.channel('family-profile-data-v2').on('postgres_changes',{event:'UPDATE',schema:'public',table:'family_profiles'},payload=>{const row=payload.new;if(row?.member_key===keyForUser()){refreshEditor();refreshProfile(row.member_key);refreshHome()}}).subscribe()}).catch(e=>console.error('[HN family data realtime]',e))}
function refreshAll(){const key=keyForUser();if(!key)return;refreshHome();refreshEditor();const active=$('#hnFamilyProfileScreen');if(active)refreshProfile(active.dataset.memberKey||key);subscribe(key)}
function wire(){if(document.documentElement.dataset.hnFamilyDataV2==='1')return;document.documentElement.dataset.hnFamilyDataV2='1';document.addEventListener('click',e=>{const member=e.target?.closest?.('[data-member-key]');if(member){e.preventDefault();e.stopImmediatePropagation();openProfile(member.dataset.memberKey,true);return}const button=e.target?.closest?.('.hn-home-profile-button');if(button){e.preventDefault();e.stopImmediatePropagation();openEditor(true)}},true);const observer=new MutationObserver(()=>{const key=keyForUser();if(key&&key!==lastKey){refreshAll()}else if(key&&$('.hn-home-profile-button')&&!$('.hn-home-profile-button').style.backgroundImage)refreshHome()});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-member-key']});refreshAll()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
})();
