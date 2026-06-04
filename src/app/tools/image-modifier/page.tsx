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
import { formatBytes } from "@/components/preview/image-preview";

type OutputFormat = "png" | "jpeg" | "webp" | "avif";
type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const FORMATS: OutputFormat[] = ["webp", "jpeg", "png", "avif"];
const POSITIONS: WatermarkPosition[] = ["bottom-right", "center", "top-left", "top-right", "bottom-left"];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Image modification failed";
}

export default function ImageModifierPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("modified-image.webp");
  const [isProcessing, setIsProcessing] = useState(false);

  const [format, setFormat] = useState<OutputFormat>("webp");
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

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    const nextUrl = URL.createObjectURL(nextFile);
    setFile(nextFile);
    setPreviewUrl(nextUrl);
    setResultUrl(null);
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
  };

  const handleModify = async () => {
    if (!file) {
      toast.error("Choose an image first");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", format);
    formData.append("quality", quality[0].toString());
    formData.append("rotate", rotate);
    formData.append("watermarkPosition", watermarkPosition);
    formData.append("watermarkOpacity", (watermarkOpacity[0] / 100).toString());

    if (resizeWidth) formData.append("resizeWidth", resizeWidth);
    if (resizeHeight) formData.append("resizeHeight", resizeHeight);
    if (cropLeft) formData.append("cropLeft", cropLeft);
    if (cropTop) formData.append("cropTop", cropTop);
    if (cropWidth) formData.append("cropWidth", cropWidth);
    if (cropHeight) formData.append("cropHeight", cropHeight);
    if (watermarkText.trim()) formData.append("watermarkText", watermarkText.trim());
    if (topText.trim()) formData.append("topText", topText.trim());
    if (bottomText.trim()) formData.append("bottomText", bottomText.trim());

    try {
      const response = await fetch("/api/convert/image-modifier", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(error.error || "Image modification failed");
      }

      const blob = await response.blob();
      const nextUrl = URL.createObjectURL(blob);
      const extension = format === "jpeg" ? "jpg" : format;
      const nextName = `modified-${file.name.replace(/\.[^.]+$/, "")}.${extension}`;

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(nextUrl);
      setResultName(nextName);
      toast.success("Image modifier output is ready");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = resultName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <ToolLayout
      title="Image Modifier"
      description="Resize, crop, rotate, watermark, add meme text, compress, and convert images in one working pipeline."
    >
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
                  Run the modifier to preview the result.
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
      </div>
    </ToolLayout>
  );
}
