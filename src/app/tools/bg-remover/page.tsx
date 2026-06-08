"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { ImagePreview } from "@/components/preview/image-preview";
import { Button } from "@/components/ui/button";
import { BeforeAfterInspector } from "@/components/preview/before-after-inspector";
import { Cpu, Download, Eraser, Layers, Loader2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/local-processing/blob-utils";
import { StatusPill } from "@/components/workspace-components";

export default function BgRemoverPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);

  const handleFileAccepted = (acceptedFile: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
    setResultUrl(null);
    setResultBlob(null);
    setShowComparison(false);
    setProgress("");
    setModelProgress(0);
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setResultBlob(null);
    setShowComparison(false);
    setModelProgress(0);
  };

  const handleRemoveBg = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress("Loading local model...");
    setModelProgress(8);

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        model: "isnet_quint8",
        device: "cpu",
        output: { format: "image/png", quality: 0.92 },
        progress: (key: string, current: number, total: number) => {
          const percent = total > 0 ? Math.round((current / total) * 100) : 0;
          setModelProgress(percent);
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

  return (
    <ToolLayout
      title="Background Remover"
      description="Remove backgrounds locally in the browser with an on-device segmentation model."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <StatusPill>Local model</StatusPill>
          <StatusPill>No upload</StatusPill>
          <StatusPill tone="warning">First run downloads model</StatusPill>
        </div>

        {!file ? (
          <Dropzone
            onFileAccepted={handleFileAccepted}
            accept={{
              "image/jpeg": [".jpg", ".jpeg"],
              "image/png": [".png"],
              "image/webp": [".webp"],
            }}
            processingMode="local"
          />
        ) : !showComparison ? (
          <ImagePreview
            file={file}
            previewUrl={previewUrl!}
            onRemove={clearFile}
          />
        ) : null}

        {showComparison && previewUrl && resultUrl && (
          <BeforeAfterInspector
            originalUrl={previewUrl}
            resultUrl={resultUrl}
            originalLabel="Original"
            resultLabel="Removed"
          />
        )}

        {file && !showComparison && (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <section className="rounded-[24px] border border-border bg-white p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-[#f8f8f5] text-violet-700">
                  <Eraser className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">Extraction pass</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">Remove the background locally</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    The browser downloads and caches the segmentation model on first use. Your selected image is processed in this tab and exported as a transparent PNG.
                  </p>
                </div>
              </div>

              {isProcessing && (
                <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-800">Local model</p>
                    <span className="font-mono text-xs font-semibold text-violet-900">{modelProgress}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                    <div className="h-full rounded-full bg-violet-700 transition-all duration-300" style={{ width: `${modelProgress}%` }} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-violet-800">
                    {progress || "Preparing the local model. Keep this tab open until export is ready."}
                  </p>
                </div>
              )}

              <Button
                size="lg"
                onClick={handleRemoveBg}
                disabled={isProcessing}
                className="mt-5 h-12 w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Removing background...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate transparent PNG
                  </>
                )}
              </Button>
            </section>

            <aside className="rounded-[24px] border border-border bg-[#f8f8f5] p-5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pipeline</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-3">
                  <span className="flex items-center text-muted-foreground"><Layers className="mr-2 h-4 w-4 text-violet-700" /> Source</span>
                  <span className="font-mono font-semibold">Image</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-3">
                  <span className="flex items-center text-muted-foreground"><Cpu className="mr-2 h-4 w-4 text-violet-700" /> Runtime</span>
                  <span className="font-mono font-semibold">Browser</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-3">
                  <span className="flex items-center text-muted-foreground"><ShieldCheck className="mr-2 h-4 w-4 text-violet-700" /> Upload</span>
                  <span className="font-mono font-semibold">None</span>
                </div>
              </div>
            </aside>
          </div>
        )}

        {showComparison && resultBlob && (
          <div className="flex flex-col gap-3 rounded-[24px] border border-border bg-white p-4 shadow-[var(--shadow-sm)] sm:flex-row">
            <Button
              size="lg"
              onClick={handleDownload}
              className="h-12 flex-1"
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
