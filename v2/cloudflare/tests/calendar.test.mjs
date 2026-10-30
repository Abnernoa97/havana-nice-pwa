import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleCalendarApi} from '../src/calendar.js';

const BASE='https://havana-nice-v2-dev.soloaplicaciones97.workers.dev';
const TOKEN='A'.repeat(43);
const adminSecret='S'.repeat(48);
async function hash(value){
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))]
  .map(x=>x.toString(16).padStart(2,'0')).join('');
}
function toRow(id,x,version=1){
 return {id,event_date:x.date,time_zone:x.timeZone,title:x.title,venue:x.venue,city:x.city,
  call_time:x.callTime,arrival_time:x.arrivalTime,show_time:x.showTime,end_time:x.endTime,
  wardrobe:x.wardrobe,notes:x.notes,status:x.status,version,created_at:new Date().toISOString(),
  updated_at:new Date().toISOString()};
}
class FakeDB {
 constructor(){this.events=new Map();this.adHash='';this.writes=0;}
 prepare(sql){
  const db=this;
  return {bind(...args){return {
   async first(){
    if(sql.startsWith('SELECT expires_at,revoked_at FROM chat_admin_sessions'))
     return args[0]===db.adHash?{expires_at:Date.now()+300_000,revoked_at:null}:null;
    if(sql.startsWith('SELECT id,event_date')&&sql.includes('WHERE id=?'))return db.events.get(args[0])||null;
    throw Error('Unexpected query: '+sql);
   },
   async all(){
    if(sql.includes('FROM calendar_events WHERE event_date BETWEEN')){
     const events=[...db.events.values()].filter(e=>e.event_date>=args[0]&&e.event_date<=args[1]);
     return {results:events.slice(0,args[2])};
    }
    throw Error('Unexpected list: '+sql);
   },
   async run(){
    if(sql.startsWith('INSERT INTO calendar_events')){
     const [id,date,timeZone,title,venue,city,callTime,arrivalTime,showTime,endTime,wardrobe,notes,status]=args;
     db.events.set(id,toRow(id,{date,timeZone,title,venue,city,callTime,arrivalTime,showTime,endTime,wardrobe,notes,status}));
     db.writes++;return {meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE calendar_events')){
     const id=args.at(-2),expected=args.at(-1),current=db.events.get(id);
     if(!current||current.version!==expected)return {meta:{changes:0}};
     const [date,timeZone,title,venue,city,callTime,arrivalTime,showTime,endTime,wardrobe,notes,status]=args;
     db.events.set(id,toRow(id,{date,timeZone,title,venue,city,callTime,arrivalTime,showTime,endTime,wardrobe,notes,status},expected+1));
     db.writes++;return {meta:{changes:1}};
    }
    throw Error('Unexpected write: '+sql);
   }
  }};
  }};
 }
}
async function env(){
 const DB=new FakeDB();DB.adHash=await hash(TOKEN);
 return {DB,V2_ADMIN_LOGIN_MODE:'enabled',V2_ADMIN_LOGIN_SECRET:adminSecret};
}
async function call(e,path,{method='GET',token='',body,member=false}={}){
 const request=new Request(BASE+path,{method,
  headers:{...(token?{authorization:'Bearer '+token}:{}),...(body?{'content-type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})});
 const response=await handleCalendarApi(request,e,new URL(request.url),'',
  (body,status=200)=>Response.json(body,{status}),
  async (_env,credential)=>member&&credential==='musician-token');
 return {status:response.status,body:await response.json()};
}
const event={date:'2026-11-28',timeZone:'America/Mexico_City',title:'Evento de prueba',
 venue:'Lugar',city:'Ciudad',callTime:'16:00',arrivalTime:'17:00',showTime:'19:00',
 endTime:'21:00',wardrobe:'Negro',notes:'Información del equipo',status:'confirmed'};

test('migration only adds one V2 calendar table without changing Chat history',()=>{
 const migration=readFileSync(new URL('../migrations/0018_calendar_events.sql',import.meta.url),'utf8');
 assert.match(migration,/CREATE TABLE IF NOT EXISTS calendar_events/);
 assert.match(migration,/CREATE INDEX IF NOT EXISTS idx_calendar_events_date/);
 assert.doesNotMatch(migration,/DROP|DELETE FROM|ALTER TABLE chat_/i);
});

test('no musician or admin calendar data is available anonymously',async()=>{
 const e=await env();
 assert.equal((await call(e,'/api/calendar/events?from=2026-01-01&to=2026-12-31')).status,401);
 assert.equal((await call(e,'/api/calendar/admin/events',{method:'POST',body:event})).status,401);
 assert.equal(e.DB.writes,0);
});

test('musicians can only read valid bounded ranges, never create events',async()=>{
 const e=await env();
 assert.equal((await call(e,'/api/calendar/events?from=2026-01-01&to=2026-12-31',{token:'musician-token',member:true})).status,200);
 assert.equal((await call(e,'/api/calendar/events?from=2026-02-30&to=2026-12-31',{token:'musician-token',member:true})).status,400);
 assert.equal((await call(e,'/api/calendar/events?from=2024-01-01&to=2026-12-31',{token:'musician-token',member:true})).status,400);
 assert.equal((await call(e,'/api/calendar/admin/events',{method:'POST',token:'musician-token',member:true,body:event})).status,401);
 assert.equal(e.DB.writes,0);
});

test('Admin creates one real event and musician reads same D1 record',async()=>{
 const e=await env();
 const result=await call(e,'/api/calendar/admin/events',{method:'POST',token:TOKEN,body:event});
 assert.equal(result.status,201);
 assert.match(result.body.event.id,/^[a-f0-9-]{36}$/);
 const read=await call(e,'/api/calendar/events?from=2026-11-01&to=2026-11-30',{token:'musician-token',member:true});
 assert.equal(read.status,200);
 assert.equal(read.body.events.length,1);
 assert.equal(read.body.events[0].title,event.title);
 assert.equal(read.body.events[0].wardrobe,'Negro');
 assert.equal(e.DB.writes,1);
});

test('bad time zone, empty event title and invalid time are rejected without DB writes',async()=>{
 const e=await env();
 for(const changed of [{timeZone:'Not/A_Timezone'},{title:' '},{arrivalTime:'27:15'},{date:'2026-02-30'}]){
  const result=await call(e,'/api/calendar/admin/events',{method:'POST',token:TOKEN,body:{...event,...changed}});
  assert.equal(result.status,400);
 }
 assert.equal(e.DB.writes,0);
});

test('optimistic version check prevents overwriting a newer Admin edit',async()=>{
 const e=await env();
 const created=await call(e,'/api/calendar/admin/events',{method:'POST',token:TOKEN,body:event});
 const id=created.body.event.id;
 const first=await call(e,'/api/calendar/admin/events/'+id,{method:'POST',token:TOKEN,body:{...event,version:1,title:'Editado'}});
 assert.equal(first.status,200);
 assert.equal(first.body.event.version,2);
 const stale=await call(e,'/api/calendar/admin/events/'+id,{method:'POST',token:TOKEN,body:{...event,version:1,title:'Cambiar'}});
 assert.equal(stale.status,409);
 assert.equal(e.DB.writes,2);
});
