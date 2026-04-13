import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import ffmpeg from "fluent-ffmpeg";
// Require typescript declaration hack since ffmpeg-static usually exports the path string
const ffmpegPath = require("ffmpeg-static");

// Inform ffmpeg where the binary is installed
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// Since Vercel Edge/Serverless might limit massive video duration, we can allow up to max time
export const maxDuration = 300; 

export async function POST(req: NextRequest) {
  let tempVideoPath = "";
  let tempOutputPath = "";

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const action = formData.get("action") as "frame" | "gif" || "frame";
    const timestampStr = formData.get("timestamp") as string || "00:00:01";
    const durationStr = formData.get("duration") as string || "3"; // For GIF
    
    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Video exceeds 50MB limit" }, { status: 400 });
    }

    // Prepare temp workspace
    const sessionId = randomUUID();
    const ext = file.name.split('.').pop() || 'mp4';
    tempVideoPath = path.join(os.tmpdir(), `${sessionId}-input.${ext}`);
    tempOutputPath = path.join(os.tmpdir(), `${sessionId}-output.${action === 'gif' ? 'gif' : 'jpg'}`);

    // Write array buffer to local OS format for FFmpeg to safely decode
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(tempVideoPath, Buffer.from(arrayBuffer));

    // Execute FFmpeg extraction
    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg(tempVideoPath);
      
      if (action === "frame") {
        command
          .seekInput(timestampStr)
          .frames(1)
          .output(tempOutputPath)
          .on("end", () => resolve())
          .on("error", (err) => reject(new Error(`FFmpeg processing error: ${err.message}`)))
          .run();
      } else if (action === "gif") {
        command
          .seekInput(timestampStr)
          .setDuration(parseInt(durationStr) || 3)
          // Basic high-compatibility framerate and filter scale for GIF output to keep size manageable
          .complexFilter("fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse")
          .output(tempOutputPath)
          .on("end", () => resolve())
          .on("error", (err) => reject(new Error(`FFmpeg GIF processing error: ${err.message}`)))
          .run();
      }
    });

    // Read the generated file
    const resultBuffer = await fs.readFile(tempOutputPath);
    const mimeType = action === 'gif' ? 'image/gif' : 'image/jpeg';
    const filename = `extracted-${sessionId}.${action === 'gif' ? 'gif' : 'jpg'}`;

    // Clean up instantly
    await fs.unlink(tempVideoPath).catch(() => {});
    await fs.unlink(tempOutputPath).catch(() => {});

    // Stream back directly
    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    // Attempt absolute clean up upon random crash
    if (tempVideoPath) await fs.unlink(tempVideoPath).catch(() => {});
    if (tempOutputPath) await fs.unlink(tempOutputPath).catch(() => {});
    
    console.error("Video conversion error:", error);
    return NextResponse.json({ error: "Failed to process video file." }, { status: 500 });
  }
}
