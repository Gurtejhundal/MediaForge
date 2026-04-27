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

interface WatermarkJob {
  id: string;
  progress: number;
  status: "processing" | "completed" | "error";
  error?: string;
  outputPath?: string;
  inputPath?: string;
  originalName?: string;
}

const jobs = (global as any).watermarkJobs || new Map<string, WatermarkJob>();
(global as any).watermarkJobs = jobs;

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
      return NextResponse.json({ error: "Job not ready" }, { status: 400 });
    }
    try {
      const resultBuffer = await readFile(job.outputPath);
      const cleanup = async () => {
        await unlink(job.inputPath!).catch(() => {});
        await unlink(job.outputPath!).catch(() => {});
        jobs.delete(jobId);
      };
      setTimeout(cleanup, 1000);
      return new NextResponse(new Uint8Array(resultBuffer), {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": `attachment; filename="${job.originalName}-cleaned.mp4"`,
        },
      });
    } catch (err) {
      return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
    }
  }
  return NextResponse.json(job);
}

export async function POST(req: NextRequest) {
  const jobId = randomUUID();
  const tmpDir = normalize(join(process.cwd(), "tmp"));
  if (!existsSync(tmpDir)) await mkdir(tmpDir, { recursive: true });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const x = parseInt(formData.get("x") as string);
  const y = parseInt(formData.get("y") as string);
  const w = parseInt(formData.get("w") as string);
  const h = parseInt(formData.get("h") as string);

  if (!file || isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const ext = extname(file.name).toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  const inputPath = normalize(join(tmpDir, `wm-in-${jobId}.${ext}`));
  const outputPath = normalize(join(tmpDir, `wm-out-${jobId}.mp4`));

  const job: WatermarkJob = {
    id: jobId,
    progress: 0,
    status: "processing",
    inputPath,
    outputPath,
    originalName: file.name.replace(/\.[^.]+$/, ""),
  };
  jobs.set(jobId, job);

  (async () => {
    try {
      const buffer = await file.arrayBuffer();
      await writeFile(inputPath, Buffer.from(buffer));

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .videoFilters([
            // band=4 adds a 4-pixel fuzzy border for much smoother blending with the surrounding area
            `delogo=x=${x}:y=${y}:w=${w}:h=${h}:band=4`
          ])
          .outputOptions([
            "-c:v libx264",
            "-preset slower",     // Better compression and detail retention
            "-crf 14",            // Very high quality, close to visually lossless
            "-tune film",         // Preserves original texture and grain
            "-pix_fmt yuv420p",
            "-c:a aac",
            "-b:a 320k",          // High fidelity audio
            "-movflags +faststart",
          ])
          .output(outputPath)
          .on("progress", (p) => {
            if (p.percent) job.progress = Math.round(p.percent);
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
      job.status = "error";
      job.error = error.message.split('\n')[0].replace(/.*stderr:/, "").trim();
      await unlink(inputPath).catch(() => {});
    }
  })();

  return NextResponse.json({ jobId });
}
