import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This image conversion endpoint is disabled. Use the browser-local Image Modifier, Format Converter, Resizer, or Compressor tools.",
    },
    { status: 410 },
  );
}
