"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { UploadCloud, Image as ImageIcon, Link as LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  accept: Record<string, string[]>;
  maxSizeMB?: number;
  displayMode?: "image" | "video";
}

export function Dropzone({ onFileAccepted, accept, maxSizeMB = 10, displayMode = "image" }: DropzoneProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="space-y-4 w-full">
      {/* 1. Drag and Drop Area */}
      <div
        {...getRootProps()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 ease-in-out cursor-pointer overflow-hidden",
          "flex flex-col items-center justify-center p-12 text-center",
          isDragActive && !isDragReject ? "border-primary bg-primary/5" : "border-border/60 bg-muted/20 hover:bg-muted/40",
          isDragReject && "border-destructive bg-destructive/5"
        )}
      >
        <input {...getInputProps()} />
        
        <div className={cn(
          "p-4 rounded-full mb-4 transition-transform duration-300",
          isDragActive ? "scale-110 bg-primary/20 text-primary" : "bg-background text-muted-foreground",
          isHovered && !isDragActive && "scale-105"
        )}>
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-semibold mb-2">
          {isDragActive
            ? isDragReject
              ? "File type not supported"
              : `Drop ${displayMode} here`
            : `Drag & drop a ${displayMode} here`}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          or click to browse. Max file size {maxSizeMB}MB.
        </p>

        <div className="mt-8 flex gap-3 text-xs text-muted-foreground/70">
          {displayMode === "image" ? (
            <>
              <span className="flex items-center bg-background px-2 py-1 rounded-md border">
                <ImageIcon className="h-3 w-3 mr-1" /> PNG
              </span>
              <span className="flex items-center bg-background px-2 py-1 rounded-md border">
                <ImageIcon className="h-3 w-3 mr-1" /> JPG
              </span>
              <span className="flex items-center bg-background px-2 py-1 rounded-md border">
                <ImageIcon className="h-3 w-3 mr-1" /> WEBP
              </span>
              <span className="flex items-center bg-background px-2 py-1 rounded-md border">
                <ImageIcon className="h-3 w-3 mr-1" /> AVIF
              </span>
              <span className="flex items-center bg-background px-2 py-1 rounded-md border">
                <ImageIcon className="h-3 w-3 mr-1" /> HEIC
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center bg-background px-2 py-1 rounded-md border">
                <UploadCloud className="h-3 w-3 mr-1" /> MP4
              </span>
              <span className="flex items-center bg-background px-2 py-1 rounded-md border">
                <UploadCloud className="h-3 w-3 mr-1" /> WEBM
              </span>
              <span className="flex items-center bg-background px-2 py-1 rounded-md border">
                <UploadCloud className="h-3 w-3 mr-1" /> MOV
              </span>
              <span className="flex items-center bg-background px-2 py-1 rounded-md border">
                <UploadCloud className="h-3 w-3 mr-1" /> MKV
              </span>
              <span className="flex items-center bg-background px-2 py-1 rounded-md border">
                <UploadCloud className="h-3 w-3 mr-1" /> AVI
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. URL Import Card */}
      <div className="bg-muted/30 p-6 rounded-xl border flex flex-col items-center">
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
    </div>
  );
}
