import JSZip from "jszip";
import { safeBaseName } from "./blob-utils";

export type BrowserImageFormat = "png" | "jpeg" | "webp" | "avif";
export type ImageFitMode = "contain" | "cover" | "stretch";
export type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface ImageProcessOptions {
  format: BrowserImageFormat;
  quality?: number;
  width?: number;
  height?: number;
  fit?: ImageFitMode;
  rotate?: number;
  crop?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  watermark?: {
    text: string;
    position: WatermarkPosition;
    opacity: number;
  };
  topText?: string;
  bottomText?: string;
}

export interface LocalImageResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export async function decodeImage(file: File | Blob) {
  try {
    return await createImageBitmap(file);
  } catch {
    return await loadImageElement(file);
  }
}

async function loadImageElement(file: File | Blob) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not decode image in this browser"));
    });

    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function resolveDrawSize(sourceWidth: number, sourceHeight: number, targetWidth?: number, targetHeight?: number, fit: ImageFitMode = "contain") {
  const width = targetWidth || (targetHeight ? Math.round((sourceWidth / sourceHeight) * targetHeight) : sourceWidth);
  const height = targetHeight || (targetWidth ? Math.round((sourceHeight / sourceWidth) * targetWidth) : sourceHeight);

  if (fit === "stretch") {
    return { canvasWidth: width, canvasHeight: height, drawX: 0, drawY: 0, drawWidth: width, drawHeight: height };
  }

  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;
  const cover = fit === "cover";
  const shouldFitWidth = cover ? sourceRatio < targetRatio : sourceRatio > targetRatio;
  const drawWidth = shouldFitWidth ? width : Math.round(height * sourceRatio);
  const drawHeight = shouldFitWidth ? Math.round(width / sourceRatio) : height;

  return {
    canvasWidth: width,
    canvasHeight: height,
    drawX: Math.round((width - drawWidth) / 2),
    drawY: Math.round((height - drawHeight) / 2),
    drawWidth,
    drawHeight,
  };
}

function getMime(format: BrowserImageFormat) {
  return `image/${format}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, format: BrowserImageFormat, quality?: number) {
  const mime = getMime(format);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(`${format.toUpperCase()} export is not available in this browser`));
        return;
      }

      if (format !== "png" && blob.type !== mime) {
        reject(new Error(`${format.toUpperCase()} export is not available in this browser`));
        return;
      }

      resolve(blob);
    }, mime, quality ? quality / 100 : undefined);
  });
}

function drawWatermark(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, watermark: NonNullable<ImageProcessOptions["watermark"]>) {
  if (!watermark.text.trim()) return;

  const fontSize = Math.max(18, Math.round(canvasWidth * 0.045));
  ctx.save();
  ctx.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
  const paddingX = Math.round(fontSize * 0.65);
  const paddingY = Math.round(fontSize * 0.45);
  const metrics = ctx.measureText(watermark.text);
  const boxWidth = metrics.width + paddingX * 2;
  const boxHeight = fontSize + paddingY * 2;
  const margin = Math.max(18, Math.round(Math.min(canvasWidth, canvasHeight) * 0.04));

  let x = (canvasWidth - boxWidth) / 2;
  let y = (canvasHeight - boxHeight) / 2;

  if (watermark.position.includes("left")) x = margin;
  if (watermark.position.includes("right")) x = canvasWidth - boxWidth - margin;
  if (watermark.position.includes("top")) y = margin;
  if (watermark.position.includes("bottom")) y = canvasHeight - boxHeight - margin;

  ctx.globalAlpha = watermark.opacity;
  ctx.fillStyle = "rgba(17, 24, 39, 0.72)";
  ctx.fillRect(x, y, boxWidth, boxHeight);
  ctx.globalAlpha = Math.min(1, watermark.opacity + 0.18);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(watermark.text, x + paddingX, y + boxHeight / 2);
  ctx.restore();
}

function drawCaption(ctx: CanvasRenderingContext2D, text: string | undefined, canvasWidth: number, canvasHeight: number, placement: "top" | "bottom") {
  if (!text?.trim()) return;

  const fontSize = Math.max(24, Math.round(canvasWidth * 0.065));
  ctx.save();
  ctx.font = `800 ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = placement === "top" ? "top" : "bottom";
  ctx.lineWidth = Math.max(4, Math.round(fontSize * 0.12));
  ctx.strokeStyle = "rgba(0, 0, 0, 0.72)";
  ctx.fillStyle = "#ffffff";
  const y = placement === "top" ? fontSize * 0.42 : canvasHeight - fontSize * 0.28;
  ctx.strokeText(text, canvasWidth / 2, y);
  ctx.fillText(text, canvasWidth / 2, y);
  ctx.restore();
}

