"use client";

import { useState, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Image as ImageIcon, Download, Zap, MousePointer2 } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/components/preview/image-preview";
import { cn } from "@/lib/utils";

type Strength = "low" | "medium" | "high";

export default function ImageEnhancerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [strength, setStrength] = useState<Strength>("medium");
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setOriginalUrl(URL.createObjectURL(acceptedFile));
    setEnhancedUrl(null);
  };

  const handleEnhance = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("strength", strength);

    try {
      const res = await fetch("/api/convert/image-enhance", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to enhance image");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setEnhancedUrl(url);
      setSliderPos(50);
      toast.success("Image enhanced successfully!");
    } catch (error: any) {
      toast.error(error.message);
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
      title="AI Image Enhancer"
      description="Professional-grade enhancement that restores detail, adjusts contrast, and makes colors pop."
    >
      <div className="space-y-8">
        {!file ? (
          <Dropzone
            onFileAccepted={handleFileAccepted}
            accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
            maxSizeMB={10}
            displayMode="image"
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
              <Button variant="ghost" size="sm" onClick={() => {
                setFile(null);
                setEnhancedUrl(null);
              }}>Clear</Button>
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
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 uppercase tracking-widest">Enhanced</div>
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 uppercase tracking-widest">Original</div>
                  </>
                )}

                {!enhancedUrl && isProcessing && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-sm font-medium animate-pulse">Analyzing pixels & applying CLAHE filters...</p>
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
                <Label className="mb-3 block text-sm">Enhancement Strength</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["low", "medium", "high"] as const).map((s) => (
                    <Button
                      key={s}
                      variant={strength === s ? "default" : "outline"}
                      onClick={() => setStrength(s)}
                      className="capitalize"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                {!enhancedUrl ? (
                  <Button 
                    size="lg" 
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 h-12"
                    onClick={handleEnhance}
                    disabled={isProcessing}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Enhance Image Now
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
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 h-12 shadow-lg shadow-blue-500/20"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = enhancedUrl;
                        link.download = `enhanced-${file.name}`;
                        link.click();
                      }}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Enhanced
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
          <div className="p-3 bg-emerald-500/10 rounded-xl w-fit text-emerald-500">
            <Zap className="h-6 w-6" />
          </div>
          <h4 className="font-bold">CLAHE Technology</h4>
          <p className="text-sm text-muted-foreground">Uses Contrast Limited Adaptive Histogram Equalization to reveal hidden details in shadows.</p>
        </div>
        <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
          <div className="p-3 bg-blue-500/10 rounded-xl w-fit text-blue-500">
            <Sparkles className="h-6 w-6" />
          </div>
          <h4 className="font-bold">Pro Sharpening</h4>
          <p className="text-sm text-muted-foreground">Multi-stage edge sharpening restores crispness to blurry or low-quality photos.</p>
        </div>
        <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl w-fit text-indigo-500">
            <ImageIcon className="h-6 w-6" />
          </div>
          <h4 className="font-bold">Color Recovery</h4>
          <p className="text-sm text-muted-foreground">Subtle saturation and luminance modulation makes colors feel natural and alive.</p>
        </div>
      </div>
    </ToolLayout>
  );
}
