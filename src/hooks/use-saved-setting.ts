"use client";

import { useEffect, useRef, useState } from "react";

// Preferences only: never pass files, content, contact details or access tokens.
export function useSavedSetting<T>(key: string, initial: T, validate: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(initial);
  const ready = useRef(false);
  const validator = useRef(validate);
  useEffect(() => {
    ready.current = false;
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(`mediaforge.setting.${key}`);
        if (raw && raw.length < 4096) {
          const stored: unknown = JSON.parse(raw);
          if (validator.current(stored)) setValue(stored);
        }
      } catch { /* Blocked/corrupt storage cannot prevent processing. */ }
      ready.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, [key]);
  useEffect(() => {
    if (!ready.current) return;
    try { localStorage.setItem(`mediaforge.setting.${key}`, JSON.stringify(value)); } catch { /* Optional. */ }
  }, [key, value]);
  return [value, setValue] as const;
}

export const isQuality = (value: unknown): value is string => typeof value === "string" && /^\d{1,3}$/.test(value) && Number(value) >= 1 && Number(value) <= 100;
export const isDimension = (value: unknown): value is string => typeof value === "string" && (value === "" || /^\d{1,5}$/.test(value) && Number(value) >= 1 && Number(value) <= 16384);
