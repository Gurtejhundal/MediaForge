import { NextRequest, NextResponse } from "next/server";
import { convertFormat, resizeImage } from "@/lib/imageProcessor";

export const maxDuration = 10;

export async function POST(req: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  try {
    const { tool } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    
    let resultBuffer: Buffer;
    let mimeType = "image/png";
    let filename = `converted-image.png`;

    if (tool === "format") {
      const targetFormat = formData.get("format") as "png" | "jpeg" | "webp" | "avif" | "heif" || "png";
      const quality = parseInt(formData.get("quality") as string) || undefined;
      resultBuffer = await convertFormat(inputBuffer, targetFormat, quality);
      mimeType = `image/${targetFormat}`;
      filename = `converted.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`;
    } 
    else if (tool === "resize") {
      const widthStr = formData.get("width") as string;
      const heightStr = formData.get("height") as string;
      const width = widthStr ? parseInt(widthStr) : undefined;
      const height = heightStr ? parseInt(heightStr) : undefined;
      
      resultBuffer = await resizeImage(inputBuffer, width, height);
      // Try to preserve original extension if possible
      const ext = file.name.split('.').pop() || 'png';
      mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      filename = `resized.${ext}`;
    }
    else if (tool === "compress") {
       const format = formData.get("format") as "png" | "jpeg" | "webp" | "avif" | "heif" || "webp";
       const quality = parseInt(formData.get("quality") as string) || 60;
       resultBuffer = await convertFormat(inputBuffer, format, quality);
       mimeType = `image/${format}`;
       filename = `compressed.${format === 'jpeg' ? 'jpg' : format}`;
    }
    else {
      return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }

    // Return direct binary stream for general downloads
    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error("General conversion error:", error);
    return NextResponse.json({ error: "Failed to process image." }, { status: 500 });
  }
}
