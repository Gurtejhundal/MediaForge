"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUnsavedWork } from "@/hooks/use-unsaved-work";
import { downloadBlob, safeBaseName } from "@/lib/local-processing/blob-utils";

type Result = { name: string; blob?: Blob; error?: string };

export function LocalGpuPanel() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [port, setPort] = useState("8765");
  const [status, setStatus] = useState("Not connected. Start the local companion on your NVIDIA computer first.");
  const [ready, setReady] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const stop = useRef(false);
  const mounted = useRef(true);
  useUnsavedWork(files.length > 0 || results.some(result => Boolean(result.blob)));
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop.current = true; }; }, []);

  function endpoint(path: string) {
    if (!/^\d{1,5}$/.test(port) || Number(port) < 1024 || Number(port) > 65535) throw new Error("Choose a local port between 1024 and 65535.");
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) throw new Error("Paste the current session token from your companion terminal.");
    return `http://127.0.0.1:${port}${path}`;
  }
  async function check() {
    setBusy(true); setReady(false);
    try {
      const response = await fetch(endpoint("/check"), { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000), cache: "no-store" });
      const result = await response.json();
      if (!response.ok || result.status !== "ready_for_trial") throw new Error(result.message || "The local CUDA engine is not ready.");
      setReady(true);
      setStatus(`${result.gpu} · ${(Number(result.gpu_free_bytes) / 1024 ** 3).toFixed(1)} GiB free. Engine ready for an experimental trial; model fit and SynthID status are unverified.`);
    } catch (error) { setStatus(error instanceof TypeError ? "Could not reach the local companion. Check its port/token, allowed app origin and your browser's local-network permission." : error instanceof Error ? error.message : "Connection failed."); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function run() {
    if (!ready || !consent || !files.length) return;
    if (results.some(result => result.blob) && !window.confirm("Start a new GPU batch? Save finished results first; this replaces the result list.")) return;
    stop.current = false; setBusy(true); setResults([]);
    let total = 0;
    try {
      for (const [index, file] of files.entries()) {
        if (stop.current || !mounted.current) break;
        setStatus(`Processing ${index + 1} of ${files.length} locally. This can take several minutes. SynthID status remains unverified.`);
        try {
          const response = await fetch(endpoint("/regenerate"), { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" }, body: file, signal: AbortSignal.timeout(920000), cache: "no-store" });
          if (!response.ok) { const result = await response.json(); throw new Error(result.message || "Local processing failed."); }
          if (!response.headers.get("Content-Type")?.startsWith("image/png")) throw new Error("The companion returned an invalid output type.");
          const blob = await response.blob();
          if (!blob.size || total + blob.size > 128 * 1024 * 1024) throw new Error("Outputs exceeded the 128 MB batch limit. Save completed files and use a smaller batch.");
          total += blob.size;
          if (mounted.current) setResults(current => [...current, { name: `${index + 1}-${safeBaseName(file.name)}-regenerated.png`, blob }]);
        } catch (error) {
          if (mounted.current) setResults(current => [...current, { name: file.name, error: error instanceof Error ? error.message : "Local processing failed." }]);
          stop.current = true; // Do not repeatedly retry a GPU/model failure.
        }
      }
      if (mounted.current) setStatus(stop.current ? "Stopped. Finished results remain available. SynthID status is unverified." : "Finished. Review image quality and check originals/results with Google's detector. SynthID status is unverified.");
    } finally { if (mounted.current) setBusy(false); }
  }

  return <details className="mt-8 border border-border bg-card p-4" aria-label="Experimental local GPU processing" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer font-semibold">Experimental invisible-watermark processing · Local NVIDIA GPU</summary>
    {open && <div className="mt-4 space-y-4 text-sm leading-6">
      <p>NVIDIA CUDA required. Plan for at least 12 GiB dedicated VRAM for initial trials; a verified minimum is unknown. The 4 GB RTX 3050 is unverified. Regeneration can change text, faces and detail and is not proof of SynthID removal.</p>
      <p>Install and start <code>services/invisible-watermarks/companion.py</code> on this computer using the separate GPU environment. For a local/desktop app, add <code>--origin</code> followed by this app&apos;s address origin. <a className="text-primary underline" href="https://github.com/Gurtejhundal/MediaForge/blob/main/docs/invisible-watermarks-local.md" target="_blank" rel="noopener noreferrer">Setup and limitations ↗</a></p>
      <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="gpu-port">Companion port</Label><Input id="gpu-port" inputMode="numeric" value={port} onChange={event => { setPort(event.target.value); setReady(false); }} /></div>
        <div><Label htmlFor="gpu-token">Session token (kept in this tab only)</Label><Input id="gpu-token" type="password" autoComplete="off" value={token} onChange={event => { setToken(event.target.value); setReady(false); }} /></div>
        <Button onClick={() => void check()}>Check local GPU connection</Button>
      </fieldset>
      <p role="status" aria-live="polite">{status}</p>
      <Label htmlFor="gpu-files">Select up to 20 local images (25 MB each, 100 MB combined)</Label>
      <Input id="gpu-files" type="file" multiple accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => {
        const selected = Array.from(event.target.files || []);
        setConsent(false);
        if (selected.length > 20 || selected.some(file => file.size > 25 * 1024 * 1024) || selected.reduce((bytes, file) => bytes + file.size, 0) > 100 * 1024 * 1024) { setStatus("Selection exceeds the 20-file / 25 MB each / 100 MB total limits."); event.target.value = ""; setFiles([]); return; }
        setFiles(selected);
      }} />
      <label className="flex min-h-11 items-start gap-3"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} className="mt-1.5" /><span>I understand these images go only to my local companion, model weights may download, pixels can change, and SynthID removal is unverified.</span></label>
      <div className="flex flex-wrap gap-3"><Button disabled={!ready || !consent || !files.length || busy} onClick={() => void run()}>Regenerate selected images locally</Button>{busy && <Button variant="outline" onClick={() => { stop.current = true; setStatus("Stopping after the current image. Its bounded local GPU job continues until completion or timeout."); }}>Stop after current image</Button>}</div>
      {results.length > 0 && <ul className="space-y-3" aria-label="GPU results">{results.map((result, index) => <li key={index} className="border border-border p-3"><p className="break-all font-semibold">{result.name}</p>{result.error ? <p role="alert">{result.error}</p> : <><p>Regenerated · SynthID unverified</p><Button variant="outline" onClick={() => downloadBlob(result.blob!, result.name, { kind: "modification" })}>Save regenerated PNG</Button></>}</li>)}</ul>}
    </div>}
  </details>;
}
