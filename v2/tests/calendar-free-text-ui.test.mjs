// Runtime regression: free-form Calendar dates must NEVER render "Invalid Date".
// This uses the real shared Calendar implementation, not a duplicated test parser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const shared=read('packages/shared/src/calendar.ts');
const compiled=ts.transpileModule(shared,{
 fileName:'calendar.ts',
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
});
const exported={};
runInNewContext(compiled.outputText,{exports:exported,URL,Date,Intl,fetch,Error,Number,String,RegExp});
const {calendarDate,safeCalendarMapUrl}=exported;

test('free-form event dates are shown exactly as entered by the Administrator',()=>{
 for(const value of ['14dic26','14 de dic. 2026','14/11/2026','Por definir','#A · 21:30','Mayo? 2027','😎 viernes']){
  assert.equal(calendarDate(value),value,'date '+value);
  assert.doesNotMatch(calendarDate(value),/Invalid Date|NaN|undefined/);
 }
 assert.equal(calendarDate(''),'Fecha por definir');
});

test('valid ISO dates are formatted, but invalid calendar dates do not turn into Invalid Date',()=>{
 const iso=calendarDate('2026-11-14');
 assert.match(iso,/14/);
 assert.match(iso,/noviembre/i);
 assert.doesNotMatch(iso,/Invalid Date|NaN/);
 assert.equal(calendarDate('2026-02-30'),'2026-02-30');
 assert.equal(calendarDate('2026-13-14'),'2026-13-14');
});

test('Google Maps text is stored/displayed freely but only safe HTTPS URLs are clickable',()=>{
 assert.equal(safeCalendarMapUrl('https://maps.google.com/?q=Mexico'),'https://maps.google.com/?q=Mexico');
 assert.equal(safeCalendarMapUrl('javascript:alert(1)'),null);
 assert.equal(safeCalendarMapUrl('Lugar #3 y calle 22'),null);
});

test('Admin, PWA and native Calendar all use the same shared date function',()=>{
 const paths=['apps/pwa/src/AdminCalendar.tsx','apps/pwa/src/CalendarAccordion.tsx',
  'apps/android/NativeCalendar.tsx'];
 for(const p of paths){
  const source=read(p);
  assert.match(source,/calendarDate\(item\.date\)/,p);
  assert.doesNotMatch(source,/new Date\(item\.date\)|Date\.parse\(item\.date\)|Invalid Date/,p);
 }
 const pwa=read('apps/pwa/src/CalendarAccordion.tsx');
 const native=read('apps/android/NativeCalendar.tsx');
 assert.match(pwa,/safeCalendarMapUrl\(item\.mapUrl\)/);
 assert.match(native,/safeCalendarMapUrl\(item\.mapUrl\)/);
});
