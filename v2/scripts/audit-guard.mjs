import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const worker = read('cloudflare/src/index.ts');
const android = read('apps/android/App.tsx');
const pwa = read('apps/pwa/src/App.tsx');
const nativeBubble = read('apps/android/SwipeableBubble.tsx');
const webBubble = read('apps/pwa/src/SwipeMessage.tsx');
const pwaStyles = read('apps/pwa/src/styles.css');
const serviceWorker = read('apps/pwa/public/sw.js');
const workerConfig = read('cloudflare/wrangler.jsonc');
const androidWorkflow = read('../.github/workflows/v2-android-apk.yml');
const distributor = read('../.github/workflows/v2-apk-direct-download.yml');
const readme = read('README.md');

function absent(content,pattern,label) {
  assert.equal(pattern.test(content),false,label);
}
function present(content,pattern,label) {
  assert.ok(pattern.test(content),label);
}

// Automatic preflight checks that guard the V2 architecture against regressions.
for(const [value,label] of [[worker,'Worker'],[android,'Android'],[pwa,'PWA']]) {
  absent(value,/LAB_CODE_SHA256|startLabChatSession|Clave de laboratorio|accessCode/,
    label+' must not revive the old laboratory password');
}
present(worker,/JOIN chat_members/,'Worker must validate the enabled member on session reuse');
present(worker,/active=1/,'Worker must deny revoked names');
present(worker,/chat\.revoked/,'Worker must notify active sessions when access is revoked');
present(android,/restoreNamedChatSession/,'Android must restore only authorized remembered sessions');
present(pwa,/restoreNamedChatSession/,'PWA must restore only authorized remembered sessions');

absent(serviceWorker,/cache\.put\(event\.request,\s*copy\)/,
  'Never store arbitrary network replies in browser caches');
present(serviceWorker,/req\.headers\.has\('authorization'\)/,
  'Reject API requests with Authorization headers in PWA service worker');
present(serviceWorker,/url\.origin !== self\.location\.origin/,
  'Reject cross-origin requests in service worker');
present(serviceWorker,/path\.startsWith\('\/assets\/'\)/,
  'Only approved static app resources are cached');

absent(workerConfig,/"r2_buckets"\s*:/i,'Never bind billed R2 storage to V2');
absent(workerConfig,/"V2_MEDIA_UPLOADS"\s*:\s*"enabled"/,
  'Do not enable unapproved media uploads');
present(readme,/R2 (?:desactivado|descartado)/i,'README must state that billed R2 is unavailable');
present(androidWorkflow,/retention-days:\s*1\b/,'Keep Android build artifacts for one day');
absent(androidWorkflow,/retention-days:\s*30\b/,'No 30-day APK artifacts');
absent(distributor,/RUN_ID=\d{8,}/,'Distributor must not publish a pinned stale APK');
present(distributor,/--commit "\$SHA"/,'Distributor must match exact Android source commit');

// C01: both interfaces anchor the long-press menu to a real bubble; do not
// allow the old centered overlay or inert '+' to regress on Android/iPhone.
present(nativeBubble,/measureInWindow\(/,'Native Chat must measure held bubble');
present(android,/onLongPress=\{\(anchor\) => showMessageMenu\(message,anchor\)\}/,
  'Native Chat must show the contextual menu for the measured message');
present(android,/menuTop/,'Native contextual menu must calculate a bounded top coordinate');
// Android 16 / Expo edge-to-edge: the composer must move above the IME.
// A layout that relies only on adjustResize left the input behind the keyboard.
present(android,/behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}/,
  'Native Android Chat must avoid IME with explicit height behavior');
present(android,/keyboardVerticalOffset=\{0\}/,
  'Native Chat keyboard offset must be predictable');
present(android,/Responder/,'Native contextual menu must provide a reply action');
absent(android,/whatsappPlus|whatsappPlusText/,'Remove inert extra-reaction button on Android');
present(webBubble,/getBoundingClientRect\(\)/,'PWA Chat must measure held message');
present(pwa,/onLongPress=\{anchor=>showMessageMenu\(message,anchor\)\}/,
  'PWA Chat must show its contextual menu for the held message');
present(pwa,/aria-modal="true"/,'PWA contextual menu must be a dialog');
present(pwa,/Responder/,'PWA contextual menu must provide a reply action');
absent(pwa,/Cerrar reacciones|>＋<\/button>/,'Remove inert extra-reaction button in PWA');
present(pwaStyles,/\.whatsapp-context\{position:absolute;/,
  'PWA menu must be anchored instead of centered');
absent(pwaStyles,/\.message-menu-overlay\{[^}]*justify-content:center/,
  'Never center contextual menu on entire PWA screen');
assert.equal((pwaStyles.match(/\{/g)||[]).length,(pwaStyles.match(/\}/g)||[]).length,
  'All PWA stylesheet braces must be balanced');

console.log('HAVANA NICE V2 — preventive audit guard: PASS');
