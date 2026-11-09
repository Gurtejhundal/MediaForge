import { safeBaseName } from "./blob-utils";

export type VideoResolutionMode = "original" | "1080p" | "720p" | "480p" | "1440p" | "2160p";
export interface LocalVideoOptions {
  resolution: VideoResolutionMode;
  fps?: number;
  includeAudio?: boolean;
  signal?: AbortSignal;
  transform?: (ctx: CanvasRenderingContext2D, scale: { x: number; y: number }) => void;
  onProgress?: (progress: number) => void;
}
export interface LocalVideoResult { blob: Blob; filename: string; }

function targetBounds(resolution: VideoResolutionMode) {
  if (resolution === "2160p") return { width: 3840, height: 2160 };
  if (resolution === "1440p") return { width: 2560, height: 1440 };
  if (resolution === "1080p") return { width: 1920, height: 1080 };
  if (resolution === "720p") return { width: 1280, height: 720 };
  if (resolution === "480p") return { width: 854, height: 480 };
  return null;
}
function fitWithin(width: number, height: number, resolution: VideoResolutionMode) {
  const bounds = targetBounds(resolution);
  if (!bounds) return { width, height };
  const ratio = Math.min(bounds.width / width, bounds.height / height);
  return { width: Math.max(2, Math.round(width * ratio / 2) * 2), height: Math.max(2, Math.round(height * ratio / 2) * 2) };
}
function loadVideo(video: HTMLVideoElement, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); video.removeEventListener("loadeddata", loaded); video.removeEventListener("error", failed); signal?.removeEventListener("abort", aborted); };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error("This browser could not decode the selected video.")); };
    const aborted = () => { cleanup(); reject(new DOMException("Processing cancelled", "AbortError")); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("Video loading timed out.")); }, 15000);
    video.addEventListener("loadeddata", loaded); video.addEventListener("error", failed);
    signal?.addEventListener("abort", aborted, { once: true });
    if (signal?.aborted) aborted();
    else if (video.readyState >= 2) loaded();
  });
}

export async function renderVideoToWebMLocally(file: File, options: LocalVideoOptions): Promise<LocalVideoResult> {
  options.signal?.throwIfAborted();
  if (!("MediaRecorder" in window)) throw new Error("MediaRecorder is not available in this browser.");
  const includeAudio = options.includeAudio !== false;
  const candidates = includeAudio ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"] : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mimeType = candidates.find(type => MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw new Error("This browser cannot export WebM video locally.");
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.playsInline = true; video.preload = "auto"; video.muted = !includeAudio;
  let audio: AudioContext | undefined;
  let source: MediaElementAudioSourceNode | undefined;
  let stream: MediaStream | undefined;
  let recorder: MediaRecorder | undefined;
  let interval: ReturnType<typeof setInterval> | undefined;
  try {
    // Resume during the click gesture, before asynchronous video loading.
    if (includeAudio) { audio = new AudioContext(); await audio.resume(); }
    options.signal?.throwIfAborted();
    video.src = url;
    await loadVideo(video, options.signal);
    if (!Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth || !video.videoHeight) throw new Error("This video has no finite duration or decodable dimensions.");
    const output = fitWithin(video.videoWidth, video.videoHeight, options.resolution);
    const canvas = document.createElement("canvas"); canvas.width = output.width; canvas.height = output.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    const fps = options.fps || 24;
    stream = canvas.captureStream(fps);
    if (audio) {
      source = audio.createMediaElementSource(video);
      const destination = audio.createMediaStreamDestination();
      source.connect(destination); // Record locally; never route to speakers/microphone.
      destination.stream.getAudioTracks().forEach(track => stream!.addTrack(track));
    }
    const draw = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      options.transform?.(ctx, { x: canvas.width / video.videoWidth, y: canvas.height / video.videoHeight });
      options.onProgress?.(Math.min(99, Math.round(video.currentTime / video.duration * 100)));
    };
    draw();
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 128_000 });
    const chunks: Blob[] = [];
    let encodedBytes = 0;
    const finished = new Promise<Blob>((resolve, reject) => {
      recorder!.ondataavailable = event => {
        if (event.data.size) { chunks.push(event.data); encodedBytes += event.data.size; }
        if (encodedBytes > 256 * 1024 * 1024) { reject(new Error("Video export exceeded 256 MB. Use a shorter or lower-resolution clip.")); video.dispatchEvent(new Event("error")); }
      };
      recorder!.onerror = () => { reject(new Error("Local video encoding failed.")); video.dispatchEvent(new Event("error")); };
      recorder!.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    });
    void finished.catch(() => {}); // Playback failure can occur before awaiting encoder completion.
    recorder.start(250);
    interval = setInterval(draw, 1000 / fps);
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); video.removeEventListener("ended", ended); video.removeEventListener("error", failed); options.signal?.removeEventListener("abort", aborted); };
      const ended = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(new Error("Video playback or encoding failed. No partial export was saved.")); };
      const aborted = () => { cleanup(); reject(new DOMException("Processing cancelled", "AbortError")); };
      const timer = setTimeout(() => { cleanup(); reject(new Error("Video rendering timed out. Keep the tab visible and try a shorter clip.")); }, video.duration * 3000 + 15000);
      video.addEventListener("ended", ended); video.addEventListener("error", failed);
      options.signal?.addEventListener("abort", aborted, { once: true });
      if (options.signal?.aborted) aborted();
      else void video.play().catch(error => { cleanup(); reject(error); });
    });
    clearInterval(interval); draw(); options.signal?.throwIfAborted();
    recorder.stop();
    const blob = await finished;
    options.signal?.throwIfAborted();
    if (!blob.size) throw new Error("The encoder returned an empty video.");
    options.onProgress?.(100);
    return { blob, filename: `${safeBaseName(file.name)}-${options.resolution === "original" ? "local" : options.resolution}.webm` };
  } finally {
    clearInterval(interval);
    if (recorder && recorder.state !== "inactive") recorder.stop();
    video.pause(); source?.disconnect();
    stream?.getTracks().forEach(track => track.stop());
    if (audio && audio.state !== "closed") await audio.close();
    video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url);
  }
}

