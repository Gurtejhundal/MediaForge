"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { ImagePreview } from "@/components/preview/image-preview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function FormatConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<"png" | "jpeg" | "webp" | "avif" | "heif">("webp");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", targetFormat);

    try {
      const response = await fetch("/api/convert/format", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
         const errData = await response.json().catch(() => ({}));
         throw new Error(errData.error || "Failed to convert image");
      }

      // Handle binary response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `converted.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Image converted successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout 
      title="Format Converter" 
      description="Convert images between PNG, JPG, and WEBP formats flawlessly."
    >
      <div className="space-y-8">
        {!file ? (
          <Dropzone 
            onFileAccepted={handleFileAccepted} 
            accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"], "image/avif": [".avif"], "image/heic": [".heic"], "image/heif": [".heif"] }}
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
            <h3 className="mb-4 font-semibold">Settings</h3>
            <div className="space-y-4">
               <div>
                  <Label className="mb-3 block text-sm text-muted-foreground">Target Format</Label>
                  <div className="flex flex-wrap gap-3">
                     {(["png", "jpeg", "webp", "avif", "heif"] as const).map(fmt => (
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
