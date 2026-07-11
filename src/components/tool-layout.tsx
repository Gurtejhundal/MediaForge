"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Cpu, Download, RadioTower, ShieldCheck } from "lucide-react";
import { ToolDock } from "@/components/tool-dock";
import { getToolByHref, tools, type ToolProcessingMode } from "@/lib/tool-catalog";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  mode?: ToolProcessingMode;
}

const scopeCopy: Record<ToolProcessingMode, {
  eyebrow: string;
  summary: string;
  rows: Array<{ label: string; value: string; icon: typeof ShieldCheck }>;
}> = {
  local: {
    eyebrow: "Local signal path",
    summary: "Selected files remain inside this browser session.",
    rows: [
      { label: "File boundary", value: "On this device", icon: ShieldCheck },
      { label: "Runtime", value: "Browser", icon: Cpu },
      { label: "Output", value: "Local Blob", icon: Download },
    ],
  },
  "model-local": {
    eyebrow: "On-device model path",
    summary: "The model may download once; the selected file stays local.",
    rows: [
      { label: "File boundary", value: "On this device", icon: ShieldCheck },
      { label: "Runtime", value: "Browser + model", icon: Cpu },
      { label: "Model assets", value: "First-run fetch", icon: Download },
    ],
  },
  network: {
    eyebrow: "Network signal path",
    summary: "This route contacts a server or external source by design.",
    rows: [
      { label: "Data boundary", value: "Network request", icon: RadioTower },
      { label: "Runtime", value: "Server-assisted", icon: Cpu },
      { label: "Output", value: "Stream / Blob", icon: Download },
    ],
  },
};

export function ToolLayout({ title, description, children, mode = "local" }: ToolLayoutProps) {
  const pathname = usePathname();
  const tool = getToolByHref(pathname);
  const documentTitle = tool?.title ?? title;
  const scope = scopeCopy[mode];
  const rackNumber = tool ? String(tools.findIndex((item) => item.href === tool.href) + 1).padStart(2, "0") : "00";

  useEffect(() => {
    window.document.title = `${documentTitle} | MediaForge`;
  }, [documentTitle]);

  return (
    <div className="mx-auto flex w-[min(100%-24px,1440px)] flex-1 flex-col py-6 md:w-[min(100%-48px,1440px)] md:py-10">
      <div className="mf-chassis p-3 sm:p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-4 px-3 py-1 text-[#909287]">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em]">MediaForge rack unit / {rackNumber}</p>
          <p className="flex items-center font-mono text-[8px] uppercase tracking-[0.14em]">
            {mode === "network" ? "Network armed" : "Local path ready"}
            <span className="mf-lamp ml-2" data-tone={mode === "network" ? "amber" : "green"} />
          </p>
        </div>

        <header className="mf-faceplate overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="relative p-6 sm:p-8 md:p-10">
              <div className="mf-proof-grid pointer-events-none absolute inset-0 opacity-25" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="mf-rack-label px-3 py-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.18em]">Operation {rackNumber}</span>
                  <span className="mf-engraved font-mono text-[8px] font-semibold uppercase tracking-[0.18em]">{scope.eyebrow}</span>
                </div>
                <h1 className="mf-display mt-7 max-w-4xl text-5xl font-semibold uppercase leading-[0.86] tracking-[-0.02em] sm:text-6xl md:text-7xl">{title}</h1>
                <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-muted-foreground md:text-base">{description}</p>
              </div>
            </div>

            <aside className="border-t border-[#706c61] bg-[#34362f] p-5 text-[#eee8db] lg:border-l lg:border-t-0 md:p-7">
              <div className="flex items-center justify-between gap-4 border-b border-[#5a5c52] pb-4">
                <div>
                  <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-[#aeb1a4]">Boundary monitor</p>
                  <p className="mt-2 text-sm font-semibold text-[#e6e0d3]">{scope.summary}</p>
                </div>
                <span className="mf-lamp" data-tone={mode === "network" ? "amber" : "green"} />
              </div>
              <dl className="mt-4 space-y-2">
                {scope.rows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-center justify-between gap-4 rounded-sm border border-black bg-[#20221d] px-3 py-2.5 shadow-[inset_0_2px_4px_rgba(0,0,0,.48)]">
                      <dt className="flex items-center text-xs text-[#aeb1a4]">
                        <Icon className="mr-2 size-3.5 text-[#e3a438]" aria-hidden="true" />{row.label}
                      </dt>
                      <dd className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[#e8e2d5]">{row.value}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mf-meter-track mt-5 h-2 p-px" aria-hidden="true"><div className="mf-meter-fill mf-flow-line w-full" /></div>
            </aside>
          </div>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-[282px_minmax(0,1fr)]">
          <ToolDock />
          <section className="mf-faceplate min-w-0 p-4 md:p-6" aria-label={`${title} workspace`}>
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
