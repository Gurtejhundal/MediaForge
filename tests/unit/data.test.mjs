import test from 'node:test';
import assert from 'node:assert/strict';
import { csvToJson, jsonToCsv, convertFileLocally } from '../../src/lib/local-processing/document-processing.ts';
import { parsePages, parseOrder, processPdfLocally } from '../../src/lib/local-processing/pdf-processing.ts';
import { PDFDocument } from 'pdf-lib';

test('CSV preserves commas, quotes, multiline cells, whitespace, BOM and prototype-like keys', () => {
  const rows = csvToJson('\ufeffname,note,__proto__\r\n"Ada, L","line one\nline ""two""",safe\r\n Grace ,ok,own');
  assert.deepEqual(rows, [{name:'Ada, L',note:'line one\nline "two"', ['__proto__']:'safe'}, {name:' Grace ',note:'ok',['__proto__']:'own'}]);
  assert.equal(Object.getPrototypeOf(rows[0]), Object.prototype);
});
test('CSV preserves intentionally empty records and ignores a blank physical line', () => {
  assert.deepEqual(csvToJson('a,b\n,\n\n'),[{a:'',b:''}]);
  assert.deepEqual(csvToJson('a\n""\n'),[{a:''}]);
});
test('CSV rejects malformed records rather than silently dropping data', () => {
  for (const value of ['a,a\n1,2', 'a,b\n1,2,3', 'a,b\n"unfinished,2', 'a,b\n"closed"junk,2']) assert.throws(() => csvToJson(value));
});
test('JSON to CSV includes columns from every row and quotes headers', () => {
  const output = jsonToCsv([{'first,name':'Ada'}, {note:'a,b', 'first,name':'Grace'}]);
  assert.deepEqual(csvToJson(output), [{'first,name':'Ada',note:''},{'first,name':'Grace',note:'a,b'}]);
});
test('nested YAML and scalar types survive conversion to JSON', async () => {
  const result = await convertFileLocally(new File(['name: "yes"\nitems:\n  - one\n  - two\nactive: true\ncount: 2'], 'input.yaml'), 'json');
  assert.deepEqual(JSON.parse(await result.blob.text()), {name:'yes',items:['one','two'],active:true,count:2});
});
test('JSON null remains a supported structured input', async () => {
  const result = await convertFileLocally(new File(['null'], 'input.json'), 'yaml');
  assert.equal((await result.blob.text()).trim(),'null');
});
test('Markdown output treats active HTML as text', async () => {
  const result = await convertFileLocally(new File(['# Hello\n\n<script>alert(1)</script>'], 'input.md'), 'html');
  assert.doesNotMatch(await result.blob.text(), /<script>/i);
});
test('page selections reject partial numbers, oversized ranges and reversed ranges promptly', () => {
  for (const value of ['1x','1.5','1-999999999999','2-1','1-2-3','1,,2','4','0']) assert.throws(() => parsePages(value,3));
  assert.deepEqual(parsePages('3,1-2,2',3),[2,0,1]);
});
test('reordering cannot accidentally omit or duplicate pages', () => {
  for (const value of ['1,2','1,1,3','1,2,nope','1,2,4']) assert.throws(() => parseOrder(value,3));
  assert.deepEqual(parseOrder('3,1,2',3),[2,0,1]);
});
test('PDF extraction and reordering produce the requested real pages', async () => {
  const source = await PDFDocument.create();
  for (const width of [100,200,300]) source.addPage([width,400]);
  const file = new File([await source.save()], 'source.pdf', {type:'application/pdf'});
  const result = await processPdfLocally([file],{mode:'organize',pageOrder:'3,1,2'});
  const output = await PDFDocument.load(await result.blob.arrayBuffer());
  assert.deepEqual(output.getPages().map(p=>p.getWidth()),[300,100,200]);
  await assert.rejects(processPdfLocally([file],{mode:'removePages',pages:'1-3'}),/empty PDF/);
});
