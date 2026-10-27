import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleAdminChat} from '../src/admin-chat.js';
const TOKEN='Q'.repeat(43),BASE='https://havana-nice-v2-dev.soloaplicaciones97.workers.dev';
const COLUMNS='seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at';
const hash=async v=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function setup(){
 const digest=await hash(TOKEN);
 const rows=[{seq:1,client_message_id:'a'.repeat(12),sender_id:'member:old',sender_name:'Noa',body:'mensaje histórico',created_at:'2026-10-27T12:00:00.000Z',reply_to_seq:null,edited_at:null,deleted_at:null},
  {seq:2,client_message_id:'b'.repeat(12),sender_id:'member:new',sender_name:'Fer',body:'mensaje reciente',created_at:'2026-10-27T13:00:00.000Z',reply_to_seq:1,edited_at:null,deleted_at:null}];
 const reactions=[{message_seq:2,actor_id:'member:new',emoji:'👍'}];
 const signals=[];
 const DB={
  prepare(sql){
   function bind(...params){return {
    first:async()=>{
     if(sql.startsWith('SELECT expires_at,revoked_at FROM chat_admin_sessions'))
      return params[0]===digest?{expires_at:Date.now()+60_000,revoked_at:null}:null;
     if(sql.startsWith('SELECT '+COLUMNS+' FROM chat_messages WHERE seq=?'))
      return rows.find(x=>x.seq===params[0])||null;
     throw Error('Unexpected SELECT first: '+sql);
    },
    all:async()=>{
     if(sql.startsWith('SELECT '+COLUMNS+' FROM chat_messages'))
      return {results:rows.filter(x=>!sql.includes('seq < ?')||x.seq<params[0])
       .sort((a,b)=>b.seq-a.seq).slice(0,sql.includes('seq < ?')?params[1]:params[0])};
     if(sql.startsWith('SELECT message_seq,actor_id,emoji FROM chat_reactions'))
      return {results:reactions.filter(x=>params.includes(x.message_seq))};
     throw Error('Unexpected SELECT all: '+sql);
    },
    run:async()=>{
     if(sql.startsWith('UPDATE chat_messages SET body=')){
      const target=rows.find(x=>x.seq===params[1]&&!x.deleted_at);
      if(target){target.body='[mensaje eliminado]';target.deleted_at=params[0];}
      return {meta:{changes:target?1:0}};
     }
     if(sql.startsWith('DELETE FROM chat_reactions WHERE message_seq=?')){
      for(let i=reactions.length-1;i>=0;i--)if(reactions[i].message_seq===params[0])reactions.splice(i,1);
      return {meta:{changes:1}};
     }
     throw Error('Unexpected write: '+sql);
    }
   };}
   return {bind,sql};
  },
  async batch(queries){return Promise.all(queries.map(q=>q.run()));}
 };
 const env={DB,V2_ADMIN_LOGIN_MODE:'enabled',V2_ADMIN_LOGIN_SECRET:'S'.repeat(48),
  CHAT_ROOMS:{idFromName:n=>n,get:()=>({fetch:async(path,options)=>{
   signals.push({path,data:JSON.parse(options.body)});return Response.json({ok:true});
  }})}};
 return {env,rows,reactions,signals};
}
async function call(e,method,path,valid=true){
 const request=new Request(BASE+path,{method,headers:valid?{authorization:'Bearer '+TOKEN}:{}});
 const response=await handleAdminChat(request,e.env,new URL(request.url),'',
  (data,status=200)=>Response.json(data,{status}));
 return {status:response.status,body:await response.json()};
}
test('not anonymous and never a musician token',async()=>{
 const e=await setup();
 assert.equal((await call(e,'GET','/api/chat/admin/messages',false)).status,401);
 assert.equal((await call(e,'DELETE','/api/chat/admin/messages/2',false)).status,401);
 assert.equal(e.rows[1].deleted_at,null);
 assert.equal(e.signals.length,0);
});
test('authorized viewer sees all authors in sequence, even removed historical names',async()=>{
 const e=await setup();
 const result=await call(e,'GET','/api/chat/admin/messages');
 assert.equal(result.status,200);
 assert.deepEqual(result.body.messages.map(x=>x.senderName),['Noa','Fer']);
 assert.equal(result.body.messages[0].text,'mensaje histórico');
 assert.deepEqual(result.body.reactions,[{messageSeq:2,actorId:'member:new',emoji:'👍'}]);
 assert.equal(result.body.hasMore,false);
 assert.equal((await call(e,'GET','/api/chat/admin/messages?beforeSeq=2')).body.messages.length,1);
 assert.equal((await call(e,'GET','/api/chat/admin/messages?beforeSeq=xyz')).status,400);
});
test('moderator soft deletion preserves reply chain, clears emoji and signals both Chats',async()=>{
 const e=await setup();
 const r=await call(e,'DELETE','/api/chat/admin/messages/2');
 assert.equal(r.status,200);
 assert.equal(r.body.message.text,'');
 assert.equal(r.body.message.senderName,'Fer');
 assert.ok(r.body.message.deletedAt);
 assert.equal(e.rows.length,2);
 assert.equal(e.rows[0].body,'mensaje histórico');
 assert.deepEqual(e.reactions,[]);
 assert.deepEqual(e.signals,[{path:'https://internal/admin-chat-message-updated',data:{seq:2}}]);
 assert.equal((await call(e,'DELETE','/api/chat/admin/messages/2')).status,200);
 assert.equal((await call(e,'DELETE','/api/chat/admin/messages/999')).status,404);
 assert.equal((await call(e,'DELETE','/api/chat/admin/messages/0')).status,400);
});
test('Durable Object relays moderation to musicians and private Admin without send permission',()=>{
 const code=readFileSync(new URL('../src/index.ts',import.meta.url),'utf8');
 assert.match(code,/admin-chat-message-updated/);
 assert.match(code,/if\(!row\|\|!row.deleted_at\)/);
 assert.match(code,/this\.broadcast\(\{type:'chat.updated',message:mapMessage\(row\)\}\)/);
 assert.match(code,/'chat.message':'admin.chat.message'/);
 assert.match(code,/'chat.updated':'admin.chat.updated'/);
 assert.match(code,/verifyAdminSession\(adminTokenRequest\(token\),this.env\)/);
});

test('The ONE Worker CORS preflight admits DELETE for authenticated moderator calls, rejects other origins',()=>{
 const code=readFileSync(new URL('../src/index.ts',import.meta.url),'utf8');
 assert.match(code,/request\.method === 'OPTIONS'/);
 assert.match(code,/'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS'/);
 assert.match(code,/'access-control-allow-headers': 'Authorization, Content-Type, X-Havana-Client-Asset-Id'/);
 assert.ok(code.indexOf("if (request.headers.has('origin') && !origin)")<
  code.indexOf("if (request.method === 'OPTIONS')"),
  'Unknown origins must be denied before preflight');
 assert.equal((code.match(/'access-control-allow-methods':/g)||[]).length,1,
  'No second CORS entrypoint should diverge');
});
