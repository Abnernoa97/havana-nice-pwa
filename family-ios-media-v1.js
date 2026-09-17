/* HAVANA NICE — iOS FAMILY MEDIA COMPATIBILITY V1
   iOS-only guard for Family profile avatars.
   Android is intentionally untouched.
*/
(()=>{'use strict';
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS())return;
function normalize(){document.querySelectorAll('.family-member-avatar img').forEach(img=>{if(!img.src)return;try{const u=new URL(img.src);if(!u.search)return;u.search='';const next=u.href;if(img.src!==next){img.referrerPolicy='no-referrer';img.decoding='sync';img.loading='eager';img.src=next}}catch(_){}})}
const observer=new MutationObserver(normalize);
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','class','data-member-key']});
normalize();
})();
