"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Film, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/components/preview/image-preview";

export default function VideoToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetAction, setTargetAction] = useState<"frame" | "gif">("frame");
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

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("action", targetAction);
    formData.append("timestamp", timestamp);
    if (targetAction === "gif") formData.append("duration", gifDuration);

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
      link.download = `extracted-${file.name.split('.')[0]}.${targetAction === 'gif' ? 'gif' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Video converted to ${targetAction.toUpperCase()} successfully!`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout 
      title="Video to Image Suite" 
      description="Extract high-quality JPG frames or generate compressed animated GIFs from your video files instantly."
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
                <div className="flex items-center">
                   <Film className="h-5 w-5 mr-3 text-primary" />
                   <div>
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
            <h3 className="mb-4 font-semibold text-lg flex items-center"><Film className="mr-2 h-5 w-5 text-primary" /> Conversion Matrix</h3>
            
            <div className="space-y-6">
               <div>
                  <Label className="mb-3 block text-sm text-foreground">Extract Type</Label>
                  <div className="flex gap-4">
                     <Button 
                       variant={targetAction === "frame" ? "default" : "outline"}
                       onClick={() => setTargetAction("frame")}
                       className="w-1/2"
                     >
                       Single JPG Frame
                     </Button>
                     <Button 
                       variant={targetAction === "gif" ? "default" : "outline"}
                       onClick={() => setTargetAction("gif")}
                       className="w-1/2"
                     >
                       Animated GIF
                     </Button>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
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
                      {targetAction === 'gif' ? 'Generate Animated GIF' : 'Extract JPG Frame'}
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
