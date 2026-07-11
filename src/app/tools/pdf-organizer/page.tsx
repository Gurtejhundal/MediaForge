"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { ArrowDownUp, Download, FileArchive, FilePlus2, Hash, Loader2, Minimize2, PenLine, RotateCw, ScanLine, Scissors, Stamp, Workflow } from "lucide-react";
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
  group: "Organize" | "Optimize" | "Edit" | "Convert";
};

const MODES: ModeOption[] = [
  { value: "merge", label: "Merge PDF", description: "Combine PDFs in file order", group: "Organize" },
  { value: "split", label: "Split PDF", description: "Extract ranges or split every page", group: "Organize" },
  { value: "extractPages", label: "Extract pages", description: "Create a new PDF from selected pages", group: "Organize" },
  { value: "removePages", label: "Remove pages", description: "Delete selected pages and export the rest", group: "Organize" },
  { value: "organize", label: "Organize PDF", description: "Reorder pages by number", group: "Organize" },
  { value: "compress", label: "Compress PDF", description: "Rewrite with object streams where possible", group: "Optimize" },
  { value: "repair", label: "Repair PDF", description: "Reload and rewrite loadable PDFs", group: "Optimize" },
  { value: "rotate", label: "Rotate PDF", description: "Rotate selected pages", group: "Edit" },
  { value: "watermark", label: "Watermark", description: "Stamp text across pages", group: "Edit" },
  { value: "pageNumbers", label: "Page numbers", description: "Add footer page numbers", group: "Edit" },
  { value: "crop", label: "Crop PDF", description: "Set crop margins on selected pages", group: "Edit" },
  { value: "sign", label: "Sign PDF", description: "Add a visible signature line", group: "Edit" },
  { value: "jpgToPdf", label: "Scan / JPG to PDF", description: "Create one PDF from images", group: "Convert" },
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
  const [cropMargin, setCropMargin] = useState<number[]>([36]);
  const [signatureText, setSignatureText] = useState("Gurtej Bir Singh");

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
        cropMargin: cropMargin[0],
        signatureText,
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
        <div className="grid gap-4 xl:grid-cols-4">
          {(["Organize", "Optimize", "Edit", "Convert"] as const).map((group) => (
            <section key={group} className="border bg-muted/20 p-3">
              <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{group}</h2>
              <div className="space-y-2">
                {MODES.filter((option) => option.group === group).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleModeChange(option.value)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      mode === option.value ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted/40"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>
            </section>
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
          {(mode === "split" || mode === "extractPages" || mode === "removePages" || mode === "rotate" || mode === "crop" || mode === "sign") && (
            <section className="rounded-xl border bg-muted/20 p-5">
              <h3 className="mb-4 flex items-center font-semibold"><FileArchive className="mr-2 h-4 w-4" /> Page Selection</h3>
              <Label htmlFor="pages">Pages</Label>
              <Input
                id="pages"
                value={pages}
                onChange={(event) => setPages(event.target.value)}
                placeholder={mode === "removePages" ? "Pages to remove: 2,4-6" : "Example: 1-3,5,8"}
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

          {(mode === "compress" || mode === "repair") && (
            <section className="rounded-xl border bg-muted/20 p-5 md:col-span-2">
              <h3 className="mb-2 flex items-center font-semibold">
                {mode === "compress" ? <Minimize2 className="mr-2 h-4 w-4" /> : <ScanLine className="mr-2 h-4 w-4" />}
                {mode === "compress" ? "Compression rewrite" : "Repair rewrite"}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                This local pass rewrites a browser-loadable PDF with object streams. It can shrink structure-heavy PDFs, but scanned/image-heavy PDFs may not become smaller.
              </p>
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

          {mode === "crop" && (
            <section className="rounded-xl border bg-muted/20 p-5">
              <h3 className="mb-4 flex items-center font-semibold"><Scissors className="mr-2 h-4 w-4" /> Crop margin</h3>
              <div className="mb-3 flex items-center justify-between">
                <Label>Margin</Label>
                <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{cropMargin[0]} pt</span>
              </div>
              <Slider value={cropMargin} onValueChange={(value) => setCropMargin(value as number[])} min={0} max={144} step={1} />
            </section>
          )}

          {mode === "sign" && (
            <section className="rounded-xl border bg-muted/20 p-5">
              <h3 className="mb-4 flex items-center font-semibold"><PenLine className="mr-2 h-4 w-4" /> Visible signature</h3>
              <Label htmlFor="signature-text">Signature text</Label>
              <Input id="signature-text" value={signatureText} onChange={(event) => setSignatureText(event.target.value)} />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Adds a visible signature line. It is not a cryptographic digital signature.</p>
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
