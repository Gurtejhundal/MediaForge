import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Server-side PDF organization is disabled. Use the browser-local PDF Organizer so files stay on the device.",
    },
    { status: 410 },
  );
}
