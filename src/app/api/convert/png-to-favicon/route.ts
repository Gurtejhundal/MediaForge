import { NextRequest, NextResponse } from "next/server";
import { generateFaviconPackage } from "@/lib/faviconGenerator";

// Configure maximum sizes if deploying on Vercel
export const maxDuration = 10; 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }

    // Convert Next.js File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process
    const result = await generateFaviconPackage(buffer);

    // We return JSON containing previews and base64 ZIP payload
    // so we don't need persistent server storage to "download later".
    return NextResponse.json({
      previews: result.previews,
      zipData: result.zipBuffer.toString("base64"),
      filename: "favicon-pack.zip"
    });

  } catch (error) {
    console.error("Favicon generation error:", error);
    return NextResponse.json({ error: "Failed to generate favicons. Make sure the file is a valid image." }, { status: 500 });
  }
}
