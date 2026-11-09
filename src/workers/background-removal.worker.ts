import { removeBackground } from "@imgly/background-removal";

// A dedicated worker can be terminated instead of leaving model inference running.
self.onmessage = async (event: MessageEvent<{ file: File }>) => {
  try {
    const blob = await removeBackground(event.data.file, {
      model: "isnet_quint8", device: "cpu", proxyToWorker: false,
      output: { format: "image/png", quality: 0.92 },
      progress: (key, current, total) => self.postMessage({ progress: total > 0 ? Math.round(current / total * 100) : 0, key }),
    });
    self.postMessage({ blob });
  } catch (error) { self.postMessage({ error: error instanceof Error ? error.message : "Background removal failed." }); }
};
