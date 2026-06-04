import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Server-side favicon generation is disabled. Use the browser-local Favicon Builder so files stay on the device.",
    },
    { status: 410 },
  );
}
