"use client";

import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Box,
  Cpu,
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
    description: "Resize, crop, rotate, watermark, caption, compress, and convert from one browser-local surface.",
    meta: "PNG JPG WEBP AVIF",
    href: "/tools/image-modifier",
    icon: <SlidersHorizontal className="h-5 w-5" />,
  },
  {
    title: "Format converter",
    description: "Convert images through browser-native Canvas export without routing selected files to the server.",
    meta: "Canvas export",
    href: "/tools/format-converter",
    icon: <Archive className="h-5 w-5" />,
  },
  {
    title: "Image resizer",
    description: "Resize with precise dimensions and export directly from a local Blob URL.",
    meta: "Local resize",
    href: "/tools/resize",
    icon: <Scissors className="h-5 w-5" />,
  },
  {
    title: "Image compressor",
    description: "Compress and compare output size after browser-side encoding.",
    meta: "No upload",
    href: "/tools/compress",
    icon: <Archive className="h-5 w-5" />,
  },
  {
    title: "Image detailer",
    description: "Upscale and add a controlled detail pass while preserving color tone.",
    meta: "Color safe",
    href: "/tools/image-enhancer",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Background remover",
    description: "Run a browser-side segmentation model and export transparent PNGs.",
    meta: "Local model",
    href: "/tools/bg-remover",
    icon: <Eraser className="h-5 w-5" />,
  },
  {
    title: "Favicon builder",
    description: "Generate PNG sizes, ICO, manifest, Apple touch icon, and ZIP locally.",
    meta: "ICO PNG ZIP",
    href: "/tools/png-to-favicon",
    icon: <Box className="h-5 w-5" />,
  },
];

const VIDEO_TOOLS = [
  {
    title: "Frame extractor",
    description: "Open a local video, seek to a timestamp, and capture a still frame with Canvas.",
    meta: "PNG JPG WEBP",
    href: "/tools/video-to-image",
    icon: <ImageDown className="h-5 w-5" />,
  },
  {
    title: "Video converter",
    description: "Export local video to browser-native WebM without an upload route.",
    meta: "WEBM",
    href: "/tools/video-converter",
    icon: <Film className="h-5 w-5" />,
  },
  {
    title: "Video upscaler",
    description: "Render a larger WebM through browser Canvas and this device's CPU.",
    meta: "Canvas render",
    href: "/tools/video-upscaler",
    icon: <MonitorUp className="h-5 w-5" />,
  },
  {
    title: "Watermark remover",
    description: "Soften a selected video region locally and export a browser-generated WebM.",
    meta: "Area cleanup",
    href: "/tools/watermark-remover",
    icon: <Eraser className="h-5 w-5" />,
  },
];

const DOCUMENT_TOOLS = [
  {
    title: "PDF organizer",
    description: "Merge, split, rotate, watermark, number, and reorder PDFs in this browser.",
    meta: "PDF ZIP",
    href: "/tools/pdf-organizer",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Universal converter",
    description: "Convert images, structured data, Markdown, HTML, TXT, and PDF exports locally.",
    meta: "Docs data",
    href: "/tools/file-converter",
    icon: <Archive className="h-5 w-5" />,
  },
  {
    title: "QR generator",
    description: "Create QR codes from text or URLs and export PNG, JPEG, or SVG.",
    meta: "PNG JPG SVG",
    href: "/tools/qr-generator",
    icon: <QrCode className="h-5 w-5" />,
  },
];

const NETWORK_TOOLS = [
  {
    title: "Video downloader",
    description: "Fetch media from a public URL. This is network-assisted and separate from local file tools.",
    meta: "Network",
    href: "/tools/video-downloader",
    icon: <LinkIcon className="h-5 w-5" />,
  },
];

const contractSteps = [
  ["01", "Select file", "The browser receives the file from your device."],
  ["02", "Process locally", "Canvas, File API, models, and browser APIs do the work."],
  ["03", "Export Blob", "Output is generated in the tab as a local download."],
  ["04", "Clear session", "Temporary object URLs are session-bound and disposable."],
];

