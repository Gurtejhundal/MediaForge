export type LocalCapability = "available" | "limited" | "unsupported";

export async function canEncodeMime(mimeType: string) {
  if (typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  return new Promise<boolean>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(Boolean(blob && blob.type === mimeType));
    }, mimeType);
  });
}

export async function getImageExportCapabilities() {
  const [jpeg, png, webp, avif] = await Promise.all([
    canEncodeMime("image/jpeg"),
    canEncodeMime("image/png"),
    canEncodeMime("image/webp"),
    canEncodeMime("image/avif"),
  ]);

  return { jpeg, png, webp, avif };
}

export function getLocalRuntimeCapabilities() {
  return {
    fileApi: typeof File !== "undefined" && typeof Blob !== "undefined",
    objectUrl: typeof URL !== "undefined" && typeof URL.createObjectURL === "function",
    canvas: typeof HTMLCanvasElement !== "undefined",
    offscreenCanvas: typeof OffscreenCanvas !== "undefined",
    workers: typeof Worker !== "undefined",
    webCodecs: typeof VideoFrame !== "undefined",
  };
}
