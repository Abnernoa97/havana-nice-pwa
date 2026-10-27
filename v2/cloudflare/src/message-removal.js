// One canonical deletion path for both Admin and musician Chat.
export async function deleteChatMessageRecord(env,seq){
 if(!Number.isSafeInteger(seq)||seq<=0)throw new Error('Invalid message sequence');
 const row=await env.DB.prepare('SELECT seq FROM chat_messages WHERE seq=?').bind(seq).first();
 if(!row)return false;
 await env.DB.batch([
  env.DB.prepare('UPDATE chat_messages SET reply_to_seq=NULL WHERE reply_to_seq=?').bind(seq),
  env.DB.prepare('DELETE FROM chat_reactions WHERE message_seq=?').bind(seq),
  env.DB.prepare('DELETE FROM chat_messages WHERE seq=?').bind(seq)
 ]);
 const check=await env.DB.prepare('SELECT seq FROM chat_messages WHERE seq=?').bind(seq).first();
 if(check)throw new Error('Deletion not confirmed');
 return true;
}