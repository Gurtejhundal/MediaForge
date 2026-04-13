import Image from "next/image";
import { X, FileImage, HardDrive } from "lucide-react";
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
    <div className="relative flex items-center p-4 border rounded-xl bg-muted/50 overflow-hidden group">
      <div className="h-16 w-16 relative flex-shrink-0 rounded-md overflow-hidden bg-white/20 border">
        <Image 
          src={previewUrl} 
          alt={file.name} 
          fill 
          className="object-cover" 
        />
      </div>
      
      <div className="ml-4 flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-foreground flex items-center">
          <FileImage className="h-4 w-4 mr-2 text-primary" />
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground flex items-center mt-1">
          <HardDrive className="h-3 w-3 mr-1" />
          {formatBytes(file.size)}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
