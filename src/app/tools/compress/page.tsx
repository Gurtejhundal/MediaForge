"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { ImagePreview } from "@/components/preview/image-preview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob, formatFileSize, revokeObjectUrl } from "@/lib/local-processing/blob-utils";
import { processImageLocally } from "@/lib/local-processing/image-processing";
import { StatusPill } from "@/components/workspace-components";

export default function CompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number[]>([70]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOutputSize, setLastOutputSize] = useState<number | null>(null);

  const handleFileAccepted = (acceptedFile: File) => {
    revokeObjectUrl(previewUrl);
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
    setLastOutputSize(null);
  };

  const clearFile = () => {
    revokeObjectUrl(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setLastOutputSize(null);
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const result = await processImageLocally(file, { format: "webp", quality: quality[0] });
      setLastOutputSize(result.blob.size);
      downloadBlob(result.blob, `compressed-${result.filename}`, { kind: "modification" });
      
      toast.success("Image compressed locally.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to compress image");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout 
      title="Image Compressor" 
      description="Compress images locally with browser-native WebP export."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusPill>Local processing</StatusPill>
        <StatusPill>No upload</StatusPill>
      </div>
      <div className="space-y-8">
        {!file ? (
          <Dropzone 
            onFileAccepted={handleFileAccepted} 
            accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"], "image/svg+xml": [".svg"] }}
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
            <h3 className="mb-6 font-semibold flex items-center">Compression Settings</h3>
            
            <div className="space-y-6">
               <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Quality Level</Label>
                    <span className="text-sm font-bold bg-primary/20 text-primary px-2 py-1 rounded">
                      {quality[0]}%
                    </span>
                  </div>
                  <Slider 
                    value={quality} 
                    onValueChange={(val) => setQuality(val as number[])} 
                    max={100} 
                    min={1} 
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Smallest File</span>
                    <span>Best Quality</span>
                  </div>
               </div>

               {lastOutputSize !== null && file && (
                 <div className="rounded-xl border bg-background p-4 text-sm">
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Original</span>
                     <span className="font-mono">{formatFileSize(file.size)}</span>
                   </div>
                   <div className="mt-2 flex justify-between">
                     <span className="text-muted-foreground">Output</span>
                     <span className="font-mono">{formatFileSize(lastOutputSize)}</span>
                   </div>
                 </div>
               )}

               <div className="pt-4">
                <Button 
                  size="lg" 
                  onClick={handleCompress} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Minimize2 className="mr-2 h-4 w-4" />
                      Compress Image
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
