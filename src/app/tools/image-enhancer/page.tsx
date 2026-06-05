"use client";

import { useRef, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Image as ImageIcon, Loader2, Maximize2, MousePointer2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/components/preview/image-preview";
import { detailUpscaleImageLocally } from "@/lib/local-processing/image-processing";
import { downloadBlob } from "@/lib/local-processing/blob-utils";

type Strength = "low" | "medium" | "high";
type Target = "2x" | "4k";

const TARGET_OPTIONS: { value: Target; label: string; detail: string }[] = [
  { value: "4k", label: "4K detail", detail: "Upscale long edge to 3840px" },
  { value: "2x", label: "2x clean", detail: "Double size, capped at 4K" },
];

const STRENGTH_OPTIONS: { value: Strength; label: string; detail: string }[] = [
  { value: "low", label: "Clean", detail: "Light detail, safest edges" },
  { value: "medium", label: "Detail", detail: "Balanced generated-image cleanup" },
  { value: "high", label: "Max", detail: "Strong texture recovery pass" },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to detail image";
}

export default function ImageEnhancerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [enhancedBlob, setEnhancedBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [strength, setStrength] = useState<Strength>("medium");
  const [target, setTarget] = useState<Target>("4k");
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileAccepted = (acceptedFile: File) => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);

    setFile(acceptedFile);
    setOriginalUrl(URL.createObjectURL(acceptedFile));
    setEnhancedUrl(null);
    setEnhancedBlob(null);
  };

  const clearFile = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);

    setFile(null);
    setOriginalUrl(null);
    setEnhancedUrl(null);
    setEnhancedBlob(null);
  };

  const handleEnhance = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      const result = await detailUpscaleImageLocally(file, { strength, target });
      const blob = result.blob;
      const url = URL.createObjectURL(blob);
      if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);
      setEnhancedUrl(url);
      setEnhancedBlob(blob);
      setSliderPos(50);
      toast.success("Image upscaled locally without color grading.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  return (
    <ToolLayout
      title="Image Detailer & 4K Upscaler"
      description="Upscale generated or blurry images locally while preserving the original color, lighting, contrast, and saturation."
    >
      <div className="space-y-8">
        {!file ? (
          <Dropzone
            onFileAccepted={handleFileAccepted}
            accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
            displayMode="image"
            processingMode="local"
          />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 border rounded-xl bg-card">
              <div className="flex items-center">
                <ImageIcon className="h-5 w-5 mr-3 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFile}>Clear</Button>
            </div>

            {/* Comparison Slider */}
            <div className="relative group">
              <div 
                ref={containerRef}
                className="relative aspect-auto min-h-[300px] max-h-[600px] w-full rounded-2xl overflow-hidden border bg-muted/20 cursor-col-resize select-none"
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
              >
                {/* Original (Bottom) */}
                <img 
                  src={originalUrl!} 
                  alt="Original" 
                  className="w-full h-full object-contain"
                />

                {/* Enhanced (Top with Clip) */}
                {enhancedUrl && (
                  <div 
                    className="absolute inset-0 w-full h-full"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                  >
                    <img 
                      src={enhancedUrl} 
                      alt="Enhanced" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Vertical Divider */}
                {enhancedUrl && (
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Labels */}
                {enhancedUrl && (
                  <>
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 uppercase tracking-widest">Detailed</div>
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 uppercase tracking-widest">Original</div>
                  </>
                )}

                {!enhancedUrl && isProcessing && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-sm font-medium animate-pulse">Upscaling and applying a color-safe detail pass...</p>
                  </div>
                )}
              </div>
              
              {enhancedUrl && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <MousePointer2 className="h-3 w-3 mr-1" /> Drag to compare
                </div>
              )}
            </div>

            <div className="space-y-6 pt-4">
              <div>
                <Label className="mb-3 block text-sm">Output Size</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {TARGET_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTarget(option.value)}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        target === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:bg-muted/40"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{option.detail}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block text-sm">Detail Pass</Label>
                <div className="grid grid-cols-3 gap-3">
                  {STRENGTH_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={strength === option.value ? "default" : "outline"}
                      onClick={() => setStrength(option.value)}
                      className="h-auto flex-col whitespace-normal py-3 text-center"
                    >
                      <span>{option.label}</span>
                      <span className={`text-[11px] ${
                        strength === option.value ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {option.detail}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                {!enhancedUrl ? (
                  <Button 
                    size="lg" 
                    className="flex-1 h-12"
                    onClick={handleEnhance}
                    disabled={isProcessing}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Create Detail Upscale
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="flex-1 h-12"
                      onClick={() => setEnhancedUrl(null)}
                    >
                      Reset
                    </Button>
                    <Button
                      size="lg" 
                      className="flex-1 h-12"
                      onClick={() => {
                        if (enhancedBlob) {
                          downloadBlob(enhancedBlob, `detail-${file.name.replace(/\.[^.]+$/, "")}-${target}.png`);
                        }
                      }}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Detail Upscale
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
          <div className="p-3 bg-primary/10 rounded-xl w-fit text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h4 className="font-bold">Color-Safe Pipeline</h4>
          <p className="text-sm text-muted-foreground">No brightness, saturation, contrast, gamma, or tone mapping filters are applied.</p>
        </div>
        <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
          <div className="p-3 bg-primary/10 rounded-xl w-fit text-primary">
            <Maximize2 className="h-6 w-6" />
          </div>
          <h4 className="font-bold">4K Long-Edge Upscale</h4>
          <p className="text-sm text-muted-foreground">Images are resized toward a 3840px long edge in the browser using high-quality canvas sampling.</p>
        </div>
        <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
          <div className="p-3 bg-primary/10 rounded-xl w-fit text-primary">
            <Zap className="h-6 w-6" />
          </div>
          <h4 className="font-bold">Controlled Detail Pass</h4>
          <p className="text-sm text-muted-foreground">The local detail pass improves edge clarity without sending the image to a server.</p>
        </div>
      </div>
    </ToolLayout>
  );
}
