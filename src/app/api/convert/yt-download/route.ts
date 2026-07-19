import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Failed to process the requested URL.";
  
  if (
    message.includes("confirm you are not a bot") || 
    message.includes("Sign in to") || 
    message.includes("LOGIN_REQUIRED")
  ) {
    return "YouTube is blocking this download request from Vercel's serverless servers (requesting bot verification). To download YouTube videos, please run MediaForge locally on your own computer, where requests will use your own internet IP and bypass this server block.";
  }
  
  return message;
}

export async function POST(req: NextRequest) {
  try {
    const { url, format: formatType, quality } = await req.json();

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
    
    let selectedFormat;
    let extension = "mp4";
    let contentType = "video/mp4";

    if (formatType === "mp3") {
      selectedFormat = ytdl.chooseFormat(info.formats, { filter: "audioonly", quality: "highestaudio" });
      extension = "mp3";
      contentType = "audio/mpeg";
    } else {
      // It's mp4 (video)
      const muxedFormats = ytdl.filterFormats(info.formats, "audioandvideo");
      if (quality === "360p") {
        selectedFormat = muxedFormats.find(f => f.qualityLabel === "360p") || 
                         ytdl.chooseFormat(info.formats, { filter: "audioandvideo", quality: "lowest" });
      } else if (quality === "720p") {
        selectedFormat = muxedFormats.find(f => f.qualityLabel === "720p") || 
                         ytdl.chooseFormat(info.formats, { filter: "audioandvideo", quality: "highest" });
      } else {
        selectedFormat = ytdl.chooseFormat(info.formats, { filter: "audioandvideo", quality: "highest" });
      }
      
      extension = "mp4";
      contentType = selectedFormat?.mimeType || "video/mp4";
    }

    if (!selectedFormat) {
      throw new Error("No suitable format found for the selected options.");
    }
    
    const stream = ytdl(url, { format: selectedFormat });
    
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
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${title}.${extension}"`
      }
    });

  } catch (error: unknown) {
    console.error("Link Downloader Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
