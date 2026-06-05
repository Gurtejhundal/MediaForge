import { AlertCircle, CheckCircle2, Download, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-[min(100%-24px,1240px)] px-0 py-8 md:w-[min(100%-48px,1240px)] md:py-12">{children}</div>;
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
      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
      tone === "local" && "border-purple-200 bg-purple-50 text-purple-700",
      tone === "server" && "border-amber-200 bg-amber-50 text-amber-800",
      tone === "warning" && "border-orange-200 bg-orange-50 text-orange-800",
      tone === "success" && "border-teal-200 bg-teal-50 text-teal-700",
    )}>
      {tone === "local" && <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />}
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
    <a href={href} className="group block rounded-2xl border border-purple-100 bg-white/92 p-5 shadow-[0_14px_38px_rgba(88,28,135,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 hover:bg-purple-50/40 hover:shadow-[0_22px_55px_rgba(88,28,135,0.12)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-100 bg-white text-purple-700 transition-transform duration-300 group-hover:scale-105">
        {icon}
      </div>
      <h3 className="text-[17px] font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <p className="mt-4 font-mono text-xs text-muted-foreground">{meta}</p>
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
    <div className="rounded-2xl border border-dashed border-border-strong bg-muted/40 p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white text-purple-700">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function SettingsPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function PreviewPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
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
    <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
      <div className="mb-4 flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-teal-700" />
        <div>
          <h3 className="font-semibold text-teal-950">{title}</h3>
          <p className="mt-1 text-sm text-teal-800">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function ProcessingProgress({ label = "Processing on this device..." }: { label?: string }) {
  return (
    <div className="flex items-center rounded-xl border border-purple-100 bg-purple-50 p-3 text-sm text-purple-800">
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
