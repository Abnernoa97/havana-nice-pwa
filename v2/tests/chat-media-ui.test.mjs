import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('One shared media policy and explicit upload-off switch',()=>{
 const src=read('packages/shared/src/index.ts');
 assert.match(src,/CHAT_MEDIA_UPLOAD_ENABLED=false as const/);
 assert.match(src,/export type ChatMediaKind='photo'\|'video'/);
 assert.match(src,/export function validateChatMediaSelection/);
 assert.match(src,/25\*1024\*1024/);
 assert.match(src,/512\*1024\*1024/);
 assert.doesNotMatch(src,/mimeTypes:\['audio\/|audio\/mpeg/);
});
test('PWA plus opens four photo/video selectors, local preview, never a fake send',()=>{
 const src=read('apps/pwa/src/App.tsx');
 for(const label of ['Galería · Foto','Galería · Video','Cámara · Foto','Cámara · Video'])
   assert.ok(src.includes(label),label);
 assert.match(src,/type="file"/);
 assert.match(src,/capture:'environment'/);
 assert.match(src,/URL.createObjectURL\(file\)/);
 assert.match(src,/URL.revokeObjectURL/);
 assert.match(src,/Quitar archivo seleccionado/);
 assert.match(src,/CHAT_MEDIA_UPLOAD_ENABLED/);
 assert.ok(src.includes("La subida a HAVANA CLOUD aún no está habilitada."));
 assert.doesNotMatch(src,/uploadPhoto\(|uploadVideo\(|POST.*media\/upload/);
 assert.match(src,/onSubmit=\{event => \{ event.preventDefault\(\); send\(\); \}\}/);
});
test('Android stays native and opens actual system gallery/camera, never creates a shadow Chat',()=>{
 const src=read('apps/android/App.tsx');
 const manifest=JSON.parse(read('apps/android/package.json'));
 const lock=JSON.parse(read('package-lock.json'));
 const app=JSON.parse(read('apps/android/app.json'));
 assert.equal(manifest.dependencies['expo-image-picker'],'~58.0.10');
 assert.equal(lock.packages['apps/android'].dependencies['expo-image-picker'],'~58.0.10');
 assert.equal(lock.packages['node_modules/expo-image-picker'].version,'58.0.10');
 assert.ok(app.expo.plugins.some(x=>Array.isArray(x)&&x[0]==='expo-image-picker'));
 for(const word of ['launchImageLibraryAsync','launchCameraAsync','requestCameraPermissionsAsync',
  'Galería · Foto','Galería · Video','Cámara · Foto','Cámara · Video'])
    assert.ok(src.includes(word),word);
 assert.match(src,/setSelectedMedia\(/);
 assert.match(src,/CHAT_MEDIA_UPLOAD_ENABLED/);
 assert.match(src,/La subida a HAVANA CLOUD aún no está habilitada/);
 assert.doesNotMatch(src,/fetch\(.*(?:upload|media).*(?:POST|PUT)/);
});
