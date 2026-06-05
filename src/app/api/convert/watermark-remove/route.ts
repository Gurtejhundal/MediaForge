import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Server-side watermark cleanup is disabled. Use the browser-local Watermark Remover so files stay on the device.",
    },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Server-side watermark cleanup jobs are disabled. Use the browser-local Watermark Remover.",
    },
    { status: 410 },
  );
}
