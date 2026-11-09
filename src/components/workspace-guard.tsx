"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHasWorkingFiles } from "@/hooks/use-unsaved-work";

const notice = "Leave this tool? Working files and previews will be cleared. Save any results you want to keep first.";
declare global { interface Window { __mediaforgeHasWorkingFiles?: boolean; __mediaforgeAllowDiscard?: boolean; } }

export function WorkspaceGuard() {
  const dirty = useHasWorkingFiles();
  const router = useRouter();
  useEffect(() => {
    window.__mediaforgeHasWorkingFiles = dirty;
    window.__mediaforgeAllowDiscard = false;
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { if (!window.__mediaforgeAllowDiscard) { event.preventDefault(); event.returnValue = ""; } };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const next = new URL(anchor.href, location.href);
      if (next.origin !== location.origin || next.pathname === location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      if (window.confirm(notice)) router.push(next.pathname + next.search + next.hash);
    };
    // Navigation API covers Back/Forward in supporting Chromium/WebView versions.
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    const traverse = (event: Event) => {
      const next = event as Event & { navigationType?: string; destination?: { url: string } };
      if (!window.__mediaforgeAllowDiscard && next.navigationType === "traverse" && event.cancelable && next.destination && new URL(next.destination.url).pathname !== location.pathname && !window.confirm(notice)) event.preventDefault();
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    navigation?.addEventListener("navigate", traverse);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
      navigation?.removeEventListener("navigate", traverse);
    };
  }, [dirty, router]);
  return dirty ? <aside className="border-b border-border bg-card px-4 py-2 text-center text-xs text-muted-foreground" aria-label="Working files reminder">Working files stay in this tab. Save your results before leaving; refresh and close warnings depend on your browser.</aside> : null;
}
