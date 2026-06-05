import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container mx-auto px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col space-y-4">
            <span className="text-xl font-semibold tracking-tight text-foreground">MediaForge</span>
            <p className="text-sm leading-6 text-muted-foreground">
              A local-first media utility. Core image, QR, favicon, and frame tools run in the browser where supported.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Image</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/tools/image-modifier" className="hover:text-primary">Image Modifier</Link></li>
              <li><Link href="/tools/format-converter" className="hover:text-primary">Image Format Converter</Link></li>
              <li><Link href="/tools/resize" className="hover:text-primary">Image Resizer</Link></li>
              <li><Link href="/tools/compress" className="hover:text-primary">Image Compressor</Link></li>
              <li><Link href="/tools/png-to-favicon" className="hover:text-primary">Favicon Builder</Link></li>
              <li><Link href="/tools/bg-remover" className="hover:text-primary">Background Remover</Link></li>
              <li><Link href="/tools/image-enhancer" className="hover:text-primary">Image Detailer</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Video</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/tools/video-to-image" className="hover:text-primary">Frame Extractor</Link></li>
              <li><Link href="/tools/video-converter" className="hover:text-primary">Video Converter</Link></li>
              <li><Link href="/tools/video-upscaler" className="hover:text-primary">Video Upscaler</Link></li>
              <li><Link href="/tools/watermark-remover" className="hover:text-primary">Watermark Remover</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Docs and data</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/tools/pdf-organizer" className="hover:text-primary">PDF Organizer</Link></li>
              <li><Link href="/tools/file-converter" className="hover:text-primary">Universal File Converter</Link></li>
              <li><Link href="/tools/qr-generator" className="hover:text-primary">QR Generator</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Network</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/tools/video-downloader" className="hover:text-primary">Video Downloader</Link></li>
              <li><Link href="/report" className="hover:text-primary">Report a problem</Link></li>
            </ul>
            <p className="mt-3 max-w-xs text-xs leading-5 text-muted-foreground">
              URL download requires network access. Only download media you own or have permission to use.
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Creator</h3>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Built by{" "}
              <Link href="https://gurtejbirsingh.vercel.app/" className="font-semibold text-foreground hover:text-primary">
                Gurtejbir Singh
              </Link>
              , a creative developer from Amritsar focused on premium web experiences, frontend development, UI design, motion-led interfaces, and digital products.
            </p>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-border pt-8 text-xs text-muted-foreground">
          <p>(C) {new Date().getFullYear()} MediaForge. All rights reserved.</p>
          <div className="flex space-x-4">
            <span>Local processing by default</span>
            <span>/</span>
            <Link href="/report" className="hover:text-primary">Feedback</Link>
            <span>/</span>
            <span>Network tools marked clearly</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
