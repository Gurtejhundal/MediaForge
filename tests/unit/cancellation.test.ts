import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abortable } from '../../src/lib/local-processing/cancellation';

test('cancelling a pending operation settles immediately and late completion cannot publish it', async () => {
  const controller=new AbortController();
  let complete!: (value:string)=>void;
  const pending=abortable(new Promise<string>(resolve=>{complete=resolve}),controller.signal);
  controller.abort();
  await assert.rejects(pending,{name:'AbortError'});
  complete('late output');
});
test('successful operations and real failures retain their result', async () => {
  const controller=new AbortController();
  assert.equal(await abortable(Promise.resolve('output'),controller.signal),'output');
  await assert.rejects(abortable(Promise.reject(new Error('decode failed')),controller.signal),/decode failed/);
});
