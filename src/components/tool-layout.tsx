import { ReactNode } from "react";
import { Cpu, Download, ShieldCheck } from "lucide-react";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="mx-auto flex w-[min(100%-24px,1180px)] flex-1 flex-col px-0 py-7 md:w-[min(100%-48px,1180px)] md:py-10">
      <div className="mb-5 overflow-hidden rounded-[24px] border border-border bg-white shadow-[var(--shadow-sm)]">
        <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
          <div className="p-5 md:p-6">
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">
              Local workspace
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">{description}</p>
          </div>
          <div className="border-t border-border bg-[#f8f8f5] p-5 lg:border-l lg:border-t-0">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center text-muted-foreground"><ShieldCheck className="mr-2 h-4 w-4 text-violet-700" /> Privacy</span>
                <span className="font-mono text-xs font-semibold text-foreground">No upload</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center text-muted-foreground"><Cpu className="mr-2 h-4 w-4 text-violet-700" /> Runtime</span>
                <span className="font-mono text-xs font-semibold text-foreground">Browser</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center text-muted-foreground"><Download className="mr-2 h-4 w-4 text-violet-700" /> Export</span>
                <span className="font-mono text-xs font-semibold text-foreground">Blob URL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full rounded-[24px] border border-border bg-white p-5 shadow-[var(--shadow-sm)] md:p-6">
        {children}
      </div>
    </div>
  );
}
