"use client";

import { useState } from "react";
import { Archive, Download, Film, Images, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OutputCard, StatusPill } from "@/components/workspace-components";
import { downloadBlob, formatFileSize, revokeObjectUrl } from "@/lib/local-processing/blob-utils";
import { extractVideoFramesToZip, type FrameExportFormat } from "@/lib/local-processing/video-frame-processing";

const FPS_OPTIONS = [12, 24, 30, 60] as const;
const FORMAT_OPTIONS: FrameExportFormat[] = ["png", "jpeg", "webp"];

export default function VideoToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(24);
  const [format, setFormat] = useState<FrameExportFormat>("png");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [zipName, setZipName] = useState("");
  const [frameCount, setFrameCount] = useState<number | null>(null);

  const handleFileAccepted = (acceptedFile: File) => {
    revokeObjectUrl(previewUrl);
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
    setZipBlob(null);
    setZipName("");
    setFrameCount(null);
    setProgress(0);
    setProgressLabel("");
  };

  const clearFile = () => {
    revokeObjectUrl(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setZipBlob(null);
    setZipName("");
    setFrameCount(null);
    setProgress(0);
    setProgressLabel("");
  };

  const handleExtractAll = async () => {
    if (!file) return;

    setIsProcessing(true);
    setZipBlob(null);
    setFrameCount(null);
    setProgress(0);
    setProgressLabel("Preparing video");

    try {
      const result = await extractVideoFramesToZip(file, {
        fps,
        format,
        onProgress: (percent, frame, total) => {
          setProgress(percent);
          setProgressLabel(percent >= 95 ? "Packaging ZIP" : `Frame ${frame} / ${total}`);
        },
      });

      setZipBlob(result.blob);
      setZipName(result.filename);
      setFrameCount(result.frameCount);
      setProgress(100);
      setProgressLabel(`${result.frameCount} frames ready`);
      toast.success(`Extracted ${result.frameCount} frames locally.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to extract video frames");
      setProgressLabel("");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadZip = () => {
    if (!zipBlob || !zipName) return;
    downloadBlob(zipBlob, zipName, { kind: "extraction" });
  };

  return (
    <ToolLayout
      title="Video Frame Extractor"
      description="Extract the whole video frame by frame into a ZIP file using browser video decode, Canvas, and local ZIP packaging."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusPill>Local processing</StatusPill>
        <StatusPill>No upload</StatusPill>
        <StatusPill tone="warning">Browser chooses supported video decoding</StatusPill>
      </div>

      <div className="space-y-8">
        {!file ? (
          <Dropzone
            onFileAccepted={handleFileAccepted}
            accept={{ "video/mp4": [".mp4"], "video/webm": [".webm"], "video/quicktime": [".mov"] }}
            displayMode="video"
            processingMode="local"
          />
        ) : (
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center">
                <Film className="mr-3 h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFile}>
                Remove
              </Button>
            </div>
            <video src={previewUrl!} controls className="aspect-video max-h-[520px] w-full rounded-xl border bg-black object-contain" />
          </div>
        )}

        {file && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="rounded-2xl border bg-card p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Images className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Whole-video frame export</h2>
                  <p className="text-xs text-muted-foreground">
                    Source FPS is not exposed reliably by browsers, so choose the sampling rate you want.
                  </p>
                </div>
              </div>

              <Label className="mb-3 block">Frames per second</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FPS_OPTIONS.map((option) => (
                  <Button key={option} variant={fps === option ? "default" : "outline"} onClick={() => setFps(option)}>
                    {option} FPS
                  </Button>
                ))}
              </div>

              <Label className="mb-3 mt-6 block">Frame format</Label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((nextFormat) => (
                  <Button
                    key={nextFormat}
                    variant={format === nextFormat ? "default" : "outline"}
                    onClick={() => setFormat(nextFormat)}
                  >
                    {nextFormat === "jpeg" ? "JPG" : nextFormat.toUpperCase()}
                  </Button>
                ))}
              </div>

              <Button onClick={handleExtractAll} disabled={isProcessing} className="mt-6 w-full">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                Extract all frames to ZIP
              </Button>

              {(isProcessing || progress > 0) && (
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progressLabel || "Working locally"}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full border bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Output</h2>
              <div className="rounded-xl border border-dashed bg-muted/30 p-4">
                <p className="text-sm font-medium">{zipBlob ? zipName : "ZIP appears here after extraction"}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {frameCount ? `${frameCount} frames packaged locally.` : "No upload route is used for frame extraction."}
                </p>
              </div>
              {zipBlob && (
                <Button onClick={downloadZip} className="mt-4 w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download frames ZIP
                </Button>
              )}
            </section>
          </div>
        )}

        {zipBlob && (
          <OutputCard description="Frames were extracted and zipped locally in this browser. Large videos can create very large ZIP files.">
            <Button onClick={downloadZip} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download frames ZIP
            </Button>
          </OutputCard>
        )}
      </div>
    </ToolLayout>
  );
}
