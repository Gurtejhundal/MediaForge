import Link from "next/link";
import { Layers, RadioTower, ShieldCheck } from "lucide-react";

const groups = [
  {
    title: "Image bench",
    links: [
      ["Image modifier", "/tools/image-modifier"],
      ["Format converter", "/tools/format-converter"],
      ["Resize", "/tools/resize"],
      ["Compress", "/tools/compress"],
      ["Favicon builder", "/tools/png-to-favicon"],
      ["Background remover", "/tools/bg-remover"],
      ["Image detailer", "/tools/image-enhancer"],
    ],
  },
  {
    title: "Video bench",
    links: [
      ["Frame extractor", "/tools/video-to-image"],
      ["Video converter", "/tools/video-converter"],
      ["Video upscaler", "/tools/video-upscaler"],
      ["Watermark remover", "/tools/watermark-remover"],
    ],
  },
  {
    title: "Documents",
    links: [
      ["PDF organizer", "/tools/pdf-organizer"],
      ["Universal converter", "/tools/file-converter"],
      ["QR generator", "/tools/qr-generator"],
    ],
  },
  {
    title: "Network",
    links: [
      ["Video downloader", "/tools/video-downloader"],
      ["Report a problem", "/report"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#fbfbf8]">
      <div className="mx-auto w-[min(100%-24px,1320px)] py-8 md:w-[min(100%-48px,1320px)] md:py-10">
        <div className="grid gap-8 rounded-[24px] border border-border bg-white p-5 shadow-[var(--shadow-sm)] md:p-6 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-700 text-white">
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <span className="block text-lg font-semibold tracking-tight text-foreground">MediaForge</span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Local media operations</span>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
              Core image, video frame, QR, favicon, PDF, and document tools process selected files in the browser where supported.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-800">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Files stay local
              </span>
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                <RadioTower className="mr-1.5 h-3.5 w-3.5" />
                Network marked
              </span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{group.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {group.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="hover:text-violet-800">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-4 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>(C) {new Date().getFullYear()} MediaForge. All rights reserved.</p>
          <p>
            Built by{" "}
            <Link href="https://gurtejbirsingh.vercel.app/" className="font-semibold text-foreground hover:text-violet-800">
              Gurtejbir Singh
            </Link>
            . Feedback goes through the network report flow.
          </p>
        </div>
      </div>
    </footer>
  );
}
