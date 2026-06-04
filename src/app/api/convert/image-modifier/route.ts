import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OutputFormat = "png" | "jpeg" | "webp" | "avif";
type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const SUPPORTED_FORMATS = new Set<OutputFormat>(["png", "jpeg", "webp", "avif"]);

function parseInteger(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sanitizeBaseName(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "").trim();
  const sanitized = withoutExtension
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "image";
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getWatermarkCoordinates(
  position: WatermarkPosition,
  imageWidth: number,
  imageHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
) {
  const margin = Math.max(24, Math.round(Math.min(imageWidth, imageHeight) * 0.04));

  switch (position) {
    case "top-left":
      return { left: margin, top: margin };
    case "top-right":
      return { left: imageWidth - watermarkWidth - margin, top: margin };
    case "bottom-left":
      return { left: margin, top: imageHeight - watermarkHeight - margin };
    case "bottom-right":
      return { left: imageWidth - watermarkWidth - margin, top: imageHeight - watermarkHeight - margin };
    case "center":
    default:
      return {
        left: Math.round((imageWidth - watermarkWidth) / 2),
        top: Math.round((imageHeight - watermarkHeight) / 2),
      };
  }
}

function makeTextOverlaySvg(text: string, width: number, height: number, options: {
  fontSize: number;
  opacity: number;
  alignY: "top" | "middle" | "bottom";
}) {
  const safeText = escapeXml(text);
  const y = options.alignY === "top"
    ? options.fontSize * 1.4
    : options.alignY === "bottom"
      ? height - options.fontSize * 0.8
      : height / 2;

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text {
          font-family: Arial, Helvetica, sans-serif;
          font-weight: 800;
          paint-order: stroke;
          stroke: rgba(0,0,0,0.62);
          stroke-width: ${Math.max(3, Math.round(options.fontSize * 0.1))}px;
          stroke-linejoin: round;
        }
      </style>
      <text
        x="${width / 2}"
        y="${y}"
        text-anchor="middle"
        dominant-baseline="${options.alignY === "middle" ? "middle" : "alphabetic"}"
        font-size="${options.fontSize}"
        fill="rgba(255,255,255,${options.opacity})"
      >${safeText}</text>
    </svg>
  `);
}

function makeWatermarkSvg(text: string, opacity: number) {
  const fontSize = 42;
  const horizontalPadding = 26;
  const verticalPadding = 16;
  const width = Math.max(220, text.length * 24 + horizontalPadding * 2);
  const height = fontSize + verticalPadding * 2;

  return {
    width,
    height,
    input: Buffer.from(`
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${width}" height="${height}" rx="10" fill="rgba(0,0,0,${Math.min(opacity * 0.34, 0.34)})"/>
        <text
          x="${width / 2}"
          y="${height / 2}"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${fontSize}"
          font-weight="700"
          fill="rgba(255,255,255,${opacity})"
        >${escapeXml(text)}</text>
      </svg>
    `),
  };
}

function formatOutput(pipeline: sharp.Sharp, format: OutputFormat, quality: number) {
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({ quality, mozjpeg: true });
    case "webp":
      return pipeline.webp({ quality });
    case "avif":
      return pipeline.avif({ quality });
    case "png":
    default:
      return pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are supported" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Image exceeds 25MB limit" }, { status: 400 });
    }

    const outputFormat = (formData.get("format") as OutputFormat | null) || "webp";
    if (!SUPPORTED_FORMATS.has(outputFormat)) {
      return NextResponse.json({ error: "Unsupported output format" }, { status: 400 });
    }

    const quality = Math.min(100, Math.max(1, parseInteger(formData.get("quality")) || 82));
    const rotate = parseInteger(formData.get("rotate")) || 0;
    const resizeWidth = parseInteger(formData.get("resizeWidth"));
    const resizeHeight = parseInteger(formData.get("resizeHeight"));
    const cropLeft = parseInteger(formData.get("cropLeft"));
    const cropTop = parseInteger(formData.get("cropTop"));
    const cropWidth = parseInteger(formData.get("cropWidth"));
    const cropHeight = parseInteger(formData.get("cropHeight"));
    const watermarkText = (formData.get("watermarkText") as string | null)?.trim();
    const watermarkPosition = ((formData.get("watermarkPosition") as string | null) || "bottom-right") as WatermarkPosition;
    const watermarkOpacity = Math.min(1, Math.max(0.08, parseNumber(formData.get("watermarkOpacity")) ?? 0.45));
    const topText = (formData.get("topText") as string | null)?.trim();
    const bottomText = (formData.get("bottomText") as string | null)?.trim();

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    let pipeline = sharp(inputBuffer, { failOn: "truncated" }).rotate();

    if (rotate !== 0) {
      pipeline = pipeline.rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
    }

    if (
      cropLeft !== undefined &&
      cropTop !== undefined &&
      cropWidth !== undefined &&
      cropHeight !== undefined &&
      cropWidth > 0 &&
      cropHeight > 0
    ) {
      pipeline = pipeline.extract({
        left: Math.max(0, cropLeft),
        top: Math.max(0, cropTop),
        width: cropWidth,
        height: cropHeight,
      });
    }

    if (resizeWidth || resizeHeight) {
      pipeline = pipeline.resize(resizeWidth || null, resizeHeight || null, {
        fit: "inside",
        withoutEnlargement: false,
        kernel: sharp.kernel.lanczos3,
      });
    }

    const prepared = await pipeline.toBuffer();
    const metadata = await sharp(prepared).metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json({ error: "Could not read processed image dimensions" }, { status: 400 });
    }

    const overlays: sharp.OverlayOptions[] = [];

    if (watermarkText) {
      const watermark = makeWatermarkSvg(watermarkText, watermarkOpacity);
      overlays.push({
        input: watermark.input,
        ...getWatermarkCoordinates(watermarkPosition, metadata.width, metadata.height, watermark.width, watermark.height),
      });
    }

    if (topText) {
      overlays.push({
        input: makeTextOverlaySvg(topText, metadata.width, metadata.height, {
          fontSize: Math.max(30, Math.round(metadata.width * 0.065)),
          opacity: 0.95,
          alignY: "top",
        }),
        left: 0,
        top: 0,
      });
    }

    if (bottomText) {
      overlays.push({
        input: makeTextOverlaySvg(bottomText, metadata.width, metadata.height, {
          fontSize: Math.max(30, Math.round(metadata.width * 0.065)),
          opacity: 0.95,
          alignY: "bottom",
        }),
        left: 0,
        top: 0,
      });
    }

    let outputPipeline = sharp(prepared);
    if (overlays.length > 0) {
      outputPipeline = outputPipeline.composite(overlays);
    }

    const outputBuffer = await formatOutput(outputPipeline, outputFormat, quality).toBuffer();
    const extension = outputFormat === "jpeg" ? "jpg" : outputFormat;

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": `image/${outputFormat}`,
        "Content-Disposition": `attachment; filename="modified-${sanitizeBaseName(file.name)}.${extension}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to modify image";
    console.error("Image modifier error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
