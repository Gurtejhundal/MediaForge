"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const active = new Set<symbol>();
const listeners = new Set<() => void>();
function emit() { listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
const snapshot = () => active.size > 0;
const serverSnapshot = () => false;

export function useUnsavedWork(dirty: boolean) {
  const id = useRef(Symbol("workspace"));
  useEffect(() => {
    const key = id.current;
    if (dirty) { active.add(key); emit(); }
    return () => { if (active.delete(key)) emit(); };
  }, [dirty]);
}

export function useHasWorkingFiles() { return useSyncExternalStore(subscribe, snapshot, serverSnapshot); }
