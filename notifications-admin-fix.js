/* HAVANA NICE — ADMIN NOTIFICATIONS V3 */
(function(){
  'use strict';
  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  let supabase=null, files=[];
  const $=id=>document.getElementById(id);
  const setMsg=t=>{const x=$('nMsg');if(x)x.textContent=t||''};
  function inject(){
    const button=$('nAdd');
    if(!button)return false;
    document.querySelectorAll('.image-upload').forEach(x=>{x.style.display='none';x.setAttribute('aria-hidden','true')});
    let box=$('hnNotifyV3');
    if(!box){
      box=document.createElement('div');box.id='hnNotifyV3';
      box.style.cssText='margin-top:8px;border:1px dashed #70501d;padding:12px';
      box.innerHTML='<label for="hnNotifyFilesV3" style="display:flex;align-items:center;justify-content:center;min-height:64px;text-align:center;color:#9b9b96;font-size:9px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer">Adjuntar imágenes (opcional)<br>1 a 3 fotos · JPG · PNG · WEBP · máximo 5 MB por foto</label><input id="hnNotifyFilesV3" type="file" accept="image/jpeg,image/png,image/webp" multiple style="display:none"><div id="hnNotifyPreviewsV3" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"></div><button id="hnNotifyClearV3" type="button" style="display:none;width:100%;margin-top:8px">Quitar imágenes</button>';
      button.parentNode.insertBefore(box,button);
    }
    return true;
  }
  function render(){
    const wrap=$('hnNotifyPreviewsV3'),clear=$('hnNotifyClearV3');if(!wrap)return;
    wrap.innerHTML='';
    files.forEach((f,i)=>{const item=document.createElement('div');item.style.cssText='position:relative;width:92px;height:68px;border:1px solid #e5bd62;overflow:hidden';const img=document.createElement('img');img.src=URL.createObjectURL(f);img.alt='Vista previa';img.style.cssText='width:100%;height:100%;object-fit:cover;display:block';const x=document.createElement('button');x.type='button';x.textContent='×';x.style.cssText='position:absolute;right:2px;top:2px;width:22px;height:22px;padding:0;background:#020302;color:#fff1a8;border:1px solid #fff1a8';x.onclick=()=>{files.splice(i,1);render()};item.append(img,x);wrap.append(item)});
    if(clear)clear.style.display=files.length?'block':'none';
  }
  async function getClient(){if(supabase)return supabase;const m=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');supabase=m.createClient(SUPABASE_URL,SUPABASE_KEY);return supabase}
  async function upload(c,file){const ext=(file.name.split('.').pop()||'jpg').toLowerCase(),path='notifications/'+crypto.randomUUID()+'.'+ext;const r=await c.storage.from('notification-images').upload(path,file,{contentType:file.type,upsert:false});if(r.error)throw r.error;return c.storage.from('notification-images').getPublicUrl(path).data.publicUrl}
  async function publish(){
    const title=$('nTitle')?.value.trim(),message=$('nMessage')?.value.trim(),button=$('nAdd');
    if(!title||!message){setMsg('Completa título y mensaje');return}if(files.length>3){setMsg('Máximo 3 fotos');return}
    button.disabled=true;button.textContent='Publicando…';
    try{const c=await getClient();const auth=await c.auth.getSession();if(!auth.data.session)throw new Error('not_authenticated');const urls=[];for(let i=0;i<files.length;i++){setMsg('Subiendo imagen '+(i+1)+' de '+files.length+'…');urls.push(await upload(c,files[i]))}setMsg('Publicando…');const r=await c.rpc('admin_create_notification_with_images',{p_title:title,p_message:message,p_image_urls:urls});if(r.error)throw r.error;$('nTitle').value='';$('nMessage').value='';files=[];render();setMsg('Publicada en tiempo real');if(typeof window.loadNotifications==='function')window.loadNotifications()}catch(e){console.error('[HN-Admin-Notifications-V3]',e);setMsg(e.message==='not_authenticated'?'Sesión de administrador no válida':'No se pudo publicar: '+(e.message||''))}finally{button.disabled=false;button.textContent='Publicar notificación'}
  }
  function init(){if(!inject())return;const input=$('hnNotifyFilesV3'),clear=$('hnNotifyClearV3'),button=$('nAdd');if(!input||!clear||!button)return;input.onchange=()=>{const chosen=Array.from(input.files||[]);if(chosen.length>3){setMsg('Máximo 3 fotos');input.value='';files=[];render();return}if(chosen.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024)){setMsg('Cada foto debe ser JPG, PNG o WEBP hasta 5 MB');input.value='';files=[];render();return}files=chosen;render();setMsg('')};clear.onclick=()=>{files=[];input.value='';render();setMsg('')};button.onclick=publish}
  function boot(){init();setTimeout(()=>{document.querySelectorAll('.image-upload').forEach(x=>x.style.display='none');inject()},250);setTimeout(()=>{document.querySelectorAll('.image-upload').forEach(x=>x.style.display='none');inject()},1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
