import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Server-side video upscaling is disabled. Use the browser-local Video Upscaler so files stay on the device.",
    },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Server-side video upscaling jobs are disabled. Use the browser-local Video Upscaler.",
    },
    { status: 410 },
  );
}
