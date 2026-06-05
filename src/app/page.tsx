"use client";

import Link from "next/link";
import {
  Archive,
  Box,
  Download,
  Eraser,
  FileText,
  Film,
  ImageDown,
  Link as LinkIcon,
  MonitorUp,
  QrCode,
  Scissors,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell, StatusPill, ToolCard } from "@/components/workspace-components";

const IMAGE_TOOLS = [
  {
    title: "Image modifier",
    description: "Resize, crop, rotate, watermark, compress, and convert from one browser-local pipeline.",
    meta: "PNG, JPG, WEBP, AVIF",
    href: "/tools/image-modifier",
    icon: <SlidersHorizontal className="h-5 w-5" />,
  },
  {
    title: "Image format converter",
    description: "Convert images with browser-native Canvas export. No upload route is used.",
    meta: "PNG, JPG, WEBP, AVIF",
    href: "/tools/format-converter",
    icon: <Archive className="h-5 w-5" />,
  },
  {
    title: "Image resizer",
    description: "Resize images locally with dimension controls and direct Blob download.",
    meta: "Local Canvas",
    href: "/tools/resize",
    icon: <Scissors className="h-5 w-5" />,
  },
  {
    title: "Image compressor",
    description: "Compress images locally and compare original and output file sizes.",
    meta: "WEBP, local",
    href: "/tools/compress",
    icon: <Archive className="h-5 w-5" />,
  },
  {
    title: "Image detailer",
    description: "Upscale and apply a controlled local detail pass without changing color tone.",
    meta: "PNG, local",
    href: "/tools/image-enhancer",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Background remover",
    description: "Use an in-browser segmentation model to export transparent PNGs.",
    meta: "Local model",
    href: "/tools/bg-remover",
    icon: <Eraser className="h-5 w-5" />,
  },
  {
    title: "Favicon builder",
    description: "Generate favicon PNG sizes, ICO, Apple touch icon, manifest, and ZIP without uploading.",
    meta: "ICO, PNG, ZIP",
    href: "/tools/png-to-favicon",
    icon: <Box className="h-5 w-5" />,
  },
];

const VIDEO_TOOLS = [
  {
    title: "Frame extractor",
    description: "Open a local video, seek to a timestamp, and capture a still frame with Canvas.",
    meta: "PNG, JPG, WEBP",
    href: "/tools/video-to-image",
    icon: <ImageDown className="h-5 w-5" />,
  },
  {
    title: "Video converter",
    description: "Browser-native WebM export from local video files. No upload route is used.",
    meta: "WEBM",
    href: "/tools/video-converter",
    icon: <Film className="h-5 w-5" />,
  },
  {
    title: "Video detail upscaler",
    description: "Render a larger local WebM through browser canvas on this device.",
    meta: "WEBM, local",
    href: "/tools/video-upscaler",
    icon: <MonitorUp className="h-5 w-5" />,
  },
  {
    title: "Watermark remover",
    description: "Clean a selected video area locally and export a browser-generated WebM.",
    meta: "WEBM, local",
    href: "/tools/watermark-remover",
    icon: <Eraser className="h-5 w-5" />,
  },
];

const DOCUMENT_TOOLS = [
  {
    title: "PDF organizer",
    description: "Merge, split, rotate, watermark, number, and reorder PDFs in the browser.",
    meta: "PDF, ZIP",
    href: "/tools/pdf-organizer",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Universal file converter",
    description: "Convert structured data, Markdown, HTML, TXT, image formats, and PDF exports locally.",
    meta: "Docs, data",
    href: "/tools/file-converter",
    icon: <Archive className="h-5 w-5" />,
  },
  {
    title: "QR generator",
    description: "Create QR codes from text or URLs and export PNG, JPEG, or SVG locally.",
    meta: "PNG, JPG, SVG",
    href: "/tools/qr-generator",
    icon: <QrCode className="h-5 w-5" />,
  },
];

