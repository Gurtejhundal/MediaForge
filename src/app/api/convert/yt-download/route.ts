import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export const dynamic = "force-dynamic";

const FALLBACK_APIS = [
  "https://dog.kittycat.boo",
  "https://rue-cobalt.xenon.zone",
  "https://cobaltapi.cjs.nz"
];

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

// Shuffles an array to randomize load balancing
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function tryCobaltAPI(url: string, isAudio: boolean, quality: string) {
  let apis = [...FALLBACK_APIS];
  
  // Try fetching live working instances list first
  try {
    const res = await fetch("https://cobalt.directory/api/working?type=api", { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data.youtube) && json.data.youtube.length > 0) {
        apis = json.data.youtube.map((api: string) => api.replace(/\/$/, ""));
      }
    }
  } catch (err) {
    console.warn("Could not fetch working Cobalt list, using fallback instances:", err);
  }

  // Shuffle APIs to balance the load
  const shuffledApis = shuffleArray(apis);

  for (const api of shuffledApis) {
    // Try v10 payload format
    const payloadV10 = {
      url,
      videoQuality: quality === "highest" ? "1080" : quality === "720p" ? "720" : "360",
      downloadMode: isAudio ? "audio" : "auto",
      audioFormat: "mp3"
    };

    try {
      const response = await fetch(api, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payloadV10),
        signal: AbortSignal.timeout(6000)
      });

      const data = await response.json();
      if (response.ok && data.url) {
        return { downloadUrl: data.url, filename: data.filename };
      }

      // Fallback: If invalid body error code is returned, try v7 payload
      if (data?.error?.code === "error.api.invalid_body") {
        const payloadV7 = {
          url,
          videoQuality: quality === "highest" ? "720" : quality === "720p" ? "720" : "360",
          isAudioOnly: isAudio
        };

        const responseV7 = await fetch(api, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payloadV7),
          signal: AbortSignal.timeout(6000)
        });

        const dataV7 = await responseV7.json();
        if (responseV7.ok && dataV7.url) {
          return { downloadUrl: dataV7.url, filename: dataV7.filename };
        }
      }
    } catch (err) {
      console.warn(`Cobalt instance ${api} failed to process request:`, err);
    }
  }

  return null;
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

    const isAudio = formatType === "mp3";

    // 1. Try public Cobalt instances first (works in cloud/Vercel!)
    const cobaltResult = await tryCobaltAPI(url, isAudio, quality);
    if (cobaltResult) {
      return NextResponse.json({
        success: true,
        downloadUrl: cobaltResult.downloadUrl,
        filename: cobaltResult.filename
      });
    }

    // 2. Fallback: If Cobalt fails, use local ytdl-core streaming (works locally)
    if (!ytdl.validateURL(url)) {
        return NextResponse.json({ error: "Unsupported URL or Cobalt instances failed to process this download. Check link and try again." }, { status: 400 });
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, ''); // sanitize filename
    
    let selectedFormat;
    let extension = "mp4";
    let contentType = "video/mp4";

    if (isAudio) {
      selectedFormat = ytdl.chooseFormat(info.formats, { filter: "audioonly", quality: "highestaudio" });
      extension = "mp3";
      contentType = "audio/mpeg";
    } else {
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
    
    // We cannot stream direct binary download if on Vercel because of bot verification, but local dev works!
    const stream = ytdl(url, { format: selectedFormat });
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

    // Return the response headers containing Content-Disposition to prompt browser download
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
