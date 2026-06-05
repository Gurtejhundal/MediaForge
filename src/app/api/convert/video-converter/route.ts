import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Server-side video conversion is disabled. Use the browser-local Video Converter so files stay on the device.",
    },
    { status: 410 },
  );
}
