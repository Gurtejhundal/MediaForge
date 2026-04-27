import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Layers } from "lucide-react";

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
          <Link href="/tools/png-to-favicon" className="transition-colors hover:text-primary">
            Favicon Generator
          </Link>
          <Link href="/tools/format-converter" className="transition-colors hover:text-primary">
            Format Converter
          </Link>
          <Link href="/tools/image-enhancer" className="transition-colors hover:text-primary">
            Image Enhancer
          </Link>
          <Link href="/tools/resize" className="transition-colors hover:text-primary">
            Resizer
          </Link>
          <Link href="/tools/compress" className="transition-colors hover:text-primary">
            Compressor
          </Link>
          <Link href="/tools/video-upscaler" className="transition-colors hover:text-primary">
            Video Upscaler
          </Link>
          <Link href="/tools/bg-remover" className="transition-colors hover:text-primary">
            BG Remover
          </Link>
          <Link href="/tools/video-to-image" className="transition-colors hover:text-primary">
            Video to Image
          </Link>
          <Link href="/tools/video-downloader" className="transition-colors hover:text-primary">
            URL Downloader
          </Link>
          <Link href="/tools/watermark-remover" className="transition-colors hover:text-primary">
            Watermark Remover
          </Link>
          <Link href="/tools/qr-generator" className="transition-colors hover:text-primary">
            QR Generator
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
