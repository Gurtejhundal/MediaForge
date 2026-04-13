"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { ImagePreview } from "@/components/preview/image-preview";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Package } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function PngToFaviconPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ previews: Record<string, string>, zipData: string } | null>(null);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
    setResult(null);
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  const handleGenerate = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/convert/png-to-favicon", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate favicons");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Favicon package generated successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = () => {
    if (!result) return;
    
    // Create a Blob from base64 representation
    const byteCharacters = atob(result.zipData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/zip" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "favicon-pack.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <ToolLayout 
      title="PNG to Favicon Generator" 
      description="Upload your logo mark to generate a comprehensive suite of favicons for all modern devices and browsers."
    >
      <div className="space-y-8">
        {!file ? (
          <Dropzone 
            onFileAccepted={handleFileAccepted} 
            accept={{ "image/png": [".png"] }}
            maxSizeMB={10} 
          />
        ) : (
          <ImagePreview 
            file={file} 
            previewUrl={previewUrl!} 
            onRemove={clearFile} 
          />
        )}

        {file && !result && (
          <div className="flex justify-center pt-4">
            <Button 
              size="lg" 
              onClick={handleGenerate} 
              disabled={isProcessing}
              className="w-full sm:w-auto px-12"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Generate Package
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 border-t border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Generated Favicons</h3>
              <Button onClick={handleDownloadZip} className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="mr-2 h-4 w-4" />
                Download Complete ZIP
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.entries(result.previews).map(([size, base64]) => (
                <div key={size} className="flex flex-col items-center justify-center p-4 rounded-xl border bg-muted/30">
                  <div className="h-16 w-16 relative flex items-center justify-center mb-3">
                    <Image 
                      src={base64} 
                      alt={`Favicon ${size}`} 
                      className="max-h-full max-w-full drop-shadow-sm" 
                      width={parseInt(size.split("x")[0])}
                      height={parseInt(size.split("x")[1])}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {size}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
