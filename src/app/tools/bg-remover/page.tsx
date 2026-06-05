"use client";

import { useState, useRef } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { ImagePreview } from "@/components/preview/image-preview";
import { Button } from "@/components/ui/button";
import { Loader2, Eraser, Download, RotateCcw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { downloadBlob } from "@/lib/local-processing/blob-utils";

export default function BgRemoverPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
    setResultUrl(null);
    setResultBlob(null);
    setShowComparison(false);
    setProgress("");
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setResultBlob(null);
    setShowComparison(false);
  };

  const handleRemoveBg = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress("Loading local model...");

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        model: "isnet_quint8",
        device: "cpu",
        output: { format: "image/png", quality: 0.92 },
        progress: (key: string, current: number, total: number) => {
          const percent = total > 0 ? Math.round((current / total) * 100) : 0;
          setProgress(`Preparing local model: ${percent}% ${key}`);
        },
      });
      const url = URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultUrl(url);
      setShowComparison(true);

      toast.success("Background removed locally.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to remove background");
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !resultBlob) return;

    downloadBlob(resultBlob, `${file?.name.replace(/\.[^.]+$/, "") || "image"}-no-bg.png`);
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!comparisonRef.current) return;

    const rect = comparisonRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  };

  return (
    <ToolLayout
      title="Background Remover"
      description="Remove backgrounds locally in the browser with an on-device segmentation model."
    >
      <div className="space-y-8">
        {!file ? (
          <Dropzone
            onFileAccepted={handleFileAccepted}
            accept={{
              "image/jpeg": [".jpg", ".jpeg"],
              "image/png": [".png"],
              "image/webp": [".webp"],
            }}
            maxSizeMB={20}
            processingMode="local"
          />
        ) : !showComparison ? (
          <ImagePreview
            file={file}
            previewUrl={previewUrl!}
            onRemove={clearFile}
          />
        ) : null}

        {/* Before / After Comparison */}
        {showComparison && previewUrl && resultUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-500" />
                Result
              </h3>
              <Button variant="ghost" size="sm" onClick={clearFile} className="text-muted-foreground hover:text-destructive">
                <RotateCcw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
            </div>

            {/* Interactive Comparison Slider */}
            <div
              ref={comparisonRef}
              className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-border/50 cursor-col-resize select-none bg-[repeating-conic-gradient(#80808015_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]"
              onMouseMove={(e) => {
                if (e.buttons === 1) handleSliderMove(e);
              }}
              onMouseDown={handleSliderMove}
              onTouchMove={handleSliderMove}
              onTouchStart={handleSliderMove}
            >
              {/* Result (background removed) - full width behind */}
              <div className="absolute inset-0">
                <Image
                  src={resultUrl}
                  alt="Background removed"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              {/* Original - clipped by slider */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <Image
                  src={previewUrl}
                  alt="Original"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              {/* Slider line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
                    <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md z-20">
                Original
              </div>
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md z-20">
                Removed
              </div>
            </div>
          </div>
        )}

        {/* Action Area */}
        {file && !showComparison && (
          <div className="bg-muted/30 p-6 rounded-xl border">
            <h3 className="mb-4 font-semibold flex items-center">
              <Eraser className="mr-2 h-5 w-5 text-rose-500" />
              Background Removal
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              The browser downloads a segmentation model on first use, then processes your image locally and exports a transparent PNG.
            </p>
            <Button
              size="lg"
              onClick={handleRemoveBg}
              disabled={isProcessing}
              className="w-full text-md h-12 relative overflow-hidden group bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 border-0"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] animate-[shimmer_2s_infinite] group-hover:block transition-all" />
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Removing background locally...
                </>
              ) : (
                <>
                  <Eraser className="mr-2 h-5 w-5" />
                  Remove Background
                </>
              )}
            </Button>
            {isProcessing && (
              <p className="text-xs text-muted-foreground text-center mt-3 animate-pulse">
                {progress || "First use may take longer because the browser downloads and caches the model."}
              </p>
            )}
          </div>
        )}

        {/* Download Button */}
        {showComparison && resultBlob && (
          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={handleDownload}
              className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 border-0"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Transparent PNG
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={clearFile}
              className="h-12"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              New Image
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
