export function removeBackgroundCancellable(file: File, signal: AbortSignal, progress: (key: string, percent: number) => void): Promise<Blob> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../../workers/background-removal.worker.ts", import.meta.url), { type: "module" });
    const cleanup = () => { clearTimeout(timeout); signal.removeEventListener("abort", abort); worker.terminate(); };
    const abort = () => { cleanup(); reject(new DOMException("Processing cancelled", "AbortError")); };
    const timeout = setTimeout(() => { cleanup(); reject(new Error("Background removal timed out. Try a smaller image and check the model download connection.")); }, 300000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onerror = () => { cleanup(); reject(new Error("The background-removal worker failed. Check that this browser supports workers and model assets are reachable.")); };
    worker.onmessage = (event: MessageEvent<{ blob?: Blob; error?: string; progress?: number; key?: string }>) => {
      if (event.data.blob) { cleanup(); resolve(event.data.blob); }
      else if (event.data.error) { cleanup(); reject(new Error(event.data.error)); }
      else progress(event.data.key || "model", event.data.progress || 0);
    };
    if (signal.aborted) abort(); else worker.postMessage({ file });
  });
}
