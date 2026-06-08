import Image from "next/image";
import { X, FileImage, HardDrive, ScanEye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  file: File;
  previewUrl: string;
  onRemove: () => void;
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function ImagePreview({ file, previewUrl, onRemove }: ImagePreviewProps) {
  return (
    <div className="group overflow-hidden rounded-[24px] border border-border bg-white shadow-[var(--shadow-sm)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative min-h-[320px] overflow-hidden bg-[linear-gradient(45deg,#f1f1ed_25%,transparent_25%),linear-gradient(-45deg,#f1f1ed_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f1ed_75%),linear-gradient(-45deg,transparent_75%,#f1f1ed_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px]">
          <Image
            src={previewUrl}
            alt={file.name}
            fill
            unoptimized
            sizes="100vw"
            className="object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-[1.015]"
          />
          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-border bg-white/92 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground shadow-[var(--shadow-sm)]">
            Source preview
          </div>
        </div>

        <aside className="flex flex-col justify-between border-t border-border bg-[#f8f8f5] p-5 lg:border-l lg:border-t-0">
          <div>
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selected file</p>
            <p className="flex min-w-0 items-center text-base font-semibold tracking-tight text-foreground">
              <FileImage className="mr-2 h-4 w-4 shrink-0 text-violet-700" />
              <span className="truncate">{file.name}</span>
            </p>
            <div className="mt-4 space-y-3 rounded-2xl border border-border bg-white p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="flex items-center text-muted-foreground"><HardDrive className="mr-2 h-3.5 w-3.5" /> Size</span>
                <span className="font-mono font-semibold">{formatBytes(file.size)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="flex items-center text-muted-foreground"><ScanEye className="mr-2 h-3.5 w-3.5" /> Stage</span>
                <span className="font-mono font-semibold">Ready</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-5 w-full justify-center"
            onClick={onRemove}
          >
            <X className="mr-2 h-4 w-4" />
            Remove file
          </Button>
        </aside>
      </div>
    </div>
  );
}
