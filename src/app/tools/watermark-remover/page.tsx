"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Eraser, Film, MousePointer2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/components/preview/image-preview";
import { downloadBlob, revokeObjectUrl } from "@/lib/local-processing/blob-utils";
import { makeBlurRegionTransform, renderVideoToWebMLocally } from "@/lib/local-processing/video-processing";

interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

function getRenderedVideoRect(containerRect: DOMRect, videoSize: { width: number; height: number }) {
  const containerRatio = containerRect.width / containerRect.height;
  const videoRatio = videoSize.width / videoSize.height;
  let width = containerRect.width;
  let height = containerRect.height;

  if (videoRatio > containerRatio) {
    height = width / videoRatio;
  } else {
    width = height * videoRatio;
  }

  return {
    x: (containerRect.width - width) / 2,
    y: (containerRect.height - height) / 2,
    width,
    height,
  };
}

function mapSelectionToVideo(selection: Region, containerRect: DOMRect, videoSize: { width: number; height: number }) {
  if (!videoSize.width || !videoSize.height) return null;

  const rendered = getRenderedVideoRect(containerRect, videoSize);
  const left = Math.max(selection.x, rendered.x);
  const top = Math.max(selection.y, rendered.y);
  const right = Math.min(selection.x + selection.w, rendered.x + rendered.width);
  const bottom = Math.min(selection.y + selection.h, rendered.y + rendered.height);

  if (right <= left || bottom <= top) return null;

  const scaleX = videoSize.width / rendered.width;
  const scaleY = videoSize.height / rendered.height;

  return {
    x: Math.round((left - rendered.x) * scaleX),
    y: Math.round((top - rendered.y) * scaleY),
    w: Math.round((right - left) * scaleX),
    h: Math.round((bottom - top) * scaleY),
  };
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
    revokeObjectUrl(previewUrl);
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
    setProgress("");
  };

  const onVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setVideoSize({ width: video.videoWidth, height: video.videoHeight });
    window.requestAnimationFrame(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setSelection({
        x: Math.round(rect.width * 0.68),
        y: Math.round(rect.height * 0.08),
        w: Math.round(rect.width * 0.24),
        h: Math.round(rect.height * 0.14),
      });
    });
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
    setProgress("Processing: 0%");

    const rect = containerRef.current.getBoundingClientRect();
    const mappedSelection = mapSelectionToVideo(selection, rect, videoSize);
    if (!mappedSelection || mappedSelection.w < 4 || mappedSelection.h < 4) {
      toast.error("Select an area over the visible video.");
      setIsProcessing(false);
      setProgress("");
      return;
    }

    try {
      const result = await renderVideoToWebMLocally(file, {
        resolution: "original",
        fps: 30,
        transform: makeBlurRegionTransform(mappedSelection, 32),
        onProgress: (percent) => setProgress(`Processing: ${percent}%`),
      });
      downloadBlob(result.blob, `${file.name.replace(/\.[^.]+$/, "")}-cleaned.webm`, { kind: "modification" });
      toast.success("Selected area cleaned locally.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to remove watermark");
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  return (
    <ToolLayout
      title="Watermark Remover"
      description="Clean a selected video area locally with a browser canvas blur pass. Output is WebM and no upload is used."
    >
      <div className="space-y-8">
        {!file ? (
          <Dropzone
            onFileAccepted={handleFileAccepted}
            accept={{ "video/mp4": [".mp4"], "video/webm": [".webm"], "video/quicktime": [".mov"] }}
            displayMode="video"
            processingMode="local"
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  revokeObjectUrl(previewUrl);
                  setFile(null);
                  setPreviewUrl(null);
                  setProgress("");
                  setVideoSize({ width: 0, height: 0 });
                }}
              >
                Remove
              </Button>
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
                  className="pointer-events-none h-full w-full select-none object-contain"
                />
                
                {/* Selection Box Overlay */}
                <div 
                  className="pointer-events-none absolute border-2 border-primary bg-primary/20 transition-[width,height,top,left] duration-75"
                  style={{
                    left: selection.x,
                    top: selection.y,
                    width: selection.w,
                    height: selection.h,
                  }}
                >
                   <div className="absolute -top-6 left-0 flex items-center bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                     <Eraser className="h-3 w-3 mr-1" /> Watermark Area
                   </div>
                </div>

                {/* Grid Overlay for precision (visible on hover) */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]" />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                 <div className="space-y-1">
                   <Label className="text-xs text-muted-foreground">Original Resolution</Label>
                   <p className="text-sm font-mono font-bold">{videoSize.width} x {videoSize.height}</p>
                 </div>
                 <div className="space-y-1">
                   <Label className="text-xs text-muted-foreground">Selection Area</Label>
                   <p className="text-sm font-mono font-bold">{Math.round(selection.w)} x {Math.round(selection.h)} px</p>
                 </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              {!isProcessing ? (
                <Button 
                  size="lg" 
                  className="h-12 w-full"
                  onClick={handleRemoveWatermark}
                  disabled={selection.w < 5 || selection.h < 5}
                >
                  <Eraser className="mr-2 h-5 w-5" />
                  Clean Selected Area Locally
                </Button>
              ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-muted-foreground flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                        {progress.split(':')[0]}
                      </span>
                      <span className="font-bold text-primary">
                        {progress.includes('%') ? progress.split(':')[1].trim() : "0%"}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden border bg-muted">
                      <div 
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: progress.includes('%') ? progress.split(':')[1].trim() : "0%" }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                      Rendering a local WebM with the selected area softened.
                    </p>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 grid grid-cols-1 border border-border md:grid-cols-3">
        <div className="space-y-3 p-5 md:border-r md:border-border">
          <div className="w-fit border border-border bg-muted p-3 text-primary">
            <MousePointer2 className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-foreground">Select precisely</h4>
          <p className="text-sm text-muted-foreground">For best results, select an area slightly larger than the watermark itself.</p>
        </div>
        <div className="space-y-3 border-t border-border p-5 md:border-r md:border-t-0">
          <div className="w-fit border border-border bg-muted p-3 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-foreground">Local canvas cleanup</h4>
          <p className="text-sm text-muted-foreground">The browser softens the selected area frame by frame without uploading the video.</p>
        </div>
        <div className="space-y-3 border-t border-border p-5 md:border-t-0">
          <div className="w-fit border border-border bg-muted p-3 text-primary">
            <Film className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-foreground">Local WebM export</h4>
          <p className="text-sm text-muted-foreground">The output is encoded by your browser, so quality and speed depend on this device.</p>
        </div>
      </div>
    </ToolLayout>
  );
}
