import { NextRequest, NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { writeFile, unlink, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

ffmpeg.setFfmpegPath(ffmpegPath as string);

export const maxDuration = 120;

const RESOLUTIONS: Record<string, { width: number; height: number; label: string }> = {
  "1080p": { width: 1920, height: 1080, label: "Full HD" },
  "1440p": { width: 2560, height: 1440, label: "2K QHD" },
  "2160p": { width: 3840, height: 2160, label: "4K UHD" },
};

// Slower presets = more encoder effort = better detail retention at same bitrate
const PRESETS: Record<string, string> = {
  fast: "fast",
  balanced: "slow",
  "max-quality": "slower",
};

// Unsharp mask strength tuned per resolution jump — bigger jumps need more sharpening
const SHARPENING: Record<string, string> = {
  "1080p": "unsharp=3:3:0.8:3:3:0.4",
  "1440p": "unsharp=5:5:0.9:5:5:0.4",
  "2160p": "unsharp=5:5:1.0:5:5:0.5",
};

export async function POST(req: NextRequest) {
  const requestId = randomUUID();
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const resolution = (formData.get("resolution") as string) || "2160p";
  const preset = (formData.get("preset") as string) || "balanced";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "mp4";
  const inputPath = join(tmpdir(), `upscale-in-${requestId}.${ext}`);
  const outputPath = join(tmpdir(), `upscale-out-${requestId}.mp4`);

  try {
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 100MB limit" }, { status: 400 });
    }

    const target = RESOLUTIONS[resolution] || RESOLUTIONS["2160p"];
    const ffmpegPreset = PRESETS[preset] || "slow";
    const sharpen = SHARPENING[resolution] || SHARPENING["2160p"];

    // Write uploaded file to temp
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(inputPath, Buffer.from(arrayBuffer));

    // Run FFmpeg upscale with detail-preserving pipeline:
    //  1. Scale up with Lanczos (best interpolation for upscaling)
    //  2. Pad to exact resolution if aspect ratio doesn't match
    //  3. Unsharp mask to recover edge detail and micro-texture lost during scaling
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters([
          `scale=${target.width}:${target.height}:flags=lanczos:force_original_aspect_ratio=decrease`,
          `pad=${target.width}:${target.height}:(ow-iw)/2:(oh-ih)/2:color=black`,
          sharpen,
        ])
        .outputOptions([
          "-c:v libx264",
          `-preset ${ffmpegPreset}`,
          "-crf 15",               // Lower CRF = higher bitrate = more detail preserved
          "-profile:v high",       // High profile unlocks better compression efficiency
          "-level:v 5.1",          // Level 5.1 supports 4K @ 30fps
          "-tune film",            // Preserves grain & texture instead of smoothing them as noise
          "-pix_fmt yuv420p",      // Universal compatibility
          "-c:a aac",              // Transcode to AAC for maximum compatibility in MP4 container
          "-b:a 192k",             // Solid audio bitrate
          "-movflags +faststart",
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err, stdout, stderr) => {
          console.error("FFmpeg stderr:", stderr);
          reject(err);
        })
        .run();
    });

    const resultBuffer = await readFile(outputPath);

    // Cleanup temp files
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);

    const originalName = file.name.replace(/\.[^.]+$/, "");

    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${originalName}-${resolution}.mp4"`,
      },
    });
  } catch (error) {
    // Cleanup on error
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);
    console.error("Video upscale error:", error);
    return NextResponse.json(
      { error: "Failed to upscale video. The file might be corrupted or in an unsupported format." },
      { status: 500 }
    );
  }
}
