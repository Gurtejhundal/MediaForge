import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import ffmpeg from "fluent-ffmpeg";
import JSZip from "jszip";

// Inform ffmpeg where the binary is installed
const ffmpegBinary = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
ffmpeg.setFfmpegPath(path.join("node_modules", "ffmpeg-static", ffmpegBinary));

export const runtime = "nodejs";
export const maxDuration = 300;

type VideoExportAction = "sequence" | "frame" | "gif";
type FrameFormat = "jpg" | "png";
type SequenceMode = "sampled" | "source";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_SEQUENCE_FRAMES = 600;

function clampNumber(value: FormDataEntryValue | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function sanitizeBaseName(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "").trim();
  const sanitized = withoutExtension
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "video";
}

function toAction(value: FormDataEntryValue | null): VideoExportAction {
  return value === "frame" || value === "gif" || value === "sequence" ? value : "sequence";
}

function toFrameFormat(value: FormDataEntryValue | null): FrameFormat {
  return value === "png" ? "png" : "jpg";
}

function toSequenceMode(value: FormDataEntryValue | null): SequenceMode {
  return value === "source" ? "source" : "sampled";
}

function runFfmpeg(command: ffmpeg.FfmpegCommand) {
  return new Promise<void>((resolve, reject) => {
    let stderr = "";

    command
      .on("stderr", (line) => {
        stderr += `${line}\n`;
      })
      .on("end", () => resolve())
      .on("error", (error) => {
        reject(new Error(`${error.message}${stderr ? `\n${stderr}` : ""}`));
      })
      .run();
  });
}

function getFrameOutputOptions(format: FrameFormat) {
  if (format === "png") {
    return ["-compression_level 6"];
  }

  return ["-q:v 2"];
}

export async function POST(req: NextRequest) {
  let sessionDir = "";

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const action = toAction(formData.get("action"));
    const timestampStr = (formData.get("timestamp") as string | null) || "00:00:01";
    const gifDuration = clampNumber(formData.get("duration"), 3, 1, 12);
    const frameRate = clampNumber(formData.get("frameRate"), 12, 1, 30);
    const maxFrames = clampNumber(formData.get("maxFrames"), 240, 1, MAX_SEQUENCE_FRAMES);
    const frameFormat = toFrameFormat(formData.get("format"));
    const sequenceMode = toSequenceMode(formData.get("sequenceMode"));
    
    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Video exceeds 100MB limit" }, { status: 400 });
    }

    // Prepare temp workspace
    const sessionId = randomUUID();
    const ext = file.name.split('.').pop() || 'mp4';
    sessionDir = path.join(os.tmpdir(), `mediaforge-${sessionId}`);
    const framesDir = path.join(sessionDir, "frames");
    const baseName = sanitizeBaseName(file.name);
    const tempVideoPath = path.join(sessionDir, `input.${ext}`);

    await fs.mkdir(framesDir, { recursive: true });

    // Write array buffer to local OS format for FFmpeg to safely decode
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(tempVideoPath, Buffer.from(arrayBuffer));

    if (action === "sequence") {
      const outputPattern = path.join(framesDir, `frame-%05d.${frameFormat}`);
      const outputOptions = [
        ...getFrameOutputOptions(frameFormat),
        "-frames:v",
        String(maxFrames),
      ];

      if (sequenceMode === "sampled") {
        outputOptions.unshift("-vf", `fps=${frameRate}`);
      } else {
        outputOptions.unshift("-vsync", "0");
      }

      await runFfmpeg(
        ffmpeg(tempVideoPath)
          .outputOptions(outputOptions)
          .output(outputPattern)
      );

      const frameFiles = (await fs.readdir(framesDir))
        .filter((filename) => filename.endsWith(`.${frameFormat}`))
        .sort();

      if (frameFiles.length === 0) {
        return NextResponse.json({ error: "No frames were extracted from this video." }, { status: 422 });
      }

      const zip = new JSZip();
      const folderName = `${baseName}-frames`;
      const folder = zip.folder(folderName) || zip;

      for (const frameFile of frameFiles) {
        const frameBuffer = await fs.readFile(path.join(framesDir, frameFile));
        folder.file(frameFile, frameBuffer);
      }

      folder.file("frames.json", JSON.stringify({
        source: file.name,
        format: frameFormat,
        mode: sequenceMode,
        requestedFrameRate: sequenceMode === "sampled" ? frameRate : null,
        maxFrames,
        frameCount: frameFiles.length,
        naming: "frame-00001",
      }, null, 2));

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
      const filename = `${baseName}-frames.zip`;

      return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const stillExtension = action === "gif" ? "gif" : frameFormat;
    const tempOutputPath = path.join(sessionDir, `${baseName}.${stillExtension}`);

    if (action === "frame") {
      await runFfmpeg(
        ffmpeg(tempVideoPath)
          .seekInput(timestampStr)
          .frames(1)
          .outputOptions(getFrameOutputOptions(frameFormat))
          .output(tempOutputPath)
      );
    } else {
      await runFfmpeg(
        ffmpeg(tempVideoPath)
          .seekInput(timestampStr)
          .setDuration(gifDuration)
          .complexFilter("fps=10,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse")
          .output(tempOutputPath)
      );
    }

    const resultBuffer = await fs.readFile(tempOutputPath);
    const mimeType = action === "gif"
      ? "image/gif"
      : frameFormat === "png"
        ? "image/png"
        : "image/jpeg";
    const filename = `${baseName}-${action === "gif" ? "clip" : "frame"}.${stillExtension}`;

    // Stream back directly
    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Video conversion error:", error);
    return NextResponse.json({ error: "Failed to process video file." }, { status: 500 });
  } finally {
    if (sessionDir) {
      await fs.rm(sessionDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
