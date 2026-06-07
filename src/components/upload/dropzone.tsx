"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { ArrowRight, Cpu, Image as ImageIcon, Link as LinkIcon, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  accept: Record<string, string[]>;
  displayMode?: "image" | "video";
  processingMode?: "local" | "server";
}

export function Dropzone({ onFileAccepted, accept, displayMode = "image", processingMode = "local" }: DropzoneProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const displayLabel = displayMode === "image" ? "an image" : "a video";

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0]);
    } else if (fileRejections.length > 0) {
      toast.error(fileRejections[0].errors[0].message || "File rejected");
    }
  }, [onFileAccepted]);

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput); // basic validation
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsFetchingUrl(true);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch from URL");
      }

      const contentType = res.headers.get("content-type") || "application/octet-stream";
      const blob = await res.blob();
      
      // Determine extension based on URL or content type ideally, but default randomly
      const filename = urlInput.split('/').pop()?.split('?')[0] || `imported-file.${contentType.split('/')[1] || 'bin'}`;
      const file = new File([blob], filename, { type: contentType });

      onFileAccepted(file);
      setUrlInput("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch from URL");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  });

  return (
    <div className="space-y-4 w-full">
      <div
        {...getRootProps()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative w-full cursor-pointer overflow-hidden rounded-[22px] border border-dashed transition-all duration-200 ease-in-out",
          "grid gap-6 p-6 md:grid-cols-[1fr_280px] md:p-8",
          isDragActive && !isDragReject ? "border-violet-400 bg-violet-50" : "border-border-strong bg-[#f8f8f5] hover:border-violet-300 hover:bg-white",
          isDragReject && "border-destructive bg-destructive/5"
        )}
      >
        <input {...getInputProps()} />

        <div>
          <div className={cn(
            "mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform duration-300",
            isDragActive ? "scale-105 border-violet-200 bg-white text-violet-700" : "border-border bg-white text-violet-700",
            isHovered && !isDragActive && "scale-105"
          )}>
            <UploadCloud className="h-6 w-6" />
          </div>

          <h3 className="text-2xl font-semibold tracking-tight">
            {isDragActive
              ? isDragReject
                ? "File type not supported"
                : `Drop ${displayLabel} here`
              : `Drop ${displayLabel} here`}
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            {processingMode === "local"
              ? "Processed locally in your browser. No app-side file limit; your device and browser decide what can run."
              : "Server-assisted processing. This file may be uploaded for processing."}
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {displayMode === "image" ? (
              <>
                <span className="flex items-center rounded-full border bg-white px-2.5 py-1 font-mono">
                  <ImageIcon className="mr-1 h-3 w-3" /> PNG
                </span>
                <span className="flex items-center rounded-full border bg-white px-2.5 py-1 font-mono">
                  <ImageIcon className="mr-1 h-3 w-3" /> JPG
                </span>
                <span className="flex items-center rounded-full border bg-white px-2.5 py-1 font-mono">
                  <ImageIcon className="mr-1 h-3 w-3" /> WEBP
                </span>
                <span className="flex items-center rounded-full border bg-white px-2.5 py-1 font-mono">
                  <ImageIcon className="mr-1 h-3 w-3" /> AVIF
                </span>
                <span className="flex items-center rounded-full border bg-white px-2.5 py-1 font-mono">
                  <ImageIcon className="mr-1 h-3 w-3" /> HEIC
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center rounded-full border bg-white px-2.5 py-1 font-mono">
                  <UploadCloud className="mr-1 h-3 w-3" /> MP4
                </span>
                <span className="flex items-center rounded-full border bg-white px-2.5 py-1 font-mono">
                  <UploadCloud className="mr-1 h-3 w-3" /> WEBM
                </span>
                <span className="flex items-center rounded-full border bg-white px-2.5 py-1 font-mono">
                  <UploadCloud className="mr-1 h-3 w-3" /> MOV
                </span>
                <span className="flex items-center rounded-full border bg-white px-2.5 py-1 font-mono">
                  <UploadCloud className="mr-1 h-3 w-3" /> MKV
                </span>
                <span className="flex items-center rounded-full border bg-white px-2.5 py-1 font-mono">
                  <UploadCloud className="mr-1 h-3 w-3" /> AVI
                </span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-[18px] border border-border bg-white p-4">
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">File path</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Selected file</span>
              <UploadCloud className="h-4 w-4 text-violet-700" />
            </div>
            <div className="flex items-center justify-center text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Browser memory</span>
              <Cpu className="h-4 w-4 text-violet-700" />
            </div>
            <div className="flex items-center justify-center text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-teal-800">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]">Blob export</p>
              <p className="mt-1 text-xs">Download generated in this tab.</p>
            </div>
          </div>
        </div>
      </div>

      {processingMode === "server" && (
        <div className="flex flex-col items-center rounded-[18px] border bg-white p-5">
          <h3 className="mb-4 font-semibold flex items-center self-start text-muted-foreground">
            <LinkIcon className="h-4 w-4 mr-2" /> Or Import from URL
          </h3>
          <div className="flex w-full gap-3">
              <Input
                placeholder={`e.g. https://example.com/media.${displayMode === 'image' ? 'png' : 'mp4'}`}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isFetchingUrl}
                className="bg-background flex-1"
                onKeyDown={(e) => {
                  if(e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlImport();
                  }
                }}
              />
              <Button
                variant="default"
                disabled={!urlInput.trim() || isFetchingUrl}
                onClick={handleUrlImport}
                className="w-28"
              >
                {isFetchingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch File"}
              </Button>
          </div>
        </div>
      )}
    </div>
  );
}
