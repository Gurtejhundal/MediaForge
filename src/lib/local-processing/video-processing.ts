import { safeBaseName } from "./blob-utils";

export type VideoResolutionMode = "original" | "1080p" | "720p" | "480p" | "1440p" | "2160p";

export interface LocalVideoOptions {
  resolution: VideoResolutionMode;
  fps?: number;
  transform?: (ctx: CanvasRenderingContext2D, scale: { x: number; y: number }) => void;
  onProgress?: (progress: number) => void;
}

export interface LocalVideoResult {
  blob: Blob;
  filename: string;
}

function bestMimeType() {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";
}

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
  return {
    width: Math.max(2, Math.round((width * ratio) / 2) * 2),
    height: Math.max(2, Math.round((height * ratio) / 2) * 2),
  };
}

function loadVideo(file: File) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";

  return new Promise<{ video: HTMLVideoElement; url: string }>((resolve, reject) => {
    video.onloadedmetadata = () => resolve({ video, url });
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This browser could not decode the selected video."));
    };
  });
}

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    const targetTime = Math.min(Math.max(time, 0), video.duration || time);
    if (Math.abs(video.currentTime - targetTime) < 0.004 && video.readyState >= 2) {
      resolve();
      return;
    }

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Video seek timed out in this browser."));
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
    };

    const handleSeeked = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("Could not seek this video in the browser."));
    };

    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);
    video.currentTime = targetTime;
  });
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function getCanvasTrack(stream: MediaStream) {
  return stream.getVideoTracks()[0] as (MediaStreamTrack & { requestFrame?: () => void }) | undefined;
}

export async function renderVideoToWebMLocally(file: File, options: LocalVideoOptions): Promise<LocalVideoResult> {
  if (!("MediaRecorder" in window)) {
    throw new Error("MediaRecorder is not available in this browser.");
  }

  const mimeType = bestMimeType();
  if (!mimeType) {
    throw new Error("This browser cannot export WEBM video locally.");
  }

  const { video, url } = await loadVideo(file);
  const output = fitWithin(video.videoWidth, video.videoHeight, options.resolution);
  const canvas = document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error("Canvas is not available in this browser.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const fps = options.fps || 24;
  const stream = canvas.captureStream(fps);
  const canvasTrack = getCanvasTrack(stream);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const finished = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("Local video encoding failed."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });

  const drawFrame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    options.transform?.(ctx, { x: canvas.width / video.videoWidth, y: canvas.height / video.videoHeight });
    canvasTrack?.requestFrame?.();
  };

  try {
    video.pause();
    await seekVideo(video, 0);
    recorder.start(1000);

    const duration = video.duration || 0;
    const frameDurationMs = 1000 / fps;
    const frameCount = Math.max(1, Math.ceil(duration * fps));

    for (let frame = 0; frame < frameCount; frame += 1) {
      const timestamp = Math.min(frame / fps, Math.max(0, duration - 0.001));
      await seekVideo(video, timestamp);
      drawFrame();
      options.onProgress?.(Math.min(99, Math.round(((frame + 1) / frameCount) * 100)));
      await wait(frameDurationMs);
    }

    recorder.stop();
    const blob = await finished;
    options.onProgress?.(100);
    return {
      blob,
      filename: `${safeBaseName(file.name)}-${options.resolution === "original" ? "local" : options.resolution}.webm`,
    };
  } finally {
    stream.getTracks().forEach((track) => track.stop());
    URL.revokeObjectURL(url);
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
