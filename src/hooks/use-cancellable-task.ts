"use client";
import { useEffect, useRef } from "react";
export function useCancellableTask() {
  const current = useRef<AbortController | null>(null);
  useEffect(() => () => current.current?.abort(), []);
  return {
    start() { current.current?.abort(); const controller = new AbortController(); current.current = controller; return controller.signal; },
    cancel() { current.current?.abort(); },
  };
}
export function wasCancelled(error: unknown) { return error instanceof Error && error.name === "AbortError"; }
