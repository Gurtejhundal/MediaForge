"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout";
import { Dropzone } from "@/components/upload/dropzone";
import { ImagePreview } from "@/components/preview/image-preview";
import { Button } from "@/components/ui/button";
import { OutputCard, StatusPill } from "@/components/workspace-components";
import { downloadBlob, revokeObjectUrl } from "@/lib/local-processing/blob-utils";
import { generateFaviconPackageLocally } from "@/lib/local-processing/image-processing";

export default function PngToFaviconPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    previews: Record<string, string>;
    blob: Blob;
    filename: string;
    dimensions: { width: number; height: number };
  } | null>(null);

  const handleFileAccepted = (acceptedFile: File) => {
    revokeObjectUrl(previewUrl);
    Object.values(result?.previews || {}).forEach(revokeObjectUrl);
    setFile(acceptedFile);
    setPreviewUrl(URL.createObjectURL(acceptedFile));
    setResult(null);
  };

  const clearFile = () => {
    revokeObjectUrl(previewUrl);
    Object.values(result?.previews || {}).forEach(revokeObjectUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  const handleGenerate = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const nextResult = await generateFaviconPackageLocally(file);
      setResult(nextResult);
      toast.success("Favicon package generated locally.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to generate favicons");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Favicon builder"
      description="Generate favicon PNG sizes, ICO, Apple touch icon, manifest, and ZIP locally in your browser."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusPill>Local processing</StatusPill>
        <StatusPill>No upload</StatusPill>
      </div>

      <div className="space-y-8">
        {!file ? (
          <Dropzone
            onFileAccepted={handleFileAccepted}
            accept={{ "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"], "image/svg+xml": [".svg"] }}
          />
        ) : (
          <ImagePreview file={file} previewUrl={previewUrl!} onRemove={clearFile} />
        )}

        {file && !result && (
          <Button size="lg" onClick={handleGenerate} disabled={isProcessing} className="w-full">
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
            Generate local package
          </Button>
        )}

        {result && (
          <OutputCard description="Favicon package generated on this device. Download your ZIP below.">
            {result.dimensions.width < 512 || result.dimensions.height < 512 ? (
              <p className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                Source image is {result.dimensions.width} x {result.dimensions.height}. Use at least 512 x 512 for sharper icons.
              </p>
            ) : null}

            <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Object.entries(result.previews).map(([size, url]) => (
                <div key={size} className="rounded-xl border bg-white p-4 text-center">
                  <div className="relative mx-auto mb-3 h-14 w-14">
                    <Image src={url} alt={`Favicon ${size}`} fill className="object-contain" unoptimized />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{size}</span>
                </div>
              ))}
            </div>

            <Button onClick={() => downloadBlob(result.blob, result.filename, { kind: "generation" })} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download ZIP
            </Button>
          </OutputCard>
        )}
      </div>
    </ToolLayout>
  );
}
