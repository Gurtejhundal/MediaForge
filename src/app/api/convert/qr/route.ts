import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Server-side QR generation is disabled. Use the browser-local QR Generator so content stays on the device.",
    },
    { status: 410 },
  );
}
