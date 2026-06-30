import JSZip from "jszip";
import { safeBaseName } from "./blob-utils";

export type FrameExportFormat = "png" | "jpeg" | "webp";

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Video seek timed out"));
    }, 12000);

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
      reject(new Error("Could not seek this video in the browser"));
    };

    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);
    video.currentTime = Math.min(Math.max(time, 0), video.duration || time);
  });
}

export function parseTimestamp(value: string) {
  const parts = value.trim().split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export async function captureFrameFromVideo(video: HTMLVideoElement, timestamp: number, format: FrameExportFormat) {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("Video metadata is not ready yet");
  }

  await seekVideo(video, timestamp);

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not available in this browser");
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    const mime = format === "jpeg" ? "image/jpeg" : `image/${format}`;
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(`${format.toUpperCase()} export is not available in this browser`));
        return;
      }
      resolve(blob);
    }, mime, 0.92);
  });
}

export interface FrameZipOptions {
  fps: number;
  format: FrameExportFormat;
  onProgress?: (progress: number, frame: number, total: number) => void;
}

export interface FrameZipResult {
  blob: Blob;
  filename: string;
  frameCount: number;
  width: number;
  height: number;
  duration: number;
}

function loadVideoFile(file: File) {
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

function canvasToFrameBlob(canvas: HTMLCanvasElement, format: FrameExportFormat) {
  return new Promise<Blob>((resolve, reject) => {
    const mime = format === "jpeg" ? "image/jpeg" : `image/${format}`;
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(`${format.toUpperCase()} export is not available in this browser.`));
        return;
      }
      resolve(blob);
    }, mime, 0.92);
  });
}

function frameExtension(format: FrameExportFormat) {
  return format === "jpeg" ? "jpg" : format;
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

export async function extractVideoFramesToZip(file: File, options: FrameZipOptions): Promise<FrameZipResult> {
  const fps = Math.max(1, Math.min(60, Math.round(options.fps)));
  const { video, url } = await loadVideoFile(file);

  try {
    if (!video.videoWidth || !video.videoHeight) {
      throw new Error("Video metadata is not ready yet.");
    }

    const duration = video.duration || 0;
    const totalFrames = Math.max(1, Math.ceil(duration * fps));
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not available in this browser.");
    }

    const zip = new JSZip();
    const folderName = `${safeBaseName(file.name)}-frames`;
    const folder = zip.folder(folderName) || zip;
    const extension = frameExtension(options.format);

    for (let index = 0; index < totalFrames; index += 1) {
      const timestamp = Math.min(index / fps, Math.max(0, duration - 0.001));
      await seekVideo(video, timestamp);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frameBlob = await canvasToFrameBlob(canvas, options.format);
      folder.file(`frame-${String(index + 1).padStart(6, "0")}.${extension}`, frameBlob);
      options.onProgress?.(Math.min(95, Math.round(((index + 1) / totalFrames) * 95)), index + 1, totalFrames);

      if (index % 10 === 0) {
        await yieldToBrowser();
      }
    }

    const blob = await zip.generateAsync({ type: "blob" }, (metadata) => {
      options.onProgress?.(95 + Math.round(metadata.percent * 0.05), totalFrames, totalFrames);
    });

    options.onProgress?.(100, totalFrames, totalFrames);

    return {
      blob,
      filename: `${folderName}-${fps}fps.zip`,
      frameCount: totalFrames,
      width: canvas.width,
      height: canvas.height,
      duration,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
