import Link from "next/link";
import { ArrowUpRight, MessageSquareText, ShieldCheck } from "lucide-react";
import { toolGroups } from "@/lib/tool-catalog";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-black bg-[#191a16] text-[#eee9dc] shadow-[0_8px_22px_rgba(0,0,0,.32)]">
      <div className="mx-auto flex h-[72px] w-[min(100%-24px,1440px)] items-center gap-4 md:w-[min(100%-48px,1440px)]">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="MediaForge home">
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-md border border-black bg-[linear-gradient(145deg,#3f4238,#1b1d18)] shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_3px_8px_rgba(0,0,0,.45)] overflow-hidden">
            <img src="/android-chrome-192x192.png" alt="MediaForge Logo" className="size-full object-cover" />
            <span className="mf-lamp absolute -right-1 -top-1" data-tone="amber" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="mf-display block truncate text-2xl font-semibold uppercase leading-none tracking-[0.015em] text-[#f3eddf]">
              MediaForge
            </span>
            <span className="mt-1 hidden font-mono text-[8px] font-semibold uppercase tracking-[0.22em] text-[#999b8f] sm:block">
              Mastering console / MF-24
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1.5 xl:flex" aria-label="Tool categories">
          {toolGroups.map((group) => (
            <Link
              key={group.key}
              href={`/#${group.id}`}
              className="mf-key flex h-9 items-center gap-2 px-3 text-xs font-semibold text-[#32342d]"
            >
              <span className="font-mono text-[8px] text-primary">{group.number}</span>
              {group.label.replace(" bench", "")}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <span className="hidden h-9 items-center rounded-sm border border-[#090a08] bg-[#292b25] px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#d4d8ca] shadow-[inset_0_2px_4px_rgba(0,0,0,.5),0_1px_0_rgba(255,255,255,.1)] md:inline-flex">
            <span className="mf-lamp mr-2" data-tone="green" aria-hidden="true" />
            <ShieldCheck className="mr-1.5 size-3.5" /> Local core
          </span>
          <Link
            href="/report"
            aria-label="Report a problem"
            className="mf-key mf-key-primary inline-flex h-9 items-center px-3 text-xs font-bold"
          >
            <MessageSquareText className="mr-2 size-3.5" />
            <span className="hidden sm:inline">Report</span>
            <ArrowUpRight className="ml-1.5 size-3" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <nav className="mf-scroll-rail overflow-x-auto border-t border-black bg-[#22241e] xl:hidden" aria-label="Tool categories">
        <div className="mx-auto flex min-w-max w-[min(100%-24px,1440px)] gap-1.5 py-2 md:w-[min(100%-48px,1440px)]">
          {toolGroups.map((group) => (
            <Link
              key={group.key}
              href={`/#${group.id}`}
              className="mf-key flex h-8 items-center gap-2 px-3 text-[11px] font-semibold text-[#32342d]"
            >
              <span className="font-mono text-[8px] text-primary">{group.number}</span>
              {group.label.replace(" bench", "")}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
