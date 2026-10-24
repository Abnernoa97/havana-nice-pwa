import { existsSync, readFileSync } from 'node:fs';

const required = [
  'apps/android/App.tsx',
  'apps/android/app.json',
  'apps/pwa/src/App.tsx',
  'apps/pwa/public/manifest.webmanifest',
  'packages/shared/src/index.ts',
  'supabase/migrations/README.md',
  'docs/CONTINUITY.md',
];

const missing = required.filter((path) => !existsSync(new URL(`../${path}`, import.meta.url)));
if (missing.length) {
  console.error('Missing V2 foundation files:', missing);
  process.exit(1);
}
for (const path of ['package.json', 'apps/android/package.json', 'apps/pwa/package.json']) {
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
}
console.log('HAVANA NICE V2 foundation structure: OK');
