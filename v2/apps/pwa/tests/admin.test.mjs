import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const ui=read('../src/AdminApp.tsx'),main=read('../src/admin-main.tsx');
test('admin has a separate static PWA entry and no Chat components',()=>{
 assert.match(read('../admin.html'),/id="admin-root"/);
 assert.match(read('../vite.config.ts'),/admin\.html/);
 assert.doesNotMatch(main,/from '\.\/App'/);
});
test('admin never bundles secrets or produces fake privileged API calls',()=>{
 for(const content of [ui,main,read('../admin.html')]){
   assert.doesNotMatch(content,/V2_DEVICE_ADMIN_SECRET|Authorization:\s*Bearer|localStorage\.|sessionStorage\.|requestSecret|api\/chat\/admin/);
 }
 assert.match(read('../src/AdminChatAccess.tsx'),/adminDeviceAction/);
 assert.match(read('../src/AdminChatAccess.tsx'),/adminDeviceRequests/);
 assert.doesNotMatch(ui,/Permisos de músicos protegidos/);
});
test('admin HTML uses network-only navigation and does not register worker',()=>{
 assert.match(read('../public/sw.js'),/navigation && path === '\/admin\.html'\) return/);
 assert.match(main,/serviceWorker\.register\('\/sw\.js'/);
 assert.match(read('../public/sw.js'),/navigation && path === '\/admin\.html'\) return/);
});

test('the one Administrator is independently installable on Android and iPhone',()=>{
 const manifest=JSON.parse(read('../public/admin.webmanifest'));
 assert.equal(manifest.start_url,'/admin.html');
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.id,'/havana-nice-v2-administrador');
 assert.equal(manifest.icons.length,2);
 assert.match(read('../admin.html'),/href="\/admin.webmanifest"/);
 assert.match(read('../admin.html'),/apple-touch-icon/);
});
test('Chat panel reads real Worker health and keeps private actions disabled',()=>{
 assert.match(ui,/fetchBackendHealth/);
 assert.match(ui,/data\.database==='ok'/);
 assert.match(ui,/setTab\('requests'\)/);
 assert.doesNotMatch(ui,/const fakeMembers|demoRequests|mockSessions/);
});
test('installed Administrator refreshes from network-only HTML, without new APK',()=>{
 assert.match(main,/serviceWorker\.register\('\/sw\.js'/);
 assert.match(main,/fetch\('\/admin\.html',\{cache:'no-store'\}\)/);
 assert.match(main,/window\.location\.reload\(\)/);
 assert.match(read('../public/sw.js'),/navigation && path === '\/admin\.html'\) return/);
});

test('privileged controls require separate login, never musician identity',()=>{
 const component=read('../src/AdminChatAccess.tsx');
 const api=read('../src/admin-api.ts');
 assert.match(component,/if\(!session\)return/);
 assert.match(component,/adminLogin\(password\)/);
 assert.match(component,/adminLogout\(value\)/);
 assert.match(component,/adminDeviceAction\(session\.token/);
 assert.match(component,/adminAvailability\(\)/);
 assert.doesNotMatch(component+api,/localStorage\.|sessionStorage\.|indexedDB\.|V2_ADMIN_LOGIN_SECRET/);
});

test('member information is retrieved only through administrator-verified API',()=>{
 const backend=read('../../../cloudflare/src/index.ts');
 const adminApi=read('../src/admin-api.ts');
 const memberUi=read('../src/AdminChatAccess.tsx');
 assert.match(backend,/url\.pathname === '\/api\/chat\/admin\/members'/);
 assert.match(backend,/if \(!await verifyAdminSession\(request,env\)\)/);
 assert.match(adminApi,/adminMembers\(token:string\)/);
 assert.match(memberUi,/Credenciales vigentes/);
 assert.doesNotMatch(backend,/SELECT\s+\*\s+FROM\s+chat_admin_sessions/);
});

test('one connected members panel; no contradictory duplicate placeholder',()=>{
 const ui=read('../src/AdminApp.tsx');
 const component=read('../src/AdminChatAccess.tsx');
 assert.doesNotMatch(ui,/Permisos de músicos protegidos|Integrantes del Chat/);
 assert.match(component,/Músicos de HAVANA NICE V2/);
});
