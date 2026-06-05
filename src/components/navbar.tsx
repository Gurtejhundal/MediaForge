import Link from "next/link";
import { Layers, ChevronDown, ImageIcon, Video, FileText, Sparkles, Box, Eraser, Film, Link as LinkIcon2, MonitorUp, QrCode, RefreshCw, SlidersHorizontal, Files, ShieldCheck } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-700 text-white shadow-[0_10px_25px_rgba(88,28,135,0.22)]">
            <Layers className="h-4 w-4" />
          </span>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            MediaForge
          </span>
        </Link>
        
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {/* Image Tools Dropdown */}
          <div className="relative group py-4">
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ImageIcon className="h-4 w-4" />
              <span>Image Tools</span>
              <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute left-0 top-full hidden group-hover:block w-72 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-lg">
                <Link href="/tools/image-modifier" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <SlidersHorizontal className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="font-semibold text-xs">Image Modifier</div>
                    <div className="text-[10px] text-muted-foreground">Local resize, crop, rotate, convert</div>
                  </div>
                </Link>
                <Link href="/tools/image-enhancer" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-xs">Image Detailer</div>
                    <div className="text-[10px] text-muted-foreground">4K detail upscale, color-safe</div>
                  </div>
                </Link>
                <Link href="/tools/png-to-favicon" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Box className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-semibold text-xs">PNG to Favicon</div>
                    <div className="text-[10px] text-muted-foreground">Generate .ico package with one click</div>
                  </div>
                </Link>
                <Link href="/tools/bg-remover" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Eraser className="h-4 w-4 text-rose-500" />
                  <div>
                    <div className="font-semibold text-xs">BG Remover</div>
                    <div className="text-[10px] text-muted-foreground">Local browser model</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Video Tools Dropdown */}
          <div className="relative group py-4">
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Video className="h-4 w-4" />
              <span>Video Tools</span>
              <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute left-0 top-full hidden group-hover:block w-72 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-lg">
                <Link href="/tools/video-converter" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <RefreshCw className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-xs">Video Converter</div>
                    <div className="text-[10px] text-muted-foreground">Local WebM export</div>
                  </div>
                </Link>
                <Link href="/tools/video-upscaler" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <MonitorUp className="h-4 w-4 text-cyan-500" />
                  <div>
                    <div className="font-semibold text-xs">Video Upscaler</div>
                    <div className="text-[10px] text-muted-foreground">Local canvas upscale</div>
                  </div>
                </Link>
                <Link href="/tools/video-to-image" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Film className="h-4 w-4 text-pink-500" />
                  <div>
                    <div className="font-semibold text-xs">Frame Extractor</div>
                    <div className="text-[10px] text-muted-foreground">Local still-frame capture</div>
                  </div>
                </Link>
                <Link href="/tools/video-downloader" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <LinkIcon2 className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-xs">URL Downloader</div>
                    <div className="text-[10px] text-muted-foreground">Network download</div>
                  </div>
                </Link>
                <Link href="/tools/watermark-remover" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Eraser className="h-4 w-4 text-indigo-500" />
                  <div>
                    <div className="font-semibold text-xs">Watermark Remover</div>
                    <div className="text-[10px] text-muted-foreground">Local selected-area cleanup</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Files Dropdown */}
          <div className="relative group py-4">
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <FileText className="h-4 w-4" />
              <span>Files</span>
              <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute left-0 top-full hidden group-hover:block w-72 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-lg">
                <Link href="/tools/pdf-organizer" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Files className="h-4 w-4 text-rose-500" />
                  <div>
                    <div className="font-semibold text-xs">PDF Organizer</div>
                    <div className="text-[10px] text-muted-foreground">Merge, split, rotate, watermark, number</div>
                  </div>
                </Link>
                <Link href="/tools/file-converter" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <RefreshCw className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="font-semibold text-xs">File Converter</div>
                    <div className="text-[10px] text-muted-foreground">Local docs and data conversion</div>
                  </div>
                </Link>
                <Link href="/tools/qr-generator" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <QrCode className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-xs">QR Generator</div>
                    <div className="text-[10px] text-muted-foreground">Generate custom, high-quality QR codes</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Local-first
          </span>
          <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground">
            Light
          </span>
        </div>
      </div>
    </header>
  );
}
