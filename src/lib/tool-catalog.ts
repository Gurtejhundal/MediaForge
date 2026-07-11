import type { LucideIcon } from "lucide-react";
import {
  Archive,
  AudioWaveform,
  DownloadCloud,
  Eraser,
  FileText,
  Film,
  ImageDown,
  ImageIcon,
  Minimize2,
  MonitorUp,
  Music,
  Package,
  QrCode,
  RadioTower,
  RefreshCw,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Video,
} from "lucide-react";

export type ToolProcessingMode = "local" | "model-local" | "network";
export type ToolGroupKey = "image" | "video" | "audio" | "documents" | "network";

export interface ToolDefinition {
  title: string;
  description: string;
  meta: string;
  href: string;
  icon: LucideIcon;
  processingMode: ToolProcessingMode;
}

export interface ToolGroup {
  key: ToolGroupKey;
  id: string;
  number: string;
  label: string;
  description: string;
  meta: string;
  icon: LucideIcon;
  tools: readonly ToolDefinition[];
}

export const toolGroups = [
  {
    key: "image",
    id: "image-tools",
    number: "01",
    label: "Image bench",
    description: "Modify, convert, resize, clean, and package still images.",
    meta: "07 operations",
    icon: ImageIcon,
    tools: [
      {
        title: "Image modifier",
        description: "Resize, crop, rotate, watermark, caption, compress, and convert.",
        meta: "PNG · JPG · WEBP · AVIF",
        href: "/tools/image-modifier",
        icon: SlidersHorizontal,
        processingMode: "local",
      },
      {
        title: "Format converter",
        description: "Convert browser-decodable images through local Canvas export.",
        meta: "Canvas export",
        href: "/tools/format-converter",
        icon: RefreshCw,
        processingMode: "local",
      },
      {
        title: "Image resizer",
        description: "Set precise dimensions and export a locally generated PNG.",
        meta: "Local resize",
        href: "/tools/resize",
        icon: Scissors,
        processingMode: "local",
      },
      {
        title: "Image compressor",
        description: "Control quality and compare source and output file sizes.",
        meta: "WEBP",
        href: "/tools/compress",
        icon: Minimize2,
        processingMode: "local",
      },
      {
        title: "Image detailer",
        description: "Upscale and apply a controlled, color-safe detail pass.",
        meta: "2× · 4K · PNG",
        href: "/tools/image-enhancer",
        icon: Sparkles,
        processingMode: "local",
      },
      {
        title: "Background remover",
        description: "Run local segmentation and export a cleaned transparent PNG.",
        meta: "Local model · PNG",
        href: "/tools/bg-remover",
        icon: Eraser,
        processingMode: "model-local",
      },
      {
        title: "Favicon builder",
        description: "Generate deployable favicon sizes, manifest, ICO, and ZIP.",
        meta: "ICO · PNG · ZIP",
        href: "/tools/png-to-favicon",
        icon: Package,
        processingMode: "local",
      },
    ],
  },
  {
    key: "video",
    id: "video-tools",
    number: "02",
    label: "Video bench",
    description: "Extract frames, convert, upscale, and clean selected regions.",
    meta: "04 operations",
    icon: Video,
    tools: [
      {
        title: "Frame extractor",
        description: "Sample the whole video and package every frame in a ZIP.",
        meta: "ZIP · PNG · JPG · WEBP",
        href: "/tools/video-to-image",
        icon: ImageDown,
        processingMode: "local",
      },
      {
        title: "Video converter",
        description: "Render browser-playable video as a local WebM export.",
        meta: "WEBM",
        href: "/tools/video-converter",
        icon: Film,
        processingMode: "local",
      },
      {
        title: "Video upscaler",
        description: "Render a larger WebM with fixed-frame browser timing.",
        meta: "1080P · 1440P · 4K",
        href: "/tools/video-upscaler",
        icon: MonitorUp,
        processingMode: "local",
      },
      {
        title: "Watermark remover",
        description: "Soften a selected video region frame by frame.",
        meta: "Selected region · WEBM",
        href: "/tools/watermark-remover",
        icon: Eraser,
        processingMode: "local",
      },
    ],
  },
  {
    key: "audio",
    id: "audio-tools",
    number: "03",
    label: "Audio bench",
    description: "Convert, extract, trim, merge, normalize, and reshape audio.",
    meta: "02 routes",
    icon: AudioWaveform,
    tools: [
      {
        title: "Audio Studio",
        description: "Run eight browser-decoded audio operations from one surface.",
        meta: "WAV · 8 modes",
        href: "/tools/audio-studio",
        icon: AudioWaveform,
        processingMode: "local",
      },
      {
        title: "Video to Audio",
        description: "Extract a browser-supported video soundtrack as WAV.",
        meta: "Video audio · WAV",
        href: "/tools/video-to-audio",
        icon: Music,
        processingMode: "local",
      },
    ],
  },
  {
    key: "documents",
    id: "document-tools",
    number: "04",
    label: "Docs and data",
    description: "Organize PDFs, convert structured files, and generate QR output.",
    meta: "03 operations",
    icon: FileText,
    tools: [
      {
        title: "PDF organizer",
        description: "Merge, split, reorder, optimize, edit, sign, and convert PDFs.",
        meta: "PDF · ZIP",
        href: "/tools/pdf-organizer",
        icon: FileText,
        processingMode: "local",
      },
      {
        title: "Universal converter",
        description: "Convert images, structured data, Markdown, HTML, and text.",
        meta: "Images · Docs · Data",
        href: "/tools/file-converter",
        icon: Archive,
        processingMode: "local",
      },
      {
        title: "QR generator",
        description: "Create configurable QR codes from text or URLs.",
        meta: "PNG · JPG · SVG",
        href: "/tools/qr-generator",
        icon: QrCode,
        processingMode: "local",
      },
    ],
  },
  {
    key: "network",
    id: "network-tools",
    number: "05",
    label: "Network boundary",
    description: "Fetch permitted media from public URLs through a network route.",
    meta: "01 network tool",
    icon: RadioTower,
    tools: [
      {
        title: "Video downloader",
        description: "Fetch YouTube or direct media that you have permission to save.",
        meta: "YouTube · Direct media",
        href: "/tools/video-downloader",
        icon: DownloadCloud,
        processingMode: "network",
      },
    ],
  },
] as const satisfies readonly ToolGroup[];

export const tools: readonly ToolDefinition[] = toolGroups.flatMap<ToolDefinition>((group) => group.tools);

export const toolByHref: ReadonlyMap<string, ToolDefinition> = new Map(
  tools.map((tool) => [tool.href, tool]),
);

export function getToolByHref(href: string) {
  return toolByHref.get(href);
}
