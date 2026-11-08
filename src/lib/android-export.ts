type Reply = { id: string; ok: boolean; token?: string; cancelled?: boolean; error?: string };
type Bridge = { postMessage(message: string): void; onmessage: ((event: { data: string }) => void) | null };
declare global { interface Window { MediaForgeFiles?: Bridge } }

export function isAndroidApp() { return process.env.NEXT_PUBLIC_MEDIAFORGE_ANDROID === "1"; }

// One acknowledged chunk at a time keeps large exports out of a single base64 string.
export async function saveAndroidBlob(blob: Blob, filename: string): Promise<boolean> {
  const bridge = window.MediaForgeFiles;
  if (!bridge) throw new Error("Update Android System WebView, then reopen MediaForge to save files.");
  if (blob.size > 256 * 1024 * 1024) throw new Error("Android exports are limited to 256 MB. Try a smaller file or use the desktop app.");
  const pending = new Map<string, { resolve(reply: Reply): void; reject(error: Error): void }>();
  // A second Save must not replace the first request's reply handler.
  if (bridge.onmessage) throw new Error("Finish the open Save dialog before saving another file.");
  bridge.onmessage = event => {
    const reply: Reply = JSON.parse(event.data);
    const request = pending.get(reply.id);
    if (!request) return;
    pending.delete(reply.id);
    if (reply.ok) request.resolve(reply);
    else request.reject(new Error(reply.error || "The file could not be saved."));
  };
  function send(action: string, data: Record<string, unknown> = {}): Promise<Reply> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      pending.set(id, { resolve, reject });
      bridge!.postMessage(JSON.stringify({ id, action, ...data }));
    });
  }
  let token: string | undefined;
  try {
    token = (await send("start", { filename, mime: blob.type || "application/octet-stream", size: blob.size })).token;
    for (let offset = 0; offset < blob.size; offset += 192 * 1024) {
      const bytes = new Uint8Array(await blob.slice(offset, offset + 192 * 1024).arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      await send("chunk", { token, data: btoa(binary) });
    }
    const reply = await send("finish", { token });
    return !reply.cancelled;
  } catch (error) {
    if (token) await send("cancel", { token }).catch(() => {});
    throw error;
  } finally { bridge.onmessage = null; }
}
