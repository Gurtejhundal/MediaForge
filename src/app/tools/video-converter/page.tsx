"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Film, RefreshCw, VolumeX, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/components/preview/image-preview";
import { downloadBlob, revokeObjectUrl } from "@/lib/local-processing/blob-utils";
import { renderVideoToWebMLocally, type VideoResolutionMode } from "@/lib/local-processing/video-processing";

type ResolutionMode = Extract<VideoResolutionMode, "original" | "1080p" | "720p" | "480p">;

export default function VideoConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resolution, setResolution] = useState<ResolutionMode>("original");
  const [muteAudio, setMuteAudio] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileAccepted = (acceptedFile: File) => {
    revokeObjectUrl(previewUrl);
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
  };

  const clearFile = () => {
    revokeObjectUrl(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setProgress(0);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await renderVideoToWebMLocally(file, {
        resolution,
        fps: 24,
        onProgress: setProgress,
      });
      downloadBlob(result.blob, result.filename, { kind: "video" });
      toast.success("Video exported locally as WebM.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to convert video");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout 
      title="Video Converter" 
      description="Convert playable videos locally in your browser and export a WebM file without uploading."
    >
      <div className="space-y-8 w-full">
        {!file ? (
          <Dropzone 
            onFileAccepted={handleFileAccepted} 
            accept={{ 
              "video/mp4": [".mp4"], 
              "video/webm": [".webm"], 
              "video/quicktime": [".mov"],
              "video/x-msvideo": [".avi"],
              "video/x-matroska": [".mkv"],
              "audio/mpeg": [".mp3"],
              "audio/wav": [".wav"]
            }}
            displayMode="video"
            processingMode="local"
          />
        ) : (
          <div className="relative flex flex-col p-4 border rounded-xl bg-card overflow-hidden">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center min-w-0">
                   <Film className="h-5 w-5 mr-3 text-primary" />
                   <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatBytes(file.size)}</p>
                   </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFile} className="text-muted-foreground hover:text-destructive">Remove File</Button>
             </div>
             
             {/* Native HTML5 Video Player for scrubbing */}
             {file.type.startsWith("video/") && (
               <div className="rounded-lg overflow-hidden bg-black/10 border aspect-video flex items-center justify-center">
                   <video 
                     src={previewUrl!} 
                     controls 
                     className="max-h-full max-w-full"
                   />
               </div>
             )}
          </div>
        )}

        {file && (
          <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
            <h3 className="font-semibold text-lg flex items-center">
              <RefreshCw className="mr-2 h-5 w-5 text-primary" /> Conversion Settings
            </h3>
            
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-sm text-foreground">Target Format</Label>
                <div className="rounded-lg border bg-background p-4 text-sm">
                  <span className="font-semibold">WEBM</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Browser-native local export. MP4, MOV, AVI, MKV, GIF, MP3, and WAV need a future local FFmpeg WASM engine.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This stays on your device. Encoding runs in real time, so a 2 minute video can take about 2 minutes.
                </p>
              </div>

              <div>
                <Label className="mb-3 block text-sm text-foreground">Target Resolution</Label>
                <div className="flex flex-wrap gap-2">
                  {(["original", "1080p", "720p", "480p"] as const).map((res) => (
                    <Button
                      key={res}
                      variant={resolution === res ? "default" : "outline"}
                      onClick={() => setResolution(res)}
                      className="capitalize min-w-[90px] h-10"
                    >
                      {res === "original" ? "Original Size" : res}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block text-sm text-foreground">Audio Track</Label>
                <div className="flex items-center space-x-3">
                  <Button type="button" variant="outline" disabled className="h-10">
                    <Volume2 className="mr-2 h-4 w-4" />
                    Keep Audio
                  </Button>
                  <Button
                    type="button"
                    variant={muteAudio ? "default" : "outline"}
                    onClick={() => setMuteAudio(true)}
                    className="h-10"
                  >
                    <VolumeX className="mr-2 h-4 w-4" />
                    Muted Local Export
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Browser canvas export strips audio in this local mode. Audio muxing needs local FFmpeg WASM.
                </p>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Button 
                  size="lg" 
                  onClick={handleConvert} 
                  disabled={isProcessing}
                  className="w-full text-md h-12 relative overflow-hidden group"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Converting Video Streams (This may take a minute)...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Export Local WEBM
                    </>
                  )}
                </Button>
                {isProcessing && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
