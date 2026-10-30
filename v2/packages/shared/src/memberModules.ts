// Canonical module list for the one HAVANA NICE V2 member HOME.
// It contains presentation metadata only: no credentials, server state or mock records.
export type MemberModule='chat'|'calendar'|'repertoire'|'musicians'|'notices'|'settings';
export type MemberScreen='home'|MemberModule;
export const MEMBER_MODULES:readonly {id:MemberModule;label:string;glyph:string;description:string;ready:boolean}[]=[
  {id:'chat',label:'Chat',glyph:'◉',description:'Mensajes del equipo',ready:true},
  {id:'calendar',label:'Calendario',glyph:'▦',description:'Eventos, horarios y vestuario',ready:true},
  {id:'repertoire',label:'Repertorio',glyph:'♫',description:'Canciones y listas por evento',ready:false},
  {id:'musicians',label:'Músicos',glyph:'♙',description:'Información del equipo',ready:false},
  {id:'notices',label:'Avisos',glyph:'◌',description:'Comunicaciones importantes',ready:false},
  {id:'settings',label:'Ajustes',glyph:'⚙',description:'Preferencias personales',ready:false},
];
