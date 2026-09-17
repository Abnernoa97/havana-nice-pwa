/* HAVANA NICE — iOS FAMILY MEDIA COMPATIBILITY V4
   Each Family row resolves its own member_key and avatar_path.
   iOS-only. Android is intentionally untouched.
*/
(()=>{'use strict';
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS())return;
const API='https://xzfradccsxonmauinecl.supabase.co/functions/v1/family-profile-media-v1';
const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
const KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
const profileCache=new Map();
const profileBusy=new Map();
const blobCache=new Map();
const blobBusy=new Map();
function memberKey(img){return img?.closest?.('[data-member-key]')?.dataset?.memberKey||''}
async function profile(key){
  if(!key)return null;
  if(profileCache.has(key))return profileCache.get(key);
  if(profileBusy.has(key))return profileBusy.get(key);
  const p=(async()=>{
    try{
      const r=await fetch(API+'?member_key='+encodeURIComponent(key),{method:'GET',cache:'no-store',headers:{Accept:'application/json'}});
      if(!r.ok)throw Error(String(r.status));
      const d=await r.json();
      if(!d?.ok)throw Error(d?.error||'profile');
      const row=d.profile||null;
      profileCache.set(key,row);
      return row;
    }catch(e){console.warn('[HN iOS family profile]',key,e);return null}
    finally{profileBusy.delete(key)}
  })();
  profileBusy.set(key,p);
  return p;
}
function urlFor(row){
  if(!row?.avatar_path)return '';
  return SUPABASE_URL+'/storage/v1/object/public/family-media/'+row.avatar_path.split('/').map(encodeURIComponent).join('/');
}
async function blobFor(url){
  if(!url)return '';
  if(blobCache.has(url))return blobCache.get(url);
  if(blobBusy.has(url))return blobBusy.get(url);
  const p=(async()=>{
    try{
      const r=await fetch(url,{method:'GET',mode:'cors',cache:'no-store',headers:{apikey:KEY,Accept:'image/*'}});
      if(!r.ok)throw Error(String(r.status));
      const blob=await r.blob();
      if(!blob.size)throw Error('empty');
      const out=URL.createObjectURL(blob);
      blobCache.set(url,out);
      return out;
    }catch(e){console.warn('[HN iOS family image]',url,e);return ''}
    finally{blobBusy.delete(url)}
  })();
  blobBusy.set(url,p);
  return p;
}
async function load(img){
  if(!img||!img.isConnected)return;
  const key=memberKey(img);
  if(!key)return;
  const row=await profile(key);
  if(!img.isConnected)return;
  const url=urlFor(row);
  if(!url){img.removeAttribute('src');img.style.display='none';return}
  img.dataset.hnFamilySource=url;
  img.referrerPolicy='no-referrer';
  img.decoding='sync';
  img.loading='eager';
  const blob=await blobFor(url);
  if(!img.isConnected)return;
  if(blob){img.onload=null;img.onerror=null;img.src=blob;img.style.display='block';return}
  img.src=url;
  img.style.display='block';
}
function scan(){document.querySelectorAll('.family-member-avatar img').forEach(img=>{const key=memberKey(img);if(!key)return;const wanted=img.dataset.hnFamilyKey;if(wanted===key)return;img.dataset.hnFamilyKey=key;load(img)})}
const observer=new MutationObserver(()=>scan());
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','class','data-member-key']});
scan();
})();
