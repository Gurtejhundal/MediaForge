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

export default function CompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number[]>([70]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("quality", quality[0].toString());
    formData.append("format", "webp"); // Compress to webp for best results by default, or could pass user setting

    try {
      const response = await fetch("/api/convert/compress", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
         const errData = await response.json().catch(() => ({}));
         throw new Error(errData.error || "Failed to compress image");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `compressed-${file.name.split('.')[0]}.webp`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Image compressed successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout 
      title="Image Compressor" 
      description="Reduce image file size significantly via smart compression algorithms."
    >
      <div className="space-y-8">
        {!file ? (
          <Dropzone 
            onFileAccepted={handleFileAccepted} 
            accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] }}
            maxSizeMB={20} 
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
