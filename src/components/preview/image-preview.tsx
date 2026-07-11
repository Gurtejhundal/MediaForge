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
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative min-h-[300px] overflow-hidden bg-[linear-gradient(45deg,#e9e5da_25%,transparent_25%),linear-gradient(-45deg,#e9e5da_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e9e5da_75%),linear-gradient(-45deg,transparent_75%,#e9e5da_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px] sm:min-h-[360px]">
          <Image
            src={previewUrl}
            alt={file.name}
            fill
            unoptimized
            sizes="100vw"
            className="object-contain p-5"
          />
          <div className="pointer-events-none absolute left-3 top-3 rounded-sm border border-border bg-card/95 px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Source / input
          </div>
        </div>

        <aside className="flex flex-col justify-between border-t border-border bg-muted/35 p-5 lg:border-l lg:border-t-0">
          <div>
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">File ticket / ready</p>
            <p className="flex min-w-0 items-center text-base font-semibold tracking-[-0.02em] text-foreground">
              <FileImage className="mr-2 h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{file.name}</span>
            </p>
            <dl className="mt-5 border-y border-border text-sm">
              <div className="flex justify-between gap-4 py-3">
                <dt className="flex items-center text-muted-foreground"><HardDrive className="mr-2 h-3.5 w-3.5" /> Size</dt>
                <dd className="font-mono font-semibold tabular-nums text-foreground">{formatBytes(file.size)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border py-3">
                <dt className="flex items-center text-muted-foreground"><ScanEye className="mr-2 h-3.5 w-3.5" /> Stage</dt>
                <dd className="font-mono font-semibold uppercase tracking-[0.1em] text-foreground">Ready</dd>
              </div>
            </dl>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-5 h-11 w-full justify-center rounded-sm bg-card"
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
