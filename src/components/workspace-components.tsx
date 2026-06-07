import { AlertCircle, ArrowUpRight, CheckCircle2, Download, Loader2, RadioTower, ShieldCheck, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[min(100%-24px,1320px)] px-0 py-6 md:w-[min(100%-48px,1320px)] md:py-10">
      {children}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "local",
}: {
  children: ReactNode;
  tone?: "local" | "server" | "warning" | "success";
}) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em]",
      tone === "local" && "border-violet-200 bg-violet-50 text-violet-800",
      tone === "server" && "border-amber-200 bg-amber-50 text-amber-800",
      tone === "warning" && "border-yellow-200 bg-yellow-50 text-yellow-900",
      tone === "success" && "border-teal-200 bg-teal-50 text-teal-800",
    )}>
      {tone === "local" && <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />}
      {tone === "server" && <RadioTower className="mr-1.5 h-3.5 w-3.5" />}
      {tone === "success" && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

export function ToolCard({
  title,
  description,
  meta,
  icon,
  href,
}: {
  title: string;
  description: string;
  meta: string;
  icon: ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group grid min-h-44 grid-rows-[auto_1fr_auto] rounded-[18px] border border-border bg-white p-4 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_18px_48px_rgba(20,20,24,0.09)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-[#f8f8f5] text-violet-700">
          {icon}
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-700" />
      </div>
      <div className="mt-4">
        <h3 className="text-[17px] font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{meta}</p>
        <span className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.12)]" />
      </div>
    </a>
  );
}

export function UploadDropzone({
  title = "Drop a file here",
  description = "Processed locally in your browser. No upload required.",
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-border-strong bg-[#f8f8f5] p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-violet-700">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function SettingsPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] border border-border bg-white p-5 shadow-[var(--shadow-sm)]">
      <h2 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function PreviewPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] border border-border bg-white p-5 shadow-[var(--shadow-sm)]">
      <h2 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function OutputCard({
  title = "Export ready",
  description,
  children,
}: {
  title?: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-teal-200 bg-teal-50 p-5">
      <div className="mb-4 flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-teal-700" />
        <div>
          <h3 className="font-semibold tracking-tight text-teal-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-teal-800">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function ProcessingProgress({ label = "Processing on this device..." }: { label?: string }) {
  return (
    <div className="flex items-center rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="flex items-start rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertCircle className="mr-2 mt-0.5 h-4 w-4" />
      {message}
    </div>
  );
}

export function ExportButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button {...props}>
      <Download className="mr-2 h-4 w-4" />
      {children}
    </Button>
  );
}
