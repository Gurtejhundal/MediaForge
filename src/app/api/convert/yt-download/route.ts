import { errorResponse, fetchPublic, publicUrl, readJson, RequestError } from "@/lib/network";

export const dynamic = "force-dynamic";
const MEDIA_TYPES = /^(?:video\/(?:mp4|webm|quicktime)|audio\/(?:mpeg|mp4|webm|ogg|wav|x-wav))$/;
const EXTENSIONS: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/webm": "webm", "audio/ogg": "ogg", "audio/wav": "wav", "audio/x-wav": "wav" };

let activeDownloads = 0;

export async function POST(request: Request) {
  if (activeDownloads >= 2) return Response.json({ error: "The download bench is busy. Try again shortly." }, { status: 429, headers: { "Retry-After": "20" } });
  activeDownloads += 1;
  try {
    const body = await readJson(request);
    const url = publicUrl(body.url);
    const direct = /\.(mp4|webm|mov|mp3|m4a|ogg|wav)$/i.test(url.pathname);
    let downloadUrl = url.href;
    if (!direct) {
      const provider = process.env.MEDIAFORGE_DOWNLOADER_URL;
      if (!provider) throw new RequestError("This server supports direct media links. Platform links require the owner to configure a trusted download provider.", 503);
      if (!["mp4", "mp3"].includes(String(body.format))) throw new RequestError("Choose MP4 video or MP3 audio.");
      const result = await fetchPublic(provider, { maxBytes: 64 * 1024, timeoutMs: 15_000, json: { url: url.href, downloadMode: body.format === "mp3" ? "audio" : "auto", audioFormat: "mp3", videoQuality: body.quality === "360p" ? "360" : body.quality === "720p" ? "720" : "1080" } });
      const payload = JSON.parse(result.bytes.toString("utf8"));
      downloadUrl = publicUrl(payload.url).href;
    }
    const media = await fetchPublic(downloadUrl, { allowedTypes: MEDIA_TYPES });
    return new Response(new Uint8Array(media.bytes), { headers: {
      "Content-Type": media.contentType,
      "Content-Disposition": `attachment; filename="media-download.${EXTENSIONS[media.contentType]}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    } });
  } catch (error) { return errorResponse(error); }
  finally { activeDownloads -= 1; }
}
