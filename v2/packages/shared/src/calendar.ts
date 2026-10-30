export type CalendarEventStatus='tentative'|'confirmed'|'cancelled';
export interface CalendarEvent {
 id:string;date:string;timeZone:string;title:string;venue:string;city:string;
 callTime:string;soundcheckTime:string;arrivalTime:string;showTime:string;endTime:string;
 wardrobe:string;details:string;contactName:string;contactPhone:string;notes:string;
 mapUrl:string;status:CalendarEventStatus;version:number;updatedAt:string;
 recipientIds?:string[]; // Administrator only; not returned to musicians.
}
export type CalendarEventInput=Omit<CalendarEvent,'id'|'version'|'updatedAt'> & {recipientIds:string[]};
export interface CalendarEventList {events:CalendarEvent[];hasMore:boolean}
const PAGE=100;
// One endpoint and token from the existing V2 session. No second login/cache.
export async function getCalendarEvents(
 token:string,base:string,admin=false
):Promise<CalendarEvent[]>{
 const results:CalendarEvent[]=[];
 for(let offset=0;offset<=10000;offset+=PAGE){
  const res=await fetch(base+(admin?'/api/calendar/admin/events':'/api/calendar/events')+
   '?offset='+offset,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store'});
  const data=await res.json() as CalendarEventList&{error?:string};
  if(!res.ok)throw Error(data.error||'Calendario no disponible ('+res.status+')');
  results.push(...data.events);
  if(!data.hasMore)return results;
 }
 throw Error('Demasiadas fechas. Contacta al Administrador.');
}
export function calendarDate(date:string):string{
 return new Date(date+'T12:00:00').toLocaleDateString('es-MX',
  {weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
