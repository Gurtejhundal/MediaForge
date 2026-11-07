"use client";

import { useEffect } from "react";

// Blob URLs hold file bytes in memory until revoked or the document closes.
// Client-side route changes do not close the document.
export function useObjectUrlCleanup(url: string | null) {
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
}

export function useObjectUrlMapCleanup(urls: Record<string, string> | undefined) {
  useEffect(() => () => {
    for (const url of Object.values(urls || {})) URL.revokeObjectURL(url);
  }, [urls]);
}
