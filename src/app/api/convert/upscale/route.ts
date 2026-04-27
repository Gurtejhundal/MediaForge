import { NextRequest, NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { writeFile, unlink, readFile, mkdir } from "fs/promises";
import { join, normalize, extname, resolve } from "path";
import { randomUUID } from "crypto";
import { existsSync } from "fs";

// Robust FFmpeg path resolution
const getFFmpegPath = () => {
  const possiblePaths = [
    ffmpegPath as string,
    resolve(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"),
    resolve(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"),
    join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe")
  ];

  for (const p of possiblePaths) {
    if (p && existsSync(p)) return p;
  }
  return ffmpegPath as string;
};

const FFMPEG_BIN = getFFmpegPath();
ffmpeg.setFfmpegPath(FFMPEG_BIN);

export const maxDuration = 300;

const RESOLUTIONS: Record<string, { width: number; height: number; label: string }> = {
  "1080p": { width: 1920, height: 1080, label: "Full HD" },
  "1440p": { width: 2560, height: 1440, label: "2K QHD" },
  "2160p": { width: 3840, height: 2160, label: "4K UHD" },
};

const PRESETS: Record<string, string> = {
  fast: "fast",
  balanced: "slow",
  "max-quality": "slower",
};

const SHARPENING: Record<string, string> = {
  "1080p": "unsharp=3:3:0.8:3:3:0.4",
  "1440p": "unsharp=5:5:0.9:5:5:0.4",
  "2160p": "unsharp=5:5:1.0:5:5:0.5",
};

export async function POST(req: NextRequest) {
  const requestId = randomUUID();
  const tmpDir = normalize(join(process.cwd(), "tmp"));
  
  // Ensure local tmp dir exists
  if (!existsSync(tmpDir)) {
    await mkdir(tmpDir, { recursive: true });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const resolution = (formData.get("resolution") as string) || "2160p";
  const preset = (formData.get("preset") as string) || "balanced";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Sanitize extension - only alphanumeric
  const rawExt = extname(file.name).toLowerCase().replace(/[^a-z0-9]/g, "");
  const ext = rawExt || "mp4";
  
  const inputPath = normalize(join(tmpDir, `in-${requestId}.${ext}`));
  const outputPath = normalize(join(tmpDir, `out-${requestId}.mp4`));

  try {
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 100MB limit" }, { status: 400 });
    }

    const target = RESOLUTIONS[resolution] || RESOLUTIONS["2160p"];
    const ffmpegPreset = PRESETS[preset] || "slow";
    const sharpen = SHARPENING[resolution] || SHARPENING["2160p"];

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(inputPath, Buffer.from(arrayBuffer));

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters([
          `scale=${target.width}:${target.height}:flags=lanczos:force_original_aspect_ratio=decrease`,
          `pad=${target.width}:${target.height}:-1:-1:color=black`,
          `setsar=1`,
          sharpen,
        ])
        .outputOptions([
          "-c:v libx264",
          `-preset ${ffmpegPreset}`,
          "-crf 15",
          "-tune film",
          "-pix_fmt yuv420p",
          "-c:a aac",
          "-b:a 192k",
          "-movflags +faststart",
        ])
        .output(outputPath)
        .on("start", (cmd) => console.log("FFmpeg command:", cmd))
        .on("end", () => resolve())
        .on("error", (err, stdout, stderr) => {
          console.error("FFmpeg error:", err.message);
          console.error("FFmpeg stderr:", stderr);
          reject(new Error(stderr || err.message));
        })
        .run();
    });

    const resultBuffer = await readFile(outputPath);

    // Cleanup
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
  } catch (error: any) {
    // Attempt cleanup on error
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
    
    console.error("Video upscale processing error:", error.message);
    const cleanError = error.message.split('\n')[0].replace(/.*stderr:/, "").trim();
    return NextResponse.json(
      { error: `Upscale failed: ${cleanError || "The video codec or format is incompatible."}` },
      { status: 500 }
    );
  }
}


