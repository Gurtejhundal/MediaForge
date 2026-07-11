"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, MonitorUp, Film, Sparkles, Zap, Crown } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/components/preview/image-preview";
import { downloadBlob, revokeObjectUrl } from "@/lib/local-processing/blob-utils";
import { renderVideoToWebMLocally, type VideoResolutionMode } from "@/lib/local-processing/video-processing";

type Resolution = Extract<VideoResolutionMode, "1080p" | "1440p" | "2160p">;
type Preset = "fast" | "balanced" | "max-quality";

const RESOLUTION_OPTIONS: { value: Resolution; label: string; detail: string; icon: React.ReactNode }[] = [
  { value: "1080p", label: "1080p", detail: "Fits within 1920 x 1080", icon: <Zap className="h-4 w-4" /> },
  { value: "1440p", label: "1440p", detail: "Fits within 2560 x 1440", icon: <Sparkles className="h-4 w-4" /> },
  { value: "2160p", label: "4K", detail: "Fits within 3840 x 2160", icon: <Crown className="h-4 w-4" /> },
];

const PRESET_OPTIONS: { value: Preset; label: string; description: string }[] = [
  { value: "fast", label: "Fast", description: "Faster encode, lighter file" },
  { value: "balanced", label: "Balanced", description: "High quality, practical speed" },
  { value: "max-quality", label: "Archive", description: "Best retention, slower encode" },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Video upscale failed";
}

export default function VideoUpscalerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Resolution>("2160p");
  const [preset, setPreset] = useState<Preset>("balanced");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFileAccepted = (acceptedFile: File) => {
    revokeObjectUrl(previewUrl);
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
  };

  const clearFile = () => {
    revokeObjectUrl(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  };

  const handleUpscale = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress("Processing: 0%");

    try {
      const result = await renderVideoToWebMLocally(file, {
        resolution,
        fps: preset === "fast" ? 24 : 30,
        onProgress: (percent) => setProgress(`Processing: ${percent}%`),
      });
      downloadBlob(result.blob, `${file.name.replace(/\.[^.]+$/, "")}-${resolution}.webm`, { kind: "video" });
      toast.success("Video upscaled locally as WebM.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  return (
    <ToolLayout
      title="Video Detail Upscaler"
      description="Upscale video locally with browser canvas sampling. Output is WebM and files are not uploaded."
    >
      <div className="space-y-8">
        {!file ? (
          <Dropzone
            onFileAccepted={handleFileAccepted}
            accept={{ 
              "video/mp4": [".mp4", ".m4v"], 
              "video/webm": [".webm"], 
              "video/quicktime": [".mov"],
              "video/x-matroska": [".mkv"],
              "video/x-msvideo": [".avi"],
              "video/x-flv": [".flv"],
              "video/mp2t": [".ts"]
            }}
            displayMode="video"
            processingMode="local"
          />
        ) : (
          <div className="relative flex flex-col overflow-hidden border bg-card p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center min-w-0">
                <Film className="h-5 w-5 mr-3 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatBytes(file.size)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFile} className="text-muted-foreground hover:text-destructive">
                Remove File
              </Button>
            </div>

            <div className="flex aspect-video items-center justify-center overflow-hidden border bg-black/10">
              <video
                src={previewUrl!}
                controls
                className="max-h-full max-w-full"
              />
            </div>
          </div>
        )}

        {file && (
          <div className="border bg-muted/30 p-5 md:p-6">
            <h3 className="mb-6 font-semibold text-lg flex items-center">
              <MonitorUp className="mr-2 h-5 w-5 text-primary" /> Detail Upscale Settings
            </h3>

            <div className="space-y-6">
              {/* Resolution Selector */}
              <div>
                <Label className="mb-3 block text-sm text-foreground">Target Size</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {RESOLUTION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setResolution(option.value)}
                      className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-sm border-2 p-4 transition-colors ${
                        resolution === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-background/40 hover:border-border hover:bg-muted/30"
                      }`}
                    >
                      <div className={`rounded-sm p-2 ${
                        resolution === option.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {option.icon}
                      </div>
                      <span className={`text-lg font-bold ${
                        resolution === option.value ? "text-primary" : "text-foreground"
                      }`}>
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{option.detail}</span>
                      {option.value === "2160p" && (
                        <span className="absolute -right-2 -top-2 border border-primary bg-primary px-2 py-0.5 font-mono text-[9px] font-bold text-primary-foreground">
                          BEST
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Selector */}
              <div>
                <Label className="mb-3 block text-sm text-foreground">Encode Quality</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {PRESET_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={preset === option.value ? "default" : "outline"}
                      onClick={() => setPreset(option.value)}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                    >
                      <span className="font-semibold">{option.label}</span>
                      <span className={`text-[11px] ${
                        preset === option.value ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {option.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Action Button & Progress */}
              <div className="pt-4 border-t border-border/50">
                {!isProcessing ? (
                  <Button
                    size="lg"
                    onClick={handleUpscale}
                    className="h-12 w-full text-base"
                  >
                    <MonitorUp className="mr-2 h-5 w-5" />
                    Create {resolution} Detail Upscale
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
                      Upscaling frames on this device with fixed-frame timing for smoother WebM motion.
                    </p>
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
