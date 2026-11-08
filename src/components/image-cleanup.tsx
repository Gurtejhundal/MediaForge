"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Dropzone } from "@/components/upload/dropzone";
import { ImagePreview } from "@/components/preview/image-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useObjectUrlCleanup } from "@/hooks/use-object-url-cleanup";
import { downloadBlob, safeBaseName } from "@/lib/local-processing/blob-utils";
import { getImageDimensions, processImageLocally } from "@/lib/local-processing/image-processing";

export function ImageCleanup() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [edges, setEdges] = useState({ left: "0", top: "0", right: "0", bottom: "0" });
  const [output, setOutput] = useState<{ blob: Blob; url: string; width: number; height: number; filename: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useObjectUrlCleanup(source); useObjectUrlCleanup(output?.url ?? null);
  useEffect(() => () => { ++generation.current; }, []);
  function clear() { ++generation.current; setFile(null); setSource(null); setDimensions(null); setOutput(null); setBusy(false); }
  async function choose(next: File) {
    const id = ++generation.current;
    setFile(next); setSource(URL.createObjectURL(next)); setDimensions(null); setOutput(null); setBusy(false);
    try { const size = await getImageDimensions(next); if (generation.current === id) setDimensions(size); }
    catch (error) { if (generation.current === id) toast.error(error instanceof Error ? error.message : "Could not open this image."); }
  }
  async function crop() {
    if (!file || !dimensions) return;
    const left = Number(edges.left), top = Number(edges.top), right = Number(edges.right), bottom = Number(edges.bottom);
    if (Object.values(edges).some(value => value.trim() === "") || [left, top, right, bottom].some(value => !Number.isSafeInteger(value) || value < 0)
      || left + right >= dimensions.width || top + bottom >= dimensions.height || left + top + right + bottom === 0) {
      toast.error("Enter whole non-negative edge trims, leaving at least one pixel in each dimension. Trim at least one edge."); return;
    }
    const id = generation.current; setBusy(true);
    try {
      const result = await processImageLocally(file, { format: "png", crop: { left, top, width: dimensions.width - left - right, height: dimensions.height - top - bottom } });
      if (generation.current !== id) return;
      setOutput({ ...result, url: URL.createObjectURL(result.blob), filename: `cleaned-${safeBaseName(file.name)}.png` });
      toast.success("Cropped preview ready. Check the visible mark before saving.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not crop this image."); }
    finally { if (generation.current === id) setBusy(false); }
  }
  return <div className="space-y-5">
    <aside className="border border-border bg-card p-4 text-sm leading-6">
      <h2 className="font-semibold">Visible edge marks and invisible SynthID are different</h2>
      <p>Crop away a visible corner logo or edge watermark, including the Gemini sparkle, when it sits outside the image area you want to keep. This changes the composition and does not reconstruct covered pixels. Your original file is unchanged.</p>
      <p className="mt-2">This tool does not detect SynthID or verify its removal. Google embeds SynthID in the image pixels; cropping and re-encoding do not guarantee its removal. <a href="https://deepmind.google/models/synthid/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">About SynthID ↗</a></p>
    </aside>
    {!file ? <Dropzone onFileAccepted={next => void choose(next)} accept={{ "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"], "image/svg+xml": [".svg"] }} /> : <ImagePreview file={file} previewUrl={source!} onRemove={clear} />}
    {file && <fieldset disabled={!dimensions || busy} className="border border-border bg-card p-4">
      <legend className="px-2 font-semibold">Trim edges in original pixels</legend>
      <p role="status" className="mb-4 text-sm">{dimensions ? `Original: ${dimensions.width} × ${dimensions.height} px` : "Reading image dimensions…"}</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{(["left", "top", "right", "bottom"] as const).map(edge => <div key={edge}><Label htmlFor={`trim-${edge}`} className="capitalize">{edge} trim (px)</Label><Input id={`trim-${edge}`} type="number" min="0" value={edges[edge]} onChange={event => setEdges(current => ({ ...current, [edge]: event.target.value }))} className="mt-2" /></div>)}</div>
      <Button className="mt-4" onClick={() => void crop()}>{busy ? "Creating preview…" : "Create cropped preview"}</Button>
    </fieldset>}
    {output && <section className="mf-inset space-y-4 p-4" aria-label="Cropped image output">
      <h2 className="font-semibold">PNG preview · {output.width} × {output.height} px</h2>
      <img src={output.url} alt="Cropped image preview" className="mx-auto max-h-96 max-w-full object-contain" />
      <p className="text-xs text-muted-foreground">Inspect this preview before saving. Changed edge settings apply to the next preview. Invisible watermark status is unverified.</p>
      <Button onClick={() => downloadBlob(output.blob, output.filename, { kind: "modification" })}>Save cropped PNG</Button>
    </section>}
  </div>;
}
