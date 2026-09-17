/* HAVANA NICE — iOS FAMILY MEDIA COMPATIBILITY V2
   iOS-only image transport for the Family list.
   Android is intentionally untouched.
*/
(()=>{'use strict';
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS())return;
const loaded=new Map();
const busy=new Map();
const KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
function publicUrl(img){return img?.src||''}
async function load(img){if(!img)return;const url=publicUrl(img);if(!url||url.startsWith('blob:'))return;const cached=loaded.get(url);if(cached){if(img.src!==cached)img.src=cached;img.style.display='block';return}if(busy.has(url)){try{const blobUrl=await busy.get(url);if(blobUrl&&img.isConnected){img.src=blobUrl;img.style.display='block'}}catch(_){}}return}const p=(async()=>{try{const r=await fetch(url,{method:'GET',mode:'cors',cache:'no-store',headers:{apikey:KEY}});if(!r.ok)throw Error(String(r.status));const blob=await r.blob();if(!blob.size)throw Error('empty');const blobUrl=URL.createObjectURL(blob);loaded.set(url,blobUrl);return blobUrl}catch(e){console.warn('[HN iOS family media]',e);return ''}})();busy.set(url,p);try{const blobUrl=await p;if(blobUrl&&img.isConnected){img.src=blobUrl;img.style.display='block'}}finally{busy.delete(url)}}
function scan(){document.querySelectorAll('.family-member-avatar img').forEach(img=>{img.referrerPolicy='no-referrer';img.decoding='sync';img.loading='eager';load(img)})}
const observer=new MutationObserver(()=>scan());
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','class','data-member-key']});
scan();
})();