function WorkbenchPreview() {
  return (
    <div className="mf-scan-line rounded-[28px] border border-border bg-white p-4 shadow-[0_24px_70px_rgba(20,20,24,0.10)] md:p-5">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace / image detail</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">local-frame-04.png</h2>
        </div>
        <StatusPill>Browser only</StatusPill>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="rounded-[22px] border border-dashed border-border-strong bg-[#f8f8f5] p-5">
          <div className="flex h-40 items-center justify-center rounded-[18px] border border-border bg-white">
            <div className="text-center">
              <UploadCloud className="mx-auto h-8 w-8 text-violet-700" />
              <p className="mt-3 text-sm font-semibold">Drop source file</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">2.4 MB PNG</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {[
              ["Input", "File API"],
              ["Runtime", "Browser memory"],
              ["Output", "Blob download"],
            ].map(([label, value], index) => (
              <div key={label} className="relative rounded-2xl border border-border bg-white p-3">
                {index < 2 && <ArrowRight className="absolute -bottom-3 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rotate-90 rounded-full bg-white p-0.5 text-muted-foreground" />}
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] border border-border bg-[#fbfbf8] p-4">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Inspector</p>
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Detail pass</span>
                <span className="font-mono font-semibold">42%</span>
              </div>
              <div className="h-2 rounded-full bg-border">
                <div className="h-full w-[42%] rounded-full bg-violet-700" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-white p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Format</p>
                <p className="mt-1 font-semibold">PNG</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Color</p>
                <p className="mt-1 font-semibold">Preserved</p>
              </div>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-teal-900">
              <p className="font-semibold">Export ready</p>
              <p className="mt-1 text-xs leading-5 text-teal-800">Generated locally. No upload route used.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolSection({
  id,
  number,
  title,
  description,
  tools,
  tone = "local",
}: {
  id: string;
  number: string;
  title: string;
  description: string;
  tools: typeof IMAGE_TOOLS;
  tone?: "local" | "server";
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-[28px] border border-border bg-[#fbfbf8] p-4 md:p-5">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="border-b border-border pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{number}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
          <div className="mt-5">
            <StatusPill tone={tone}>{tone === "server" ? "Network" : "No upload"}</StatusPill>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => <ToolCard key={tool.href} {...tool} />)}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <AppShell>
      <section className="mf-rise grid min-h-[calc(100vh-7rem)] gap-6 pb-8 lg:grid-cols-[280px_1fr]">
        <aside className="order-2 rounded-[28px] border border-border bg-white p-4 shadow-[var(--shadow-sm)] lg:order-1 lg:self-start lg:sticky lg:top-24">
          <p className="px-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tool index</p>
          <nav className="mt-3 space-y-1">
            {[
              ["Image bench", "#image-tools", "07 tools"],
              ["Video bench", "#video-tools", "04 tools"],
              ["Docs and data", "#document-tools", "03 tools"],
              ["Network", "#network-tools", "01 tool"],
            ].map(([label, href, meta]) => (
              <a key={href} href={href} className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-violet-50 hover:text-violet-900">
                <span className="font-medium">{label}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{meta}</span>
              </a>
            ))}
          </nav>
          <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <ShieldCheck className="h-5 w-5 text-violet-800" />
            <p className="mt-3 text-sm font-semibold text-violet-950">Local-first boundary</p>
            <p className="mt-2 text-xs leading-5 text-violet-800">Core file tools process selected files in the browser. Network features are labelled separately.</p>
          </div>
        </aside>

        <div className="order-1 space-y-6 lg:order-2">
          <div className="rounded-[32px] border border-border bg-white p-5 shadow-[var(--shadow-sm)] md:p-7">
            <div className="mb-6 flex flex-wrap gap-2">
              <StatusPill>Local media toolkit</StatusPill>
              <StatusPill tone="success">Unlimited local exports</StatusPill>
              <StatusPill tone="warning">Device limits apply</StatusPill>
            </div>
            <div className="grid gap-7 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
              <div>
                <p className="mb-4 font-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-violet-700">Browser-powered file operations</p>
                <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.045em] text-foreground md:text-7xl">
                  A local export bench for media files.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  Convert, detail, resize, compress, package, extract, and organize files from one browser workspace. No cloud upload path for core tools.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="#image-tools">
                    <Button size="lg" className="h-11 px-5">Open workspace</Button>
                  </Link>
                  <Link href="/report">
                    <Button size="lg" variant="outline" className="h-11 px-5">Request a tool</Button>
                  </Link>
                </div>
              </div>
              <WorkbenchPreview />
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              { icon: <UploadCloud className="h-5 w-5" />, title: "No app-side upload quota", body: "Local tools do not upload files, so there is no server quota to hit." },
              { icon: <Cpu className="h-5 w-5" />, title: "Runs on this device", body: "Performance depends on browser, RAM, CPU, storage, and file support." },
              { icon: <Download className="h-5 w-5" />, title: "Direct download", body: "Outputs are generated as browser Blob downloads where supported." },
            ].map((claim) => (
              <div key={claim.title} className="rounded-[24px] border border-border bg-white p-5 shadow-[var(--shadow-sm)]">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-[#f8f8f5] text-violet-700">{claim.icon}</div>
                <h2 className="font-semibold tracking-tight">{claim.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{claim.body}</p>
              </div>
            ))}
          </section>
        </div>
      </section>

      <div className="mf-rise mf-rise-delay-1 space-y-5 pb-8">
        <ToolSection
          id="image-tools"
          number="01"
          title="Image bench"
          description="The highest-traffic file operations: modify, convert, resize, compress, detail, remove backgrounds, and ship favicon packages."
          tools={IMAGE_TOOLS}
        />

        <ToolSection
          id="video-tools"
          number="02"
          title="Video bench"
          description="Browser-native video operations for frames and WebM exports. Heavy jobs use this device's compute, so large files can be slow."
          tools={VIDEO_TOOLS}
        />

        <ToolSection
          id="document-tools"
          number="03"
          title="Docs and data"
          description="PDF organization, structured data conversion, text exports, and QR generation without uploading selected files."
          tools={DOCUMENT_TOOLS}
        />

        <ToolSection
          id="network-tools"
          number="04"
          title="Network boundary"
          description="URL download is different from local conversion because it contacts external services. It is isolated and labelled."
          tools={NETWORK_TOOLS}
          tone="server"
        />
      </div>

      <section className="mf-rise mf-rise-delay-2 mb-4 rounded-[32px] border border-border bg-[#141418] p-5 text-white shadow-[0_22px_70px_rgba(20,20,24,0.22)] md:p-7">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">Privacy contract</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">The file path is visible by design.</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              MediaForge earns trust by making the processing boundary obvious. Local tools keep files in the browser; network tools are marked before use.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {contractSteps.map(([step, title, body]) => (
              <div key={step} className="rounded-[22px] border border-white/12 bg-white/[0.06] p-4">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">{step}</p>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
