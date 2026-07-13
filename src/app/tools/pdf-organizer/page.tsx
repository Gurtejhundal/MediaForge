"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownUp,
  Download,
  FileArchive,
  FileImage,
  FileInput,
  FileKey,
  FileOutput,
  FilePlus2,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Files,
  Hash,
  Loader2,
  LockKeyhole,
  Minimize2,
  PenLine,
  Presentation,
  RotateCw,
  ScanLine,
  Scissors,
  ShieldAlert,
  Stamp,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes } from "@/components/preview/image-preview";
import { StatusPill } from "@/components/workspace-components";
import { downloadBlob } from "@/lib/local-processing/blob-utils";
import {
  acceptedDocumentTypes,
  documentModeSupportsMultiple,
  processDocumentConversion,
  type DocumentConversionMode,
} from "@/lib/local-processing/office-document-processing";
import { processPdfLocally, type PdfMode, type WatermarkPosition } from "@/lib/local-processing/pdf-processing";
import { cn } from "@/lib/utils";

type DocumentMode = PdfMode | DocumentConversionMode;
type ToolGroup = "Organize PDF" | "Optimize PDF" | "Convert to PDF" | "Convert from PDF" | "Edit PDF" | "PDF security";

type ModeOption = {
  value: DocumentMode | "pdfToPdfA" | "unlock" | "protect" | "redact";
  label: string;
  description: string;
  group: ToolGroup;
  icon: LucideIcon;
  available?: boolean;
  note?: string;
};

const MODES: ModeOption[] = [
  { value: "merge", label: "Merge PDF", description: "Combine PDFs in selected order", group: "Organize PDF", icon: Files },
  { value: "split", label: "Split PDF", description: "Export ranges or every page", group: "Organize PDF", icon: Scissors },
  { value: "removePages", label: "Remove pages", description: "Delete selected pages", group: "Organize PDF", icon: FileOutput },
  { value: "extractPages", label: "Extract pages", description: "Build a PDF from selected pages", group: "Organize PDF", icon: FileInput },
  { value: "organize", label: "Organize PDF", description: "Set a new page order", group: "Organize PDF", icon: ArrowDownUp },
  { value: "scanToPdf", label: "Scan to PDF", description: "Package photos as a PDF", group: "Organize PDF", icon: ScanLine },

  { value: "compress", label: "Compress PDF", description: "Rewrite object streams", group: "Optimize PDF", icon: Minimize2 },
  { value: "repair", label: "Repair PDF", description: "Rebuild a loadable PDF", group: "Optimize PDF", icon: Workflow },
  { value: "ocrPdf", label: "OCR PDF", description: "Add a searchable English text layer", group: "Optimize PDF", icon: FileSearch, note: "Downloads an OCR language model on first use." },

  { value: "jpgToPdf", label: "JPG to PDF", description: "Convert PNG or JPG pages", group: "Convert to PDF", icon: FileImage },
  { value: "wordToPdf", label: "Word to PDF", description: "Convert modern DOCX text", group: "Convert to PDF", icon: FileText, note: "Complex Word layout may be simplified." },
  { value: "powerpointToPdf", label: "PowerPoint to PDF", description: "Convert PPTX slide text", group: "Convert to PDF", icon: Presentation, note: "Complex slide layout may be simplified." },
  { value: "excelToPdf", label: "Excel to PDF", description: "Convert XLSX worksheets", group: "Convert to PDF", icon: FileSpreadsheet, note: "Modern XLSX only; layout is fitted for reading." },
  { value: "htmlToPdf", label: "HTML to PDF", description: "Convert readable HTML content", group: "Convert to PDF", icon: FilePlus2 },

  { value: "pdfToJpg", label: "PDF to JPG", description: "Package rendered pages as a ZIP", group: "Convert from PDF", icon: FileImage },
  { value: "pdfToWord", label: "PDF to Word", description: "Recover page text into DOCX", group: "Convert from PDF", icon: FileText, note: "Text is editable; original layout may differ." },
  { value: "pdfToPowerPoint", label: "PDF to PowerPoint", description: "Place each page on a PPTX slide", group: "Convert from PDF", icon: Presentation, note: "Preserves appearance as slide images." },
  { value: "pdfToExcel", label: "PDF to Excel", description: "Recover page rows into XLSX", group: "Convert from PDF", icon: FileSpreadsheet, note: "Table recovery is best-effort." },
  { value: "pdfToPdfA", label: "PDF to PDF/A", description: "Standards-conformant archival PDF", group: "Convert from PDF", icon: FileArchive, available: false, note: "Requires a conformance engine not available in-browser." },

  { value: "rotate", label: "Rotate PDF", description: "Rotate selected pages", group: "Edit PDF", icon: RotateCw },
  { value: "pageNumbers", label: "Add page numbers", description: "Number every page footer", group: "Edit PDF", icon: Hash },
  { value: "watermark", label: "Add watermark", description: "Stamp text across pages", group: "Edit PDF", icon: Stamp },
  { value: "crop", label: "Crop PDF", description: "Set page crop margins", group: "Edit PDF", icon: Scissors },
  { value: "addText", label: "Edit PDF", description: "Add text to selected pages", group: "Edit PDF", icon: PenLine },
  { value: "flattenForms", label: "PDF forms", description: "Flatten existing form fields", group: "Edit PDF", icon: FileInput },

  { value: "unlock", label: "Unlock PDF", description: "Remove password encryption", group: "PDF security", icon: FileKey, available: false, note: "Password decryption needs a dedicated secure engine." },
  { value: "protect", label: "Protect PDF", description: "Apply password encryption", group: "PDF security", icon: LockKeyhole, available: false, note: "Browser PDF encryption is not implemented safely." },
  { value: "sign", label: "Sign PDF", description: "Add a visible signature line", group: "PDF security", icon: PenLine, note: "Visible signature only; not a cryptographic certificate." },
  { value: "redact", label: "Redact PDF", description: "Permanently remove sensitive content", group: "PDF security", icon: ShieldAlert, available: false, note: "A black rectangle is not secure redaction, so this is intentionally unavailable." },
  { value: "comparePdf", label: "Compare PDF", description: "Create a page-by-page text report", group: "PDF security", icon: FileSearch },
];

