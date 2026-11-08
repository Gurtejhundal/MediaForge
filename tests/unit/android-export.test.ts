import test from "node:test";
import assert from "node:assert/strict";
import { saveAndroidBlob } from "../../src/lib/android-export";

test("Android export waits for the native save result and streams exact bytes in bounded chunks", async () => {
  const bytes = Uint8Array.from({ length: 500_000 }, (_, i) => i % 251);
  const received: Buffer[] = [];
  let finish: (() => void) | undefined;
  const bridge = {
    onmessage: null as null | ((event: { data: string }) => void),
    postMessage(message: string) {
      const request = JSON.parse(message);
      const respond = (data = {}) => queueMicrotask(() => bridge.onmessage?.({ data: JSON.stringify({ id: request.id, ok: true, ...data }) }));
      if (request.action === "start") respond({ token: "test-token" });
      else {
        assert.equal(request.token, "test-token");
        if (request.action === "chunk") { const part = Buffer.from(request.data, "base64"); assert.ok(part.length <= 192 * 1024); received.push(part); respond(); }
        if (request.action === "finish") finish = () => respond();
      }
    },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { MediaForgeFiles: bridge } });
  try {
    let completed = false;
    const saved = saveAndroidBlob(new Blob([bytes]), "example.bin").then(result => { completed = true; return result; });
    while (!finish) await new Promise(resolve => setTimeout(resolve, 1));
    assert.equal(completed, false, "Preparing bytes must not be counted as a saved file");
    await assert.rejects(saveAndroidBlob(new Blob(["another"]), "other.txt"), /Finish the open Save dialog/);
    finish();
    assert.equal(await saved, true);
    assert.deepEqual(Buffer.concat(received), Buffer.from(bytes));
    assert.equal(bridge.onmessage, null);
  } finally { Reflect.deleteProperty(globalThis, "window"); }
});

test("Android cancelled saves report cancellation and native failures clear the pending handler", async () => {
  for (const failure of [false, true]) {
    const bridge = {
      onmessage: null as null | ((event: { data: string }) => void),
      postMessage(message: string) {
        const request = JSON.parse(message);
        const result = request.action === "start" ? { token: "token" } : request.action === "finish" ? failure ? { ok: false, error: "Storage full" } : { cancelled: true } : {};
        queueMicrotask(() => bridge.onmessage?.({ data: JSON.stringify({ id: request.id, ok: true, ...result }) }));
      },
    };
    Object.defineProperty(globalThis, "window", { configurable: true, value: { MediaForgeFiles: bridge } });
    try {
      const save = saveAndroidBlob(new Blob(["result"]), "result.txt");
      if (failure) await assert.rejects(save, /Storage full/);
      else assert.equal(await save, false);
      assert.equal(bridge.onmessage, null);
    } finally { Reflect.deleteProperty(globalThis, "window"); }
  }
});
