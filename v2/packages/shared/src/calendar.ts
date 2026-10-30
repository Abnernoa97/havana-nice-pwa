export type CalendarEventStatus='tentative'|'confirmed'|'cancelled';
export interface CalendarEvent {
 id:string;
 date:string;
 timeZone:string;
 title:string;
 venue:string;
 city:string;
 callTime:string|null;
 arrivalTime:string|null;
 showTime:string|null;
 endTime:string|null;
 wardrobe:string;
 notes:string;
 status:CalendarEventStatus;
 version:number;
 updatedAt:string;
}
export type CalendarEventInput=Pick<CalendarEvent,
 'date'|'timeZone'|'title'|'venue'|'city'|'callTime'|'arrivalTime'|'showTime'|'endTime'|'wardrobe'|'notes'|'status'>;
export interface CalendarEventList {events:CalendarEvent[];hasMore:boolean}

// The caller supplies an existing V2 musician or Admin token; no new login,
// session store, database or WebView credential is created.
export async function getCalendarEvents(
 token:string,from:string,to:string,base:string
):Promise<CalendarEventList>{
 const url=base+'/api/calendar/events?from='+encodeURIComponent(from)+'&to='+encodeURIComponent(to);
 const result=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store'});
 if(!result.ok)throw Error('No se pudo consultar Calendario ('+result.status+')');
 return result.json() as Promise<CalendarEventList>;
}
