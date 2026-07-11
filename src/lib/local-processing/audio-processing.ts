import { safeBaseName } from "./blob-utils";

export type AudioMode = "convertWav" | "trim" | "merge" | "normalize" | "volume" | "reverse" | "speed" | "videoToAudio";

export interface AudioProcessOptions {
  mode: AudioMode;
  startSeconds?: number;
  endSeconds?: number;
  volumePercent?: number;
  speed?: number;
}

export interface AudioProcessResult {
  blob: Blob;
  filename: string;
  duration: number;
  sampleRate: number;
  channels: number;
}

function createAudioContext() {
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) throw new Error("Web Audio is not available in this browser.");
  return new AudioContextCtor();
}

function copyAudioBuffer(context: BaseAudioContext, source: AudioBuffer) {
  const output = context.createBuffer(source.numberOfChannels, source.length, source.sampleRate);
  for (let channel = 0; channel < source.numberOfChannels; channel += 1) {
    output.copyToChannel(source.getChannelData(channel), channel);
  }
  return output;
}

async function decodeAudio(file: File) {
  const context = createAudioContext();
  try {
    const buffer = await context.decodeAudioData(await file.arrayBuffer());
    return { context, buffer };
  } catch {
    await context.close();
    throw new Error("This browser could not decode audio from the selected file.");
  }
}

function sliceBuffer(context: BaseAudioContext, buffer: AudioBuffer, startSeconds: number, endSeconds: number) {
  const start = Math.max(0, Math.min(buffer.duration, startSeconds));
  const end = Math.max(start, Math.min(buffer.duration, endSeconds || buffer.duration));
  const startFrame = Math.floor(start * buffer.sampleRate);
  const endFrame = Math.max(startFrame + 1, Math.floor(end * buffer.sampleRate));
  const output = context.createBuffer(buffer.numberOfChannels, endFrame - startFrame, buffer.sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    output.copyToChannel(buffer.getChannelData(channel).slice(startFrame, endFrame), channel);
  }

  return output;
}

function normalizeBuffer(context: BaseAudioContext, buffer: AudioBuffer) {
  const output = copyAudioBuffer(context, buffer);
  let peak = 0;

  for (let channel = 0; channel < output.numberOfChannels; channel += 1) {
    const data = output.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) {
      peak = Math.max(peak, Math.abs(data[index]));
    }
  }

  if (peak <= 0) return output;
  const gain = Math.min(8, 0.98 / peak);

  for (let channel = 0; channel < output.numberOfChannels; channel += 1) {
    const data = output.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.max(-1, Math.min(1, data[index] * gain));
    }
  }

  return output;
}

function applyVolume(context: BaseAudioContext, buffer: AudioBuffer, volumePercent = 100) {
  const output = copyAudioBuffer(context, buffer);
  const gain = Math.max(0, Math.min(400, volumePercent)) / 100;

  for (let channel = 0; channel < output.numberOfChannels; channel += 1) {
    const data = output.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.max(-1, Math.min(1, data[index] * gain));
    }
  }

  return output;
}

function reverseBuffer(context: BaseAudioContext, buffer: AudioBuffer) {
  const output = copyAudioBuffer(context, buffer);
  for (let channel = 0; channel < output.numberOfChannels; channel += 1) {
    output.getChannelData(channel).reverse();
  }
  return output;
}

function changeSpeed(context: BaseAudioContext, buffer: AudioBuffer, speed = 1) {
  const rate = Math.max(0.25, Math.min(4, speed));
  const outputLength = Math.max(1, Math.floor(buffer.length / rate));
  const output = context.createBuffer(buffer.numberOfChannels, outputLength, buffer.sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const input = buffer.getChannelData(channel);
    const data = output.getChannelData(channel);

    for (let index = 0; index < outputLength; index += 1) {
      const sourceIndex = index * rate;
      const left = Math.floor(sourceIndex);
      const right = Math.min(input.length - 1, left + 1);
      const ratio = sourceIndex - left;
      data[index] = input[left] * (1 - ratio) + input[right] * ratio;
    }
  }

  return output;
}

async function resampleBuffer(buffer: AudioBuffer, sampleRate: number) {
  if (buffer.sampleRate === sampleRate) return buffer;

  const offline = new OfflineAudioContext(buffer.numberOfChannels, Math.ceil(buffer.duration * sampleRate), sampleRate);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start();
  return offline.startRendering();
}

async function mergeBuffers(context: BaseAudioContext, buffers: AudioBuffer[]) {
  const sampleRate = buffers[0].sampleRate;
  const resampled = await Promise.all(buffers.map((buffer) => resampleBuffer(buffer, sampleRate)));
  const channels = Math.max(...resampled.map((buffer) => buffer.numberOfChannels));
  const totalLength = resampled.reduce((sum, buffer) => sum + buffer.length, 0);
  const output = context.createBuffer(channels, totalLength, sampleRate);
  let offset = 0;

  for (const buffer of resampled) {
    for (let channel = 0; channel < channels; channel += 1) {
      const source = buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1));
      output.getChannelData(channel).set(source, offset);
    }
    offset += buffer.length;
  }

  return output;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function encodeWav(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = buffer.length * blockAlign;
  const output = new ArrayBuffer(44 + dataSize);
  const view = new DataView(output);
  const channelData = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let index = 0; index < buffer.length; index += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][index]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([output], { type: "audio/wav" });
}

function outputName(file: File, suffix: string) {
  return `${safeBaseName(file.name)}-${suffix}.wav`;
}

export async function processAudioLocally(files: File[], options: AudioProcessOptions): Promise<AudioProcessResult> {
  if (files.length === 0) throw new Error("Choose audio or video first.");

  const primary = files[0];
  const { context, buffer } = await decodeAudio(primary);

  try {
    let outputBuffer = buffer;
    let filename = outputName(primary, "converted");

    if (options.mode === "trim") {
      outputBuffer = sliceBuffer(context, buffer, options.startSeconds ?? 0, options.endSeconds ?? buffer.duration);
      filename = outputName(primary, "trimmed");
    } else if (options.mode === "merge") {
      if (files.length < 2) throw new Error("Merge needs at least two audio files.");
      const decoded = [buffer];
      const contextsToClose: AudioContext[] = [];

      for (const file of files.slice(1)) {
        const next = await decodeAudio(file);
        decoded.push(next.buffer);
        contextsToClose.push(next.context);
      }

      outputBuffer = await mergeBuffers(context, decoded);
      await Promise.all(contextsToClose.map((nextContext) => nextContext.close()));
      filename = "merged-audio.wav";
    } else if (options.mode === "normalize") {
      outputBuffer = normalizeBuffer(context, buffer);
      filename = outputName(primary, "normalized");
    } else if (options.mode === "volume") {
      outputBuffer = applyVolume(context, buffer, options.volumePercent ?? 100);
      filename = outputName(primary, "volume");
    } else if (options.mode === "reverse") {
      outputBuffer = reverseBuffer(context, buffer);
      filename = outputName(primary, "reversed");
    } else if (options.mode === "speed") {
      outputBuffer = changeSpeed(context, buffer, options.speed ?? 1);
      filename = outputName(primary, "speed");
    } else if (options.mode === "videoToAudio") {
      filename = outputName(primary, "audio");
    }

    return {
      blob: encodeWav(outputBuffer),
      filename,
      duration: outputBuffer.duration,
      sampleRate: outputBuffer.sampleRate,
      channels: outputBuffer.numberOfChannels,
    };
  } finally {
    await context.close();
  }
}
