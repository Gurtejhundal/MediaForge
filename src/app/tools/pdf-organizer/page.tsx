"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { ArrowDownUp, Download, FileArchive, FilePlus2, Hash, Loader2, RotateCw, Stamp, Workflow } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes } from "@/components/preview/image-preview";
import { downloadBlob } from "@/lib/local-processing/blob-utils";
import { processPdfLocally, type PdfMode, type WatermarkPosition } from "@/lib/local-processing/pdf-processing";

type ModeOption = {
  value: PdfMode;
  label: string;
  description: string;
};

const MODES: ModeOption[] = [
  { value: "merge", label: "Merge", description: "Combine PDFs in file order" },
  { value: "split", label: "Split", description: "Extract page ranges or split every page" },
  { value: "rotate", label: "Rotate", description: "Rotate selected pages" },
  { value: "watermark", label: "Watermark", description: "Stamp text across pages" },
  { value: "pageNumbers", label: "Page Numbers", description: "Add footer page numbers" },
  { value: "organize", label: "Organize", description: "Reorder pages by number" },
  { value: "jpgToPdf", label: "Images to PDF", description: "Create one PDF from images" },
];

const POSITIONS: WatermarkPosition[] = ["center", "bottom-right", "top-left", "top-right", "bottom-left"];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "PDF operation failed";
}

function acceptsForMode(mode: PdfMode) {
  return mode === "jpgToPdf" ? "image/png,image/jpeg,image/jpg" : "application/pdf";
}

function supportsMultiple(mode: PdfMode) {
  return mode === "merge" || mode === "jpgToPdf";
}

export default function PdfOrganizerPage() {
  const [mode, setMode] = useState<PdfMode>("merge");
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pages, setPages] = useState("");
  const [pageOrder, setPageOrder] = useState("");
  const [splitEveryPage, setSplitEveryPage] = useState(false);
  const [angle, setAngle] = useState("90");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>("center");
  const [opacity, setOpacity] = useState<number[]>([25]);

  const selectedMode = MODES.find((option) => option.value === mode) || MODES[0];

  const handleModeChange = (nextMode: PdfMode) => {
    setMode(nextMode);
    setFiles([]);
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || []);
    if (nextFiles.length === 0) return;

    const invalidFile = nextFiles.find((file) => {
      if (nextModeIsImage(mode)) return !file.type.startsWith("image/");
      return file.type && file.type !== "application/pdf";
    });

    if (invalidFile) {
      toast.error(`${invalidFile.name} is not valid for ${selectedMode.label}`);
      return;
    }

    setFiles(supportsMultiple(mode) ? nextFiles : [nextFiles[0]]);
  };

  const handleRun = async () => {
    if (files.length === 0) {
      toast.error("Choose files first");
      return;
    }

    if (mode === "merge" && files.length < 2) {
      toast.error("Merge needs at least two PDFs");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await processPdfLocally(files, {
        mode,
        pages: pages.trim(),
        pageOrder: pageOrder.trim(),
        splitEveryPage,
        angle,
        watermarkText,
        position: watermarkPosition,
        opacity: opacity[0] / 100,
      });
      downloadBlob(result.blob, result.filename, { kind: "document" });
      toast.success(`${selectedMode.label} output generated locally`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="PDF Organizer"
      description="Merge, split, rotate, watermark, number, reorder, and create PDFs from images locally in this browser."
    >
      <div className="space-y-8">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleModeChange(option.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                mode === option.value ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted/40"
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border bg-muted/20 p-5">
          <Label htmlFor="pdf-files" className="mb-3 flex items-center text-sm font-semibold">
            <FilePlus2 className="mr-2 h-4 w-4" /> {selectedMode.label} Files
          </Label>
          <Input
            key={mode}
            id="pdf-files"
            type="file"
            accept={acceptsForMode(mode)}
            multiple={supportsMultiple(mode)}
            onChange={handleFilesChange}
          />
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file) => (
                <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-lg border bg-background p-3 text-sm">
                  <span className="min-w-0 truncate">{file.name}</span>
                  <span className="ml-3 shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {(mode === "split" || mode === "rotate") && (
            <section className="rounded-xl border bg-muted/20 p-5">
              <h3 className="mb-4 flex items-center font-semibold"><FileArchive className="mr-2 h-4 w-4" /> Page Selection</h3>
              <Label htmlFor="pages">Pages</Label>
              <Input
                id="pages"
                value={pages}
                onChange={(event) => setPages(event.target.value)}
                placeholder="Example: 1-3,5,8"
                disabled={mode === "split" && splitEveryPage}
              />
              {mode === "split" && (
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={splitEveryPage} onChange={(event) => setSplitEveryPage(event.target.checked)} />
                  Split every page into a ZIP
                </label>
              )}
            </section>
          )}

          {mode === "rotate" && (
            <section className="rounded-xl border bg-muted/20 p-5">
              <h3 className="mb-4 flex items-center font-semibold"><RotateCw className="mr-2 h-4 w-4" /> Rotation</h3>
              <div className="grid grid-cols-3 gap-2">
                {["90", "180", "270"].map((nextAngle) => (
                  <Button key={nextAngle} variant={angle === nextAngle ? "default" : "outline"} onClick={() => setAngle(nextAngle)}>
                    {nextAngle}
                  </Button>
                ))}
              </div>
            </section>
          )}

          {mode === "watermark" && (
            <section className="rounded-xl border bg-muted/20 p-5 md:col-span-2">
              <h3 className="mb-4 flex items-center font-semibold"><Stamp className="mr-2 h-4 w-4" /> Watermark</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="watermark-text">Text</Label>
                  <Input id="watermark-text" value={watermarkText} onChange={(event) => setWatermarkText(event.target.value)} />
                </div>
                <div>
                  <Label className="mb-2 block">Position</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {POSITIONS.map((position) => (
                      <Button key={position} variant={watermarkPosition === position ? "default" : "outline"} onClick={() => setWatermarkPosition(position)} className="capitalize">
                        {position.replace("-", " ")}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <Label>Opacity</Label>
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{opacity[0]}%</span>
                </div>
                <Slider value={opacity} onValueChange={(value) => setOpacity(value as number[])} min={5} max={100} step={1} />
              </div>
            </section>
          )}

          {mode === "organize" && (
            <section className="rounded-xl border bg-muted/20 p-5 md:col-span-2">
              <h3 className="mb-4 flex items-center font-semibold"><ArrowDownUp className="mr-2 h-4 w-4" /> Page Order</h3>
              <Label htmlFor="page-order">New page order</Label>
              <Textarea
                id="page-order"
                value={pageOrder}
                onChange={(event) => setPageOrder(event.target.value)}
                placeholder="Example: 3,1,2,4"
              />
            </section>
          )}

          {mode === "pageNumbers" && (
            <section className="rounded-xl border bg-muted/20 p-5 md:col-span-2">
              <h3 className="mb-2 flex items-center font-semibold"><Hash className="mr-2 h-4 w-4" /> Page Numbers</h3>
              <p className="text-sm text-muted-foreground">Adds centered footer page numbers to every page.</p>
            </section>
          )}
        </div>

        <Button size="lg" onClick={handleRun} disabled={isProcessing || files.length === 0} className="w-full">
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Workflow className="mr-2 h-4 w-4" />}
          Run {selectedMode.label}
          {!isProcessing && <Download className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </ToolLayout>
  );
}

function nextModeIsImage(mode: PdfMode) {
  return mode === "jpgToPdf";
}
