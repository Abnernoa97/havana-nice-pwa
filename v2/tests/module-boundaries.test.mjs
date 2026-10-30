import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const screens=[
  ['HOME Android','apps/android/NativeMemberHome.tsx'],
  ['HOME PWA','apps/pwa/src/VisualApp.tsx'],
  ['Calendario Android','apps/android/NativeCalendar.tsx'],
  ['Calendario PWA','apps/pwa/src/CalendarAccordion.tsx'],
  ['Calendario Administrador','apps/pwa/src/AdminCalendar.tsx']
];

test('A01: HOME lists the same modules from a single shared contract',()=>{
  const list=read('packages/shared/src/memberModules.ts');
  const ids=[...list.matchAll(/\bid:'(chat|calendar|repertoire|musicians|notices|settings)'/g)].map(x=>x[1]);
  assert.deepEqual(ids,['chat','calendar','repertoire','musicians','notices','settings']);
  assert.match(read('apps/android/NativeMemberHome.tsx'),/MEMBER_MODULES\.map/);
  assert.match(read('apps/pwa/src/VisualApp.tsx'),/MEMBER_MODULES/);
  assert.match(read('apps/android/App.tsx'),/session&&activeScreen!=='chat'&&<NativeMemberHome/);
  assert.match(read('apps/pwa/src/App.tsx'),/session&&activeScreen!=='chat'&&<VisualApp/);
});

test('A01: only existing App shells own musician enrollment and session restoration',()=>{
  for(const [name,path] of screens){
    const source=read(path);
    assert.doesNotMatch(source,/startNamedChatSession|restoreNamedChatSession|\/api\/chat\/session|chat_single_device_owners|loginMusician|createChatSession/,name+' may not create a parallel login');
    assert.doesNotMatch(source,/new WebSocket|new DurableObject|new D1Database/,name+' must not create a separate backend');
  }
  for(const path of ['apps/android/App.tsx','apps/pwa/src/App.tsx']){
    assert.match(read(path),/startNamedChatSession\(name\.trim\(\)\)/);
    assert.match(read(path),/restoreNamedChatSession/);
  }
});

test('A02/A03: Calendar never owns Chat engine, messages or device binding',()=>{
  const calendarFiles=[
    'apps/android/NativeCalendar.tsx',
    'apps/pwa/src/CalendarAccordion.tsx',
    'apps/pwa/src/AdminCalendar.tsx',
    'packages/shared/src/calendar.ts',
    'cloudflare/src/calendar.js'
  ];
  for(const path of calendarFiles){
    const source=read(path);
    assert.doesNotMatch(source,/chat_messages|chat_reactions|chat_single_device_owners|CHAT_ROOMS|localStorage|AsyncStorage|SQLite|WebSocket|startNamedChatSession|restoreNamedChatSession/,path+' illegally owns Chat internals');
  }
  const handler=read('cloudflare/src/calendar.js');
  assert.match(handler,/verifyAdminSession/);
  assert.match(handler,/verifyMusicianSession/);
  assert.match(handler,/calendar_event_recipients/);
  assert.doesNotMatch(handler,/\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+chat_/i);
  const worker=read('cloudflare/src/index.ts');
  assert.match(worker,/handleCalendarApi\(request,env,url,origin,respond,verifySession\)/);
  assert.match(worker,/export class ChatRoom/);
});

test('A03: Calendar UIs use shared read contract; Admin alone has writes',()=>{
  for(const path of ['apps/android/NativeCalendar.tsx','apps/pwa/src/CalendarAccordion.tsx']){
    const ui=read(path);
    assert.match(ui,/getCalendarEvents/);
    assert.doesNotMatch(ui,/adminCreateCalendarEvent|adminUpdateCalendarEvent|adminDeleteCalendarEvent/);
    assert.match(ui,/catch\(e\)/,'a failed calendar fetch must remain local');
  }
  const admin=read('apps/pwa/src/AdminCalendar.tsx');
  assert.match(admin,/adminCreateCalendarEvent/);
  assert.match(admin,/adminUpdateCalendarEvent/);
  assert.match(admin,/adminDeleteCalendarEvent/);
  assert.match(admin,/recipientIds/);
  assert.match(read('cloudflare/migrations/0018_calendar_events.sql'),/CREATE TABLE IF NOT EXISTS calendar_event_recipients/);
});

test('A09: independent module tests must not modify legacy or introduce a second server',()=>{
  const guard=read('scripts/audit-guard.mjs');
  const workerConfig=read('cloudflare/wrangler.jsonc');
  assert.match(guard,/V2 development branch must not include unused main-era root files/);
  assert.doesNotMatch(workerConfig,/"services"\s*:/);
  assert.match(read('../.github/workflows/v2-foundation-check.yml'),/Test isolated V2 Calendar without changing live D1/);
});
