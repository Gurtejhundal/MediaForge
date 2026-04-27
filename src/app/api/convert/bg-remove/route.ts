import { NextRequest, NextResponse } from "next/server";
import { removeBackground } from "@imgly/background-removal-node";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 20MB limit" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputData = new Uint8Array(arrayBuffer);

    // Run AI background removal — pass raw bytes directly
    // The library handles image decoding internally via its own bundled sharp
    const resultBlob = await removeBackground(inputData, {
      model: "medium",
      output: {
        format: "image/png",
        quality: 1,
      },
    });

    // Convert result Blob to Buffer
    const resultArrayBuffer = await resultBlob.arrayBuffer();
    const resultBuffer = Buffer.from(resultArrayBuffer);

    const originalName = file.name.replace(/\.[^.]+$/, "");

    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${originalName}-no-bg.png"`,
      },
    });
  } catch (error) {
    console.error("Background removal error:", error);
    return NextResponse.json(
      { error: "Failed to remove background. Please try with a different image." },
      { status: 500 }
    );
  }
}

