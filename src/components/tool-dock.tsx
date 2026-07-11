"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getToolByHref, toolGroups, tools, type ToolProcessingMode } from "@/lib/tool-catalog";
import { cn } from "@/lib/utils";

export interface ToolDockProps { className?: string; }

function processingLabel(mode: ToolProcessingMode) {
  if (mode === "model-local") return "Model";
  if (mode === "network") return "Net";
  return "Local";
}

export function ToolDock({ className }: ToolDockProps) {
  const pathname = usePathname();
  const currentTool = getToolByHref(pathname);

  return (
    <aside className={cn("mf-faceplate min-w-0 max-w-full overflow-hidden lg:self-start", className)}>
      <div className="border-b border-[#817d70] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-muted-foreground">Patch bay</p>
          <span className="mf-lamp" data-tone={currentTool?.processingMode === "network" ? "amber" : "green"} />
        </div>
        <div className="mf-inset mt-3 p-3">
          <p className="truncate text-sm font-bold">{currentTool?.title ?? "Choose an operation"}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="truncate font-mono text-[8px] uppercase tracking-[.1em] text-muted-foreground">{currentTool?.meta ?? `${tools.length} available routes`}</p>
            {currentTool ? <span className="mf-rack-label shrink-0 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[.1em]">{processingLabel(currentTool.processingMode)}</span> : null}
          </div>
        </div>
      </div>

      <nav aria-label="Media tools" className="mf-scroll-rail max-w-full overflow-x-auto p-3 lg:overflow-visible lg:p-4">
        <div className="flex min-w-max gap-3 lg:min-w-0 lg:flex-col lg:gap-5">
          {toolGroups.map((group) => {
            const GroupIcon = group.icon;
            const groupIsActive = group.tools.some((tool) => tool.href === pathname);
            const headingId = `tool-dock-${group.id}`;

            return (
              <section key={group.key} aria-labelledby={headingId} className="w-72 shrink-0 border-t border-[#8d897c] pt-3 lg:w-auto">
                <div className="flex items-start justify-between gap-3 px-1">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className={cn("mf-inset mt-0.5 flex size-7 shrink-0 items-center justify-center text-muted-foreground", groupIsActive && "border-primary text-primary")}>
                      <GroupIcon className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h2 id={headingId} className={cn("text-xs font-bold", groupIsActive ? "text-foreground" : "text-muted-foreground")}>{group.label}</h2>
                      <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[.08em] text-muted-foreground">{group.meta}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[8px] font-bold text-primary">{group.number}</span>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {group.tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = pathname === tool.href;
                    return (
                      <li key={tool.href}>
                        <Link
                          href={tool.href}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "mf-key group flex min-h-10 items-center gap-2 px-2.5 py-2 text-xs",
                            isActive && "mf-key-primary border-primary text-primary-foreground",
                          )}
                        >
                          <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate font-bold">{tool.title}</span>
                          <span className={cn("font-mono text-[7px] uppercase tracking-[.08em]", isActive ? "text-primary-foreground/75" : "text-muted-foreground")}>{processingLabel(tool.processingMode)}</span>
                          <ArrowUpRight className="size-3 shrink-0 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
