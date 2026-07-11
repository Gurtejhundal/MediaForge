"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Cpu,
  Download,
  Gauge,
  HardDrive,
  RadioTower,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AppShell } from "@/components/workspace-components";
import { formatFileSize } from "@/lib/local-processing/blob-utils";
import {
  readLocalActivityStats,
  subscribeLocalActivity,
  type LocalActivityStats,
} from "@/lib/local-processing/activity-stats";
import { toolGroups, tools, type ToolProcessingMode } from "@/lib/tool-catalog";
import { cn } from "@/lib/utils";

const emptyActivityStats: LocalActivityStats = {
  totalExports: 0,
  conversions: 0,
  modifiedFiles: 0,
  generatedFiles: 0,
  extractedFiles: 0,
  documentExports: 0,
  videoExports: 0,
  bytesExported: 0,
  lastFilename: null,
  lastUpdatedAt: null,
};

interface BrowserResourceStats {
  heapUsedLabel: string;
  heapPercent: number;
  storageUsedLabel: string;
  storagePercent: number;
  cpuThreads: string;
  deviceMemoryLabel: string;
}

const emptyResourceStats: BrowserResourceStats = {
  heapUsedLabel: "Hidden",
  heapPercent: 0,
  storageUsedLabel: "Checking",
  storagePercent: 0,
  cpuThreads: "Unknown",
  deviceMemoryLabel: "Hidden",
};

type PerformanceWithMemory = Performance & {
  memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
};

type NavigatorWithDeviceMemory = Navigator & { deviceMemory?: number };

