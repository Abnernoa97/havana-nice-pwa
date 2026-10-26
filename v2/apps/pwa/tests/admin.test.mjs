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
 assert.match(ui,/disabled type="button">Aprobar/);
 assert.match(ui,/disabled>Revocar dispositivo/);
 assert.match(ui,/disabled>Administrar acceso/);
});
test('admin HTML uses network-only navigation and does not register worker',()=>{
 assert.match(read('../public/sw.js'),/navigation && path === '\/admin\.html'\) return/);
 assert.doesNotMatch(main,/serviceWorker\.register/);
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
