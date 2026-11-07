import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalActivityStats, recordLocalExport } from '../../src/lib/local-processing/activity-stats.ts';
import { formatFileSize } from '../../src/lib/local-processing/blob-utils.ts';

test('blocked localStorage never prevents recording or reading an export', () => {
  globalThis.window = new EventTarget();
  Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError');}});
  assert.equal(readLocalActivityStats().totalExports,0);
  assert.doesNotThrow(()=>recordLocalExport({filename:'output.png',bytes:12}));
  delete globalThis.window;
});
test('corrupt and poisoned stats are normalized without destroying valid counters', () => {
  let saved = JSON.stringify({totalExports:'999',conversions:4,bytesExported:-3,lastFilename:{secret:'bad'}});
  globalThis.window = new EventTarget();
  window.localStorage = {getItem:()=>saved,setItem:(_key,value)=>{saved=value;}};
  assert.equal(readLocalActivityStats().totalExports,0);
  assert.equal(readLocalActivityStats().conversions,4);
  recordLocalExport({filename:'image.png',bytes:15,kind:'conversion'});
  assert.equal(readLocalActivityStats().totalExports,1);
  assert.equal(readLocalActivityStats().conversions,5);
  assert.equal(readLocalActivityStats().bytesExported,15);
  saved = '{invalid';
  assert.equal(readLocalActivityStats().totalExports,0);
  window.localStorage.setItem=()=>{throw new DOMException('full','QuotaExceededError');};
  assert.doesNotThrow(()=>recordLocalExport({filename:'output',bytes:20}));
  delete globalThis.window;
});
test('file size displays stay finite for invalid and huge values', () => {
  assert.equal(formatFileSize(-5),'0 Bytes');
  assert.equal(formatFileSize(NaN),'0 Bytes');
  assert.match(formatFileSize(2**50),/GB$/);
});
