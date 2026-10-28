import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('One shared photo/video policy, with upload disabled across clients',()=>{
 const src=read('packages/shared/src/index.ts');
 assert.match(src,/CHAT_MEDIA_UPLOAD_ENABLED=false as const/);
 assert.match(src,/export type ChatMediaKind='photo'\|'video'/);
 assert.match(src,/export function validateChatMediaSelection/);
 assert.match(src,/25\*1024\*1024/);
 assert.match(src,/512\*1024\*1024/);
 assert.doesNotMatch(src,/audio\/mpeg|mimeTypes:\['audio\//);
});
test('PWA has ONE WhatsApp-style dock, not the obsolete expanded four-button grid',()=>{
 const src=read('apps/pwa/src/App.tsx');
 const css=read('apps/pwa/src/styles.css');
 const icons=read('apps/pwa/src/ChatComposerIcon.tsx');
 for(const word of ['chat-input-pill','chat-action-circle','chat-attachments-popover',
  'chat-emojis-popover','galleryPicker','cameraPicker','openMediaPicker(\'camera\')'])
  assert.ok(src.includes(word),'Expected '+word);
 for(const icon of ['emoji','clip','camera','mic','send'])assert.ok(icons.includes("case '"+icon+"'"));
 for(const old of ['chat-attach-button','chat-media-menu','mediaMenuOpen','mediaInputs'])
  assert.ok(!src.includes(old)&&!css.includes(old),'Obsolete '+old);
 assert.equal((src.match(/<form className="chat-composer"/g)||[]).length,1);
 assert.equal((src.match(/<button type="submit" className="chat-action-circle"/g)||[]).length,1);
 assert.match(src,/aria-label="Adjuntar fotografía o video"/);
 assert.match(src,/aria-label="Abrir cámara"/);
 assert.match(src,/aria-label="Insertar emoji"/);
 assert.match(src,/La subida a HAVANA CLOUD aún no está habilitada/);
 assert.match(src,/URL.createObjectURL\(file\)/);
 assert.match(src,/URL.revokeObjectURL/);
 assert.match(src,/type="file"/);
 assert.match(src,/capture="environment"/);
 assert.doesNotMatch(src,/uploadPhoto\(|uploadVideo\(|POST.*media\/upload/);
 assert.match(src,/onSubmit=\{event=>\{event.preventDefault\(\);send\(\);\}\}/);
 assert.match(css,/position:absolute;bottom:76px/);
 assert.match(css,/\.chat-attachments-popover/);
});
test('Android native has ONE compact dock, system camera/gallery and overlay panel',()=>{
 const src=read('apps/android/App.tsx');
 const icons=read('apps/android/ChatComposerIcon.tsx');
 const manifest=JSON.parse(read('apps/android/package.json'));
 const lock=JSON.parse(read('package-lock.json'));
 const app=JSON.parse(read('apps/android/app.json'));
 assert.equal(manifest.dependencies['expo-image-picker'],'~58.0.10');
 assert.equal(lock.packages['apps/android'].dependencies['expo-image-picker'],'~58.0.10');
 assert.equal(lock.packages['node_modules/expo-image-picker'].version,'58.0.10');
 assert.ok(app.expo.plugins.some(x=>Array.isArray(x)&&x[0]==='expo-image-picker'));
 for(const word of ['launchImageLibraryAsync','launchCameraAsync','requestCameraPermissionsAsync',
  'styles.inputPill','styles.composerIcon','styles.sendCircle','styles.attachmentsPopover',
  'styles.composerPanelDismiss','mediaTypes:[\'images\',\'videos\']'])
  assert.ok(src.includes(word),'Expected '+word);
 for(const icon of ["name=\"emoji\"","name=\"clip\"","name=\"camera\"","name=\"mic\"","name=\"send\""])
  assert.ok(src.includes(icon),'Expected '+icon);
 assert.match(icons,/Dependency-free native shapes/);
 for(const old of ['mediaMenuOpen','styles.mediaMenu','styles.mediaPlus','styles.sendButton',
  'Galería · Foto','Galería · Video','Cámara · Foto','Cámara · Video'])
  assert.ok(!src.includes(old),'Obsolete '+old);
 assert.match(src,/CHAT_MEDIA_UPLOAD_ENABLED/);
 assert.match(src,/La subida a HAVANA CLOUD aún no está habilitada/);
 assert.doesNotMatch(src,/fetch\(.*(?:upload|media).*(?:POST|PUT)/);
});
test('Microphone is informative but recording is NOT activated ahead of M03',()=>{
 const pwa=read('apps/pwa/src/App.tsx');
 const native=read('apps/android/App.tsx');
 assert.match(pwa,/Los mensajes de voz se habilitarán después de fotos y videos/);
 assert.match(native,/Los audios estarán disponibles después de las fotografías y los videos/);
 assert.doesNotMatch(native,/requestMicrophonePermissionsAsync|startRecording\(/);
 assert.doesNotMatch(pwa,/getUserMedia|MediaRecorder/);
});