const GROUPS: ToolGroup[] = ["Organize PDF", "Optimize PDF", "Convert to PDF", "Convert from PDF", "Edit PDF", "PDF security"];
const POSITIONS: WatermarkPosition[] = ["center", "bottom-right", "top-left", "top-right", "bottom-left"];
const CONVERSION_MODES = new Set<DocumentMode>([
  "wordToPdf", "powerpointToPdf", "excelToPdf", "htmlToPdf", "pdfToJpg", "pdfToWord", "pdfToPowerPoint", "pdfToExcel", "ocrPdf", "comparePdf",
]);

function isDocumentConversionMode(mode: DocumentMode): mode is DocumentConversionMode {
  return CONVERSION_MODES.has(mode);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Document operation failed";
}

function acceptsForMode(mode: DocumentMode) {
  if (isDocumentConversionMode(mode)) return acceptedDocumentTypes(mode);
  return mode === "jpgToPdf" || mode === "scanToPdf" ? "image/png,image/jpeg,image/jpg" : "application/pdf,.pdf";
}

function supportsMultiple(mode: DocumentMode) {
  return mode === "merge" || mode === "jpgToPdf" || mode === "scanToPdf" || (isDocumentConversionMode(mode) && documentModeSupportsMultiple(mode));
}

function requiresPageSelection(mode: DocumentMode) {
  return ["split", "extractPages", "removePages", "rotate", "crop", "sign", "addText"].includes(mode);
}

