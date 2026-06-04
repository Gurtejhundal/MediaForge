import { NextRequest, NextResponse } from "next/server";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to fetch the requested URL.";
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 });
    }

    // Try fetching the remote resource
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resource: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error: unknown) {
    console.error("URL Fetch Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
