"use client";

import { useState } from "react";
import { Download, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { OutputCard, SettingsPanel, StatusPill } from "@/components/workspace-components";
import { downloadBlob, revokeObjectUrl } from "@/lib/local-processing/blob-utils";
import { generateQrLocally, getContrastRatio, type QrErrorCorrection, type QrFormat } from "@/lib/local-processing/qr-processing";

export default function QrGeneratorPage() {
  const [text, setText] = useState("");
  const [darkColor, setDarkColor] = useState("#111827");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [margin, setMargin] = useState<number[]>([4]);
  const [errorCorrection, setErrorCorrection] = useState<QrErrorCorrection>("H");
  const [format, setFormat] = useState<QrFormat>("png");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const contrastRatio = getContrastRatio(darkColor, lightColor);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateQrLocally({
        text,
        darkColor,
        lightColor,
        margin: margin[0],
        errorCorrection,
        format,
      });
      const nextUrl = URL.createObjectURL(blob);
      revokeObjectUrl(previewUrl);
      setPreviewUrl(nextUrl);
      setOutputBlob(blob);
      toast.success("QR code generated locally.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!outputBlob) {
      toast.error("Generate the QR code first.");
      return;
    }

    downloadBlob(outputBlob, `qr-code.${format === "jpeg" ? "jpg" : format}`, { kind: "generation" });
  };

  return (
    <ToolLayout
      title="QR generator"
      description="Generate QR codes in the browser and export PNG, JPEG, or SVG without uploading content."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusPill>Local processing</StatusPill>
        <StatusPill>No upload</StatusPill>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <SettingsPanel title="Content">
            <Label className="mb-2 block">Text or URL</Label>
            <Textarea
              placeholder="https://example.com"
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-36 resize-none"
            />
          </SettingsPanel>

          <SettingsPanel title="Appearance">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block text-xs">Foreground</Label>
                <input className="h-10 w-full rounded-md border border-input bg-white" type="color" value={darkColor} onChange={(event) => setDarkColor(event.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block text-xs">Background</Label>
                <input className="h-10 w-full rounded-md border border-input bg-white" type="color" value={lightColor} onChange={(event) => setLightColor(event.target.value)} />
              </div>
            </div>

            {contrastRatio < 3 && (
              <p className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                Low contrast may make this QR difficult to scan.
              </p>
            )}

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <Label>Margin</Label>
                <span className="font-mono text-xs text-muted-foreground">{margin[0]} modules</span>
              </div>
              <Slider value={margin} onValueChange={(value) => setMargin(value as number[])} min={0} max={10} step={1} />
            </div>

            <div className="mt-5">
              <Label className="mb-3 block">Error correction</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["L", "M", "Q", "H"] as const).map((level) => (
                  <Button key={level} variant={errorCorrection === level ? "default" : "outline"} onClick={() => setErrorCorrection(level)}>
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <Label className="mb-3 block">Export format</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["png", "jpeg", "svg"] as const).map((nextFormat) => (
                  <Button key={nextFormat} variant={format === nextFormat ? "default" : "outline"} onClick={() => setFormat(nextFormat)}>
                    {nextFormat === "jpeg" ? "JPG" : nextFormat.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </SettingsPanel>
        </div>

        <div className="space-y-6">
          <SettingsPanel title="Preview">
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border bg-white p-5">
              {previewUrl ? (
                format === "svg" ? (
                  <object data={previewUrl} type="image/svg+xml" aria-label="Generated QR code" className="h-72 w-72" />
                ) : (
                  <img src={previewUrl} alt="Generated QR code" className="h-72 w-72 object-contain" />
                )
              ) : (
                <div className="text-center text-muted-foreground">
                  <QrCode className="mx-auto mb-3 h-12 w-12 opacity-45" />
                  <p className="text-sm">Generated QR preview appears here.</p>
                </div>
              )}
            </div>
          </SettingsPanel>

          {outputBlob && (
            <OutputCard description="Generated locally. Download your file below.">
              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download QR code
              </Button>
            </OutputCard>
          )}

          <Button size="lg" onClick={handleGenerate} disabled={isGenerating || !text.trim()} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
            Generate locally
          </Button>
        </div>
      </div>
    </ToolLayout>
  );
}
