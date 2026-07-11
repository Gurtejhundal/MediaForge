import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Download,
  Loader2,
  RadioTower,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[min(100%-24px,1440px)] py-6 md:w-[min(100%-48px,1440px)] md:py-10">
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
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-sm border px-2.5 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.15em] shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_1px_2px_rgba(0,0,0,.25)]",
        tone === "local" && "border-[#20221d] bg-[#34362f] text-[#eee8db]",
        tone === "server" && "border-[#7c2a17] bg-primary text-primary-foreground",
        tone === "warning" && "border-warning/60 bg-[#3d321d] text-[#f0c675]",
        tone === "success" && "border-success/60 bg-[#253a28] text-[#b5d1ae]",
      )}
    >
      {tone === "local" && <ShieldCheck className="mr-1.5 size-3.5" />}
      {tone === "server" && <RadioTower className="mr-1.5 size-3.5" />}
      {tone === "success" && <CheckCircle2 className="mr-1.5 size-3.5" />}
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
    <Link
      href={href}
      className="mf-faceplate group grid min-h-40 grid-rows-[auto_1fr_auto] p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,.28)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="mf-inset flex size-9 items-center justify-center text-primary">{icon}</div>
        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="mt-5">
        <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-5 border-t border-border pt-3">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{meta}</p>
      </div>
    </Link>
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
    <div className="mf-inset p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="mf-key flex size-10 shrink-0 items-center justify-center text-primary">
          <UploadCloud className="size-5" />
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

function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("mf-faceplate overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-[#817d70] px-4 py-3">
        <h2 className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</h2>
        <span className="mf-lamp" />
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

export function SettingsPanel({ title, children }: { title: string; children: ReactNode }) {
  return <Panel title={title}>{children}</Panel>;
}

export function PreviewPanel({ title, children }: { title: string; children: ReactNode }) {
  return <Panel title={title}>{children}</Panel>;
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
    <div className="mf-faceplate border-success/60 p-5 shadow-[inset_4px_0_0_var(--success),var(--shadow-panel)]">
      <div className="mb-4 flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 text-success" />
        <div>
          <h3 className="font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function ProcessingProgress({ label = "Processing on this device..." }: { label?: string }) {
  return (
    <div className="flex items-center border border-primary/40 bg-primary/10 p-3 text-sm text-accent-foreground" role="status">
      <span className="mf-lamp mr-2" data-tone="amber" /><Loader2 className="mr-2 size-4 animate-spin text-primary" />
      {label}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="mf-inset flex items-start border-danger/60 bg-danger/10 p-3 text-sm text-danger" role="alert">
      <AlertCircle className="mr-2 mt-0.5 size-4" />
      {message}
    </div>
  );
}

export function ExportButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button {...props}>
      <Download className="mr-2 size-4" />
      {children}
    </Button>
  );
}
