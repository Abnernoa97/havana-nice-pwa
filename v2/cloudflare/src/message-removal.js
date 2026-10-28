// One canonical deletion path for both Admin and musician Chat.
export async function deleteChatMessageRecord(env,seq){
 if(!Number.isSafeInteger(seq)||seq<=0)throw new Error('Invalid message sequence');
 const row=await env.DB.prepare('SELECT seq FROM chat_messages WHERE seq=?').bind(seq).first();
 if(!row)return false;
 const media=await env.DB.prepare(
  'SELECT asset_id FROM chat_media_assets WHERE message_seq=?'
 ).bind(seq).first();
 if(media?.asset_id){
  // Cloud originals must disappear before a message can be erased permanently.
  if(env.V2_CLOUD_BRIDGE_ENABLED!=='enabled'||env.V2_CLOUD_BRIDGE_MEDIA_ENABLED!=='enabled'||
     typeof env.V2_CLOUD_BRIDGE_SECRET!=='string'||env.V2_CLOUD_BRIDGE_SECRET.length<40||
     typeof env.HAVANA_CLOUD_BRIDGE?.fetch!=='function')
    throw Error('media_delete_requires_cloud');
  let deleted;
  try{
   const response=await env.HAVANA_CLOUD_BRIDGE.fetch(
    'https://havana-cloud.internal/api/internal/havana-v2/media/'+media.asset_id+'/file',{
      method:'DELETE',headers:{'x-havana-v2-internal-token':env.V2_CLOUD_BRIDGE_SECRET}
    });
   deleted=response.ok&&(await response.json())?.ok===true;
  }catch{deleted=false;}
  if(!deleted)throw Error('media_delete_unconfirmed');
 }
 await env.DB.batch([
  ...(media?.asset_id?[env.DB.prepare('DELETE FROM chat_media_assets WHERE asset_id=?').bind(media.asset_id)]:[]),
  env.DB.prepare('UPDATE chat_messages SET reply_to_seq=NULL WHERE reply_to_seq=?').bind(seq),
  env.DB.prepare('DELETE FROM chat_reactions WHERE message_seq=?').bind(seq),
  env.DB.prepare('DELETE FROM chat_messages WHERE seq=?').bind(seq)
 ]);
 const check=await env.DB.prepare('SELECT seq FROM chat_messages WHERE seq=?').bind(seq).first();
 if(check)throw new Error('Deletion not confirmed');
 return true;
}