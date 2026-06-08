"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronsLeftRight, ImageIcon, Maximize2, ScanLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewMode = "compare" | "output" | "original";
type FitMode = "contain" | "cover";

interface BeforeAfterInspectorProps {
  originalUrl: string;
  resultUrl: string;
  originalLabel?: string;
  resultLabel?: string;
}

export function BeforeAfterInspector({
  originalUrl,
  resultUrl,
  originalLabel = "Original",
  resultLabel = "Transparent PNG",
}: BeforeAfterInspectorProps) {
  const [sliderPosition, setSliderPosition] = useState(52);
  const [viewMode, setViewMode] = useState<ViewMode>("compare");
  const [fitMode, setFitMode] = useState<FitMode>("contain");
  const stageRef = useRef<HTMLDivElement>(null);

  const updateSlider = (clientX: number) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    setSliderPosition(Math.min(Math.max((x / rect.width) * 100, 0), 100));
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    updateSlider(event.clientX);
  };

  const imageClassName = fitMode === "contain" ? "object-contain" : "object-cover";

  return (
    <section className="rounded-[28px] border border-border bg-white p-4 shadow-[var(--shadow-sm)] md:p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">Extraction preview</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Aligned before/after inspection</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["compare", "Compare", ChevronsLeftRight],
            ["output", "Output", Sparkles],
            ["original", "Original", ImageIcon],
          ].map(([mode, label, Icon]) => (
            <Button
              key={mode as string}
              type="button"
              size="sm"
              variant={viewMode === mode ? "default" : "outline"}
              onClick={() => setViewMode(mode as ViewMode)}
              className="h-8"
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {label as string}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setFitMode((current) => (current === "contain" ? "cover" : "contain"))}
            className="h-8"
          >
            <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
            {fitMode === "contain" ? "Fit" : "Fill"}
          </Button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="group relative isolate aspect-[16/10] max-h-[680px] min-h-[340px] cursor-col-resize touch-none select-none overflow-hidden rounded-[24px] border border-border bg-[linear-gradient(45deg,#f1f1ed_25%,transparent_25%),linear-gradient(-45deg,#f1f1ed_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f1ed_75%),linear-gradient(-45deg,transparent_75%,#f1f1ed_75%)] bg-[length:28px_28px] bg-[position:0_0,0_14px,14px_-14px,-14px_0px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateSlider(event.clientX);
        }}
        onPointerMove={handlePointerMove}
      >
        <div className={cn("absolute inset-0 transition-opacity duration-300", viewMode === "original" ? "opacity-0" : "opacity-100")}>
          <Image src={resultUrl} alt={resultLabel} fill unoptimized sizes="100vw" className={cn("p-5", imageClassName)} />
        </div>

        <div
          className={cn("absolute inset-0 transition-opacity duration-300", viewMode === "output" ? "opacity-0" : "opacity-100")}
          style={viewMode === "compare" ? { clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` } : undefined}
        >
          <Image src={originalUrl} alt={originalLabel} fill unoptimized sizes="100vw" className={cn("p-5", imageClassName)} />
        </div>

        {viewMode === "compare" && (
          <>
            <div
              className="absolute bottom-0 top-0 z-20 w-px bg-white shadow-[0_0_0_1px_rgba(20,20,24,0.18),0_0_22px_rgba(111,44,255,0.35)]"
              style={{ left: `${sliderPosition}%` }}
            />
            <div
              className="absolute top-1/2 z-30 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-violet-700 shadow-[0_16px_42px_rgba(20,20,24,0.18)] transition-transform duration-200 group-hover:scale-105"
              style={{ left: `${sliderPosition}%` }}
              aria-hidden="true"
            >
              <ChevronsLeftRight className="h-5 w-5" />
            </div>
          </>
        )}

        <div className="pointer-events-none absolute left-4 top-4 z-30 rounded-full border border-border bg-white/92 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground shadow-[var(--shadow-sm)]">
          {viewMode === "output" ? resultLabel : originalLabel}
        </div>
        <div className="pointer-events-none absolute right-4 top-4 z-30 rounded-full border border-teal-200 bg-teal-50/95 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800 shadow-[var(--shadow-sm)]">
          {viewMode === "original" ? originalLabel : resultLabel}
        </div>
      </div>

      {viewMode === "compare" && (
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-[#f8f8f5] px-4 py-3">
            <ScanLine className="h-4 w-4 text-violet-700" />
            <span className="sr-only">Comparison split</span>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPosition}
              onChange={(event) => setSliderPosition(Number(event.target.value))}
              className="h-2 w-full accent-violet-700"
              aria-label="Comparison split"
            />
            <span className="min-w-12 text-right font-mono text-xs font-semibold text-muted-foreground">{Math.round(sliderPosition)}%</span>
          </label>
          <p className="text-xs leading-5 text-muted-foreground">Both layers use the same frame; only the reveal mask moves.</p>
        </div>
      )}
    </section>
  );
}
