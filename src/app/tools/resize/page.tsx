"use client";

import { useObjectUrlCleanup } from "@/hooks/use-object-url-cleanup";

import { useRef, useState } from "react";
import { ImageBatchMode } from "@/components/image-batch-mode";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { ImagePreview } from "@/components/preview/image-preview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Maximize, FileDown } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob, revokeObjectUrl } from "@/lib/local-processing/blob-utils";
import { getImageDimensions, processImageLocally } from "@/lib/local-processing/image-processing";
import { StatusPill } from "@/components/workspace-components";

export default function ResizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useObjectUrlCleanup(previewUrl);
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReadingDimensions, setIsReadingDimensions] = useState(false);
  const inputGeneration = useRef(0);

  const handleFileAccepted = (acceptedFile: File) => {
    const generation = ++inputGeneration.current;
    revokeObjectUrl(previewUrl);
    const url = URL.createObjectURL(acceptedFile);
    setFile(acceptedFile);
    setPreviewUrl(url);
    setWidth(""); setHeight(""); setIsReadingDimensions(true);
    getImageDimensions(acceptedFile).then((dimensions) => {
      if (generation !== inputGeneration.current) return;
      setWidth(dimensions.width.toString());
      setHeight(dimensions.height.toString());
    }).catch(() => {
      if (generation === inputGeneration.current) toast.error("Could not read the image dimensions. Enter output dimensions manually.");
    }).finally(() => { if (generation === inputGeneration.current) setIsReadingDimensions(false); });
  };

  const clearFile = () => {
    ++inputGeneration.current;
    setIsReadingDimensions(false);
    revokeObjectUrl(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setWidth("");
    setHeight("");
  };

  const handleResize = async () => {
    if (!file) return;

    if (!width && !height) {
       toast.error("Please provide at least one dimension");
       return;
    }

    setIsProcessing(true);
    try {
      const result = await processImageLocally(file, {
        format: "png",
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
      });
      downloadBlob(result.blob, `resized-${result.filename}`, { kind: "modification" });
      
      toast.success("Image resized locally.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to resize image");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout 
      title="Image Resizer" 
      description="Resize images locally with Canvas. No upload required."
    >
      <ImageBatchMode mode="resize">
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
            <h3 className="mb-4 font-semibold flex items-center"><Maximize className="mr-2 h-4 w-4 text-primary" /> Dimensions</h3>
            <div className="grid grid-cols-2 gap-4 pb-4">
               <div>
                  <Label htmlFor="width">Width (px)</Label>
                  <Input disabled={isReadingDimensions || isProcessing}
                    id="width" 
                    type="number" 
                    placeholder="e.g. 800" 
                    value={width} 
                    onChange={e => setWidth(e.target.value)} 
                    className="mt-1" 
                  />
               </div>
               <div>
                  <Label htmlFor="height">Height (px)</Label>
                  <Input disabled={isReadingDimensions || isProcessing}
                    id="height" 
                    type="number" 
                    placeholder="e.g. 600" 
                    value={height} 
                    onChange={e => setHeight(e.target.value)} 
                    className="mt-1" 
                  />
               </div>
            </div>
            {isReadingDimensions && <p role="status" className="mb-4 text-sm text-muted-foreground">Reading image dimensions…</p>}

            <div className="pt-2">
              <Button 
                size="lg" 
                onClick={handleResize} 
                    disabled={isProcessing || isReadingDimensions}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resizing...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Resize Image
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      </ImageBatchMode>
    </ToolLayout>
  );
}
