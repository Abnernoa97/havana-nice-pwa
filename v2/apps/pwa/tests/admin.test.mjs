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