export async function processImageLocally(file: File, options: ImageProcessOptions): Promise<LocalImageResult> {
  const source = await decodeImage(file);
  const originalWidth = source.width;
  const originalHeight = source.height;
  const crop = options.crop;
  const sourceX = crop ? Math.max(0, crop.left) : 0;
  const sourceY = crop ? Math.max(0, crop.top) : 0;
  const sourceWidth = crop ? Math.min(crop.width, originalWidth - sourceX) : originalWidth;
  const sourceHeight = crop ? Math.min(crop.height, originalHeight - sourceY) : originalHeight;

  const draw = resolveDrawSize(sourceWidth, sourceHeight, options.width, options.height, options.fit);
  const rotated = Math.abs(options.rotate || 0) % 180 === 90;
  const canvas = createCanvas(rotated ? draw.canvasHeight : draw.canvasWidth, rotated ? draw.canvasWidth : draw.canvasHeight);
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas is not available in this browser");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "rgba(255, 255, 255, 0)";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (options.rotate) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((options.rotate * Math.PI) / 180);
    ctx.translate(-draw.canvasWidth / 2, -draw.canvasHeight / 2);
  }

  ctx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, draw.drawX, draw.drawY, draw.drawWidth, draw.drawHeight);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawWatermark(ctx, canvas.width, canvas.height, options.watermark || { text: "", position: "bottom-right", opacity: 0.45 });
  drawCaption(ctx, options.topText, canvas.width, canvas.height, "top");
  drawCaption(ctx, options.bottomText, canvas.width, canvas.height, "bottom");

  const blob = await canvasToBlob(canvas, options.format, options.quality);
  const extension = options.format === "jpeg" ? "jpg" : options.format;

  return {
    blob,
    filename: `${safeBaseName(file.name)}.${extension}`,
    width: canvas.width,
    height: canvas.height,
    originalWidth,
    originalHeight,
  };
}

function applyDetailKernel(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  const source = ctx.getImageData(0, 0, width, height);
  const src = source.data;
  const out = new Uint8ClampedArray(src);
  const center = 1 + amount * 4;
  const side = -amount;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        const top = src[((y - 1) * width + x) * 4 + channel];
        const left = src[(y * width + x - 1) * 4 + channel];
        const current = src[index + channel];
        const right = src[(y * width + x + 1) * 4 + channel];
        const bottom = src[((y + 1) * width + x) * 4 + channel];
        out[index + channel] = Math.max(0, Math.min(255, current * center + (top + left + right + bottom) * side));
      }
    }
  }

  ctx.putImageData(new ImageData(out, width, height), 0, 0);
}

export async function detailUpscaleImageLocally(file: File, options: {
  target: "2x" | "4k";
  strength: "low" | "medium" | "high";
}) {
  const image = await decodeImage(file);
  const longEdge = Math.max(image.width, image.height);
  const scale = options.target === "4k" ? Math.min(3840 / longEdge, 4) : Math.min(2, 3840 / longEdge);
  const width = Math.max(1, Math.round(image.width * Math.max(scale, 1)));
  const height = Math.max(1, Math.round(image.height * Math.max(scale, 1)));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas is not available in this browser");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);

  const amount = options.strength === "high" ? 0.42 : options.strength === "medium" ? 0.26 : 0.14;
  applyDetailKernel(ctx, width, height, amount);

  const blob = await canvasToBlob(canvas, "png");
  return {
    blob,
    filename: `detail-${safeBaseName(file.name)}-${options.target}.png`,
    width,
    height,
  };
}

export async function getImageDimensions(file: File) {
  const image = await decodeImage(file);
  return { width: image.width, height: image.height };
}

async function makePngBlobFromImage(source: CanvasImageSource, size: number) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(source, 0, 0, size, size);
  return await canvasToBlob(canvas, "png");
}

async function makeIcoBlob(pngBlobs: Blob[]) {
  const buffers = await Promise.all(pngBlobs.map(async (blob) => new Uint8Array(await blob.arrayBuffer())));
  const headerSize = 6 + buffers.length * 16;
  const totalSize = headerSize + buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const data = new Uint8Array(totalSize);
  const view = new DataView(data.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, buffers.length, true);

  let offset = headerSize;
  buffers.forEach((buffer, index) => {
    const size = [16, 32, 48][index] || 0;
    const entryOffset = 6 + index * 16;
    view.setUint8(entryOffset, size);
    view.setUint8(entryOffset + 1, size);
    view.setUint8(entryOffset + 2, 0);
    view.setUint8(entryOffset + 3, 0);
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, buffer.byteLength, true);
    view.setUint32(entryOffset + 12, offset, true);
    data.set(buffer, offset);
    offset += buffer.byteLength;
  });

  return new Blob([data], { type: "image/x-icon" });
}

export async function generateFaviconPackageLocally(file: File) {
  const image = await decodeImage(file);
  const sizes = [16, 32, 48, 64, 96, 180, 192, 512];
  const pngs = new Map<number, Blob>();

  for (const size of sizes) {
    pngs.set(size, await makePngBlobFromImage(image, size));
  }

  const ico = await makeIcoBlob([pngs.get(16)!, pngs.get(32)!, pngs.get(48)!]);
  const zip = new JSZip();
  const folderName = `${safeBaseName(file.name)}-favicon-pack`;
  const folder = zip.folder(folderName) || zip;
  folder.file("favicon.ico", ico);
  folder.file("favicon-16x16.png", pngs.get(16)!);
  folder.file("favicon-32x32.png", pngs.get(32)!);
  folder.file("favicon-48x48.png", pngs.get(48)!);
  folder.file("apple-touch-icon.png", pngs.get(180)!);
  folder.file("android-chrome-192x192.png", pngs.get(192)!);
  folder.file("android-chrome-512x512.png", pngs.get(512)!);
  folder.file("site.webmanifest", JSON.stringify({
    name: "Application",
    short_name: "App",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
  }, null, 2));

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const previews: Record<string, string> = {};

  for (const [size, blob] of pngs.entries()) {
    if (size <= 192) previews[`${size}x${size}`] = URL.createObjectURL(blob);
  }

  return {
    blob: zipBlob,
    filename: `${folderName}.zip`,
    previews,
    dimensions: { width: image.width, height: image.height },
  };
}