export function makeBlurRegionTransform(region: { x: number; y: number; w: number; h: number }, blurPx = 28) {
  const source = document.createElement("canvas");
  const pixelated = document.createElement("canvas");
  const sourceCtx = source.getContext("2d");
  const pixelatedCtx = pixelated.getContext("2d");

  return (ctx: CanvasRenderingContext2D, scale: { x: number; y: number }) => {
    const x = Math.max(0, region.x * scale.x);
    const y = Math.max(0, region.y * scale.y);
    const w = Math.min(ctx.canvas.width - x, Math.max(1, region.w * scale.x));
    const h = Math.min(ctx.canvas.height - y, Math.max(1, region.h * scale.y));
    if (!sourceCtx || !pixelatedCtx || w <= 0 || h <= 0) return;

    const pad = Math.min(42, Math.max(14, blurPx));
    const sx = Math.max(0, x - pad);
    const sy = Math.max(0, y - pad);
    const sw = Math.min(ctx.canvas.width - sx, w + pad * 2);
    const sh = Math.min(ctx.canvas.height - sy, h + pad * 2);

    source.width = Math.max(1, Math.round(sw));
    source.height = Math.max(1, Math.round(sh));
    sourceCtx.clearRect(0, 0, source.width, source.height);
    sourceCtx.drawImage(ctx.canvas, sx, sy, sw, sh, 0, 0, source.width, source.height);

    ctx.save();
    ctx.filter = `blur(${blurPx}px)`;
    ctx.drawImage(source, 0, 0, source.width, source.height, sx, sy, sw, sh);
    ctx.restore();

    const pixelSize = Math.max(8, Math.round(Math.min(w, h) / 10));
    pixelated.width = Math.max(1, Math.round(w / pixelSize));
    pixelated.height = Math.max(1, Math.round(h / pixelSize));
    pixelatedCtx.imageSmoothingEnabled = true;
    pixelatedCtx.clearRect(0, 0, pixelated.width, pixelated.height);
    pixelatedCtx.drawImage(ctx.canvas, x, y, w, h, 0, 0, pixelated.width, pixelated.height);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.86;
    ctx.drawImage(pixelated, 0, 0, pixelated.width, pixelated.height, x, y, w, h);
    ctx.restore();
  };
}
