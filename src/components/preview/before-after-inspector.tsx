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

const VIEW_MODES = [
  { value: "compare", label: "Compare", icon: ChevronsLeftRight },
  { value: "output", label: "Output", icon: Sparkles },
  { value: "original", label: "Original", icon: ImageIcon },
] as const;

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
    <section className="border border-border bg-card p-3 md:p-4">
      <div className="mb-4 flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Proof viewer / compare</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-foreground">Aligned before-and-after inspection</h3>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Preview mode">
          {VIEW_MODES.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={viewMode === value ? "default" : "outline"}
              aria-pressed={viewMode === value}
              onClick={() => setViewMode(value)}
              className="h-9 rounded-sm px-3"
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={fitMode === "cover"}
            onClick={() => setFitMode((current) => (current === "contain" ? "cover" : "contain"))}
            className="h-9 rounded-sm px-3"
          >
            <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
            {fitMode === "contain" ? "Fit" : "Fill"}
          </Button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative isolate aspect-[16/10] max-h-[680px] min-h-[260px] cursor-col-resize touch-none select-none overflow-hidden rounded-md border border-border bg-[linear-gradient(45deg,#e9e5da_25%,transparent_25%),linear-gradient(-45deg,#e9e5da_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e9e5da_75%),linear-gradient(-45deg,transparent_75%,#e9e5da_75%)] bg-[length:28px_28px] bg-[position:0_0,0_14px,14px_-14px,-14px_0px] ring-1 ring-foreground/5 sm:min-h-[340px]"
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
              className="absolute bottom-0 top-0 z-20 w-0.5 bg-primary"
              style={{ left: `${sliderPosition}%` }}
            />
            <div
              className="absolute top-1/2 z-30 flex h-12 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border border-primary-foreground/40 bg-primary text-primary-foreground shadow-sm"
              style={{ left: `${sliderPosition}%` }}
              aria-hidden="true"
            >
              <ChevronsLeftRight className="h-5 w-5" />
            </div>
          </>
        )}

        <div className="pointer-events-none absolute left-3 top-3 z-30 max-w-[44%] truncate rounded-sm border border-border bg-card/95 px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground">
          {viewMode === "output" ? resultLabel : originalLabel}
        </div>
        <div className="pointer-events-none absolute right-3 top-3 z-30 max-w-[44%] truncate rounded-sm border border-primary bg-primary px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
          {viewMode === "original" ? originalLabel : resultLabel}
        </div>
      </div>

      {viewMode === "compare" && (
        <div className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-[1fr_auto] md:items-center">
          <label className="flex items-center gap-3 rounded-sm border border-border bg-muted/35 px-3 py-3">
            <ScanLine className="h-4 w-4 shrink-0 text-primary" />
            <span className="sr-only">Comparison split</span>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPosition}
              onChange={(event) => setSliderPosition(Number(event.target.value))}
              className="h-2 w-full cursor-ew-resize accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45"
              aria-label="Comparison split"
            />
            <span className="min-w-12 text-right font-mono text-xs font-semibold tabular-nums text-foreground">{Math.round(sliderPosition)}%</span>
          </label>
          <p className="max-w-56 text-xs leading-5 text-muted-foreground">Both layers share one frame; only the proof line moves.</p>
        </div>
      )}
    </section>
  );
}
