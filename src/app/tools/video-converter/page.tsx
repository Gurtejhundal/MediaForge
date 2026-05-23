"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Film, RefreshCw, VolumeX, Volume2, Shield } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/components/preview/image-preview";

type VideoFormat = "mp4" | "webm" | "mkv" | "avi" | "mov" | "gif" | "mp3" | "wav";
type ResolutionMode = "original" | "1080p" | "720p" | "480p";

function getFilenameFromResponse(response: Response, fallback: string) {
  const contentDisposition = response.headers.get("content-disposition");
  const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
  return filenameMatch?.[1] || fallback;
}

function getBaseName(filename: string) {
  return filename.replace(/\.[^.]+$/, "") || "video";
}

export default function VideoConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<VideoFormat>("mp4");
  const [resolution, setResolution] = useState<ResolutionMode>("original");
  const [muteAudio, setMuteAudio] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", targetFormat);
    formData.append("resolution", resolution);
    formData.append("muteAudio", String(muteAudio));

    try {
      const response = await fetch("/api/convert/video-converter", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to convert video");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFilenameFromResponse(response, `${getBaseName(file.name)}.${targetFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success("Video converted and downloaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to convert video");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout 
      title="Video Converter" 
      description="Convert video files to any format locally and securely using our built-in video encoder."
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
            maxSizeMB={100} 
            displayMode="video"
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
              {/* Target Format Selector */}
              <div>
                <Label className="mb-3 block text-sm text-foreground">Target Format</Label>
                <div className="flex flex-wrap gap-2">
                  {(["mp4", "webm", "mkv", "avi", "mov", "gif", "mp3", "wav"] as const).map((format) => (
                    <Button
                      key={format}
                      variant={targetFormat === format ? "default" : "outline"}
                      onClick={() => setTargetFormat(format)}
                      className="capitalize min-w-[70px] h-10"
                    >
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Select GIF to convert video to an animated GIF, or MP3/WAV to extract audio only.
                </p>
              </div>

              {/* Resolution Selector (Disabled for Audio Formats) */}
              {targetFormat !== "mp3" && targetFormat !== "wav" && (
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
              )}

              {/* Mute Audio Option (Disabled for Audio Formats and GIF) */}
              {targetFormat !== "mp3" && targetFormat !== "wav" && targetFormat !== "gif" && (
                <div>
                  <Label className="mb-3 block text-sm text-foreground">Audio Track</Label>
                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant={muteAudio ? "outline" : "default"}
                      onClick={() => setMuteAudio(false)}
                      className="h-10"
                    >
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
                      Mute Audio
                    </Button>
                  </div>
                </div>
              )}

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
                      Convert to {targetFormat.toUpperCase()}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
