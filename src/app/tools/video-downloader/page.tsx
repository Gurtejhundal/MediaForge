"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, DownloadCloud, Youtube, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function VideoDownloaderPage() {
  const [url, setUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!url.trim()) return;

    try {
      new URL(url); // quick validate
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
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to download media");
      }

      // 2. Stream the binary response securely to client
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "media-download.mp4";
      
      if (contentDisposition) {
         const matches = /filename="([^"]+)"/.exec(contentDisposition);
         if (matches && matches[1]) {
             filename = matches[1];
         }
      }

      // 3. Prompt user save window safely
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);

      toast.success("Download started successfully!");
      setUrl("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ToolLayout 
      title="Universal Video Downloader" 
      description="Paste a standard YouTube link or direct video file link (.mp4) below to securely download the full raw video file."
    >
      <div className="max-w-2xl mx-auto mt-4 mb-20">
         <div className="bg-muted/30 p-8 md:p-12 rounded-3xl border text-center shadow-sm relative overflow-hidden">
            
            {/* Background decors */}
            <div className="absolute -top-10 -right-10 opacity-10">
               <Youtube className="w-48 h-48" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
               <div className="bg-primary/10 p-4 rounded-full mb-6">
                  <DownloadCloud className="h-10 w-10 text-primary" />
               </div>

               <h2 className="text-2xl font-bold mb-2">Download Media by Link</h2>
               <p className="text-muted-foreground mb-8">
                 Supports standard YouTube URLs and public `.mp4` / `.webm` raw links.
               </p>

               <div className="w-full flex flex-col md:flex-row gap-3">
                  <div className="relative w-full">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-muted-foreground" />
                     </div>
                     <Input 
                       placeholder="https://youtube.com/watch?v=..." 
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
               
               <div className="mt-8 flex flex-wrap justify-center gap-4 opacity-50">
                  <div className="flex items-center text-sm"><Youtube className="h-4 w-4 mr-1" /> YouTube</div>
                  <div className="flex items-center text-sm"><LinkIcon className="h-4 w-4 mr-1" /> Direct MP4</div>
               </div>
            </div>

         </div>
      </div>
    </ToolLayout>
  );
}
