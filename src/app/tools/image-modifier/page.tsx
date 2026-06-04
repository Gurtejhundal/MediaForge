"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { Download, Droplets, ImageIcon, Loader2, RotateCw, Scissors, Stamp, Type, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { OutputCard, StatusPill } from "@/components/workspace-components";
import { downloadBlob, revokeObjectUrl } from "@/lib/local-processing/blob-utils";
import { processImageLocally, type BrowserImageFormat, type WatermarkPosition } from "@/lib/local-processing/image-processing";
import { formatBytes } from "@/components/preview/image-preview";

const FORMATS: BrowserImageFormat[] = ["webp", "jpeg", "png", "avif"];
const POSITIONS: WatermarkPosition[] = ["bottom-right", "center", "top-left", "top-right", "bottom-left"];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Image modification failed";
}

export default function ImageModifierPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState("modified-image.webp");
  const [isProcessing, setIsProcessing] = useState(false);

  const [format, setFormat] = useState<BrowserImageFormat>("webp");
  const [quality, setQuality] = useState<number[]>([82]);
  const [resizeWidth, setResizeWidth] = useState("");
  const [resizeHeight, setResizeHeight] = useState("");
  const [cropLeft, setCropLeft] = useState("");
  const [cropTop, setCropTop] = useState("");
  const [cropWidth, setCropWidth] = useState("");
  const [cropHeight, setCropHeight] = useState("");
  const [rotate, setRotate] = useState("0");
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>("bottom-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number[]>([45]);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    if (!nextFile) return;

    if (!nextFile.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }

    revokeObjectUrl(previewUrl);
    revokeObjectUrl(resultUrl);

    const nextUrl = URL.createObjectURL(nextFile);
    setFile(nextFile);
    setPreviewUrl(nextUrl);
    setResultUrl(null);
    setResultBlob(null);
  };

  const clearFile = () => {
    revokeObjectUrl(previewUrl);
    revokeObjectUrl(resultUrl);

    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setResultBlob(null);
  };

  const handleModify = async () => {
    if (!file) {
      toast.error("Choose an image first");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processImageLocally(file, {
        format,
        quality: quality[0],
        width: resizeWidth ? Number.parseInt(resizeWidth, 10) : undefined,
        height: resizeHeight ? Number.parseInt(resizeHeight, 10) : undefined,
        rotate: Number.parseInt(rotate, 10),
        crop: cropLeft && cropTop && cropWidth && cropHeight ? {
          left: Number.parseInt(cropLeft, 10),
          top: Number.parseInt(cropTop, 10),
          width: Number.parseInt(cropWidth, 10),
          height: Number.parseInt(cropHeight, 10),
        } : undefined,
        watermark: watermarkText.trim() ? {
          text: watermarkText.trim(),
          position: watermarkPosition,
          opacity: watermarkOpacity[0] / 100,
        } : undefined,
        topText: topText.trim() || undefined,
        bottomText: bottomText.trim() || undefined,
      });

      const nextUrl = URL.createObjectURL(result.blob);
      revokeObjectUrl(resultUrl);
      setResultUrl(nextUrl);
      setResultBlob(result.blob);
      setResultName(`modified-${result.filename}`);
      toast.success("Image modified locally.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultBlob) return;
    downloadBlob(resultBlob, resultName);
  };

  return (
    <ToolLayout
      title="Image Modifier"
      description="Resize, crop, rotate, watermark, add meme text, compress, and convert images locally in your browser."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusPill>Local processing</StatusPill>
        <StatusPill>No upload</StatusPill>
      </div>
      <div className="space-y-8">
        <div className="rounded-xl border bg-muted/20 p-5">
          <Label htmlFor="image-file" className="mb-3 flex items-center text-sm font-semibold">
            <ImageIcon className="mr-2 h-4 w-4" /> Source Image
          </Label>
          <Input id="image-file" type="file" accept="image/*" onChange={handleFileChange} />
          {file && (
            <div className="mt-4 flex items-center justify-between rounded-lg border bg-background p-3 text-sm">
              <span className="min-w-0 truncate">{file.name} - {formatBytes(file.size)}</span>
              <Button variant="ghost" size="sm" onClick={clearFile}>Clear</Button>
            </div>
          )}
        </div>

        {previewUrl && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-black/5 p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Original</p>
              <img src={previewUrl} alt="Original preview" className="max-h-[360px] w-full rounded-lg object-contain" />
            </div>
            <div className="rounded-xl border bg-black/5 p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Output</p>
              {resultUrl ? (
                <img src={resultUrl} alt="Modified output" className="max-h-[360px] w-full rounded-lg object-contain" />
              ) : (
                <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  Run the local modifier to preview the result.
                </div>
              )}
            </div>
          </div>
        )}

        {file && (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border bg-muted/20 p-5">
              <h3 className="mb-4 flex items-center font-semibold"><Scissors className="mr-2 h-4 w-4" /> Geometry</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="resize-width">Width</Label>
                  <Input id="resize-width" type="number" min="1" value={resizeWidth} onChange={(event) => setResizeWidth(event.target.value)} placeholder="auto" />
                </div>
                <div>
                  <Label htmlFor="resize-height">Height</Label>
                  <Input id="resize-height" type="number" min="1" value={resizeHeight} onChange={(event) => setResizeHeight(event.target.value)} placeholder="auto" />
                </div>
                <div>
                  <Label htmlFor="crop-left">Crop X</Label>
                  <Input id="crop-left" type="number" min="0" value={cropLeft} onChange={(event) => setCropLeft(event.target.value)} placeholder="optional" />
                </div>
                <div>
                  <Label htmlFor="crop-top">Crop Y</Label>
                  <Input id="crop-top" type="number" min="0" value={cropTop} onChange={(event) => setCropTop(event.target.value)} placeholder="optional" />
                </div>
                <div>
                  <Label htmlFor="crop-width">Crop Width</Label>
                  <Input id="crop-width" type="number" min="1" value={cropWidth} onChange={(event) => setCropWidth(event.target.value)} placeholder="optional" />
                </div>
                <div>
                  <Label htmlFor="crop-height">Crop Height</Label>
                  <Input id="crop-height" type="number" min="1" value={cropHeight} onChange={(event) => setCropHeight(event.target.value)} placeholder="optional" />
                </div>
              </div>
              <div className="mt-4">
                <Label className="mb-2 flex items-center"><RotateCw className="mr-2 h-4 w-4" /> Rotate</Label>
                <div className="grid grid-cols-4 gap-2">
                  {["0", "90", "180", "270"].map((angle) => (
                    <Button key={angle} variant={rotate === angle ? "default" : "outline"} onClick={() => setRotate(angle)}>
                      {angle}
                    </Button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-muted/20 p-5">
              <h3 className="mb-4 flex items-center font-semibold"><Droplets className="mr-2 h-4 w-4" /> Output</h3>
              <Label className="mb-2 block">Format</Label>
              <div className="mb-5 grid grid-cols-4 gap-2">
                {FORMATS.map((nextFormat) => (
                  <Button key={nextFormat} variant={format === nextFormat ? "default" : "outline"} onClick={() => setFormat(nextFormat)}>
                    {nextFormat === "jpeg" ? "JPG" : nextFormat.toUpperCase()}
                  </Button>
                ))}
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Label>Quality</Label>
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{quality[0]}%</span>
                </div>
                <Slider value={quality} onValueChange={(value) => setQuality(value as number[])} min={1} max={100} step={1} />
              </div>
            </section>

            <section className="rounded-xl border bg-muted/20 p-5">
              <h3 className="mb-4 flex items-center font-semibold"><Stamp className="mr-2 h-4 w-4" /> Watermark</h3>
              <Label htmlFor="watermark">Text</Label>
              <Input id="watermark" value={watermarkText} onChange={(event) => setWatermarkText(event.target.value)} placeholder="Brand, credit, draft..." />
              <Label className="mb-2 mt-4 block">Position</Label>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map((position) => (
                  <Button key={position} variant={watermarkPosition === position ? "default" : "outline"} onClick={() => setWatermarkPosition(position)} className="capitalize">
                    {position.replace("-", " ")}
                  </Button>
                ))}
              </div>
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label>Opacity</Label>
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{watermarkOpacity[0]}%</span>
                </div>
                <Slider value={watermarkOpacity} onValueChange={(value) => setWatermarkOpacity(value as number[])} min={8} max={100} step={1} />
              </div>
            </section>

            <section className="rounded-xl border bg-muted/20 p-5">
              <h3 className="mb-4 flex items-center font-semibold"><Type className="mr-2 h-4 w-4" /> Meme Text</h3>
              <Label htmlFor="top-text">Top Text</Label>
              <Textarea id="top-text" value={topText} onChange={(event) => setTopText(event.target.value)} placeholder="Optional top caption" />
              <Label htmlFor="bottom-text" className="mt-4">Bottom Text</Label>
              <Textarea id="bottom-text" value={bottomText} onChange={(event) => setBottomText(event.target.value)} placeholder="Optional bottom caption" />
            </section>
          </div>
        )}

        {file && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={handleModify} disabled={isProcessing} className="flex-1">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Apply Modifications
            </Button>
            <Button size="lg" variant="outline" onClick={downloadResult} disabled={!resultUrl} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download Output
            </Button>
          </div>
        )}

        {resultUrl && (
          <OutputCard description="Generated locally from this browser. Download your file below.">
            <Button onClick={downloadResult} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download output
            </Button>
          </OutputCard>
        )}
      </div>
    </ToolLayout>
  );
}
