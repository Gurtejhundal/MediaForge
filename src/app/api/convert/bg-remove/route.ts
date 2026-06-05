import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Server-side background removal is disabled. Use the browser-local Background Remover so files stay on the device.",
    },
    { status: 410 },
  );
}
