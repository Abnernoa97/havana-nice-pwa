const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const root=path.resolve(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
function clock(){let id=0;const jobs=new Map();return {setTimeout(fn){jobs.set(++id,fn);return id},clearTimeout(id){jobs.delete(id)},run(){const batch=[...jobs.values()];jobs.clear();for(const f of batch)f()},jobs};}
function lifecycle(){
 const c=clock(),events={},channels=[],calls=[];let profile={id:'musician-1'};
 const sb={channel(){const channel={on(){return this},subscribe(fn){this.status=fn;return this}};channels.push(channel);return channel},removeChannel(ch){ch.status('CLOSED');return Promise.resolve('ok')}};
 const ctx={...c,window:{addEventListener(n,fn){events[n]=fn}},document:{hidden:false,addEventListener(n,fn){events[n]=fn}},navigator:{onLine:true},currentProfile:()=>profile,client:()=>sb,ensureChatIdentity:()=>profile?.id,restoreHistory(){calls.push('history')},loadMessages(){calls.push('load')},loadChatSettings(){calls.push('settings')},closeReply(){},clearOutgoing(){},releaseLocalImages(){},ensureStyles(){},wireModule(){}};
 vm.createContext(ctx);
 const chat=source('chat-v2.js');
 const code=chat.slice(chat.indexOf('  function disconnectChat('),chat.indexOf('  function closeReply('));
 const init=chat.slice(chat.indexOf('  function init(){'),chat.indexOf("  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init"));
 vm.runInContext(`let initialized=false,chatReconnectTimer=null,chatReconnectDelay=1000,chatChannelOwner=null,chatChannelStatus=null,chatChannelEpoch=0,chatBootTimer=null,chatResumeTimer=null,chatChannel=null,activeProfileId=null,historyRestoredFor=null,messages=[],loadFlight=null,syncedAt=0,syncRevision=0,listEl=null;const liveChanges=new Map(); const CHAT_TABLE='chat_messages';\n${code}\n${init}\ninit();`,ctx);
 return {ctx,c,events,channels,calls,setProfile(p){profile=p}};
}
test('saved-session startup subscribes immediately; repeated session events do not duplicate channels',()=>{
 const h=lifecycle();assert.equal(h.channels.length,1);assert(h.calls.includes('load'));assert(h.calls.includes('settings'));
 h.events['hn:session-ready']();assert.equal(h.channels.length,1);
});
test('resume and online reconnect once; stale CLOSED cannot restart a replaced or logged-out channel',()=>{
 const h=lifecycle();h.channels[0].status('SUBSCRIBED');
 h.events.focus();h.events.pageshow();h.events.visibilitychange();h.c.run();assert.equal(h.channels.length,2);assert.equal(h.c.jobs.size,0);
 h.ctx.navigator.onLine=false;h.events.offline();assert.equal(h.c.jobs.size,0);
 h.ctx.navigator.onLine=true;h.events.online();h.c.run();assert.equal(h.channels.length,3);
 h.setProfile(null);h.events['hn:session-logout']();h.channels[2].status('CLOSED');h.c.run();assert.equal(h.channels.length,3);
});
test('channel failure schedules a retry and ignores old channel callbacks',()=>{
 const h=lifecycle();h.channels[0].status('CHANNEL_ERROR');h.c.run();assert.equal(h.channels.length,2);
 h.channels[0].status('CLOSED');assert.equal(h.c.jobs.size,0);
});
function posterContext(video,canvas){
 const c=clock();let revoked=[];
 const ctx={...c,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(u){revoked.push(u)}},document:{createElement(t){return t==='video'?video:canvas}},generation:0,POSTER_TIMEOUT:9000,MAX_EDGE:640,POSTER_QUALITY:.76,requestAnimationFrame(fn){fn()}};
 vm.createContext(ctx);const s=source('chat-media-v13.js');vm.runInContext(s.slice(s.indexOf('  function posterFromFile('),s.indexOf('  function makeEntry(')),ctx);return {ctx,c,revoked};
}
function video(){return {readyState:2,videoWidth:640,videoHeight:480,duration:0,requestVideoFrameCallback(){return 7},cancelVideoFrameCallback(){},pause(){},load(){},removeAttribute(){}}}
test('a decoded video that never delivers a frame still resolves at the deadline',async()=>{
 const h=posterContext(video());const pending=h.ctx.posterFromFile({},0);h.c.run();assert.equal(await pending,null);assert(h.revoked.length);
});
test('canvas encoding that never calls back cannot block sending',async()=>{
 const v=video();v.requestVideoFrameCallback=fn=>{fn();return 7};
 const h=posterContext(v,{getContext(){return {drawImage(){}}},toBlob(){}});
 const pending=h.ctx.posterFromFile({},0);v.onloadeddata();h.c.run();assert.equal(await pending,null);
});
test('a successful frame produces a poster and cancels the deadline',async()=>{
 const v=video();v.requestVideoFrameCallback=fn=>{fn();return 7};
 const h=posterContext(v,{getContext(){return {drawImage(){}}},toBlob(fn){fn({size:42})}});
 const pending=h.ctx.posterFromFile({},0);v.onloadeddata();assert.equal((await pending).blob.size,42);assert.equal(h.c.jobs.size,0);
});
test('stalled poster upload falls back instead of blocking the message',async()=>{
 const c=clock();const ctx={...c,ensurePoster:async()=>({blob:{size:42}}),sb:()=>({storage:{from:()=>({upload:()=>new Promise(()=>{})})}}),objectPath:()=> 'video.mp4',posterUrl:()=> 'poster.jpg',BUCKET:'chat-media',POSTER_TIMEOUT:9000,console};
 vm.createContext(ctx);const s=source('chat-media-v13.js');vm.runInContext(s.slice(s.indexOf('  async function persistPoster('),s.indexOf('  function paintPending(')),ctx);
 const pending=ctx.persistPoster({},'video');await new Promise(setImmediate);assert.equal(c.jobs.size,1);c.run();assert.equal(await pending,'');
});
function helpers(){
 const ctx={URL,Map,Set,Number,Date};vm.createContext(ctx);
 const s=stripTypeScriptTypes(source('supabase/functions/storage-maintenance-v1/references.ts')).replaceAll('export ','');
 vm.runInContext(s+';globalThis.api={chatRefs,notificationRefs,visitAll,oldEnough};',ctx);return ctx.api;
}
test('all media references and legacy sidecars are protected, with exact project URL matching',()=>{
 const h=helpers(),base='https://example.supabase.co',url=p=>base+'/storage/v1/object/public/chat-media/'+p;
 const refs=h.chatRefs({media_urls:[url('original.mov')],media_playback_urls:[url('play.mp4')],media_posters:[url('cover.jpg')],audio_url:base+'/storage/v1/object/public/chat-audio/a.m4a'},base);
 const paths=refs.map(x=>x.path);for(const p of ['original.mov','original.mov.poster.jpg','play.mp4','play.mp4.poster.jpg','cover.jpg','a.m4a'])assert(paths.includes(p));
 assert.equal(h.chatRefs({media_urls:['https://foreign.example/storage/v1/object/public/chat-media/x']},base).length,0);
 assert.equal(h.oldEnough({created_at:null,updated_at:null},Date.now()),false);
});
test('reference scan protects messages beyond 300 and handles server page caps; errors abort',async()=>{
 const h=helpers(),rows=Array.from({length:1201},(_,i)=>({id:i+1,media_posters:['poster-'+i]}));let visits=[];
 const client={from(){let cursor=0;return {select(){return this},order(){return this},limit(){return this},gt(_,id){cursor=id;return this},then(resolve){resolve({data:rows.filter(r=>r.id>cursor).slice(0,200),error:null})}}}};
 await h.visitAll(client,'chat_messages','id',r=>visits.push(r.id));assert.equal(visits.length,1201);assert.equal(visits.at(-1),1201);
 const bad={from(){return {select(){return this},order(){return this},limit(){return Promise.resolve({data:null,error:new Error('offline')})}}}};
 await assert.rejects(()=>h.visitAll(bad,'chat_messages','id',()=>{}),/offline/);
});
