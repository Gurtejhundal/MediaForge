import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex flex-col space-y-4">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              MediaForge
            </span>
            <p className="text-sm text-muted-foreground">
              A modern, fast, and secure suite of media manipulation tools. Processed entirely local or server-side without arbitrary storage.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Tools</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/tools/png-to-favicon" className="hover:text-primary">PNG to Favicon</Link></li>
              <li><Link href="/tools/format-converter" className="hover:text-primary">Format Converter</Link></li>
              <li><Link href="/tools/resize" className="hover:text-primary">Image Resizer</Link></li>
              <li><Link href="/tools/compress" className="hover:text-primary">Image Compressor</Link></li>
              <li><Link href="/tools/video-to-image" className="hover:text-primary">Video to Image</Link></li>
              <li><Link href="/tools/video-downloader" className="hover:text-primary">URL Video Downloader</Link></li>
              <li><Link href="/tools/qr-generator" className="hover:text-primary">QR Generator</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border/40 pt-8 flex  items-center justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} MediaForge. All rights reserved.</p>
          <div className="flex space-x-4">
            <span>Fast Processing</span>
            <span>•</span>
            <span>No Uploads Stored</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
