export type LocalExportKind =
  | "conversion"
  | "modification"
  | "generation"
  | "extraction"
  | "document"
  | "video"
  | "unknown";

export interface LocalExportEvent {
  kind?: LocalExportKind;
  filename: string;
  bytes: number;
}

export interface LocalActivityStats {
  totalExports: number;
  conversions: number;
  modifiedFiles: number;
  generatedFiles: number;
  extractedFiles: number;
  documentExports: number;
  videoExports: number;
  bytesExported: number;
  lastFilename: string | null;
  lastUpdatedAt: string | null;
}

const STORAGE_KEY = "mediaforge.localActivity.v1";
const ACTIVITY_EVENT = "mediaforge:local-activity";

const emptyStats: LocalActivityStats = {
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

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseStats(value: string | null): LocalActivityStats {
  if (!value) return emptyStats;

  try {
    return { ...emptyStats, ...JSON.parse(value) } as LocalActivityStats;
  } catch {
    return emptyStats;
  }
}

export function readLocalActivityStats(): LocalActivityStats {
  if (!canUseBrowserStorage()) return emptyStats;
  return parseStats(window.localStorage.getItem(STORAGE_KEY));
}

function inferExportKind(filename: string): LocalExportKind {
  const normalized = filename.toLowerCase();

  if (normalized.includes("converted-")) return "conversion";
  if (normalized.includes("modified-") || normalized.includes("resized-") || normalized.includes("compressed-") || normalized.includes("-no-bg") || normalized.includes("-cleaned")) return "modification";
  if (normalized.includes("qr-code") || normalized.includes("favicon")) return "generation";
  if (normalized.includes("-frame")) return "extraction";
  if (normalized.endsWith(".pdf") || normalized.includes("pdf")) return "document";
  if (normalized.endsWith(".webm") || normalized.endsWith(".mp4")) return "video";

  return "unknown";
}

export function recordLocalExport(event: LocalExportEvent) {
  if (!canUseBrowserStorage()) return;

  const kind = event.kind || inferExportKind(event.filename);
  const current = readLocalActivityStats();
  const next: LocalActivityStats = {
    ...current,
    totalExports: current.totalExports + 1,
    conversions: current.conversions + (kind === "conversion" ? 1 : 0),
    modifiedFiles: current.modifiedFiles + (kind === "modification" ? 1 : 0),
    generatedFiles: current.generatedFiles + (kind === "generation" ? 1 : 0),
    extractedFiles: current.extractedFiles + (kind === "extraction" ? 1 : 0),
    documentExports: current.documentExports + (kind === "document" ? 1 : 0),
    videoExports: current.videoExports + (kind === "video" ? 1 : 0),
    bytesExported: current.bytesExported + Math.max(0, event.bytes),
    lastFilename: event.filename,
    lastUpdatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(ACTIVITY_EVENT, { detail: next }));
}

export function subscribeLocalActivity(listener: (stats: LocalActivityStats) => void) {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const detail = event instanceof CustomEvent ? event.detail : null;
    listener(detail || readLocalActivityStats());
  };

  window.addEventListener(ACTIVITY_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(ACTIVITY_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
