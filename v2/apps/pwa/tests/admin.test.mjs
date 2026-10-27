import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const ui=read('../src/AdminApp.tsx');
const panel=read('../src/AdminChatAccess.tsx');
const api=read('../src/admin-api.ts');
const backend=read('../../../cloudflare/src/index.ts');

test('single installable Administrator PWA, separate from Chat',()=>{
 assert.match(read('../admin.html'),/id="admin-root"/);
 assert.match(read('../vite.config.ts'),/admin\.html/);
 assert.doesNotMatch(read('../src/admin-main.tsx'),/from '\.\/App'/);
 const manifest=JSON.parse(read('../public/admin.webmanifest'));
 assert.equal(manifest.start_url,'/admin.html');
 assert.equal(manifest.id,'/havana-nice-v2-administrador');
 assert.equal(manifest.display,'standalone');
});
test('PWA admin network-only HTML and safe automatic refresh',()=>{
 const sw=read('../public/sw.js');
 const main=read('../src/admin-main.tsx');
 assert.match(sw,/navigation && path === '\/admin\.html'\) return/);
 assert.match(main,/fetch\('\/admin\.html',\{cache:'no-store'\}\)/);
 assert.match(main,/serviceWorker\.register\('\/sw\.js'/);
});
test('five Administrator modules, only Acceso a músicos is active',()=>{
 for(const section of ['Acceso a músicos','Chat','Repertorio','Calendario','Más'])assert.ok(ui.includes(section));
 assert.match(ui,/useState<Tab>\('access'\)/);
 assert.match(ui,/fetchBackendHealth/);
 assert.match(panel,/section!=='access'/);
 assert.match(ui,/Por ahora no hay funciones activas/);
 assert.doesNotMatch(ui,/setTab\('requests'\)|setTab\('devices'\)/);
});
test('authenticated Administrator creates members from a real form, not mock data',()=>{
 assert.match(panel,/Añadir miembro/);
 assert.match(panel,/Añadir y autorizar/);
 assert.match(panel,/adminCreateMember\(session\.token,name\.trim\(\)\)/);
 assert.match(panel,/adminMembers\(token\)/);
 assert.match(panel,/Músicos autorizados/);
 assert.match(panel,/await refreshMembers\(session\.token\)/);
 assert.doesNotMatch(ui,/const fakeMembers|demoRequests|mockSessions/);
});
test('new musician endpoint requires a separate verified Administrator token',()=>{
 assert.match(backend,/url\.pathname === '\/api\/chat\/admin\/members'/);
 assert.match(backend,/if \(!await verifyAdminSession\(request,env\)\)/);
 assert.match(backend,/request\.method === 'POST'/);
 assert.match(backend,/INSERT OR IGNORE INTO chat_members\(username,actor_id,display_name,active\)/);
 assert.match(backend,/created\.meta\?\.changes/);
 assert.match(backend,/Este nombre ya existe en el Administrador/);
 assert.match(backend,/notifyAdminClients\(env,'members'\)/);
 assert.match(api,/adminCreateMember\(token:string,displayName:string\)/);
 assert.match(api,/authenticated\(token,\{method:'POST'/);
});
test('admin cannot leak credential or store privileged session in browser',()=>{
 for(const c of [ui,panel,api,read('../admin.html')]){
  assert.doesNotMatch(c,/localStorage\.|sessionStorage\.|indexedDB\.|V2_ADMIN_LOGIN_SECRET|V2_DEVICE_ADMIN_SECRET/);
 }
 assert.match(panel,/adminLogin\(password\)/);
 assert.match(panel,/adminLogout\(token\)/);
 assert.match(panel,/adminVerify\(session\.token\)/);
 assert.match(api,/cache:'no-store'/);
});
test('real-time admin list invalidates on membership changes',()=>{
 assert.match(api,/new WebSocket\(url,\['havana-v2-admin','admin\.'\+token\]\)/);
 assert.match(panel,/openAdminRealtime\(session\.token/);
 assert.match(panel,/event\.topic==='members'/);
 assert.match(panel,/document\.addEventListener\('visibilitychange',resume\)/);
});
test('musician PWA uses server allowlist instead of device experiments',()=>{
 const pwa=read('../src/App.tsx'),android=read('../../android/App.tsx');
 assert.match(pwa,/startNamedChatSession\(name\.trim\(\)\)/);
 assert.match(pwa,/Introduce el nombre que el Administrador creó y autorizó/);
 assert.match(android,/startNamedChatSession\(name\.trim\(\)\)/);
 assert.match(backend,/FROM chat_members WHERE username=\? AND active=1/);
 assert.match(backend,/normalizeMusicianName\(payload\?\.displayName\)/);
 assert.match(backend,/replace\(\/\\s\+\/g, ' '\)/);
});
test('original musician offline storage and Chat remain intact',()=>{
 const pwa=read('../src/App.tsx'),android=read('../../android/App.tsx');
 assert.match(pwa,/loadPendingEnrollment\(\)/);
 assert.match(pwa,/savePendingEnrollment\(pending\)/);
 assert.match(read('../src/local.ts'),/pending-device-enrollment-v1/);
 assert.match(read('../../android/chatStorage.ts'),/havana-v2-chat-local-v1/);
 assert.match(android,/loadNativePendingEnrollment/);
});

test('Administrator can explicitly close other sessions but cannot clear the current one',()=>{
 const ui=read('../src/AdminChatAccess.tsx');
 const api=read('../src/admin-api.ts');
 assert.match(ui,/adminOtherSessions\(session\.token\)/);
 assert.match(ui,/adminRevokeOtherSessions\(session\.token\)/);
 assert.match(ui,/window\.confirm\(/);
 assert.match(ui,/Cerrar otras sesiones/);
 assert.match(api,/\/api\/chat\/admin\/auth\/sessions/);
 assert.match(api,/\/api\/chat\/admin\/auth\/revoke-others/);
 assert.doesNotMatch(api,/adminDeviceRequests\(|adminDeviceAction\(/);
});
test('Administrator frontend defers new versions while its session or unsaved form is active',()=>{
 const main=read('../src/admin-main.tsx');
 const admin=read('../src/AdminApp.tsx');
 const access=read('../src/AdminChatAccess.tsx');
 assert.match(main,/adminSessionActive==='true'/);
 assert.match(main,/formHasDraft/);
 assert.match(main,/adminUpdatePending='true'/);
 assert.match(admin,/havana-admin-update-pending/);
 assert.match(admin,/Se aplicará cuando cierres sesión/);
 assert.match(access,/dataset\.adminSessionActive=session\?'true':'false'/);
});

test('Admin retains an authorized session during network outages and retries on resume',()=>{
 const access=read('../src/AdminChatAccess.tsx');
 const api=read('../src/admin-api.ts');
 assert.match(api,/export class AdminApiError extends Error/);
 assert.match(api,/export function isAdminUnauthorized/);
 assert.match(api,/reason instanceof AdminApiError && reason\.status===401/);
 assert.match(access,/if\(isAdminUnauthorized\(reason\)\)/);
 assert.match(access,/else setError\('Sin conexión temporal\. La sesión sigue abierta/);
 assert.match(access,/conservamos la sesión y los datos cargados/);
 assert.doesNotMatch(access,/catch\(\(\)=>setSession\(null\)\)/);
});

test('Access to musicians uses only server-confirmed list changes and fresh history',()=>{
 const access=read('../src/AdminChatAccess.tsx');
 const deletion=access.indexOf('await adminRemoveMember(session.token,person.actor_id,person.display_name)');
 const confirmedDelete=access.indexOf('setMembers(previous=>previous.filter(item=>item.actor_id!==person.actor_id))');
 assert.ok(deletion>0&&confirmedDelete>deletion,'Do not remove a musician from UI before server confirmation');
 const creation=access.indexOf('const result=await adminCreateMember(session.token,name.trim())');
 const confirmedCreate=access.indexOf('setMembers(previous=>previous.some(item=>item.actor_id===result.member.actor_id)');
 assert.ok(creation>0&&confirmedCreate>creation,'Do not display a created musician before D1 confirmed it');
 assert.match(access,/setHistory\(previous=>\{const next=\{\.\.\.previous\};delete next\[person\.actor_id\];return next;\}\)/);
 assert.match(access,/historyErrors\[person\.actor_id\]/);
 assert.match(access,/No se pudo consultar el historial en Cloudflare/);
 assert.match(access,/role="alert">\{historyErrors\[person\.actor_id\]\}/);
});
