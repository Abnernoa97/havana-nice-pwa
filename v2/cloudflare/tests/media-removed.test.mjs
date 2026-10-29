import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('V2 has no external storage bridge or authorization routes',()=>{
 const cfg=JSON.parse(src('wrangler.jsonc'));
 assert.equal(cfg.name,'havana-nice-v2-dev');
 assert.equal(cfg.services,undefined);
 assert.equal(cfg.vars.V2_CLOUD_LINK_ENABLED,undefined);
 assert.equal(cfg.vars.V2_CLOUD_MEDIA_ENABLED,undefined);
 for(const file of ['cloud-link.js','cloud-media-adapter.js','unified-media.js']){
  assert.equal(existsSync(new URL('../src/'+file,import.meta.url)),false);
 }
 const worker=src('src/index.ts');
 assert.doesNotMatch(worker,/handleCloudLinkAdmin|HAVANA_CLOUD_BRIDGE|attachChatMedia/);
 assert.match(worker,/media: 'not-configured'/);
 assert.match(worker,/enabled:false,maxFilesPerSend:5/);
});
test('Text message deletion is independent of any outside file storage',()=>{
 const source=src('src/message-removal.js');
 assert.doesNotMatch(source,/cloudDelete|chat_cloud_uploads|chat_media_assets/);
 assert.match(source,/DELETE FROM chat_messages WHERE seq=\?/);
 assert.match(source,/UPDATE chat_messages SET reply_to_seq=NULL/);
});
