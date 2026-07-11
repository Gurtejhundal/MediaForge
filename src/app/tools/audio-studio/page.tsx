"use client";

import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { Download, Gauge, Loader2, Merge, Music, Repeat2, Scissors, SlidersHorizontal, Video, Volume2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { OutputCard, StatusPill } from "@/components/workspace-components";
import { formatBytes } from "@/components/preview/image-preview";
import { downloadBlob } from "@/lib/local-processing/blob-utils";
import { processAudioLocally, type AudioMode } from "@/lib/local-processing/audio-processing";

type AudioModeOption = {
  value: AudioMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  accept: string;
  multiple?: boolean;
};

const AUDIO_MODES: AudioModeOption[] = [
  {
    value: "convertWav",
    label: "Audio to WAV",
    description: "Convert browser-decodable audio into a clean WAV export.",
    icon: <Music className="h-4 w-4" />,
    accept: "audio/*",
  },
  {
    value: "videoToAudio",
    label: "Video to audio",
    description: "Extract decoded audio from MP4, MOV, WEBM, or other browser-supported video.",
    icon: <Video className="h-4 w-4" />,
    accept: "video/*",
  },
  {
    value: "trim",
    label: "Trim / ringtone",
    description: "Cut a clip by start and end time.",
    icon: <Scissors className="h-4 w-4" />,
    accept: "audio/*,video/*",
  },
  {
    value: "merge",
    label: "Merge audio",
    description: "Join multiple audio files in the selected order.",
    icon: <Merge className="h-4 w-4" />,
    accept: "audio/*",
    multiple: true,
  },
  {
    value: "normalize",
    label: "Normalize",
    description: "Raise peak level without changing the mix shape.",
    icon: <Wand2 className="h-4 w-4" />,
    accept: "audio/*,video/*",
  },
  {
    value: "volume",
    label: "Volume",
    description: "Boost or reduce loudness with clipping protection.",
    icon: <Volume2 className="h-4 w-4" />,
    accept: "audio/*,video/*",
  },
  {
    value: "reverse",
    label: "Reverse",
    description: "Reverse the waveform for effects and sound design.",
    icon: <Repeat2 className="h-4 w-4" />,
    accept: "audio/*,video/*",
  },
  {
    value: "speed",
    label: "Speed",
    description: "Speed up or slow down audio with simple resampling.",
    icon: <Gauge className="h-4 w-4" />,
    accept: "audio/*,video/*",
  },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Audio processing failed";
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return "Unknown";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function AudioStudio({ initialMode = "convertWav" }: { initialMode?: AudioMode }) {
  const [mode, setMode] = useState<AudioMode>(initialMode);
  const [files, setFiles] = useState<File[]>([]);
  const [startSeconds, setStartSeconds] = useState("0");
  const [endSeconds, setEndSeconds] = useState("");
  const [volume, setVolume] = useState<number[]>([100]);
  const [speed, setSpeed] = useState<number[]>([100]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; filename: string; duration: number; sampleRate: number; channels: number } | null>(null);

  const selectedMode = useMemo(() => AUDIO_MODES.find((option) => option.value === mode) || AUDIO_MODES[0], [mode]);

  const handleModeChange = (nextMode: AudioMode) => {
    setMode(nextMode);
    setFiles([]);
    setResult(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || []);
    setFiles(selectedMode.multiple ? nextFiles : nextFiles.slice(0, 1));
    setResult(null);
  };

  const handleRun = async () => {
    if (files.length === 0) {
      toast.error("Choose files first");
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const nextResult = await processAudioLocally(files, {
        mode,
        startSeconds: Number.parseFloat(startSeconds || "0"),
        endSeconds: endSeconds.trim() ? Number.parseFloat(endSeconds) : undefined,
        volumePercent: volume[0],
        speed: speed[0] / 100,
      });
      setResult(nextResult);
      toast.success(`${selectedMode.label} generated locally.`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadBlob(result.blob, result.filename, { kind: mode === "videoToAudio" ? "extraction" : "conversion" });
  };

  return (
    <ToolLayout
      title="Audio Studio"
      description="Convert, extract, trim, merge, normalize, reverse, adjust volume, and change speed locally with browser audio decoding and WAV export."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusPill>Local processing</StatusPill>
        <StatusPill>No upload</StatusPill>
        <StatusPill tone="warning">WAV export</StatusPill>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {AUDIO_MODES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleModeChange(option.value)}
                className={`mf-faceplate min-h-44 p-4 text-left transition-[border-color,background-color,box-shadow] ${
                  mode === option.value ? "border-primary bg-primary/10 shadow-[inset_4px_0_0_var(--primary),var(--shadow-panel)]" : "hover:border-primary/55 hover:bg-[#e8e2d5]"
                }`}
              >
                <span className="mf-key mb-3 flex h-9 w-9 items-center justify-center bg-[#f5efe2] text-primary">{option.icon}</span>
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
              </button>
            ))}
          </div>

          <div className="mf-inset p-5">
            <Label htmlFor="audio-files" className="mb-3 flex items-center text-sm font-semibold">
              <Music className="mr-2 h-4 w-4" /> {selectedMode.label} files
            </Label>
            <Input
              key={mode}
              id="audio-files"
              type="file"
              accept={selectedMode.accept}
              multiple={selectedMode.multiple}
              onChange={handleFileChange}
            />
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Files are decoded in this tab. Browser codec support decides which audio/video files can be opened.
            </p>
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-sm border bg-background p-3 text-sm">
                    <span className="min-w-0 truncate">{file.name}</span>
                    <span className="ml-3 shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(mode === "trim" || mode === "volume" || mode === "speed") && (
            <div className="grid gap-4 md:grid-cols-2">
              {mode === "trim" && (
                <>
                  <div className="mf-inset p-5">
                    <Label htmlFor="start-seconds">Start seconds</Label>
                    <Input id="start-seconds" value={startSeconds} onChange={(event) => setStartSeconds(event.target.value)} inputMode="decimal" />
                  </div>
                  <div className="mf-inset p-5">
                    <Label htmlFor="end-seconds">End seconds</Label>
                    <Input id="end-seconds" value={endSeconds} onChange={(event) => setEndSeconds(event.target.value)} inputMode="decimal" placeholder="Leave empty for end" />
                  </div>
                </>
              )}

              {mode === "volume" && (
                <div className="mf-inset p-5 md:col-span-2">
                  <div className="mb-3 flex items-center justify-between">
                    <Label>Volume</Label>
                    <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{volume[0]}%</span>
                  </div>
                  <Slider value={volume} onValueChange={(value) => setVolume(value as number[])} min={0} max={400} step={1} />
                </div>
              )}

              {mode === "speed" && (
                <div className="mf-inset p-5 md:col-span-2">
                  <div className="mb-3 flex items-center justify-between">
                    <Label>Speed</Label>
                    <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{speed[0]}%</span>
                  </div>
                  <Slider value={speed} onValueChange={(value) => setSpeed(value as number[])} min={25} max={400} step={5} />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">This simple local speed tool changes duration and pitch together.</p>
                </div>
              )}
            </div>
          )}

          <Button size="lg" onClick={handleRun} disabled={isProcessing || files.length === 0} className="w-full">
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SlidersHorizontal className="mr-2 h-4 w-4" />}
            Run {selectedMode.label}
          </Button>
        </section>

        <aside className="mf-faceplate p-5">
          <h2 className="text-sm font-semibold">Export details</h2>
          {result ? (
            <div className="mt-4 space-y-3">
              <div className="mf-inset p-4">
                <p className="truncate text-sm font-semibold">{result.filename}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{formatBytes(result.blob.size)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="mf-inset p-3">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-semibold">{formatDuration(result.duration)}</p>
                </div>
                <div className="mf-inset p-3">
                  <p className="text-xs text-muted-foreground">Channels</p>
                  <p className="font-semibold">{result.channels}</p>
                </div>
                <div className="mf-inset p-3">
                  <p className="text-xs text-muted-foreground">Sample rate</p>
                  <p className="font-semibold">{result.sampleRate} Hz</p>
                </div>
                <div className="mf-inset p-3">
                  <p className="text-xs text-muted-foreground">Format</p>
                  <p className="font-semibold">WAV</p>
                </div>
              </div>
              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download audio
              </Button>
            </div>
          ) : (
            <div className="mf-screen mt-4 border-dashed p-4 text-sm leading-6 text-[#aebaa1]">
              Output metadata appears here after a local audio operation.
            </div>
          )}
        </aside>
      </div>

      {result && (
        <OutputCard description="Audio was generated locally as a browser Blob. No upload route was used.">
          <Button onClick={handleDownload} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download audio
          </Button>
        </OutputCard>
      )}
    </ToolLayout>
  );
}

export default function AudioStudioPage() {
  return <AudioStudio />;
}
