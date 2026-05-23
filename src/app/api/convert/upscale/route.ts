import { NextRequest, NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { writeFile, unlink, readFile, mkdir } from "fs/promises";
import { join, normalize, extname, resolve } from "path";
import { randomUUID } from "crypto";
import { existsSync } from "fs";
import os from "os";

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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

// Job tracking
interface UpscaleJob {
  id: string;
  progress: number;
  status: "processing" | "completed" | "error";
  error?: string;
  outputPath?: string;
  inputPath?: string;
  originalName?: string;
  resolution?: string;
}

// Store jobs in global to survive some hot-reloads in dev
const globalForUpscale = globalThis as typeof globalThis & {
  upscaleJobs?: Map<string, UpscaleJob>;
};
const jobs = globalForUpscale.upscaleJobs || new Map<string, UpscaleJob>();
globalForUpscale.upscaleJobs = jobs;

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

const CRF_BY_PRESET: Record<string, number> = {
  fast: 18,
  balanced: 14,
  "max-quality": 12,
};

const LUMA_DETAIL: Record<string, string> = {
  "1080p": "unsharp=3:3:0.55:3:3:0",
  "1440p": "unsharp=5:5:0.65:3:3:0",
  "2160p": "unsharp=5:5:0.75:3:3:0",
};

const SUPPORTED_VIDEO_EXTENSIONS = new Set(["mp4", "m4v", "webm", "mov", "mkv", "avi", "flv", "ts"]);

function sanitizeBaseName(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "").trim();
  const sanitized = withoutExtension
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "video";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Processing failed";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const download = searchParams.get("download") === "true";

  if (!jobId || !jobs.has(jobId)) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const job = jobs.get(jobId)!;

  if (download) {
    if (job.status !== "completed" || !job.outputPath) {
      return NextResponse.json({ error: "Job not ready for download" }, { status: 400 });
    }

    try {
      const resultBuffer = await readFile(job.outputPath);
      
      // Cleanup after successful read
      const cleanup = async () => {
        await unlink(job.inputPath!).catch(() => {});
        await unlink(job.outputPath!).catch(() => {});
        jobs.delete(jobId);
      };
      
      // We don't await cleanup here so we can return the response faster, 
      // but we do it immediately after sending the response.
      setTimeout(cleanup, 1000);

      return new NextResponse(new Uint8Array(resultBuffer), {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": `attachment; filename="${job.originalName}-${job.resolution}.mp4"`,
        },
      });
    } catch {
      return NextResponse.json({ error: "Failed to read output file" }, { status: 500 });
    }
  }

  return NextResponse.json(job);
}

export async function POST(req: NextRequest) {
  const jobId = randomUUID();
  const tmpDir = normalize(join(os.tmpdir(), "mediaforge-upscale"));
  
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

  const rawExt = extname(file.name).toLowerCase().replace(/[^a-z0-9]/g, "");

  if (file.type && !file.type.startsWith("video/") && !SUPPORTED_VIDEO_EXTENSIONS.has(rawExt)) {
    return NextResponse.json({ error: "Only video files are supported" }, { status: 400 });
  }

  if (!file.type && !SUPPORTED_VIDEO_EXTENSIONS.has(rawExt)) {
    return NextResponse.json({ error: "Unsupported video file type" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Video exceeds 100MB limit" }, { status: 400 });
  }

  if (!(resolution in RESOLUTIONS) || !(preset in PRESETS)) {
    return NextResponse.json({ error: "Invalid upscale settings" }, { status: 400 });
  }

  const ext = rawExt || "mp4";
  const inputPath = normalize(join(tmpDir, `in-${jobId}.${ext}`));
  const outputPath = normalize(join(tmpDir, `out-${jobId}.mp4`));

  // Initialize job
  const job: UpscaleJob = {
    id: jobId,
    progress: 0,
    status: "processing",
    inputPath,
    outputPath,
    originalName: sanitizeBaseName(file.name),
    resolution
  };
  jobs.set(jobId, job);

  // Run processing in background
  (async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(inputPath, Buffer.from(arrayBuffer));

      const target = RESOLUTIONS[resolution] || RESOLUTIONS["2160p"];
      const ffmpegPreset = PRESETS[preset] || "slow";
      const crf = CRF_BY_PRESET[preset] || CRF_BY_PRESET.balanced;
      const lumaDetail = LUMA_DETAIL[resolution] || LUMA_DETAIL["2160p"];

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .videoFilters([
            `scale=${target.width}:${target.height}:flags=lanczos:force_original_aspect_ratio=decrease:force_divisible_by=2`,
            `setsar=1`,
            lumaDetail,
          ])
          .outputOptions([
            "-c:v libx264",
            `-preset ${ffmpegPreset}`,
            `-crf ${crf}`,
            "-pix_fmt yuv420p",
            "-c:a aac",
            "-b:a 192k",
            "-movflags +faststart",
          ])
          .output(outputPath)
          .on("progress", (p) => {
            if (p.percent) {
              job.progress = Math.round(p.percent);
            }
          })
          .on("end", () => resolve())
          .on("error", (err, _stdout, stderr) => {
            console.error("FFmpeg error:", stderr);
            reject(new Error(stderr || err.message));
          })
          .run();
      });

      job.status = "completed";
      job.progress = 100;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error("Job error:", message);
      job.status = "error";
      job.error = message.split('\n')[0].replace(/.*stderr:/, "").trim() || "Processing failed";
      // Cleanup input on error
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
    }
  })();

  return NextResponse.json({ jobId });
}
