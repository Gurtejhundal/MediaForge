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
