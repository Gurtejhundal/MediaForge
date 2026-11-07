import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = process.env.MEDIAFORGE_DESKTOP_TOKEN;
  if (token && request.headers.get("x-mediaforge-desktop-token") !== token) {
    return NextResponse.json({ error: "This local workbench is available only inside MediaForge." }, { status: 403 });
  }
  return NextResponse.next();
}
