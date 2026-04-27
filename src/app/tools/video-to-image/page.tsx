"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Loader2, Film, RefreshCw, Images, Image as ImageIcon, Clapperboard } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/components/preview/image-preview";

type ExportAction = "sequence" | "frame" | "gif";
type FrameFormat = "jpg" | "png";
type SequenceMode = "sampled" | "source";

function getFilenameFromResponse(response: Response, fallback: string) {
  const contentDisposition = response.headers.get("content-disposition");
  const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);

  return filenameMatch?.[1] || fallback;
}

function getBaseName(filename: string) {
  return filename.replace(/\.[^.]+$/, "") || "video";
}

export default function VideoToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetAction, setTargetAction] = useState<ExportAction>("sequence");
  const [frameFormat, setFrameFormat] = useState<FrameFormat>("jpg");
  const [sequenceMode, setSequenceMode] = useState<SequenceMode>("sampled");
  const [frameRate, setFrameRate] = useState<number[]>([12]);
  const [maxFrames, setMaxFrames] = useState<string>("240");
  const [timestamp, setTimestamp] = useState<string>("00:00:01");
  const [gifDuration, setGifDuration] = useState<string>("3");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const exportLabel = targetAction === "sequence"
    ? "Export Frame ZIP"
    : targetAction === "gif"
      ? "Generate GIF"
      : "Extract Still Frame";

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("action", targetAction);
    formData.append("format", frameFormat);
    formData.append("timestamp", timestamp);

    if (targetAction === "sequence") {
      formData.append("sequenceMode", sequenceMode);
      formData.append("frameRate", String(frameRate[0]));
      formData.append("maxFrames", maxFrames);
    }

    if (targetAction === "gif") {
      formData.append("duration", gifDuration);
    }

    try {
      const response = await fetch("/api/convert/video-to-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
         const errData = await response.json().catch(() => ({}));
         throw new Error(errData.error || "Failed to process video");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFilenameFromResponse(
        response,
        `${getBaseName(file.name)}-${targetAction === "sequence" ? "frames.zip" : targetAction === "gif" ? "clip.gif" : `frame.${frameFormat}`}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success(targetAction === "sequence" ? "Frame ZIP exported successfully." : "Video export completed.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to process video");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout 
      title="Video to Image Suite" 
      description="Export numbered image sequences, still frames, or compact GIFs from uploaded videos."
    >
      <div className="space-y-8">
        {!file ? (
          <Dropzone 
            onFileAccepted={handleFileAccepted} 
            accept={{ "video/mp4": [".mp4"], "video/webm": [".webm"], "video/quicktime": [".mov"] }}
            maxSizeMB={50} 
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
             <div className="rounded-lg overflow-hidden bg-black/10 border aspect-video flex items-center justify-center">
                 <video 
                   src={previewUrl!} 
                   controls 
                   className="max-h-full max-w-full"
                 />
             </div>
          </div>
        )}

        {file && (
          <div className="bg-muted/30 p-6 rounded-xl border">
            <h3 className="mb-4 font-semibold text-lg flex items-center"><Film className="mr-2 h-5 w-5 text-primary" /> Export Settings</h3>
            
            <div className="space-y-6">
               <div>
                  <Label className="mb-3 block text-sm text-foreground">Output Type</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                     <Button 
                       variant={targetAction === "sequence" ? "default" : "outline"}
                       onClick={() => setTargetAction("sequence")}
                       className="h-11 justify-center"
                     >
                       <Images className="mr-2 h-4 w-4" />
                       Frame ZIP
                     </Button>
                     <Button 
                       variant={targetAction === "frame" ? "default" : "outline"}
                       onClick={() => setTargetAction("frame")}
                       className="h-11 justify-center"
                     >
                       <ImageIcon className="mr-2 h-4 w-4" />
                       Still Frame
                     </Button>
                     <Button 
                       variant={targetAction === "gif" ? "default" : "outline"}
                       onClick={() => setTargetAction("gif")}
                       className="h-11 justify-center"
                     >
                       <Clapperboard className="mr-2 h-4 w-4" />
                       GIF
                     </Button>
                  </div>
               </div>

               {targetAction !== "gif" && (
                 <div>
                    <Label className="mb-3 block text-sm text-foreground">Image Format</Label>
                    <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                       {(["jpg", "png"] as const).map((format) => (
                         <Button
                           key={format}
                           variant={frameFormat === format ? "default" : "outline"}
                           onClick={() => setFrameFormat(format)}
                           className="h-10 uppercase"
                         >
                           {format}
                         </Button>
                       ))}
                    </div>
                 </div>
               )}

               {targetAction === "sequence" && (
                 <div className="space-y-5 rounded-xl border bg-background/60 p-5">
                    <div>
                       <Label className="mb-3 block text-sm text-foreground">Sequence Mode</Label>
                       <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Button
                            variant={sequenceMode === "sampled" ? "default" : "outline"}
                            onClick={() => setSequenceMode("sampled")}
                            className="h-10"
                          >
                            Sampled FPS
                          </Button>
                          <Button
                            variant={sequenceMode === "source" ? "default" : "outline"}
                            onClick={() => setSequenceMode("source")}
                            className="h-10"
                          >
                            Source Frames
                          </Button>
                       </div>
                    </div>

                    {sequenceMode === "sampled" && (
                      <div>
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <Label>Frames Per Second</Label>
                          <span className="rounded-md bg-primary/15 px-2 py-1 text-sm font-semibold text-primary">
                            {frameRate[0]} fps
                          </span>
                        </div>
                        <Slider
                          value={frameRate}
                          onValueChange={(value) => setFrameRate(value as number[])}
                          min={1}
                          max={30}
                          step={1}
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="maxFrames">Maximum Frames</Label>
                      <Input
                        id="maxFrames"
                        type="number"
                        min={1}
                        max={600}
                        value={maxFrames}
                        onChange={(event) => setMaxFrames(event.target.value)}
                        className="mt-2 max-w-xs"
                      />
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                   <div>
                      <Label htmlFor="timestamp">Start Timestamp (HH:MM:SS)</Label>
                      <Input 
                        id="timestamp" 
                        placeholder="00:00:01" 
                        value={timestamp} 
                        onChange={e => setTimestamp(e.target.value)} 
                        className="mt-2" 
                      />
                   </div>
                   {targetAction === "gif" && (
                     <div>
                        <Label htmlFor="duration">GIF Duration (Seconds)</Label>
                        <Input 
                          id="duration" 
                          type="number" 
                          placeholder="3" 
                          value={gifDuration} 
                          onChange={e => setGifDuration(e.target.value)} 
                          className="mt-2" 
                        />
                     </div>
                   )}
               </div>

               <div className="pt-4 border-t border-border/50">
                <Button 
                  size="lg" 
                  onClick={handleConvert} 
                  disabled={isProcessing}
                  className="w-full text-md h-12 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] animate-[shimmer_2s_infinite] group-hover:block transition-all"></span>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Parsing Video Streams...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      {exportLabel}
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
