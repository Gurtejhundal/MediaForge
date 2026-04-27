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
const jobs = (global as any).upscaleJobs || new Map<string, UpscaleJob>();
(global as any).upscaleJobs = jobs;

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
    } catch (err: any) {
      return NextResponse.json({ error: "Failed to read output file" }, { status: 500 });
    }
  }

  return NextResponse.json(job);
}

export async function POST(req: NextRequest) {
  const jobId = randomUUID();
  const tmpDir = normalize(join(process.cwd(), "tmp"));
  
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
    originalName: file.name.replace(/\.[^.]+$/, ""),
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
      const sharpen = SHARPENING[resolution] || SHARPENING["2160p"];

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
          .on("progress", (p) => {
            if (p.percent) {
              job.progress = Math.round(p.percent);
            }
          })
          .on("end", () => resolve())
          .on("error", (err, stdout, stderr) => {
            console.error("FFmpeg error:", stderr);
            reject(new Error(stderr || err.message));
          })
          .run();
      });

      job.status = "completed";
      job.progress = 100;
    } catch (error: any) {
      console.error("Job error:", error.message);
      job.status = "error";
      job.error = error.message.split('\n')[0].replace(/.*stderr:/, "").trim() || "Processing failed";
      // Cleanup input on error
      await unlink(inputPath).catch(() => {});
    }
  })();

  return NextResponse.json({ jobId });
}



