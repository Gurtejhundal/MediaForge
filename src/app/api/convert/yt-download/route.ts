import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 });
    }

    // Handle Native direct links instantly fallback
    if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov')) {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Could not fetch remote media");
        const contentType = response.headers.get("content-type") || "video/mp4";
        const buffer = await response.arrayBuffer();
        return new NextResponse(buffer, {
             status: 200,
             headers: {
                 "Content-Type": contentType,
                 "Content-Disposition": `attachment; filename="media-file.${contentType.split('/')[1] || 'mp4'}"`
             }
        });
    }

    // Handle YouTube Links
    if (!ytdl.validateURL(url)) {
        return NextResponse.json({ error: "Unsupported URL. Currently supports standard YouTube links or direct .mp4/.webm links." }, { status: 400 });
    }

    // Get Info about video
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, ''); // sanitize filename
    
    // Select the best format containing both video and audio ideally
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    
    // We must fetch from the format URL since we can't cleanly stream ytdl directly through Next.js Edge Responses sometimes
    // Actually, ytdl(url) returns a readable stream which we can wrap in a web ReadableStream!
    
    const stream = ytdl(url, { format });
    
    // Convert Node Readable to Web ReadableStream for Next.js response
    const webStream = new ReadableStream({
       start(controller) {
          stream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk)));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
       },
       cancel() {
          stream.destroy();
       }
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': format.mimeType || 'video/mp4',
        'Content-Disposition': `attachment; filename="${title}.mp4"`
      }
    });

  } catch (error: any) {
    console.error("Link Downloader Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process the requested URL." }, { status: 500 });
  }
}