const NETWORK_TOOLS = [
  {
    title: "Video downloader",
    description: "Fetch media from a public URL. This is network-assisted and separate from local file tools.",
    meta: "Network tool",
    href: "/tools/video-downloader",
    icon: <LinkIcon className="h-5 w-5" />,
  },
];

const CLAIMS = [
  {
    title: "Unlimited local exports",
    description: "No app-side download quota for browser-generated files.",
    icon: <Download className="h-4 w-4" />,
  },
  {
    title: "No upload quota",
    description: "Local tools do not upload files, so there is no upload limit to hit.",
    icon: <UploadCloud className="h-4 w-4" />,
  },
  {
    title: "Runs on your device",
    description: "Actual limits are your browser, RAM, CPU, storage, and file format support.",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
];

function ToolSection({
  id,
  title,
  description,
  tools,
}: {
  id: string;
  title: string;
  description: string;
  tools: typeof IMAGE_TOOLS;
}) {
  return (
    <section id={id} className="space-y-4">
      <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <StatusPill>No upload</StatusPill>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => <ToolCard key={tool.href} {...tool} />)}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <AppShell>
      <section className="mf-rise border-b border-border pb-8 pt-4 text-center md:pb-10">
        <div className="mb-5 flex flex-wrap justify-center gap-2">
          <StatusPill>Local media toolkit</StatusPill>
          <StatusPill>Unlimited local exports</StatusPill>
          <StatusPill>No upload quota</StatusPill>
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
          Convert, modify, and export files locally.
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
          MediaForge gives you image, video, PDF, document, and QR tools that process files in your browser.
          Network features are separated clearly.
        </p>
        <div className="mt-7 flex justify-center">
          <Link href="#image-tools">
            <Button size="lg" className="h-11 px-6">Open workspace</Button>
          </Link>
        </div>
      </section>

      <section className="mf-rise mf-rise-delay-1 grid gap-4 py-8 md:grid-cols-3">
        {CLAIMS.map((claim) => (
          <div key={claim.title} className="mf-float rounded-2xl border border-purple-100 bg-white/88 p-5 shadow-[0_18px_45px_rgba(88,28,135,0.08)] backdrop-blur">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-purple-100 bg-white text-purple-700">
              {claim.icon}
            </div>
            <h2 className="font-semibold">{claim.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{claim.description}</p>
          </div>
        ))}
      </section>

      <nav aria-label="Tool categories" className="mf-rise mf-rise-delay-2 mb-8 flex flex-wrap justify-center gap-2 rounded-2xl border border-purple-100 bg-white/88 p-3 shadow-[0_18px_45px_rgba(88,28,135,0.08)] backdrop-blur">
        <a href="#image-tools" className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-purple-50 hover:text-purple-800">Image tools</a>
        <a href="#video-tools" className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-purple-50 hover:text-purple-800">Video tools</a>
        <a href="#document-tools" className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-purple-50 hover:text-purple-800">Docs and data</a>
        <a href="#network-tools" className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-purple-50 hover:text-purple-800">Network</a>
      </nav>

      <div className="mf-rise mf-rise-delay-2 space-y-14 pb-8">
        <ToolSection
          id="image-tools"
          title="Image Tools"
          description="Modify, resize, compress, upscale, remove backgrounds, convert formats, and build favicon packages locally."
          tools={IMAGE_TOOLS}
        />

        <ToolSection
          id="video-tools"
          title="Video Tools"
          description="Extract frames, export local WebM files, upscale through browser canvas, and soften selected regions without uploading."
          tools={VIDEO_TOOLS}
        />

        <ToolSection
          id="document-tools"
          title="Document And Data Tools"
          description="Organize PDFs, convert structured documents and text files, and generate QR codes in the browser."
          tools={DOCUMENT_TOOLS}
        />

        <section id="network-tools" className="space-y-4">
          <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Network Tools</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                These features contact external URLs by design. They are separate from local conversion and modification.
              </p>
            </div>
            <StatusPill tone="server">Network</StatusPill>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {NETWORK_TOOLS.map((tool) => <ToolCard key={tool.href} {...tool} />)}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
