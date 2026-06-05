"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { ImagePreview } from "@/components/preview/image-preview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob, revokeObjectUrl } from "@/lib/local-processing/blob-utils";
import { processImageLocally, type BrowserImageFormat } from "@/lib/local-processing/image-processing";
import { StatusPill } from "@/components/workspace-components";

export default function FormatConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<BrowserImageFormat>("webp");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    revokeObjectUrl(previewUrl);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
  };

  const clearFile = () => {
    revokeObjectUrl(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const result = await processImageLocally(file, { format: targetFormat, quality: 90 });
      downloadBlob(result.blob, `converted-${result.filename}`);
      
      toast.success("Image converted locally.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to convert image");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout 
      title="Format Converter" 
      description="Convert images in the browser. No upload required."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusPill>Local processing</StatusPill>
        <StatusPill>No upload</StatusPill>
      </div>
      <div className="space-y-8">
        {!file ? (
          <Dropzone 
            onFileAccepted={handleFileAccepted} 
            accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"], "image/avif": [".avif"], "image/heic": [".heic"], "image/heif": [".heif"] }}
          />
        ) : (
          <ImagePreview 
            file={file} 
            previewUrl={previewUrl!} 
            onRemove={clearFile} 
          />
        )}

        {file && (
          <div className="bg-muted/30 p-6 rounded-xl border">
            <h3 className="mb-4 font-semibold">Settings</h3>
            <div className="space-y-4">
               <div>
                  <Label className="mb-3 block text-sm text-muted-foreground">Target Format</Label>
                  <div className="flex flex-wrap gap-3">
                     {(["png", "jpeg", "webp", "avif"] as const).map(fmt => (
                       <Button 
                         key={fmt}
                         variant={targetFormat === fmt ? "default" : "outline"}
                         onClick={() => setTargetFormat(fmt)}
                         className="capitalize w-24"
                       >
                         {fmt === "jpeg" ? "jpg" : fmt}
                       </Button>
                     ))}
                  </div>
               </div>

               <div className="pt-6">
                <Button 
                  size="lg" 
                  onClick={handleConvert} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Convert to {targetFormat === 'jpeg' ? 'JPG' : targetFormat.toUpperCase()}
                    </>
                  )}
                </Button>
               </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
