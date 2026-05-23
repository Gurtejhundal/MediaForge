import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Strength = "low" | "medium" | "high";
type Target = "2x" | "4k";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const TARGET_LONG_EDGE: Record<Target, number> = {
  "2x": 0,
  "4k": 3840,
};

const DETAIL_PRESETS: Record<Strength, sharp.SharpenOptions> = {
  low: { sigma: 0.7, m1: 0.45, m2: 0.9, x1: 2.5, y2: 8, y3: 12 },
  medium: { sigma: 0.9, m1: 0.7, m2: 1.35, x1: 2.5, y2: 10, y3: 16 },
  high: { sigma: 1.05, m1: 0.95, m2: 1.8, x1: 3, y2: 12, y3: 20 },
};

const SUPPORTED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".heic", ".heif"]);

function sanitizeBaseName(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "").trim();
  const sanitized = withoutExtension
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "image";
}

function resolveDimensions(width: number, height: number, target: Target) {
  if (target === "2x") {
    const maxLongEdge = 3840;
    const scale = Math.min(2, maxLongEdge / Math.max(width, height));

    return {
      width: Math.max(1, Math.round(width * Math.max(scale, 1))),
      height: Math.max(1, Math.round(height * Math.max(scale, 1))),
    };
  }

  const longEdge = Math.max(width, height);

  if (longEdge >= TARGET_LONG_EDGE["4k"]) {
    return { width, height };
  }

  const scale = TARGET_LONG_EDGE["4k"] / longEdge;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown image processing error";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const strength = ((formData.get("strength") as string) || "medium") as Strength;
    const target = ((formData.get("target") as string) || "4k") as Target;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || "";

    if (file.type && !file.type.startsWith("image/") && !SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: "Only image files are supported" }, { status: 400 });
    }

    if (!file.type && !SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: "Unsupported image file type" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Image exceeds 20MB limit" }, { status: 400 });
    }

    if (!(strength in DETAIL_PRESETS) || !(target in TARGET_LONG_EDGE)) {
      return NextResponse.json({ error: "Invalid enhancement settings" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json({ error: "Could not read image dimensions" }, { status: 400 });
    }

    const output = resolveDimensions(metadata.width, metadata.height, target);

    const resultBuffer = await sharp(buffer, { failOn: "truncated" })
      .rotate()
      .resize(output.width, output.height, {
        fit: "inside",
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: false,
        fastShrinkOnLoad: false,
      })
      .sharpen(DETAIL_PRESETS[strength])
      .keepMetadata()
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
      })
      .toBuffer();

    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="detail-${sanitizeBaseName(file.name)}-${target}.png"`,
      },
    });
  } catch (error: unknown) {
    console.error("Image enhancement error:", getErrorMessage(error));
    return NextResponse.json(
      { error: "Failed to detail and upscale image. Ensure it is a valid still image." },
      { status: 500 }
    );
  }
}
