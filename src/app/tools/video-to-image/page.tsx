"use client";

import { useRef, useState } from "react";
import { Download, Film, ImageDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OutputCard, StatusPill } from "@/components/workspace-components";
import { downloadBlob, formatFileSize, revokeObjectUrl, safeBaseName } from "@/lib/local-processing/blob-utils";
import { captureFrameFromVideo, parseTimestamp, type FrameExportFormat } from "@/lib/local-processing/video-frame-processing";

export default function VideoToImagePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState("00:00:01");
  const [format, setFormat] = useState<FrameExportFormat>("png");
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const handleFileAccepted = (acceptedFile: File) => {
    revokeObjectUrl(previewUrl);
    revokeObjectUrl(outputUrl);
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
    setOutputBlob(null);
    setOutputUrl(null);
  };

  const clearFile = () => {
    revokeObjectUrl(previewUrl);
    revokeObjectUrl(outputUrl);
    setFile(null);
    setPreviewUrl(null);
    setOutputBlob(null);
    setOutputUrl(null);
  };

  const handleCapture = async () => {
    if (!videoRef.current || !file) return;

    setIsProcessing(true);
    try {
      const blob = await captureFrameFromVideo(videoRef.current, parseTimestamp(timestamp), format);
      const nextUrl = URL.createObjectURL(blob);
      revokeObjectUrl(outputUrl);
      setOutputBlob(blob);
      setOutputUrl(nextUrl);
      toast.success("Frame extracted locally.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to extract frame");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFrame = () => {
    if (!outputBlob || !file) return;
    const extension = format === "jpeg" ? "jpg" : format;
    downloadBlob(outputBlob, `${safeBaseName(file.name)}-frame.${extension}`);
  };

  return (
    <ToolLayout
      title="Frame extractor"
      description="Extract a still frame from a selected video using the browser video element and Canvas. No upload required."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusPill>Local processing</StatusPill>
        <StatusPill>No upload</StatusPill>
        <StatusPill tone="warning">Large videos use this device CPU and memory</StatusPill>
      </div>

      <div className="space-y-8">
        {!file ? (
          <Dropzone
            onFileAccepted={handleFileAccepted}
            accept={{ "video/mp4": [".mp4"], "video/webm": [".webm"], "video/quicktime": [".mov"] }}
            displayMode="video"
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
              <Button variant="ghost" size="sm" onClick={clearFile}>Remove</Button>
            </div>
            <video ref={videoRef} src={previewUrl!} controls className="aspect-video max-h-[520px] w-full rounded-xl border bg-black object-contain" />
          </div>
        )}

        {file && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Output preview</h2>
              {outputUrl ? (
                <img src={outputUrl} alt="Captured video frame" className="max-h-[460px] w-full rounded-xl border bg-white object-contain" />
              ) : (
                <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
                  Captured frame appears here.
                </div>
              )}
            </section>

            <section className="rounded-2xl border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Frame settings</h2>
              <Label htmlFor="timestamp">Timestamp</Label>
              <Input id="timestamp" value={timestamp} onChange={(event) => setTimestamp(event.target.value)} placeholder="00:00:01" className="mt-2 font-mono" />
              <p className="mt-2 text-xs text-muted-foreground">Use HH:MM:SS, MM:SS, or seconds.</p>

              <Label className="mb-3 mt-5 block">Export format</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["png", "jpeg", "webp"] as const).map((nextFormat) => (
                  <Button key={nextFormat} variant={format === nextFormat ? "default" : "outline"} onClick={() => setFormat(nextFormat)}>
                    {nextFormat === "jpeg" ? "JPG" : nextFormat.toUpperCase()}
                  </Button>
                ))}
              </div>

              <Button onClick={handleCapture} disabled={isProcessing} className="mt-6 w-full">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageDown className="mr-2 h-4 w-4" />}
                Capture frame
              </Button>
            </section>
          </div>
        )}

        {outputBlob && (
          <OutputCard description="Frame extracted locally. Download your file below.">
            <Button onClick={downloadFrame} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download frame
            </Button>
          </OutputCard>
        )}
      </div>
    </ToolLayout>
  );
}
