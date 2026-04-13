"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { ImagePreview } from "@/components/preview/image-preview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Maximize, FileDown } from "lucide-react";
import { toast } from "sonner";

export default function ResizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);

    // Provide default dimensions based on original
    const img = new Image();
    img.onload = () => {
       setWidth(img.width.toString());
       setHeight(img.height.toString());
    };
    const url = URL.createObjectURL(acceptedFile);
    img.src = url;
    setPreviewUrl(url);
  };

  const clearFile = () => {
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
    const formData = new FormData();
    formData.append("file", file);
    if (width) formData.append("width", width);
    if (height) formData.append("height", height);

    try {
      const response = await fetch("/api/convert/resize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
         const errData = await response.json().catch(() => ({}));
         throw new Error(errData.error || "Failed to resize image");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resized-${file.name}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Image resized and downloaded!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout 
      title="Image Resizer" 
      description="Change image dimensions precisely while maintaining high quality."
    >
      <div className="space-y-8">
        {!file ? (
          <Dropzone 
            onFileAccepted={handleFileAccepted} 
            accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] }}
            maxSizeMB={10} 
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
                  <Input 
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
                  <Input 
                    id="height" 
                    type="number" 
                    placeholder="e.g. 600" 
                    value={height} 
                    onChange={e => setHeight(e.target.value)} 
                    className="mt-1" 
                  />
               </div>
            </div>

            <div className="pt-2">
              <Button 
                size="lg" 
                onClick={handleResize} 
                disabled={isProcessing}
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
    </ToolLayout>
  );
}
