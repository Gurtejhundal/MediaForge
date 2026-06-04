"use client";

import Link from "next/link";
import { Archive, Box, Eraser, FileText, Film, ImageDown, Layers, Link as LinkIcon, MonitorUp, QrCode, Scissors, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell, StatusPill, ToolCard } from "@/components/workspace-components";

const LOCAL_TOOLS = [
  {
    title: "Image modifier",
    description: "Resize, crop, rotate, watermark, compress, and convert from one browser-local pipeline.",
    meta: "PNG, JPG, WEBP, AVIF",
    href: "/tools/image-modifier",
    icon: <SlidersHorizontal className="h-5 w-5" />,
  },
  {
    title: "Favicon builder",
    description: "Generate favicon PNG sizes, ICO, Apple touch icon, manifest, and ZIP without uploading.",
    meta: "ICO, PNG, ZIP",
    href: "/tools/png-to-favicon",
    icon: <Box className="h-5 w-5" />,
  },
  {
    title: "QR generator",
    description: "Create QR codes from text or URLs and export PNG, JPEG, or SVG locally.",
    meta: "PNG, JPG, SVG",
    href: "/tools/qr-generator",
    icon: <QrCode className="h-5 w-5" />,
  },
  {
    title: "Frame extractor",
    description: "Open a local video, seek to a timestamp, and capture a still frame with Canvas.",
    meta: "PNG, JPG, WEBP",
    href: "/tools/video-to-image",
    icon: <ImageDown className="h-5 w-5" />,
  },
];

const SERVER_TOOLS = [
  {
    title: "Video downloader",
    description: "Fetch media from a public URL. This uses network/server assistance and is not local-only.",
    meta: "Network tool",
    href: "/tools/video-downloader",
    icon: <LinkIcon className="h-5 w-5" />,
  },
  {
    title: "Video converter",
    description: "Server-assisted video conversion for formats and audio extraction that need FFmpeg.",
    meta: "Server-assisted",
    href: "/tools/video-converter",
    icon: <Film className="h-5 w-5" />,
  },
  {
    title: "Video detail upscaler",
    description: "Server-assisted FFmpeg upscale and luma detail pass for larger video work.",
    meta: "Server-assisted",
    href: "/tools/video-upscaler",
    icon: <MonitorUp className="h-5 w-5" />,
  },
  {
    title: "Image detailer",
    description: "Server-assisted image enhancement and upscaling. It is not part of the no-upload guarantee.",
    meta: "Server-assisted",
    href: "/tools/image-enhancer",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Background remover",
    description: "Server-assisted background segmentation for images.",
    meta: "Server-assisted",
    href: "/tools/bg-remover",
    icon: <Eraser className="h-5 w-5" />,
  },
  {
    title: "Watermark remover",
    description: "Server-assisted video cleanup using FFmpeg processing.",
    meta: "Server-assisted",
    href: "/tools/watermark-remover",
    icon: <Eraser className="h-5 w-5" />,
  },
  {
    title: "Universal file converter",
    description: "Server-assisted document, data, and image conversion outside the browser-local core tools.",
    meta: "Server-assisted",
    href: "/tools/file-converter",
    icon: <Archive className="h-5 w-5" />,
  },
  {
    title: "PDF organizer",
    description: "Merge, split, rotate, watermark, number, and reorder PDFs through the app route.",
    meta: "Server-assisted",
    href: "/tools/pdf-organizer",
    icon: <FileText className="h-5 w-5" />,
  },
];

export default function Home() {
  return (
    <AppShell>
      <section className="grid gap-10 py-10 lg:grid-cols-[1fr_460px] lg:items-center lg:py-16">
        <div>
          <div className="mb-5 flex flex-wrap gap-2">
            <StatusPill>Local media toolkit</StatusPill>
            <StatusPill>No upload for core tools</StatusPill>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            Convert and export media without the clutter.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            MediaForge gives you one clean workspace for image conversion, favicon packages,
            compression, video frames, and QR codes. Core tools process files in your browser where supported.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/tools/image-modifier">
              <Button size="lg" className="h-11 px-5">Open workspace</Button>
            </Link>
            <Link href="#tools">
              <Button size="lg" variant="outline" className="h-11 px-5">View tools</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-5 shadow-[var(--shadow-md)]">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold">Workspace / Convert</span>
            </div>
            <StatusPill>Browser-only</StatusPill>
          </div>
          <div className="rounded-2xl border border-dashed bg-muted/40 p-5">
            <p className="font-medium">hero-image.png</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">2.4 MB - PNG to WEBP</p>
          </div>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl border bg-white p-3">
              <span className="text-sm text-muted-foreground">Quality</span>
              <span className="font-mono text-sm">82%</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 w-[82%] rounded-full bg-blue-600" />
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="text-sm font-semibold text-teal-950">Export ready</p>
              <p className="mt-1 font-mono text-xs text-teal-800">Generated locally - 742 KB</p>
            </div>
          </div>
        </div>
      </section>

      <section id="tools" className="space-y-10 py-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Local-first tools</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            These tools use File API, Canvas, Blob URLs, JSZip, and browser APIs. User files are not posted to MediaForge API routes.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {LOCAL_TOOLS.map((tool) => <ToolCard key={tool.href} {...tool} />)}
        </div>

        <div className="pt-8">
          <h2 className="text-2xl font-semibold tracking-tight">Server-assisted and network tools</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            These features may contact external services or process data outside the browser. They are not part of the no-upload promise.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SERVER_TOOLS.map((tool) => <ToolCard key={tool.href} {...tool} />)}
        </div>
      </section>

      <section className="my-10 grid gap-4 rounded-3xl border bg-white p-6 md:grid-cols-3">
        <div>
          <ShieldCheck className="mb-3 h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">No upload by default</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Core file operations generate local Blob outputs in the current browser session.</p>
        </div>
        <div>
          <Scissors className="mb-3 h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Precise controls</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Use direct format, quality, dimension, timestamp, and package settings.</p>
        </div>
        <div>
          <Archive className="mb-3 h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Honest limits</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Large videos and unsupported browser encoders are called out instead of hidden.</p>
        </div>
      </section>
    </AppShell>
  );
}
