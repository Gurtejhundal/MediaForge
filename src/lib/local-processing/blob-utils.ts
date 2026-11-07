import { recordLocalExport, type LocalExportKind } from "./activity-stats";

export function makeObjectUrl(blob: Blob) {
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string | null | undefined) {
  if (url) URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string, options?: { kind?: LocalExportKind }) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Let the browser consume the URL before releasing it (including slow devices).
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  recordLocalExport({ filename, bytes: blob.size, kind: options?.kind });
}

export function formatFileSize(bytes: number, decimals = 2) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const base = 1024;
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.max(0, Math.floor(Math.log(bytes) / Math.log(base))));
  return `${Number.parseFloat((bytes / Math.pow(base, index)).toFixed(decimals))} ${units[index]}`;
}

export function safeBaseName(filename: string) {
  const baseName = filename.replace(/\.[^.]+$/, "").trim();
  const sanitized = baseName
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "mediaforge-export";
}
