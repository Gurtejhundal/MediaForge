"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import JSZip from "jszip";
import { useSavedSetting, isDimension, isQuality } from "@/hooks/use-saved-setting";
import { useUnsavedWork } from "@/hooks/use-unsaved-work";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob, formatFileSize, safeBaseName } from "@/lib/local-processing/blob-utils";
import { processImageLocally, type BrowserImageFormat } from "@/lib/local-processing/image-processing";

type Mode = "convert" | "resize" | "compress";
type Item = { id: string; file: File; state: "queued" | "working" | "done" | "error"; result?: Blob; filename?: string; error?: string; width?: number; height?: number };

export function ImageBatchMode({ mode, children }: { mode: Mode; children: ReactNode }) {
  const [batch, setBatch] = useState(false);
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  return <>
    <div role="group" aria-label="File mode" className="mb-5 flex flex-wrap gap-2">
      <Button variant={!batch ? "default" : "outline"} aria-pressed={!batch} disabled={busy} onClick={() => setBatch(false)}>Single file</Button>
      <Button variant={batch ? "default" : "outline"} aria-pressed={batch} disabled={busy} onClick={() => { setOpened(true); setBatch(true); }}>Multiple files</Button>
    </div>
    <div hidden={batch}>{children}</div>
    <div hidden={!batch}>{opened && <BatchImages mode={mode} onBusy={setBusy} />}</div>
  </>;
}

