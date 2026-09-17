/* HAVANA NICE — FAMILY MEDIA ISOLATION V1
   Media-only compatibility layer.
   It does not own navigation, profile state, or editing.
   It mirrors the current family-v1.js data into native IMG elements
   so Safari/WebKit cannot retain a previous background-image.
*/
(()=>{'use strict';
const API='https://xzfradccsxonmauinecl.supabase.co/functions/v1/family-profile-media-v1';
const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
const KEYS=['fer-noa','orly-show','jali','rafa','andy-rey'];
const cache=new Map();
const inflight=new Map();
let scheduled=false;
function url(path,key,updated){if(!path)return '';return SUPABASE_URL+'/storage/v1/object/public/family-media/'+path.split('/').map(encodeURIComponent).join('/')+'?hn_member='+encodeURIComponent(key)+'&v='+encodeURIComponent(updated||Date.now())}
async function getProfile(key){if(cache.has(key))return cache.get(key);if(inflight.has(key))return inflight.get(key);const p=fetch(API+'?member_key='+encodeURIComponent(key)+'&media_isolation='+Date.now(),{method:'GET',cache:'no-store',headers:{Accept:'application/json','Cache-Control':'no-cache'}}).then(async r=>{let d={};try{d=await r.json()}catch(_){}if(!r.ok||!d.ok)throw Error(d.error||'profile');const row=d.profile||null;cache.set(key,row);return row}).finally(()=>inflight.delete(key));inflight.set(key,p);return p}
function desiredSrc(path,key,updated){return url(path,key,updated)}
function paint(node,path,key,updated,round=false){if(!node)return;const desired=desiredSrc(path,key,updated);const existing=node.querySelector('.hn-family-media-isolation');if(desired&&existing?.getAttribute('src')===desired){node.style.removeProperty('background-image');return}if(!desired&&!existing&&!node.style.backgroundImage)return;node.querySelectorAll('.hn-family-media-isolation').forEach(x=>x.remove());node.style.removeProperty('background-image');if(!desired)return;const img=document.createElement('img');img.className='hn-family-media-isolation';img.alt='';img.draggable=false;img.decoding='sync';img.loading='eager';img.src=desired;img.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;border:0;margin:0;padding:0;pointer-events:none;'+(round?'border-radius:50%;':'');node.appendChild(img)}
async function paintList(){const list=document.querySelector('#hnFamilyScreen .family-list');if(!list)return;for(const key of KEYS){const button=list.querySelector(`[data-member-key="${key}"]`),node=button?.querySelector('.family-member-avatar');if(!node)continue;try{const row=await getProfile(key);paint(node,row?.avatar_path,key,row?.updated_at,true)}catch(_){} }}
async function paintProfile(){const root=document.querySelector('#hnFamilyProfileScreen');if(!root?.classList.contains('is-active'))return;const key=root.dataset.memberKey;if(!key||!KEYS.includes(key))return;const row=await getProfile(key).catch(()=>null);if(!root.classList.contains('is-active')||root.dataset.memberKey!==key)return;const cover=root.querySelector('[data-cover]');const avatar=root.querySelector('[data-avatar]');if(cover)paint(cover,row?.cover_path,key,row?.updated_at,false);if(avatar)paint(avatar,row?.avatar_path,key,row?.updated_at,true)}
function invalidate(key,row){if(key&&row)cache.set(key,row);else if(key)cache.delete(key);schedule()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;paintList();paintProfile()})}
function observe(){const observer=new MutationObserver(mutations=>{for(const m of mutations){if(m.type==='attributes'&&(m.attributeName==='class'||m.attributeName==='data-member-key'||m.attributeName==='style')){schedule();break}if(m.type==='childList'){const t=m.target;if(t.closest?.('#hnFamilyScreen, #hnFamilyProfileScreen')){schedule();break}}}});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-member-key','style']});schedule()}
function realtime(){import('https://esm.sh/@supabase/supabase-js@2').then(m=>{const c=m.createClient(SUPABASE_URL,'sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9');c.channel('family-media-isolation-v1').on('postgres_changes',{event:'*',schema:'public',table:'family_profiles'},p=>{const row=p.new;if(row?.member_key&&KEYS.includes(row.member_key))invalidate(row.member_key,row)}).subscribe()}).catch(()=>{})}
function boot(){observe();realtime()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();