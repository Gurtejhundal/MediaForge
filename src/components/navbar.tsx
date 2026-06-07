import Link from "next/link";
import { FileText, ImageIcon, Layers, MessageSquareText, RadioTower, ShieldCheck, Video } from "lucide-react";

const navItems = [
  { href: "/#image-tools", label: "Image", icon: ImageIcon },
  { href: "/#video-tools", label: "Video", icon: Video },
  { href: "/#document-tools", label: "Docs", icon: FileText },
  { href: "/#network-tools", label: "Network", icon: RadioTower },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-[#fbfbf8]/90 backdrop-blur supports-[backdrop-filter]:bg-[#fbfbf8]/82">
      <div className="mx-auto flex h-16 w-[min(100%-24px,1320px)] items-center gap-4 md:w-[min(100%-48px,1320px)]">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-violet-700 text-white shadow-[0_12px_28px_rgba(76,29,149,0.22)]">
            <Layers className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-semibold tracking-tight text-foreground">MediaForge</span>
            <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Local export bench
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center rounded-full border border-border bg-white p-1 shadow-[var(--shadow-sm)] lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-violet-50 hover:text-violet-800"
              >
                <Icon className="mr-1.5 h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link href="/report" className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-violet-200 hover:text-violet-800">
            <MessageSquareText className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Report</span>
          </Link>
          <span className="hidden items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-800 md:inline-flex">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            No upload
          </span>
        </div>
      </div>
    </header>
  );
}