function getPercent(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

async function readBrowserResourceStats(): Promise<BrowserResourceStats> {
  if (typeof window === "undefined") return emptyResourceStats;

  const performanceWithMemory = window.performance as PerformanceWithMemory;
  const navigatorWithMemory = window.navigator as NavigatorWithDeviceMemory;
  const heap = performanceWithMemory.memory;
  const storageEstimate = await window.navigator.storage?.estimate?.();
  const usage = storageEstimate?.usage || 0;
  const quota = storageEstimate?.quota || 0;

  return {
    heapUsedLabel: heap ? formatFileSize(heap.usedJSHeapSize, 1) : "Hidden",
    heapPercent: heap ? getPercent(heap.usedJSHeapSize, heap.jsHeapSizeLimit) : 0,
    storageUsedLabel: quota ? formatFileSize(usage, 1) : "Unavailable",
    storagePercent: quota ? getPercent(usage, quota) : 0,
    cpuThreads: window.navigator.hardwareConcurrency ? `${window.navigator.hardwareConcurrency}` : "Unknown",
    deviceMemoryLabel: navigatorWithMemory.deviceMemory ? `${navigatorWithMemory.deviceMemory} GB hint` : "Hidden",
  };
}

function useWorkbenchMeters() {
  const [activityStats, setActivityStats] = useState<LocalActivityStats>(emptyActivityStats);
  const [resourceStats, setResourceStats] = useState<BrowserResourceStats>(emptyResourceStats);

  useEffect(() => {
    let active = true;
    const refreshResources = async () => {
      const nextStats = await readBrowserResourceStats();
      if (active) setResourceStats(nextStats);
    };
    const initialTimer = window.setTimeout(() => {
      if (active) setActivityStats(readLocalActivityStats());
    }, 0);
    const unsubscribe = subscribeLocalActivity(setActivityStats);
    const interval = window.setInterval(refreshResources, 5000);
    void refreshResources();

    return () => {
      active = false;
      unsubscribe();
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);

  return { activityStats, resourceStats };
}

function Meter({ icon, label, value, percent }: { icon: ReactNode; label: string; value: string; percent: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center text-[#9da68f]">{icon}{label}</span>
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#d7dec8]">{value}</span>
      </div>
      <div className="mf-meter-track h-2.5 p-px">
        <div className="mf-meter-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function SessionPanel() {
  const { activityStats, resourceStats } = useWorkbenchMeters();
  const processedCount = activityStats.conversions
    + activityStats.modifiedFiles
    + activityStats.generatedFiles
    + activityStats.extractedFiles
    + activityStats.documentExports
    + activityStats.videoExports;

  return (
    <aside className="border-t border-[#69675d] p-4 sm:p-6 lg:border-l lg:border-t-0">
      <div className="mf-screen h-full min-h-[410px] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-[#3c4738] pb-5">
          <div>
            <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-[#92a77b]">Live browser telemetry</p>
            <h2 className="mf-display mt-2 text-3xl font-semibold uppercase leading-none text-[#d9e2c9]">Session monitor</h2>
          </div>
          <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.14em] text-[#87927b]">
            Active <span className="mf-lamp" data-tone="green" title="Browser runtime active" />
          </div>
        </div>

        <dl className="grid grid-cols-2 border-b border-[#3c4738]">
          {[
            ["Exports", activityStats.totalExports],
            ["Processed", processedCount],
            ["Bytes out", formatFileSize(activityStats.bytesExported, 1)],
            ["CPU threads", resourceStats.cpuThreads],
          ].map(([label, value], index) => (
            <div key={label} className={cn("py-5", index % 2 === 0 ? "border-r border-[#3c4738] pr-4" : "pl-4")}>
              <dt className="font-mono text-[8px] font-semibold uppercase tracking-[0.17em] text-[#77816d]">{label}</dt>
              <dd className="mf-display mt-2 text-3xl font-semibold leading-none text-[#d7dec8]">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 space-y-5">
          <Meter icon={<Activity className="mr-2 size-3.5" />} label="JS heap" value={resourceStats.heapUsedLabel} percent={resourceStats.heapPercent} />
          <Meter icon={<HardDrive className="mr-2 size-3.5" />} label="Origin storage" value={resourceStats.storageUsedLabel} percent={resourceStats.storagePercent} />
        </div>

        <div className="mt-6 rounded-sm border border-[#3c4738] bg-[#0e120d] p-3 shadow-[inset_0_2px_5px_rgba(0,0,0,.55)]">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#77816d]">Last local export</p>
          <p className="mt-2 truncate text-xs text-[#b3bea4]">{activityStats.lastFilename || "No export recorded yet"}</p>
          <p className="mt-2 font-mono text-[8px] text-[#6e7866]">RAM: {resourceStats.deviceMemoryLabel}</p>
        </div>
      </div>
    </aside>
  );
}

function processingLabel(mode: ToolProcessingMode) {
  if (mode === "model-local") return "Local model";
  if (mode === "network") return "Network";
  return "Local";
}

function Hero() {
  const route = [
    { icon: UploadCloud, number: "01", title: "Select", detail: "File input" },
    { icon: Cpu, number: "02", title: "Process", detail: "Browser runtime" },
    { icon: Download, number: "03", title: "Export", detail: "Local output" },
  ];

  return (
    <section className="mf-faceplate overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1.28fr)_minmax(350px,0.72fr)]">
        <div className="relative overflow-hidden p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="mf-proof-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="mf-rack-label px-3 py-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.18em]">
                Media mastering workstation
              </span>
              <span className="mf-engraved font-mono text-[8px] uppercase tracking-[0.16em]">{tools.length} rack operations / one browser</span>
            </div>

            <h1 className="mf-display mt-9 max-w-5xl text-6xl font-semibold uppercase leading-[0.82] tracking-[-0.025em] text-[#22231e] sm:text-7xl md:text-8xl xl:text-[7.5rem]">
              Put your media
              <span className="block text-primary">on the bench.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-medium leading-7 text-muted-foreground md:text-lg md:leading-8">
              Convert, resize, extract, clean, package, and export files from a tactile production console that shows exactly where every operation runs.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#tool-index" className={buttonVariants({ size: "lg" })}>
                Load an operation <ArrowDownRight className="ml-2 size-4" />
              </Link>
              <Link href="#processing-contract" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Inspect signal path
              </Link>
            </div>
          </div>

          <ol className="mf-inset relative mt-12 grid gap-px overflow-hidden bg-[#706c61] p-px sm:grid-cols-3">
            {route.map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.number} className="flex items-center gap-3 bg-[#d7d1c2] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
                  <span className="mf-key flex size-9 items-center justify-center text-primary"><Icon className="size-4" /></span>
                  <div>
                    <p className="text-sm font-bold">{step.title}</p>
                    <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">{step.number} / {step.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <SessionPanel />
      </div>
    </section>
  );
}

function ToolIndex() {
  return (
    <section id="tool-index" className="scroll-mt-32">
      <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#d2a17e]">Rack directory / {String(tools.length).padStart(2, "0")} operations</p>
          <h2 className="mf-display mt-2 text-5xl font-semibold uppercase leading-none text-[#f0eadd] md:text-6xl">Choose a signal path</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#a6a89d]">Operations are grouped by the work you need to finish. Existing routes and processing behavior stay fixed.</p>
      </div>

      <div className="space-y-4">
        {toolGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <article key={group.key} id={group.id} className="mf-faceplate scroll-mt-32 overflow-hidden">
              <header className="grid gap-4 border-b border-[#787469] p-5 sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-center md:px-7">
                <div className="mf-key flex size-11 items-center justify-center text-primary">
                  <GroupIcon className="size-5" />
                </div>
                <div>
                  <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-primary">Rack {group.number} / {group.meta}</p>
                  <h3 className="mf-display mt-1 text-3xl font-semibold uppercase leading-none">{group.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
                </div>
                <span className="mf-rack-label hidden px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.14em] sm:block">Load route ↗</span>
              </header>

              <ul className="divide-y divide-[#8d897c]">
                {group.tools.map((tool, index) => {
                  const Icon = tool.icon;
                  return (
                    <li key={tool.href}>
                      <Link
                        href={tool.href}
                        className={cn(
                          "group grid grid-cols-[38px_minmax(0,1fr)_24px] gap-3 px-5 py-4 transition-colors hover:bg-[#eee8db]/70 sm:grid-cols-[38px_minmax(240px,1fr)_minmax(220px,auto)_24px] sm:items-center md:px-7",
                          tool.processingMode === "network" && "bg-[#e9d4bd]/45 hover:bg-[#ead0b6]/70",
                        )}
                      >
                        <span className="col-start-1 row-start-1 pt-1 font-mono text-[9px] font-bold text-muted-foreground sm:pt-0">{String(index + 1).padStart(2, "0")}</span>
                        <div className="col-start-2 row-start-1 flex min-w-0 items-start gap-3 sm:col-auto sm:row-auto">
                          <span className="mf-inset mt-0.5 flex size-9 shrink-0 items-center justify-center text-primary">
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-foreground">{tool.title}</span>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{tool.description}</span>
                          </span>
                        </div>
                        <div className="col-start-2 row-start-2 flex min-w-0 flex-nowrap items-center gap-2 sm:col-auto sm:row-auto sm:justify-end">
                          <span className="inline-flex items-center rounded-sm border border-[#55574f] bg-[#34362f] px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[#e5dfd2]">
                            <span className="mf-lamp mr-1.5" data-tone={tool.processingMode === "network" ? "amber" : "green"} />
                            {processingLabel(tool.processingMode)}
                          </span>
                          <span className="min-w-0 truncate font-mono text-[8px] uppercase tracking-[0.11em] text-muted-foreground" title={tool.meta}>{tool.meta}</span>
                        </div>
                        <ArrowUpRight className="col-start-3 row-span-2 row-start-1 size-4 self-center text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary sm:col-auto sm:row-auto" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProcessingContract() {
  const items = [
    { number: "01", title: "Select", body: "The browser receives the file from your device." },
    { number: "02", title: "Operate", body: "Canvas, Web Audio, PDF libraries, and local models do the work." },
    { number: "03", title: "Export", body: "A browser Blob becomes the downloadable output." },
    { number: "04", title: "Separate", body: "URL fetching and text feedback are marked as network routes." },
  ];

  return (
    <section id="processing-contract" className="mf-faceplate scroll-mt-32 overflow-hidden">
      <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
        <div className="border-b border-[#706c61] bg-[#34362f] p-7 text-[#eee8db] lg:border-b-0 lg:border-r md:p-9">
          <div className="flex items-center gap-3">
            <span className="mf-lamp" data-tone="green" />
            <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-[#aeb4a5]">Processing contract / verified route</p>
          </div>
          <ShieldCheck className="mt-8 size-7 text-[#83ad77]" />
          <h2 className="mf-display mt-4 max-w-lg text-5xl font-semibold uppercase leading-[0.86] md:text-6xl">Trust is part of the instrument panel.</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#b6b8ad]">Local operations, local-model operations, and network routes are labeled before you act. The interface never hides a boundary change.</p>
        </div>

        <ol className="grid sm:grid-cols-2">
          {items.map((item, index) => (
            <li key={item.number} className={cn("p-6 md:p-7", index % 2 === 1 && "sm:border-l sm:border-[#8d897c]", index > 1 && "border-t border-[#8d897c]")}>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-primary">{item.number}</p>
                <span className="mf-lamp" data-tone={item.number === "04" ? "amber" : "green"} />
              </div>
              <h3 className="mf-display mt-5 text-3xl font-semibold uppercase leading-none">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-col gap-3 border-t border-black bg-[#1a1b17] p-4 text-[#b2b4a9] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center text-xs"><RadioTower className="mr-2 size-4 text-[#e3a438]" /> Network tools are isolated and permission-sensitive.</p>
        <Link href="#network-tools" className="inline-flex items-center font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-[#ddd7c9] hover:text-[#e3a438]">Inspect network rack <ArrowUpRight className="ml-2 size-3.5" /></Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <AppShell>
      <div className="mf-chassis p-3 sm:p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between px-3 py-1 text-[#8f9187]">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em]">MediaForge integrated media system</p>
          <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em]"><Gauge className="size-3.5" /> System ready <span className="mf-lamp" data-tone="green" /></div>
        </div>
        <div className="space-y-5 md:space-y-6">
          <Hero />
          <ToolIndex />
          <ProcessingContract />
        </div>
      </div>
    </AppShell>
  );
}