function BatchImages({ mode, onBusy }: { mode: Mode; onBusy(busy: boolean): void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useSavedSetting<BrowserImageFormat>(`batch.${mode}.format`, mode === "compress" ? "webp" : "png", (v): v is BrowserImageFormat => typeof v === "string" && ["png", "jpeg", "webp", "avif", "svg"].includes(v));
  const [width, setWidth] = useSavedSetting(`batch.${mode}.width`, "", isDimension);
  const [height, setHeight] = useSavedSetting(`batch.${mode}.height`, "", isDimension);
  const [quality, setQuality] = useSavedSetting(`batch.${mode}.quality`, "80", isQuality);
  const [busy, setBusy] = useState(false);
  const [packing, setPacking] = useState(false);
  const cancelled = useRef(false);
  const mounted = useRef(true);
  const [hasRun, setHasRun] = useState(false);
  const originalSettings = useRef<Parameters<typeof processImageLocally>[1] | null>(null);
  useUnsavedWork(items.length > 0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; cancelled.current = true; }; }, []);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next = [...items];
    let rejected = 0;
    for (const file of Array.from(files)) {
      if (next.length >= 20 || file.size > 25 * 1024 * 1024 || next.reduce((size, item) => size + item.file.size, 0) + file.size > 100 * 1024 * 1024) { rejected++; continue; }
      next.push({ id: crypto.randomUUID(), file, state: "queued" });
    }
    setItems(next);
    if (rejected) toast.error(`${rejected} file(s) exceeded the batch limits. Accepted files are listed below.`);
  }
  function resetResults() { setItems(current => current.map(item => ({ id: item.id, file: item.file, state: "queued" }))); }
  async function run(selection: "all" | "resume" | "retry" = "all") {
    const dimensions = [width, height].filter(Boolean).map(Number);
    if (selection === "all" && mode === "resize" && (!dimensions.length || dimensions.some(n => !Number.isInteger(n) || n < 1 || n > 16384))) {
      toast.error("Enter at least one dimension, using whole pixels between 1 and 16,384."); return;
    }
    const q = Number(quality);
    if (selection === "all" && (!Number.isInteger(q) || q < 1 || q > 100)) { toast.error("Quality must be a whole number between 1 and 100."); return; }
    if (selection === "all" && items.some(item => item.result) && !window.confirm("Reprocess all images with the current settings? Save any finished results first; they will be replaced.")) return;
    if (selection === "all") {
      setHasRun(true);
      originalSettings.current = { format: mode === "compress" ? "webp" : format, quality: q,
        ...(mode === "resize" ? { width: width ? Number(width) : undefined, height: height ? Number(height) : undefined, fit: "contain" as const } : {}) };
      resetResults();
    }
    const settings = originalSettings.current;
    if (!settings) return;
    const selected = items.filter(item => selection === "all" || item.state === (selection === "retry" ? "error" : "queued"));
    cancelled.current = false; setBusy(true); onBusy(true);
    let outputBytes = selection === "all" ? 0 : items.reduce((total, item) => total + (item.result?.size || 0), 0);
    try {
      for (const item of selected) {
        if (cancelled.current) break;
        setItems(current => current.map(entry => entry.id === item.id ? { ...entry, state: "working", error: undefined } : entry));
        try {
          const output = await processImageLocally(item.file, settings);
          if (!mounted.current) return;
          if (outputBytes + output.blob.size > 128 * 1024 * 1024) throw new Error("Finished images exceed the 128 MB batch limit. Use a smaller batch.");
          outputBytes += output.blob.size;
          setItems(current => current.map(entry => entry.id === item.id ? { ...entry, state: "done", result: output.blob, filename: output.filename, width: output.width, height: output.height } : entry));
        } catch (error) {
          if (!mounted.current) return;
          setItems(current => current.map(entry => entry.id === item.id ? { ...entry, state: "error", error: error instanceof Error ? error.message : "Could not process this file." } : entry));
        }
        // Yield between files so touch, keyboard and Stop remain responsive.
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } finally { if (mounted.current) { setBusy(false); onBusy(false); } }
  }
  async function saveZip() {
    setPacking(true); onBusy(true);
    try {
      const zip = new JSZip();
      const report: { input: string; output?: string; error?: string; status: string }[] = [];
      for (const [index, item] of items.entries()) {
        const filename = `${String(index + 1).padStart(2, "0")}-${safeBaseName(item.file.name)}.${item.filename?.split(".").pop() || "bin"}`;
        if (item.result) zip.file(filename, item.result);
        report.push({ input: item.file.name, output: item.result ? filename : undefined, status: item.state, error: item.error });
      }
      zip.file("batch-report.json", JSON.stringify(report, null, 2));
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      if (blob.size > 256 * 1024 * 1024) throw new Error("This ZIP exceeds 256 MB. Save results individually or use a smaller batch.");
      if (mounted.current) downloadBlob(blob, `mediaforge-${mode}-batch.zip`, { kind: mode === "convert" ? "conversion" : "modification" });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not package these results."); }
    finally { if (mounted.current) { setPacking(false); onBusy(false); } }
  }
  const ready = items.filter(item => item.state === "done").length;
  return <section aria-label="Batch image files" className="space-y-5">
    <div className="mf-inset space-y-3 p-4">
      <h2 className="text-lg font-semibold">One queue. A ZIP of finished images.</h2>
      <p className="text-sm text-muted-foreground">Up to 20 files, 25 MB each and 100 MB total. Images run one at a time on this device. Failed files stay in the list; originals are unchanged.</p>
      <Label htmlFor={`batch-${mode}-files`}>Add images</Label>
      <Input id={`batch-${mode}-files`} type="file" multiple accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml,.png,.jpg,.jpeg,.webp,.avif,.svg" disabled={busy || packing} onChange={event => { addFiles(event.target.files); event.target.value = ""; }} />
    </div>
    <fieldset disabled={busy || packing} className="grid gap-4 border border-border p-4 sm:grid-cols-2">
      <legend className="px-2 text-sm font-semibold">Apply to every image</legend>
      {mode !== "compress" && <div><Label htmlFor={`batch-${mode}-format`}>Output format</Label><select id={`batch-${mode}-format`} value={format} onChange={event => { setFormat(event.target.value as BrowserImageFormat); }} className="mt-2 h-11 w-full border border-input bg-card px-3">
        {["png", "jpeg", "webp", "avif", "svg"].map(value => <option key={value} value={value}>{value.toUpperCase()}</option>)}
      </select></div>}
      <div><Label htmlFor={`batch-${mode}-quality`}>Quality (1–100; JPEG/WebP/AVIF)</Label><Input id={`batch-${mode}-quality`} type="number" min="1" max="100" value={quality} onChange={event => { setQuality(event.target.value); }} className="mt-2" /></div>
      {mode === "resize" && <><div><Label htmlFor="batch-width">Batch width (px)</Label><Input id="batch-width" type="number" value={width} onChange={event => { setWidth(event.target.value); }} className="mt-2" /></div><div><Label htmlFor="batch-height">Batch height (px)</Label><Input id="batch-height" type="number" value={height} onChange={event => { setHeight(event.target.value); }} className="mt-2" /></div><p className="text-xs text-muted-foreground sm:col-span-2">Leave one dimension empty to preserve aspect ratio. With both set, artwork fits inside the requested size.</p></>}
    </fieldset>
    <p role="status" aria-live="polite" className="text-sm">{ready} of {items.length} ready{busy ? " · Processing…" : ""}</p>
    {items.length > 0 && <ul className="space-y-2">{items.map(item => <li key={item.id} className="flex flex-wrap items-center gap-3 border border-border bg-card p-3 text-sm">
      <div className="min-w-0 flex-1 basis-40"><p className="break-all font-semibold">{item.file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)} · {item.state}{item.result ? ` · ${item.width} × ${item.height} · ${item.filename?.split(".").pop()?.toUpperCase()} · ${formatFileSize(item.result.size)}` : ""}</p>{item.error && <p className="mt-1 text-danger">{item.error}</p>}</div>
      {item.result && <Button variant="outline" size="sm" disabled={packing} onClick={() => downloadBlob(item.result!, item.filename!, { kind: mode === "convert" ? "conversion" : "modification" })} aria-label={`Save ${item.file.name}`}>Save</Button>}
      <Button variant="ghost" size="sm" disabled={busy || packing} onClick={() => setItems(current => current.filter(entry => entry.id !== item.id))} aria-label={`Remove ${item.file.name}`}>Remove</Button>
    </li>)}</ul>}
    <div className="flex flex-wrap gap-2">
      <Button disabled={!items.length || busy || packing} onClick={() => void run()}>Process {items.length || "selected"} images</Button>
      {hasRun && items.some(item => item.state === "queued") && !busy && <Button variant="outline" disabled={packing} onClick={() => void run("resume")}>Resume remaining files</Button>}
      {items.some(item => item.state === "error") && <Button variant="outline" disabled={busy || packing} onClick={() => void run("retry")}>Retry failed files</Button>}
      {busy && <Button variant="outline" onClick={() => { cancelled.current = true; toast.info("Stopping after the current image. Finished results will remain available."); }}>Stop after this file</Button>}
      <Button variant="outline" disabled={!ready || busy || packing} onClick={() => void saveZip()}>{packing ? "Building ZIP…" : "Save finished images as ZIP"}</Button>
      <Button variant="ghost" disabled={!items.length || busy || packing} onClick={() => { setItems([]); setHasRun(false); originalSettings.current = null; }}>Clear batch</Button>
    </div>
    <p className="text-xs text-muted-foreground">Format, dimensions and quality are remembered on this device. Resume/retry uses the original batch settings; Process applies the current settings; completed files retain their displayed dimensions and format. Results remain in this tab until you leave the page or clear the batch. The ZIP includes a report of successes and failures. Browser image formats and device memory still apply.</p>
  </section>;
}
