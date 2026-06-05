import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Server-side image enhancement is disabled. Use the browser-local Image Detailer so files stay on the device.",
    },
    { status: 410 },
  );
}
