import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('APK creation occurs only through an explicitly approved batch marker',()=>{
 const yaml=read('../.github/workflows/v2-android-apk.yml');
 assert.match(yaml,/workflow_dispatch:/);
 assert.match(yaml,/push:\n\s+branches:\s*\[havana-nice-v2-foundation\]\n\s+paths:\n\s+- 'v2\/releases\/android-batch\.json'/);
 assert.doesNotMatch(yaml,/^\s+- 'v2\/apps\/android\/app\.json'/m);
 assert.doesNotMatch(yaml,/^\s+- '\.github\/workflows\/v2-android-apk\.yml'/m);
 assert.match(yaml,/m\.releaseMode!=='explicit-batch'/);
 assert.match(yaml,/m\.approved!==true/);
 assert.match(yaml,/m\.version!==app\.version/);
 assert.match(yaml,/m\.versionCode!==app\.android\.versionCode/);
 assert.match(yaml,/app\.android\.package!=='com\.havananice\.v2'/);
 assert.match(yaml,/m\.notes\.trim\(\)\.length<10/);
});

test('No unapproved Android release manifest exists on the development branch',()=>{
 // Deliberate release is created only on explicit owner approval.
 assert.equal(existsSync(new URL('../releases/android-batch.json',import.meta.url)),false);
});

test('Normal development CI validates Android code but does not assemble/publish APKs',()=>{
 const ci=read('../.github/workflows/v2-foundation-check.yml');
 assert.match(ci,/Export Android bundle/);
 assert.match(ci,/npm run export -w @havana\/android/);
 assert.doesNotMatch(ci,/assembleRelease|git worktree add|HAVANA-NICE-V2-LATEST\.apk/);
});
