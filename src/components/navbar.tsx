import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Layers, ChevronDown, ImageIcon, Video, FileText, Sparkles, Box, FileType, Maximize, Download, Eraser, Film, Link as LinkIcon2, MonitorUp, QrCode, RefreshCw } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <Layers className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            MediaForge
          </span>
        </Link>
        
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {/* Image Tools Dropdown */}
          <div className="relative group py-4">
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <ImageIcon className="h-4 w-4" />
              <span>Image Tools</span>
              <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute left-0 top-full hidden group-hover:block w-72 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-lg backdrop-blur-xl">
                <Link href="/tools/image-enhancer" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-xs">Image Enhancer</div>
                    <div className="text-[10px] text-muted-foreground">Restore detail & make colors pop</div>
                  </div>
                </Link>
                <Link href="/tools/png-to-favicon" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Box className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-semibold text-xs">PNG to Favicon</div>
                    <div className="text-[10px] text-muted-foreground">Generate .ico package with one click</div>
                  </div>
                </Link>
                <Link href="/tools/format-converter" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <FileType className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-semibold text-xs">Format Converter</div>
                    <div className="text-[10px] text-muted-foreground">Convert image formats flawlessly</div>
                  </div>
                </Link>
                <Link href="/tools/resize" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Maximize className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-xs">Resizer</div>
                    <div className="text-[10px] text-muted-foreground">Resize dimensions with aspect ratio</div>
                  </div>
                </Link>
                <Link href="/tools/compress" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Download className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="font-semibold text-xs">Compressor</div>
                    <div className="text-[10px] text-muted-foreground">Reduce image size losslessly</div>
                  </div>
                </Link>
                <Link href="/tools/bg-remover" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Eraser className="h-4 w-4 text-rose-500" />
                  <div>
                    <div className="font-semibold text-xs">BG Remover</div>
                    <div className="text-[10px] text-muted-foreground">AI-powered background removal</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Video Tools Dropdown */}
          <div className="relative group py-4">
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <Video className="h-4 w-4" />
              <span>Video Tools</span>
              <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute left-0 top-full hidden group-hover:block w-72 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-lg backdrop-blur-xl">
                <Link href="/tools/video-converter" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <RefreshCw className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-xs">Video Converter</div>
                    <div className="text-[10px] text-muted-foreground">Convert to MP4, WebM, GIF, MP3, etc.</div>
                  </div>
                </Link>
                <Link href="/tools/video-upscaler" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <MonitorUp className="h-4 w-4 text-cyan-500" />
                  <div>
                    <div className="font-semibold text-xs">Video Upscaler</div>
                    <div className="text-[10px] text-muted-foreground">Upscale resolutions up to 4K</div>
                  </div>
                </Link>
                <Link href="/tools/video-to-image" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Film className="h-4 w-4 text-pink-500" />
                  <div>
                    <div className="font-semibold text-xs">Video to Image</div>
                    <div className="text-[10px] text-muted-foreground">Extract frames or create animated GIFs</div>
                  </div>
                </Link>
                <Link href="/tools/video-downloader" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <LinkIcon2 className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-xs">URL Downloader</div>
                    <div className="text-[10px] text-muted-foreground">Download videos from YouTube/links</div>
                  </div>
                </Link>
                <Link href="/tools/watermark-remover" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Eraser className="h-4 w-4 text-indigo-500" />
                  <div>
                    <div className="font-semibold text-xs">Watermark Remover</div>
                    <div className="text-[10px] text-muted-foreground">Remove logos & clean up videos</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Files Dropdown */}
          <div className="relative group py-4">
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <FileText className="h-4 w-4" />
              <span>Files</span>
              <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute left-0 top-full hidden group-hover:block w-72 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-lg backdrop-blur-xl">
                <Link href="/tools/file-converter" className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-semibold text-xs">File Converter</div>
                    <div className="text-[10px] text-muted-foreground">Convert CSV, JSON, Markdown, SVG, XML</div>
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

        <div className="flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
