"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, MonitorUp, Film, Sparkles, Zap, Crown } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/components/preview/image-preview";

type Resolution = "1080p" | "1440p" | "2160p";
type Preset = "fast" | "balanced" | "max-quality";

const RESOLUTION_OPTIONS: { value: Resolution; label: string; detail: string; icon: React.ReactNode }[] = [
  { value: "1080p", label: "1080p", detail: "1920 × 1080 Full HD", icon: <Zap className="h-4 w-4" /> },
  { value: "1440p", label: "1440p", detail: "2560 × 1440 QHD", icon: <Sparkles className="h-4 w-4" /> },
  { value: "2160p", label: "4K", detail: "3840 × 2160 UHD", icon: <Crown className="h-4 w-4" /> },
];

const PRESET_OPTIONS: { value: Preset; label: string; description: string }[] = [
  { value: "fast", label: "Fast", description: "Quick encode, slightly lower quality" },
  { value: "balanced", label: "Balanced", description: "Good quality, moderate speed" },
  { value: "max-quality", label: "Max Quality", description: "Best output, slower encode" },
];

export default function VideoUpscalerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Resolution>("2160p");
  const [preset, setPreset] = useState<Preset>("balanced");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  };

  const handleUpscale = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress("Uploading video...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("resolution", resolution);
    formData.append("preset", preset);

    try {
      setProgress("Upscaling — this may take a minute...");

      const response = await fetch("/api/convert/upscale", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to upscale video");
      }

      setProgress("Preparing download...");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers.get("content-disposition");
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
      link.download = filenameMatch?.[1] || `${file.name.replace(/\.[^.]+$/, "")}-${resolution}.mp4`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`Video upscaled to ${resolution} successfully!`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to upscale video");
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  return (
    <ToolLayout
      title="Video Upscaler"
      description="Enhance your 720p or 1080p videos to stunning 4K resolution using advanced Lanczos resampling."
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
          <div className="relative flex flex-col p-4 border rounded-xl bg-card overflow-hidden">
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
            <h3 className="mb-6 font-semibold text-lg flex items-center">
              <MonitorUp className="mr-2 h-5 w-5 text-cyan-500" /> Upscale Settings
            </h3>

            <div className="space-y-6">
              {/* Resolution Selector */}
              <div>
                <Label className="mb-3 block text-sm text-foreground">Target Resolution</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {RESOLUTION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setResolution(option.value)}
                      className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                        resolution === option.value
                          ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                          : "border-border/50 bg-background/40 hover:border-border hover:bg-muted/30"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        resolution === option.value ? "bg-cyan-500/20 text-cyan-400" : "bg-muted text-muted-foreground"
                      }`}>
                        {option.icon}
                      </div>
                      <span className={`text-lg font-bold ${
                        resolution === option.value ? "text-cyan-400" : "text-foreground"
                      }`}>
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{option.detail}</span>
                      {option.value === "2160p" && (
                        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                          BEST
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Selector */}
              <div>
                <Label className="mb-3 block text-sm text-foreground">Quality Preset</Label>
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

              {/* Action Button */}
              <div className="pt-4 border-t border-border/50">
                <Button
                  size="lg"
                  onClick={handleUpscale}
                  disabled={isProcessing}
                  className="w-full text-md h-12 relative overflow-hidden group bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] animate-[shimmer_2s_infinite] group-hover:block transition-all" />
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {progress || "Processing..."}
                    </>
                  ) : (
                    <>
                      <MonitorUp className="mr-2 h-5 w-5" />
                      Upscale to {resolution}
                    </>
                  )}
                </Button>
                {isProcessing && (
                  <p className="text-xs text-muted-foreground text-center mt-3 animate-pulse">
                    Video upscaling is compute-intensive. Larger files may take several minutes.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
