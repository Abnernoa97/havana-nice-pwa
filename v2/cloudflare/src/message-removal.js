// One canonical deletion path for both Admin and musician Chat.
import {cloudDelete} from './cloud-media-adapter.js';

export async function deleteChatMessageRecord(env,seq){
 if(!Number.isSafeInteger(seq)||seq<=0)throw new Error('Invalid message sequence');
 const row=await env.DB.prepare('SELECT seq FROM chat_messages WHERE seq=?').bind(seq).first();
 if(!row)return false;
 const media=await env.DB.prepare(
  'SELECT asset_id FROM chat_media_assets WHERE message_seq=?'
 ).bind(seq).first();
 if(media?.asset_id){
  // The original must be removed using ONLY already-published Cloud APIs
  // before deleting the canonical D1 bubble. Do not touch Cloud's code.
  try{await cloudDelete(env,media.asset_id);}
  catch{throw Error('media_delete_unconfirmed');}
 }
 await env.DB.batch([
  ...(media?.asset_id?[
   env.DB.prepare('DELETE FROM chat_cloud_uploads WHERE asset_id=?').bind(media.asset_id),
   env.DB.prepare('DELETE FROM chat_media_assets WHERE asset_id=?').bind(media.asset_id)
  ]:[]),
  env.DB.prepare('UPDATE chat_messages SET reply_to_seq=NULL WHERE reply_to_seq=?').bind(seq),
  env.DB.prepare('DELETE FROM chat_reactions WHERE message_seq=?').bind(seq),
  env.DB.prepare('DELETE FROM chat_messages WHERE seq=?').bind(seq)
 ]);
 const check=await env.DB.prepare('SELECT seq FROM chat_messages WHERE seq=?').bind(seq).first();
 if(check)throw new Error('Deletion not confirmed');
 return true;
}