// HAVANA NICE V2 — one calendar API, one D1 table, shared by musician clients and Admin.
// This module never reads or changes Chat records, musician tokens or installations.
import {verifyAdminSession} from './admin-auth.js';

const DATE=/^\d{4}-\d{2}-\d{2}$/;
const TIME=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUS=new Set(['tentative','confirmed','cancelled']);
const COLS='id,event_date,time_zone,title,venue,city,call_time,arrival_time,show_time,end_time,wardrobe,notes,status,version,created_at,updated_at';
const MAX_PER_RANGE=250;
const DAY=86400000;

function validDate(value){
 if(typeof value!=='string'||!DATE.test(value))return false;
 const parsed=new Date(value+'T00:00:00.000Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}
function dateRange(from,to){
 if(!validDate(from)||!validDate(to))return false;
 const days=(Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/DAY;
 return days>=0&&days<=366;
}
function optionalTime(value){
 if(value===null||value===undefined||value==='')return null;
 if(typeof value!=='string'||!TIME.test(value))throw new Error('Hora inválida; utiliza HH:MM');
 return value;
}
function bounded(value,max,label,required=false){
 if(typeof value!=='string')throw new Error(label+' debe ser texto');
 const text=value.normalize('NFC').trim();
 if(text.length>max||(required&&!text))throw new Error(label+' excede los límites permitidos');
 return text;
}
function validateFields(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Evento inválido');
 if(!validDate(input.date))throw new Error('Fecha inválida');
 const zone=bounded(input.timeZone,64,'Zona horaria',true);
 try{new Intl.DateTimeFormat('en-US',{timeZone:zone});}catch{throw new Error('Zona horaria inválida');}
 if(!STATUS.has(input.status))throw new Error('Estado inválido');
 return {
  date:input.date, timeZone:zone,
  title:bounded(input.title,160,'Título',true),
  venue:bounded(input.venue??'',160,'Lugar'),
  city:bounded(input.city??'',120,'Ciudad'),
  callTime:optionalTime(input.callTime),
  arrivalTime:optionalTime(input.arrivalTime),
  showTime:optionalTime(input.showTime),
  endTime:optionalTime(input.endTime),
  wardrobe:bounded(input.wardrobe??'',500,'Vestuario'),
  notes:bounded(input.notes??'',4000,'Notas'),
  status:input.status
 };
}
const toEvent=row=>({
 id:row.id,date:row.event_date,timeZone:row.time_zone,title:row.title,
 venue:row.venue,city:row.city,callTime:row.call_time,arrivalTime:row.arrival_time,
 showTime:row.show_time,endTime:row.end_time,wardrobe:row.wardrobe,notes:row.notes,
 status:row.status,version:row.version,updatedAt:row.updated_at
});
const values=v=>[
 v.date,v.timeZone,v.title,v.venue,v.city,v.callTime,v.arrivalTime,v.showTime,
 v.endTime,v.wardrobe,v.notes,v.status
];
async function readBody(request){
 if((request.headers.get('content-type')||'').split(';')[0].trim()!=='application/json')
  throw new Error('Se requiere JSON');
 const contentLength=Number(request.headers.get('content-length')||0);
 if(contentLength>16000)throw new Error('Solicitud demasiado grande');
 const raw=await request.text();
 if(raw.length>16000)throw new Error('Solicitud demasiado grande');
 try{return JSON.parse(raw);}catch{throw new Error('JSON inválido');}
}

export async function handleCalendarApi(request,env,url,origin,respond,verifyMusicianSession){
 const reply=(body,status=200)=>respond(body,status,origin);
 const administrative=url.pathname.startsWith('/api/calendar/admin/');
 if(administrative){
  if(!await verifyAdminSession(request,env))return reply({error:'No autorizado'},401);
 }else{
  const token=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if(!await verifyMusicianSession(env,token)&&!await verifyAdminSession(request,env))
   return reply({error:'No autorizado'},401);
 }
 if(url.pathname==='/api/calendar/events'&&request.method==='GET'){
  const from=url.searchParams.get('from'),to=url.searchParams.get('to');
  if(!dateRange(from,to))return reply({error:'Rango de fechas inválido (máximo 366 días)'},400);
  try{
   const rows=await env.DB.prepare('SELECT '+COLS+' FROM calendar_events WHERE event_date BETWEEN ? AND ? ORDER BY event_date,COALESCE(call_time,arrival_time,show_time),id LIMIT ?')
    .bind(from,to,MAX_PER_RANGE+1).all();
   const items=rows.results||[];
   return reply({events:items.slice(0,MAX_PER_RANGE).map(toEvent),hasMore:items.length>MAX_PER_RANGE});
  }catch{return reply({error:'Calendario no disponible'},503);}
 }
 if(!administrative)return reply({error:'Ruta no válida'},404);
 if(url.pathname==='/api/calendar/admin/events'&&request.method==='POST'){
  let data;
  try{data=validateFields(await readBody(request));}
  catch(e){return reply({error:e instanceof Error?e.message:'Evento inválido'},400);}
  const id=crypto.randomUUID(),now=new Date().toISOString();
  try{
   await env.DB.prepare('INSERT INTO calendar_events(id,event_date,time_zone,title,venue,city,call_time,arrival_time,show_time,end_time,wardrobe,notes,status,version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)')
    .bind(id,...values(data),now,now).run();
   return reply({event:{id,...data,version:1,updatedAt:now}},201);
  }catch{return reply({error:'No se pudo guardar el evento'},503);}
 }
 const match=/^\/api\/calendar\/admin\/events\/([0-9a-f-]+)$/.exec(url.pathname);
 if(match&&ID.test(match[1])&&request.method==='POST'){
  let input,data;
  try{
   input=await readBody(request);
   if(!Number.isSafeInteger(input?.version)||input.version<1)throw new Error('Versión inválida');
   data=validateFields(input);
  }catch(e){return reply({error:e instanceof Error?e.message:'Evento inválido'},400);}
  const now=new Date().toISOString();
  try{
   const result=await env.DB.prepare('UPDATE calendar_events SET event_date=?,time_zone=?,title=?,venue=?,city=?,call_time=?,arrival_time=?,show_time=?,end_time=?,wardrobe=?,notes=?,status=?,version=version+1,updated_at=? WHERE id=? AND version=?')
    .bind(...values(data),now,match[1],input.version).run();
   if(Number(result.meta?.changes)!==1)return reply({error:'El evento cambió o ya no existe. Actualiza antes de guardar.'},409);
   const row=await env.DB.prepare('SELECT '+COLS+' FROM calendar_events WHERE id=?').bind(match[1]).first();
   return reply({event:toEvent(row)});
  }catch{return reply({error:'No se pudo actualizar el evento'},503);}
 }
 return reply({error:'Ruta no válida'},404);
}
