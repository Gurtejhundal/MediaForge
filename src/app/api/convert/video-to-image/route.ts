import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Server-side frame extraction is disabled. Use the browser-local Frame Extractor so videos stay on the device.",
    },
    { status: 410 },
  );
}
