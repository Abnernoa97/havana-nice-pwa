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