export default function PdfOrganizerPage() {
  const [mode, setMode] = useState<DocumentMode>("merge");
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
  const [editText, setEditText] = useState("Added with MediaForge");

  const selectedMode = MODES.find((option) => option.value === mode) || MODES[0];

  const handleModeChange = (option: ModeOption) => {
    if (option.available === false) {
      toast.info(option.note || "This operation is not available in the local engine");
      return;
    }
    setMode(option.value as DocumentMode);
    setFiles([]);
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || []);
    if (nextFiles.length === 0) return;
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
    if (mode === "comparePdf" && files.length !== 2) {
      toast.error("Compare PDF needs exactly two files");
      return;
    }

    setIsProcessing(true);
    try {
      const result = isDocumentConversionMode(mode)
        ? await processDocumentConversion(files, mode)
        : await processPdfLocally(files, {
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
            editText,
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
      title="Document Studio"
      description="Organize, optimize, edit, OCR, and convert PDF, Word, PowerPoint, Excel, HTML, and image documents locally where the browser can do so safely."
    >
      <div className="space-y-7">
        <div className="flex flex-wrap gap-2">
          <StatusPill>Local document engine</StatusPill>
          <StatusPill>No file upload</StatusPill>
          <StatusPill tone="warning">Modern Office formats</StatusPill>
        </div>

        <section aria-labelledby="document-tool-catalog">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[8px] font-bold uppercase tracking-[.18em] text-primary">Document rack / 30 capabilities</p>
              <h2 id="document-tool-catalog" className="mf-display mt-1 text-4xl font-semibold uppercase">Choose an operation</h2>
            </div>
            <p className="max-w-xl text-xs leading-5 text-muted-foreground">Unavailable security tools remain visible with exact reasons. They are not presented as working buttons.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {GROUPS.map((group) => (
              <section key={group} className="mf-faceplate overflow-hidden">
                <header className="border-b border-border px-4 py-3">
                  <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{group}</h3>
                </header>
                <div className="space-y-1.5 p-2.5">
                  {MODES.filter((option) => option.group === group).map((option) => {
                    const Icon = option.icon;
                    const isSelected = mode === option.value;
                    const unavailable = option.available === false;
                    return (
                      <button
                        key={`${group}-${option.value}`}
                        type="button"
                        onClick={() => handleModeChange(option)}
                        aria-pressed={isSelected}
                        aria-disabled={unavailable}
                        title={option.note}
                        className={cn(
                          "group flex min-h-14 w-full items-start gap-2.5 rounded-sm border px-2.5 py-2 text-left transition-colors",
                          isSelected ? "border-primary bg-primary/10 shadow-[inset_3px_0_0_var(--primary)]" : "border-transparent hover:border-border hover:bg-background/70",
                          unavailable && "cursor-not-allowed opacity-55",
                        )}
                      >
                        <span className={cn("mf-inset mt-0.5 flex size-7 shrink-0 items-center justify-center text-primary", unavailable && "text-muted-foreground")}><Icon className="size-3.5" /></span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-xs font-bold">
                            {option.label}
                            {unavailable ? <LockKeyhole className="size-3 text-muted-foreground" /> : null}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">{option.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="mf-inset p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Label htmlFor="document-files" className="flex items-center text-sm font-bold">
                <FilePlus2 className="mr-2 size-4 text-primary" /> {selectedMode.label} files
              </Label>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{selectedMode.description}. {selectedMode.note || "Processing stays in this browser tab."}</p>
            </div>
            <span className="mf-rack-label shrink-0 px-2 py-1 font-mono text-[8px] uppercase tracking-[.12em]">{acceptsForMode(mode).replaceAll(",", " · ")}</span>
          </div>
          <Input
            key={mode}
            id="document-files"
            type="file"
            accept={acceptsForMode(mode)}
            multiple={supportsMultiple(mode)}
            onChange={handleFilesChange}
            className="mt-4"
          />
          {files.length > 0 ? (
            <div className="mt-4 space-y-2">
              {files.map((file) => (
                <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-sm border bg-background p-3 text-sm">
                  <span className="min-w-0 truncate font-semibold">{file.name}</span>
                  <span className="ml-3 shrink-0 font-mono text-[9px] text-muted-foreground">{formatBytes(file.size)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {requiresPageSelection(mode) ? (
            <section className="mf-faceplate p-5">
              <h3 className="mb-4 flex items-center font-bold"><FileArchive className="mr-2 size-4 text-primary" /> Page selection</h3>
              <Label htmlFor="pages">Pages</Label>
              <Input id="pages" value={pages} onChange={(event) => setPages(event.target.value)} placeholder={mode === "removePages" ? "Pages to remove: 2,4-6" : "Example: 1-3,5,8"} disabled={mode === "split" && splitEveryPage} />
              {mode === "split" ? (
                <label className="mt-4 flex min-h-10 items-center gap-2 text-sm">
                  <input type="checkbox" checked={splitEveryPage} onChange={(event) => setSplitEveryPage(event.target.checked)} /> Split every page into a ZIP
                </label>
              ) : null}
            </section>
          ) : null}

          {mode === "compress" || mode === "repair" ? (
            <section className="mf-faceplate p-5 md:col-span-2">
              <h3 className="mb-2 flex items-center font-bold">{mode === "compress" ? <Minimize2 className="mr-2 size-4 text-primary" /> : <ScanLine className="mr-2 size-4 text-primary" />}{mode === "compress" ? "Compression rewrite" : "Repair rewrite"}</h3>
              <p className="text-sm leading-6 text-muted-foreground">This pass rewrites a browser-loadable PDF with object streams. Scanned or image-heavy PDFs may not become smaller.</p>
            </section>
          ) : null}

          {mode === "ocrPdf" ? (
            <section className="mf-faceplate p-5 md:col-span-2">
              <h3 className="mb-2 flex items-center font-bold"><FileSearch className="mr-2 size-4 text-primary" /> Searchable OCR layer</h3>
              <p className="text-sm leading-6 text-muted-foreground">The first run downloads the English OCR model. Each page is rendered locally, recognized locally, and rebuilt with a searchable text layer. Large documents can take several minutes.</p>
            </section>
          ) : null}

          {mode === "rotate" ? (
            <section className="mf-faceplate p-5">
              <h3 className="mb-4 flex items-center font-bold"><RotateCw className="mr-2 size-4 text-primary" /> Rotation</h3>
              <div className="grid grid-cols-3 gap-2">{["90", "180", "270"].map((nextAngle) => <Button key={nextAngle} variant={angle === nextAngle ? "default" : "outline"} onClick={() => setAngle(nextAngle)}>{nextAngle}°</Button>)}</div>
            </section>
          ) : null}

          {mode === "watermark" ? (
            <section className="mf-faceplate p-5 md:col-span-2">
              <h3 className="mb-4 flex items-center font-bold"><Stamp className="mr-2 size-4 text-primary" /> Watermark</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label htmlFor="watermark-text">Text</Label><Input id="watermark-text" value={watermarkText} onChange={(event) => setWatermarkText(event.target.value)} /></div>
                <div><Label className="mb-2 block">Position</Label><div className="grid grid-cols-2 gap-2">{POSITIONS.map((position) => <Button key={position} variant={watermarkPosition === position ? "default" : "outline"} onClick={() => setWatermarkPosition(position)} className="capitalize">{position.replace("-", " ")}</Button>)}</div></div>
              </div>
              <div className="mt-5"><div className="mb-3 flex items-center justify-between"><Label>Opacity</Label><span className="font-mono text-xs font-bold text-primary">{opacity[0]}%</span></div><Slider value={opacity} onValueChange={(value) => setOpacity(value as number[])} min={5} max={100} step={1} /></div>
            </section>
          ) : null}

          {mode === "organize" ? (
            <section className="mf-faceplate p-5 md:col-span-2"><h3 className="mb-4 flex items-center font-bold"><ArrowDownUp className="mr-2 size-4 text-primary" /> Page order</h3><Label htmlFor="page-order">New page order</Label><Textarea id="page-order" value={pageOrder} onChange={(event) => setPageOrder(event.target.value)} placeholder="Example: 3,1,2,4" /></section>
          ) : null}

          {mode === "pageNumbers" ? (
            <section className="mf-faceplate p-5 md:col-span-2"><h3 className="mb-2 flex items-center font-bold"><Hash className="mr-2 size-4 text-primary" /> Page numbers</h3><p className="text-sm text-muted-foreground">Adds centered footer page numbers to every page.</p></section>
          ) : null}

          {mode === "crop" ? (
            <section className="mf-faceplate p-5"><h3 className="mb-4 flex items-center font-bold"><Scissors className="mr-2 size-4 text-primary" /> Crop margin</h3><div className="mb-3 flex items-center justify-between"><Label>Margin</Label><span className="font-mono text-xs font-bold text-primary">{cropMargin[0]} pt</span></div><Slider value={cropMargin} onValueChange={(value) => setCropMargin(value as number[])} min={0} max={144} step={1} /></section>
          ) : null}

          {mode === "sign" ? (
            <section className="mf-faceplate p-5"><h3 className="mb-4 flex items-center font-bold"><PenLine className="mr-2 size-4 text-primary" /> Visible signature</h3><Label htmlFor="signature-text">Signature text</Label><Input id="signature-text" value={signatureText} onChange={(event) => setSignatureText(event.target.value)} /><p className="mt-2 text-xs leading-5 text-muted-foreground">This is visible signing, not a certificate-backed digital signature.</p></section>
          ) : null}

          {mode === "addText" ? (
            <section className="mf-faceplate p-5"><h3 className="mb-4 flex items-center font-bold"><PenLine className="mr-2 size-4 text-primary" /> Add text</h3><Label htmlFor="edit-text">Text to add</Label><Textarea id="edit-text" value={editText} onChange={(event) => setEditText(event.target.value)} /></section>
          ) : null}

          {mode === "flattenForms" ? (
            <section className="mf-faceplate p-5 md:col-span-2"><h3 className="mb-2 flex items-center font-bold"><FileInput className="mr-2 size-4 text-primary" /> Flatten PDF form fields</h3><p className="text-sm leading-6 text-muted-foreground">Existing field values become fixed page content. Save a copy before flattening because the exported fields are no longer editable.</p></section>
          ) : null}
        </div>

        <Button size="lg" onClick={handleRun} disabled={isProcessing || files.length === 0} className="w-full">
          {isProcessing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Workflow className="mr-2 size-4" />}
          {isProcessing ? `Running ${selectedMode.label}…` : `Run ${selectedMode.label}`}
          {!isProcessing ? <Download className="ml-2 size-4" /> : null}
        </Button>
      </div>
    </ToolLayout>
  );
}
