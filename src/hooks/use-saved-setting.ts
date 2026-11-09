"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

// Preferences only: never pass files, content, contact details or access tokens.
export function useSavedSetting<T>(key: string, initial: T, validate: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(initial);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const edited = useRef(false);
  const validator = useRef(validate);
  const setPreference = useCallback((next: SetStateAction<T>) => {
    edited.current = true;
    setValue(next);
  }, []);
  useEffect(() => {
    edited.current = false;
    const timer = setTimeout(() => {
      // An early user edit wins over delayed hydration. Marking hydration in
      // state also guarantees that edit is persisted even if no read changed it.
      if (!edited.current) {
        try {
          const raw = localStorage.getItem(`mediaforge.setting.${key}`);
          if (raw && raw.length < 4096) {
            const stored: unknown = JSON.parse(raw);
            if (validator.current(stored)) setValue(stored);
          }
        } catch { /* Blocked/corrupt storage cannot prevent processing. */ }
      }
      setHydratedKey(key);
    }, 0);
    return () => clearTimeout(timer);
  }, [key]);
  useEffect(() => {
    if (hydratedKey !== key) return;
    try { localStorage.setItem(`mediaforge.setting.${key}`, JSON.stringify(value)); } catch { /* Optional. */ }
  }, [hydratedKey, key, value]);
  return [value, setPreference] as const;
}

export const isQuality = (value: unknown): value is string => typeof value === "string" && /^\d{1,3}$/.test(value) && Number(value) >= 1 && Number(value) <= 100;
export const isDimension = (value: unknown): value is string => typeof value === "string" && (value === "" || /^\d{1,5}$/.test(value) && Number(value) >= 1 && Number(value) <= 16384);
