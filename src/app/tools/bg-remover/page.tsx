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
import { cleanupTransparentMatte, type AlphaCleanupStrength } from "@/lib/local-processing/image-processing";
import { StatusPill } from "@/components/workspace-components";

const cleanupModes: Array<{
  value: AlphaCleanupStrength;
  label: string;
  detail: string;
}> = [
  { value: "soft", label: "Soft", detail: "Preserve fine hair" },
  { value: "balanced", label: "Balanced", detail: "Clean normal edges" },
  { value: "strong", label: "Strong", detail: "Remove dirty halos" },
];

export default function BgRemoverPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [cleanupStrength, setCleanupStrength] = useState<AlphaCleanupStrength>("strong");

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
          setModelProgress(Math.min(90, Math.round(percent * 0.9)));
          setProgress(`Preparing local model: ${percent}% ${key}`);
        },
      });

      setProgress("Cleaning transparent matte...");
      setModelProgress(96);
      const cleanedBlob = await cleanupTransparentMatte(blob, cleanupStrength);
      const url = URL.createObjectURL(cleanedBlob);
      setResultBlob(cleanedBlob);
      setResultUrl(url);
      setShowComparison(true);
      setModelProgress(100);

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

    downloadBlob(resultBlob, `${file?.name.replace(/\.[^.]+$/, "") || "image"}-no-bg.png`, { kind: "modification" });
  };

  return (
    <ToolLayout
      title="Background Remover"
      description="Remove backgrounds locally in the browser with an on-device segmentation model."
      mode="model-local"
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
            <section className="border border-border bg-card p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-border bg-muted text-primary">
                  <Eraser className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Extraction pass</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">Remove the background locally</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    The browser downloads and caches the segmentation model on first use. Your selected image is processed in this tab and exported as a transparent PNG.
                  </p>
                </div>
              </div>

              {isProcessing && (
                <div className="mt-5 border border-primary/40 bg-primary/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-foreground">Local model</p>
                    <span className="font-mono text-xs font-semibold text-accent-foreground">{modelProgress}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden bg-card">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${modelProgress}%` }} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-accent-foreground">
                    {progress || "Preparing the local model. Keep this tab open until export is ready."}
                  </p>
                </div>
              )}

              <div className="mt-5 border border-border bg-muted/35 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Matte cleanup</p>
                    <p className="mt-1 text-sm text-muted-foreground">Removes semi-transparent background dust after the local model finishes.</p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-primary">PNG alpha pass</span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {cleanupModes.map((mode) => {
                    const active = cleanupStrength === mode.value;

                    return (
                      <button
                        key={mode.value}
                        type="button"
                        aria-pressed={active}
                        disabled={isProcessing}
                        onClick={() => setCleanupStrength(mode.value)}
                        className={`rounded-sm border p-3 text-left transition-colors ${
                          active
                            ? "border-primary bg-card text-foreground"
                            : "border-transparent bg-card/60 text-foreground hover:border-border hover:bg-card"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <span className="block text-sm font-semibold">{mode.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{mode.detail}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

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

            <aside className="border border-border bg-muted/35 p-5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pipeline</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-border bg-card p-3 first:border-t first:border-x last:border-x">
                  <span className="flex items-center text-muted-foreground"><Layers className="mr-2 h-4 w-4 text-primary" /> Source</span>
                  <span className="font-mono font-semibold">Image</span>
                </div>
                <div className="flex items-center justify-between border-b border-x border-border bg-card p-3">
                  <span className="flex items-center text-muted-foreground"><Cpu className="mr-2 h-4 w-4 text-primary" /> Runtime</span>
                  <span className="font-mono font-semibold">Browser</span>
                </div>
                <div className="flex items-center justify-between border-b border-x border-border bg-card p-3">
                  <span className="flex items-center text-muted-foreground"><ShieldCheck className="mr-2 h-4 w-4 text-primary" /> Upload</span>
                  <span className="font-mono font-semibold">None</span>
                </div>
              </div>
            </aside>
          </div>
        )}

        {showComparison && resultBlob && (
          <div className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row">
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
