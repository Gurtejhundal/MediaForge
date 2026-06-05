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
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const finished = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("Local video encoding failed."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });

  const draw = () => {
    if (video.paused || video.ended) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    options.transform?.(ctx, { x: canvas.width / video.videoWidth, y: canvas.height / video.videoHeight });
    options.onProgress?.(Math.min(100, Math.round((video.currentTime / video.duration) * 100)));
    requestAnimationFrame(draw);
  };

  try {
    video.currentTime = 0;
    recorder.start(1000);
    await video.play();
    draw();

    await new Promise<void>((resolve) => {
      video.onended = () => resolve();
    });

    recorder.stop();
    const blob = await finished;
    return {
      blob,
      filename: `${safeBaseName(file.name)}-${options.resolution === "original" ? "local" : options.resolution}.webm`,
    };
  } finally {
    stream.getTracks().forEach((track) => track.stop());
    URL.revokeObjectURL(url);
  }
}

export function makeBlurRegionTransform(region: { x: number; y: number; w: number; h: number }, blurPx = 14) {
  return (ctx: CanvasRenderingContext2D, scale: { x: number; y: number }) => {
    const x = Math.max(0, region.x * scale.x);
    const y = Math.max(0, region.y * scale.y);
    const w = Math.max(1, region.w * scale.x);
    const h = Math.max(1, region.h * scale.y);

    ctx.save();
    ctx.filter = `blur(${blurPx}px)`;
    ctx.drawImage(ctx.canvas, x, y, w, h, x, y, w, h);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  };
}
