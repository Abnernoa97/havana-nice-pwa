/* HAVANA NICE — FAMILY PROFILE PERSISTENCE V1
   Uses the server-side profile read endpoint so profile media survives
   PWA reloads even when the browser cannot load the Supabase JS SDK.
*/
(()=>{'use strict';
const API='https://xzfradccsxonmauinecl.supabase.co/functions/v1/family-profile-media-v1';
const MAP={fer:'fer-noa',orly:'orly-show',jali:'jali',rafa:'rafa',andy:'andy-rey'};
const $=s=>document.querySelector(s);
function username(){try{return String(JSON.parse(sessionStorage.getItem('hn_profile')||'{}').username||'').trim().toLowerCase()}catch(_){return ''}}
function keyForUser(){return MAP[username()]||null}
function mediaUrl(path,updated){if(!path)return '';const v=updated?encodeURIComponent(updated):String(Date.now());return API.replace('/functions/v1/family-profile-media-v1','')+'/storage/v1/object/public/family-media/'+path.split('/').map(encodeURIComponent).join('/')+'?v='+v}
async function getProfile(key){if(!key)return null;const r=await fetch(API+'?member_key='+encodeURIComponent(key),{method:'GET',cache:'no-store'});let d={};try{d=await r.json()}catch(_){}if(!r.ok||!d.ok)return null;return d.profile||null}
function renderMedia(root,row){if(!root)return;const c=root.querySelector('[data-cover]'),a=root.querySelector('[data-avatar]');if(c)c.style.backgroundImage=row?.cover_path?`url(\"${mediaUrl(row.cover_path,row.updated_at)}\")`:'';if(a)a.style.backgroundImage=row?.avatar_path?`url(\"${mediaUrl(row.avatar_path,row.updated_at)}\")`:''}
function applyEditor(row){const root=$('#hnProfileEditor');if(!root)return;renderMedia(root,row);const save=root.querySelector('.hn-editor-save');if(save)save.disabled=true}
function applyProfile(row){const root=$('#hnFamilyProfileScreen');if(!root)return;renderMedia(root,row);if(row){const n=root.querySelector('.family-profile-name'),r=root.querySelector('.family-profile-role'),b=root.querySelector('.family-profile-bio');if(n)n.textContent=row.name||'';if(r)r.textContent=row.role||'';if(b)b.innerHTML=row.bio?String(row.bio).replace(/\n/g,'<br>'):'<span class=\"family-profile-placeholder\">Biografía próximamente.</span>'}}
async function openEditorPersist(push=true){if(typeof window.hnFamilyEditorOpen==='function')await window.hnFamilyEditorOpen(push);const row=await getProfile(keyForUser());if(row)applyEditor(row)}
async function openProfilePersist(key,push=true){if(typeof window.hnFamilyProfileOpen==='function')await window.hnFamilyProfileOpen(key,push);const row=await getProfile(key);if(row)applyProfile(row)}
async function refreshHome(){const key=keyForUser();const row=await getProfile(key);const b=$('.hn-home-profile-button');if(row&&b&&row.avatar_path)b.style.backgroundImage=`url(\"${mediaUrl(row.avatar_path,row.updated_at)}\")`}
function wire(){if(document.documentElement.dataset.hnFamilyPersistence==='1')return;document.documentElement.dataset.hnFamilyPersistence='1';document.addEventListener('click',e=>{const member=e.target?.closest?.('[data-member-key]');if(member){e.preventDefault();e.stopImmediatePropagation();openProfilePersist(member.dataset.memberKey,true);return}const profileButton=e.target?.closest?.('.hn-home-profile-button');if(profileButton){e.preventDefault();e.stopImmediatePropagation();openEditorPersist(true)}},true);refreshHome();}
function boot(){wire();setTimeout(refreshHome,700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
