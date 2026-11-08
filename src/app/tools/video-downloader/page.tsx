"use client";

import { isAndroidApp } from "@/lib/android-export";
import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, DownloadCloud, Film, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/local-processing/blob-utils";
import { StatusPill } from "@/components/workspace-components";

export default function VideoDownloaderPage() {
  const [url, setUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [format, setFormat] = useState<"mp4" | "mp3">("mp4");
  const [quality, setQuality] = useState<"highest" | "720p" | "360p">("highest");

  const handleDownload = async () => {
    if (!url.trim()) return;

    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsDownloading(true);
    try {
      // 1. Fetch from our backend proxy which handles stream parsing
      const response = await fetch("/api/convert/yt-download", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: url.trim(),
          format,
          quality
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to download media");
      }

      const contentType = response.headers.get("Content-Type") || "";

      if (!contentType.startsWith("video/") && !contentType.startsWith("audio/")) throw new Error("The server did not return media.");
      const blob = await response.blob();
      const filename = /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") || "")?.[1] || "media-download";
      downloadBlob(blob, filename, { kind: "extraction" });

      toast.success("Download started successfully!");
      setUrl("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to download media");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isAndroidApp()) return (
    <ToolLayout title="Media downloader" description="This network tool needs the web app’s server." mode="network">
      <div className="mx-auto max-w-xl space-y-4 border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Use the web workbench for URL downloads</h2>
        <p>The Android app processes files you choose on your phone. URL downloads use a server and are available separately in the web app.</p>
        <a className="inline-block font-semibold text-primary underline underline-offset-4" href="https://mediaforge-tau.vercel.app/tools/video-downloader/" target="_blank" rel="noopener noreferrer">Open media downloader in your browser ↗</a>
      </div>
    </ToolLayout>
  );

  return (
    <ToolLayout
      title="Media downloader"
      description="Download public media up to 50 MB. Direct links keep their original format. Platform links need a configured provider."
      mode="network"
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusPill tone="server">Network tool</StatusPill>
        <StatusPill tone="warning">Only download media you own or have permission to use</StatusPill>
      </div>
      <div className="max-w-2xl mx-auto mt-4 mb-20">
         <div className="relative overflow-hidden border bg-muted/30 p-7 text-center md:p-10">

            {/* Background decors */}
            <div className="absolute -top-10 -right-10 opacity-10">
               <Film className="w-48 h-48" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
               <div className="bg-primary/10 p-4 rounded-full mb-6">
                  <DownloadCloud className="h-10 w-10 text-primary" />
               </div>

               <h2 className="text-2xl font-bold mb-2">Download Media by Link</h2>
               <p className="text-muted-foreground mb-8">
                 This feature contacts external URLs and may use a server route to fetch the media.
               </p>

               <div className="w-full flex flex-col md:flex-row gap-3">
                  <div className="relative w-full">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-muted-foreground" />
                     </div>
                     <Input
                       aria-label="Media URL"
                       placeholder="https://example.com/video.mp4"
                       value={url}
                       onChange={(e) => setUrl(e.target.value)}
                       disabled={isDownloading}
                       className="h-14 pl-10 bg-background/80 text-lg rounded-xl shadow-inner w-full"
                       onKeyDown={(e) => {
                         if(e.key === 'Enter') {
                           e.preventDefault();
                           handleDownload();
                         }
                       }}
                     />
                  </div>

                  <Button
                    size="lg"
                    className="h-14 px-8 rounded-xl shrink-0"
                    disabled={!url.trim() || isDownloading}
                    onClick={handleDownload}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      "Download Now"
                    )}
                  </Button>
               </div>

               {/* Format and Quality Selectors */}
               <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/40 pt-6">
                  <div className="flex flex-col gap-2 text-left">
                     <span className="text-sm font-semibold text-muted-foreground">Provider format</span>
                     <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={format === "mp4" ? "default" : "outline"}
                          onClick={() => setFormat("mp4")}
                          className="flex-1 h-11 rounded-xl"
                          disabled={isDownloading}
                        >
                          MP4 (Video)
                        </Button>
                        <Button
                          type="button"
                          variant={format === "mp3" ? "default" : "outline"}
                          onClick={() => setFormat("mp3")}
                          className="flex-1 h-11 rounded-xl"
                          disabled={isDownloading}
                        >
                          MP3 (Audio)
                        </Button>
                     </div>
                  </div>

                  {format === "mp4" ? (
                     <div className="flex flex-col gap-2 text-left transition-all duration-200">
                        <span className="text-sm font-semibold text-muted-foreground">Provider quality</span>
                        <div className="flex gap-2">
                           <Button
                             type="button"
                             variant={quality === "highest" ? "default" : "outline"}
                             onClick={() => setQuality("highest")}
                             className="flex-1 h-11 rounded-xl text-xs sm:text-sm"
                             disabled={isDownloading}
                           >
                             Best Muxed
                           </Button>
                           <Button
                             type="button"
                             variant={quality === "720p" ? "default" : "outline"}
                             onClick={() => setQuality("720p")}
                             className="flex-1 h-11 rounded-xl text-xs sm:text-sm"
                             disabled={isDownloading}
                           >
                             720p
                           </Button>
                           <Button
                             type="button"
                             variant={quality === "360p" ? "default" : "outline"}
                             onClick={() => setQuality("360p")}
                             className="flex-1 h-11 rounded-xl text-xs sm:text-sm"
                             disabled={isDownloading}
                           >
                             360p
                           </Button>
                        </div>
                     </div>
                  ) : (
                     <div className="flex flex-col gap-2 text-left opacity-50">
                        <span className="text-sm font-semibold text-muted-foreground">Provider quality</span>
                        <div className="flex items-center h-11 px-4 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                           MP3 requested from provider
                        </div>
                     </div>
                  )}
               </div>

               <div className="mt-8 flex flex-wrap justify-center gap-4 opacity-50">
                  <div className="flex items-center text-sm"><Film className="h-4 w-4 mr-1" /> Platform links (provider required)</div>
                  <div className="flex items-center text-sm"><LinkIcon className="h-4 w-4 mr-1" /> Direct MP4</div>
               </div>
            </div>

         </div>
      </div>
    </ToolLayout>
  );
}
