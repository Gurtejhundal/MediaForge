"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  ArrowRight,
  Cpu,
  FileImage,
  Film,
  Link as LinkIcon,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  accept: Record<string, string[]>;
  displayMode?: "image" | "video";
  processingMode?: "local" | "server";
}

export function Dropzone({
  onFileAccepted,
  accept,
  displayMode = "image",
  processingMode = "local",
}: DropzoneProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const displayLabel = displayMode === "image" ? "an image" : "a video";
  const DisplayIcon = displayMode === "image" ? FileImage : Film;
  const formatLabels = useMemo(() => {
    const extensions = Object.values(accept)
      .flat()
      .map((extension) => extension.replace(/^\./, "").toUpperCase())
      .filter(Boolean);
    const mimeFallbacks = Object.keys(accept).map((mime) => mime.split("/").pop()?.toUpperCase() ?? mime);
    return Array.from(new Set([...extensions, ...mimeFallbacks])).slice(0, 7);
  }, [accept]);

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
      new URL(urlInput);
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
      const filename = urlInput.split("/").pop()?.split("?")[0] || `imported-file.${contentType.split("/")[1] || "bin"}`;
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
    <div className="w-full space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "mf-inset relative grid w-full cursor-pointer overflow-hidden border-2 border-dashed p-5 transition-[background-color,border-color,box-shadow] md:grid-cols-[minmax(0,1fr)_280px] md:p-7",
          isDragActive && !isDragReject
            ? "border-primary bg-primary/10"
            : "border-border-strong bg-[#c4beae] hover:border-primary hover:bg-[#d1cbbb]",
          isDragReject && "border-danger bg-danger/10",
        )}
      >
        <input {...getInputProps()} />

        <div className="relative p-1 md:pr-8">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-primary">Input bay / local file</p>
          <div className="mf-key mt-5 flex size-12 items-center justify-center text-primary">
            <UploadCloud className="size-6" />
          </div>

          <h3 className="mf-display mt-5 text-4xl font-semibold uppercase leading-none tracking-[-0.02em] sm:text-5xl">
            {isDragReject ? "File type not supported" : isDragActive ? `Drop ${displayLabel} now` : `Drop ${displayLabel} here`}
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            {processingMode === "local"
              ? "The selected file stays in this browser session. Device memory, CPU, and browser support set the practical limit."
              : "This is a server-assisted path. The selected file may leave this browser for processing."}
          </p>

          <div className="mt-6 flex flex-wrap gap-1.5" aria-label="Accepted input formats">
            {formatLabels.map((format) => (
              <span key={format} className="mf-rack-label inline-flex items-center px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em]">
                <DisplayIcon className="mr-1.5 size-3" />
                {format}
              </span>
            ))}
          </div>
        </div>

        <aside className="mf-screen mt-6 p-4 md:mt-0">
          <div className="flex items-center justify-between"><p className="font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-[#7f8e74]">Signal route</p><span className="mf-lamp" data-tone={processingMode === "local" ? "green" : "amber"} /></div>
          <ol className="mt-5 space-y-3 text-sm text-[#aab69d]">
            <li className="flex items-center justify-between gap-3 border-b border-background/20 pb-3">
              <span>Selected file</span>
              <UploadCloud className="size-4 text-[#e3a438]" />
            </li>
            <li className="flex items-center justify-center text-[#66725f]" aria-hidden="true">
              <ArrowRight className="size-4 rotate-90" />
            </li>
            <li className="flex items-center justify-between gap-3 border-b border-background/20 pb-3">
              <span>Browser memory</span>
              <Cpu className="size-4 text-[#e3a438]" />
            </li>
            <li className="flex items-center justify-center text-[#66725f]" aria-hidden="true">
              <ArrowRight className="size-4 rotate-90" />
            </li>
            <li className="border border-background/25 p-3">
              <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-[#a9bd96]">
                {processingMode === "local" ? "Local Blob export" : "Server response"}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#8e9b83]">Download is prepared for this browser tab.</p>
            </li>
          </ol>
        </aside>
      </div>

      {processingMode === "server" && (
        <div className="mf-faceplate p-4 md:p-5">
          <h3 className="mb-4 flex items-center font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <LinkIcon className="mr-2 size-4 text-primary" /> Import from URL
          </h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder={`https://example.com/media.${displayMode === "image" ? "png" : "mp4"}`}
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              disabled={isFetchingUrl}
              className="flex-1 bg-card"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleUrlImport();
                }
              }}
            />
            <Button disabled={!urlInput.trim() || isFetchingUrl} onClick={handleUrlImport} className="sm:w-32">
              {isFetchingUrl ? <Loader2 className="size-4 animate-spin" /> : "Fetch file"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
