"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/components/preview/image-preview";
import { convertFileLocally } from "@/lib/local-processing/document-processing";
import { downloadBlob, revokeObjectUrl } from "@/lib/local-processing/blob-utils";

type FileCategory = "image" | "data" | "document" | "unknown";

function getFileCategory(ext: string): FileCategory {
  const imageExts = ["png", "jpg", "jpeg", "webp", "gif", "tiff", "bmp", "svg", "ico"];
  const dataExts = ["json", "csv", "xml", "yaml", "yml"];
  const docExts = ["md", "markdown", "html", "txt"];

  if (imageExts.includes(ext)) return "image";
  if (dataExts.includes(ext)) return "data";
  if (docExts.includes(ext)) return "document";
  return "unknown";
}

function getTargetFormats(ext: string): string[] {
  const category = getFileCategory(ext);
  
  if (category === "image") {
    return ["png", "jpeg", "webp", "avif"];
  }
  if (ext === "json") {
    return ["csv", "xml", "yaml", "txt", "pdf"];
  }
  if (ext === "csv") {
    return ["json", "xml", "yaml", "txt", "pdf"];
  }
  if (ext === "xml") {
    return ["json", "csv", "yaml", "txt", "pdf"];
  }
  if (ext === "yaml" || ext === "yml") {
    return ["json", "csv", "xml", "txt", "pdf"];
  }
  if (ext === "md" || ext === "markdown") {
    return ["html", "txt", "pdf"];
  }
  if (ext === "html") {
    return ["txt", "pdf"];
  }
  if (ext === "txt") {
    return ["html", "pdf", "json"];
  }
  return ["txt", "json"];
}

export default function FileConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fileExt = file ? (file.name.split('.').pop() || "").toLowerCase() : "";
  const availableFormats = file ? getTargetFormats(fileExt) : [];

  const handleFileAccepted = (acceptedFile: File) => {
    revokeObjectUrl(previewUrl);
    setFile(acceptedFile);
    const ext = (acceptedFile.name.split('.').pop() || "").toLowerCase();
    const formats = getTargetFormats(ext);
    if (formats.length > 0) {
      setTargetFormat(formats[0]);
    } else {
      setTargetFormat("txt");
    }
    if (acceptedFile.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(acceptedFile));
    }
  };

  const clearFile = () => {
    revokeObjectUrl(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setTargetFormat("");
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      const result = await convertFileLocally(file, targetFormat);
      downloadBlob(result.blob, result.filename, { kind: "conversion" });
      toast.success("File converted locally.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to convert file");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout 
      title="Universal File Converter" 
      description="Convert images, structured data, and document text locally in this browser."
    >
      <div className="space-y-8 w-full">
        {!file ? (
          <Dropzone 
            onFileAccepted={handleFileAccepted} 
            accept={{ 
              "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif", ".tiff", ".bmp", ".svg", ".ico"],
              "text/*": [".txt", ".csv", ".json", ".xml", ".yaml", ".yml", ".md", ".markdown", ".html"],
              "application/json": [".json"],
              "text/csv": [".csv"],
              "application/xml": [".xml"]
            }}
            displayMode="image"
            processingMode="local"
          />
        ) : (
          <div className="relative flex flex-col p-4 border rounded-xl bg-card overflow-hidden">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center min-w-0">
                   <FileText className="h-5 w-5 mr-3 text-primary" />
                   <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: <span className="uppercase font-semibold">{fileExt}</span> / {formatBytes(file.size)}
                      </p>
                   </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFile} className="text-muted-foreground hover:text-destructive">Remove File</Button>
             </div>
             
             {/* Thumbnail display for images */}
             {file.type.startsWith("image/") && previewUrl && (
               <div className="rounded-lg overflow-hidden bg-black/10 border aspect-video flex items-center justify-center p-4">
                   <img 
                     src={previewUrl} 
                     alt="Upload Preview"
                     className="max-h-full max-w-full object-contain rounded-md"
                   />
               </div>
             )}
          </div>
        )}

        {file && (
          <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
            <h3 className="font-semibold text-lg flex items-center">
              <RefreshCw className="mr-2 h-5 w-5 text-primary" /> Conversion Settings
            </h3>
            
            <div className="space-y-6">
              {/* Target Format Selector */}
              {availableFormats.length > 0 ? (
                <div>
                  <Label className="mb-3 block text-sm text-foreground">Target Format</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableFormats.map((format) => (
                      <Button
                        key={format}
                        variant={targetFormat === format ? "default" : "outline"}
                        onClick={() => setTargetFormat(format)}
                        className="capitalize min-w-[70px] h-10"
                      >
                        {format === "jpeg" ? "jpg" : format.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-amber-500 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-xs">
                    No matching conversions found for this file type. Please try text, structured data, or image formats.
                  </p>
                </div>
              )}

              {availableFormats.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <Button 
                    size="lg" 
                    onClick={handleConvert} 
                    disabled={isProcessing}
                    className="w-full text-md h-12 relative overflow-hidden group"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Converting File...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Convert to {targetFormat === "jpeg" ? "JPG" : targetFormat.toUpperCase()}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
