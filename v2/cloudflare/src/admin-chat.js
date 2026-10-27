// Private, moderator-only view of the SAME D1 Chat. No musician identity is minted.
import {verifyAdminSession} from './admin-auth.js';
const MAX_HISTORY=100;
const ROOM='main-chat-v2';
function mapped(row){
 return {seq:row.seq,clientMessageId:row.client_message_id,senderId:row.sender_id,
  senderName:row.sender_name,text:row.deleted_at?'':row.body,sentAt:row.created_at,
  replyToSeq:row.reply_to_seq??null,editedAt:row.edited_at??null,deletedAt:row.deleted_at??null};
}
const COLUMNS='seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at';
export async function handleAdminChat(request,env,url,origin,respond){
 const reply=(data,status=200)=>respond(data,status,origin);
 if(!await verifyAdminSession(request,env))return reply({error:'No autorizado'},401);
 if(url.pathname==='/api/chat/admin/messages' && request.method==='GET'){
  const raw=url.searchParams.get('beforeSeq');
  const before=raw===null?null:Number(raw);
  if(before!==null&&(!Number.isSafeInteger(before)||before<1))
   return reply({error:'Cursor inválido'},400);
  const query=before===null?
   env.DB.prepare('SELECT '+COLUMNS+' FROM chat_messages ORDER BY seq DESC LIMIT ?').bind(MAX_HISTORY):
   env.DB.prepare('SELECT '+COLUMNS+' FROM chat_messages WHERE seq < ? ORDER BY seq DESC LIMIT ?').bind(before,MAX_HISTORY);
  const rows=(await query.all()).results||[];
  const ids=rows.map(x=>x.seq);
  let reactions=[];
  if(ids.length){
   const marks=ids.map(()=>'?').join(',');
   const response=await env.DB.prepare('SELECT message_seq,actor_id,emoji FROM chat_reactions WHERE message_seq IN ('+marks+')')
    .bind(...ids).all();
   reactions=(response.results||[]).map(x=>({messageSeq:x.message_seq,actorId:x.actor_id,emoji:x.emoji}));
  }
  return reply({messages:rows.reverse().map(mapped),reactions,hasMore:rows.length===MAX_HISTORY});
 }
 const matched=/^\/api\/chat\/admin\/messages\/(\d+)$/.exec(url.pathname);
 if(!matched||request.method!=='DELETE')return reply({error:'Ruta no válida'},404);
 const seq=Number(matched[1]);
 if(!Number.isSafeInteger(seq)||seq<=0)return reply({error:'Mensaje inválido'},400);
 const old=await env.DB.prepare('SELECT '+COLUMNS+' FROM chat_messages WHERE seq=?').bind(seq).first();
 if(!old)return reply({error:'Mensaje no encontrado'},404);
 // A tombstone preserves sequence numbers/replies and broadcasts to both Chats.
 // Single D1 batch keeps the deletion and reaction cleanup atomic.
 if(!old.deleted_at){
  await env.DB.batch([
   env.DB.prepare("UPDATE chat_messages SET body='[mensaje eliminado]',deleted_at=? WHERE seq=? AND deleted_at IS NULL")
    .bind(new Date().toISOString(),seq),
   env.DB.prepare('DELETE FROM chat_reactions WHERE message_seq=?').bind(seq)
  ]);
 }
 const row=await env.DB.prepare('SELECT '+COLUMNS+' FROM chat_messages WHERE seq=?').bind(seq).first();
 if(!row?.deleted_at)return reply({error:'No se pudo confirmar el borrado'},503);
 const message=mapped(row);
 try{
  await env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName(ROOM)).fetch(
   'https://internal/admin-chat-message-updated',{method:'POST',
    body:JSON.stringify({seq})});
 }catch{/* D1 is authoritative. Clients reconcile on re-entry/reconnect. */}
 return reply({ok:true,message});
}
