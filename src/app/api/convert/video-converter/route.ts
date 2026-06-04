import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import ffmpeg from "fluent-ffmpeg";

// Inform ffmpeg where the binary is installed
const ffmpegBinary = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
ffmpeg.setFfmpegPath(path.join("node_modules", "ffmpeg-static", ffmpegBinary));

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // allow up to 5 minutes for processing

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB

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
  return error instanceof Error ? error.message : "";
}

export async function POST(req: NextRequest) {
  let sessionDir = "";

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetFormat = (formData.get("format") as string || "mp4").toLowerCase();
    const resolution = formData.get("resolution") as string || "original";
    const muteAudio = formData.get("muteAudio") === "true";

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Video exceeds 100MB limit" }, { status: 400 });
    }

    // Set up session directory
    const sessionId = randomUUID();
    const inputExt = file.name.split('.').pop() || 'mp4';
    sessionDir = path.join(os.tmpdir(), `mediaforge-video-${sessionId}`);
    await fs.mkdir(sessionDir, { recursive: true });

    const baseName = sanitizeBaseName(file.name);
    const tempInputPath = path.join(sessionDir, `input.${inputExt}`);
    const tempOutputPath = path.join(sessionDir, `${baseName}.${targetFormat}`);

    // Write file to input path
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(tempInputPath, Buffer.from(arrayBuffer));

    // Build FFmpeg command
    const command = ffmpeg(tempInputPath);

    // Apply Audio options
    if (muteAudio || targetFormat === "gif") {
      command.noAudio();
    }

    // Apply scale filters based on resolution
    let scaleFilter = "";
    if (resolution === "1080p") {
      scaleFilter = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2";
    } else if (resolution === "720p") {
      scaleFilter = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2";
    } else if (resolution === "480p") {
      scaleFilter = "scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2";
    }

    // Configure codecs/filters based on target format
    if (targetFormat === "gif") {
      const filters = [
        scaleFilter || "scale=480:-1",
        "fps=12",
        "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"
      ].filter(Boolean).join(",");
      command.complexFilter(filters);
    } else {
      if (scaleFilter) {
        command.videoFilters(scaleFilter);
      }

      // Add format specific settings
      switch (targetFormat) {
        case "mp4":
          command.videoCodec("libx264").audioCodec("aac").outputOptions("-pix_fmt yuv420p");
          break;
        case "webm":
          command.videoCodec("libvpx-vp9").audioCodec("libopus").outputOptions("-b:v 0 -crf 30");
          break;
        case "avi":
          // Keep defaults
          break;
        case "mov":
          command.videoCodec("libx264").audioCodec("aac");
          break;
        case "mkv":
          command.videoCodec("libx264");
          break;
        case "mp3":
          command.noVideo().audioCodec("libmp3lame").audioBitrate(192);
          break;
        case "wav":
          command.noVideo().audioCodec("pcm_s16le");
          break;
      }
    }

    // Run conversion
    command.output(tempOutputPath);
    await runFfmpeg(command);

    // Read result
    const resultBuffer = await fs.readFile(tempOutputPath);

    // Set content type
    let mimeType = "video/mp4";
    switch (targetFormat) {
      case "webm": mimeType = "video/webm"; break;
      case "mkv": mimeType = "video/x-matroska"; break;
      case "avi": mimeType = "video/x-msvideo"; break;
      case "mov": mimeType = "video/quicktime"; break;
      case "gif": mimeType = "image/gif"; break;
      case "mp3": mimeType = "audio/mpeg"; break;
      case "wav": mimeType = "audio/wav"; break;
    }

    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${baseName}.${targetFormat}"`,
      },
    });

  } catch (error: unknown) {
    console.error("Video conversion error:", error);
    const errorMsg = getErrorMessage(error);
    const errorLines = errorMsg.split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => {
        if (!line) return false;
        const lower = line.toLowerCase();
        return !lower.startsWith('ffmpeg version') &&
               !lower.startsWith('built with') &&
               !lower.startsWith('configuration:') &&
               !lower.startsWith('libav') &&
               !lower.startsWith('libsw') &&
               !lower.startsWith('libpostproc') &&
               !lower.includes('copyright (c)');
      });
    const parsedError = errorLines.length > 0
      ? errorLines.slice(-2).join(' | ')
      : errorMsg.split('\n')[0].replace(/.*stderr:/, "").trim() || "Failed to convert video file.";
    return NextResponse.json({ error: parsedError }, { status: 500 });
  } finally {
    if (sessionDir) {
      await fs.rm(sessionDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
