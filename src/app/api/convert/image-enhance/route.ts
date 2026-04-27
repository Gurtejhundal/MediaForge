import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const strength = (formData.get("strength") as string) || "medium";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let pipeline = sharp(buffer);

    // Get image metadata to determine scaling if needed
    const metadata = await pipeline.metadata();

    // 1. CLAHE (Contrast Limited Adaptive Histogram Equalization)
    // This is the "secret sauce" for professional enhancement - it brings out details in highlights/shadows
    pipeline = pipeline.clahe({
      width: 50,
      height: 50,
      maxSlope: strength === "high" ? 6 : strength === "medium" ? 3 : 2
    });

    // 2. Sharpening
    // We use a multi-stage sharpening for crisp edges without halo artifacts
    if (strength === "high") {
      pipeline = pipeline.sharpen({ sigma: 1.5, m1: 1.0, m2: 2.0 });
    } else if (strength === "medium") {
      pipeline = pipeline.sharpen({ sigma: 1.0, m1: 0.5, m2: 1.0 });
    } else {
      pipeline = pipeline.sharpen({ sigma: 0.5 });
    }

    // 3. Color & Brightness Boost
    // Subtle modulation to make the image feel more "alive"
    pipeline = pipeline.modulate({
      brightness: 1.02,
      saturation: 1.05,
    });

    // 4. Gamma correction to lift midtones slightly
    pipeline = pipeline.gamma(1.1);

    const resultBuffer = await pipeline
      .toFormat("png") // Use PNG for output to ensure no quality loss from re-compression
      .toBuffer();

    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="enhanced-${file.name.replace(/\.[^.]+$/, ".png")}"`,
      },
    });
  } catch (error: any) {
    console.error("Image enhancement error:", error);
    return NextResponse.json(
      { error: "Failed to enhance image. Ensure it is a valid photo." },
      { status: 500 }
    );
  }
}
