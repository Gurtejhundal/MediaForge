"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Eraser, Film, MousePointer2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/components/preview/image-preview";
import { cn } from "@/lib/utils";

interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function WatermarkRemoverPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [selection, setSelection] = useState<Region>({ x: 10, y: 10, w: 100, h: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
  };

  const onVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setVideoSize({ width: video.videoWidth, height: video.videoHeight });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
    setSelection({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const x = Math.min(dragStart.x, currentX);
    const y = Math.min(dragStart.y, currentY);
    const w = Math.abs(currentX - dragStart.x);
    const h = Math.abs(currentY - dragStart.y);

    setSelection({ x, y, w, h });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleRemoveWatermark = async () => {
    if (!file || !containerRef.current || !videoRef.current) return;

    setIsProcessing(true);
    setProgress("Initializing...");

    // Scale coordinates to actual video resolution
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = videoSize.width / rect.width;
    const scaleY = videoSize.height / rect.height;

    const actualX = Math.round(selection.x * scaleX);
    const actualY = Math.round(selection.y * scaleY);
    const actualW = Math.round(selection.w * scaleX);
    const actualH = Math.round(selection.h * scaleY);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("x", actualX.toString());
    formData.append("y", actualY.toString());
    formData.append("w", actualW.toString());
    formData.append("h", actualH.toString());

    try {
      const res = await fetch("/api/convert/watermark-remove", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to start processing");
      const { jobId } = await res.json();

      const poll = async () => {
        const statusRes = await fetch(`/api/convert/watermark-remove?jobId=${jobId}`);
        const job = await statusRes.json();

        if (job.status === "error") throw new Error(job.error || "Processing failed");
        
        if (job.status === "completed") {
          setProgress("Downloading...");
          const downloadRes = await fetch(`/api/convert/watermark-remove?jobId=${jobId}&download=true`);
          const blob = await downloadRes.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${file.name.replace(/\.[^.]+$/, "")}-no-watermark.mp4`;
          link.click();
          URL.revokeObjectURL(url);
          
          toast.success("Watermark removed successfully!");
          setIsProcessing(false);
          setProgress("");
          return;
        }

        setProgress(`Processing: ${job.progress || 0}%`);
        setTimeout(poll, 1000);
      };

      poll();
    } catch (error: any) {
      toast.error(error.message);
      setIsProcessing(false);
      setProgress("");
    }
  };

  return (
    <ToolLayout
      title="Watermark Remover"
      description="Remove unwanted watermarks or logos from your videos by selecting the area to clean."
    >
      <div className="space-y-8">
        {!file ? (
          <Dropzone
            onFileAccepted={handleFileAccepted}
            accept={{ "video/mp4": [".mp4"], "video/webm": [".webm"], "video/quicktime": [".mov"] }}
            maxSizeMB={100}
            displayMode="video"
          />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 border rounded-xl bg-card">
              <div className="flex items-center">
                <Film className="h-5 w-5 mr-3 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Remove</Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-dashed">
                <MousePointer2 className="h-4 w-4 text-primary" />
                Drag your mouse over the watermark area in the video below to select it.
              </div>

              <div 
                ref={containerRef}
                className="relative rounded-xl border bg-black overflow-hidden cursor-crosshair group aspect-video flex items-center justify-center"
                onMouseDown={handleMouseDown}
              >
                <video
                  ref={videoRef}
                  src={previewUrl!}
                  onLoadedMetadata={onVideoLoad}
                  className="max-w-full max-h-full pointer-events-none select-none"
                />
                
                {/* Selection Box Overlay */}
                <div 
                  className="absolute border-2 border-primary bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.5)] pointer-events-none transition-[width,height,top,left] duration-75"
                  style={{
                    left: selection.x,
                    top: selection.y,
                    width: selection.w,
                    height: selection.h,
                  }}
                >
                   <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded flex items-center">
                     <Eraser className="h-3 w-3 mr-1" /> Watermark Area
                   </div>
                </div>

                {/* Grid Overlay for precision (visible on hover) */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]" />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                 <div className="space-y-1">
                   <Label className="text-xs text-muted-foreground">Original Resolution</Label>
                   <p className="text-sm font-mono font-bold">{videoSize.width} × {videoSize.height}</p>
                 </div>
                 <div className="space-y-1">
                   <Label className="text-xs text-muted-foreground">Selection Area</Label>
                   <p className="text-sm font-mono font-bold">{Math.round(selection.w)} × {Math.round(selection.h)} px</p>
                 </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              {!isProcessing ? (
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 h-12"
                  onClick={handleRemoveWatermark}
                  disabled={selection.w < 5 || selection.h < 5}
                >
                  <Eraser className="mr-2 h-5 w-5" />
                  Remove Watermark from Selected Area
                </Button>
              ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-muted-foreground flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-500" />
                        {progress.split(':')[0]}
                      </span>
                      <span className="font-bold text-indigo-500">
                        {progress.includes('%') ? progress.split(':')[1].trim() : "0%"}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden border">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                        style={{ width: progress.includes('%') ? progress.split(':')[1].trim() : "0%" }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                      Analyzing pixels and interpolating surrounding area...
                    </p>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl w-fit text-indigo-500">
            <MousePointer2 className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-foreground">Select precisely</h4>
          <p className="text-sm text-muted-foreground">For best results, select an area slightly larger than the watermark itself.</p>
        </div>
        <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
          <div className="p-3 bg-purple-500/10 rounded-xl w-fit text-purple-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-foreground">AI Interpolation</h4>
          <p className="text-sm text-muted-foreground">We use FFmpeg's delogo filter to intelligently fill the area using surrounding pixels.</p>
        </div>
        <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl w-fit text-indigo-500">
            <Film className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-foreground">High Quality</h4>
          <p className="text-sm text-muted-foreground">Original video quality and audio are preserved during the removal process.</p>
        </div>
      </div>
    </ToolLayout>
  );
}
