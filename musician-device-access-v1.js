/* HAVANA NICE — MUSICIAN DEVICE ACCESS V1
   Minimal device authorization layer for the musician PWA.
*/
const TOKEN_KEY='hn_musician_device_token_v1';
let client=null;

function getClient(){
  if(client)return client;
  client=window.hnMusicianSupabase||window.hnSupabase||null;
  return client;
}

export function getDeviceToken(){
  try{
    let t=localStorage.getItem(TOKEN_KEY);
    if(!t||t.length<16){
      t=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2));
      localStorage.setItem(TOKEN_KEY,t);
    }
    return t;
  }catch(_){
    return 'hn-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  }
}

export function getDeviceLabel(){
  const ua=navigator.userAgent||'';
  if(/iPhone|iPad|iPod/i.test(ua))return 'iPhone · iOS';
  if(/Android/i.test(ua))return /SamsungBrowser/i.test(ua)||/SM-[A-Z0-9-]+/i.test(ua)?'Samsung · Android':'Android';
  if(/Macintosh/i.test(ua))return 'Mac · macOS';
  if(/Windows/i.test(ua))return 'Windows';
  return 'Dispositivo · '+(navigator.platform||'Web');
}

export async function requestAccess(username){
  const sb=getClient();
  if(!sb)throw new Error('Supabase no disponible');
  const {data,error}=await sb.rpc('login_by_username',{p_username:username});
  if(error)throw error;
  if(!data||!data.length)return {status:'denied',message:'Acceso no autorizado'};
  const profile=data[0];
  const result=await sb.rpc('request_musician_device_access',{
    p_username:profile.username,
    p_device_token:getDeviceToken(),
    p_device_label:getDeviceLabel()
  });
  if(result.error)throw result.error;
  const access=result.data&&result.data[0];
  if(!access)return {status:'denied',message:'No fue posible verificar el dispositivo'};
  return {status:access.status,message:access.message,profile};
}

export async function validateSession(username){
  const sb=getClient();
  if(!sb)return null;
  return sb.rpc('validate_musician_device_session',{
    p_username:username,
    p_device_token:getDeviceToken()
  });
}
