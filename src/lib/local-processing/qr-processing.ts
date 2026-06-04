import QRCode from "qrcode";

export type QrFormat = "png" | "jpeg" | "svg";
export type QrErrorCorrection = "L" | "M" | "Q" | "H";

export interface QrOptions {
  text: string;
  darkColor: string;
  lightColor: string;
  margin: number;
  errorCorrection: QrErrorCorrection;
  format: QrFormat;
  width?: number;
}

export async function generateQrLocally(options: QrOptions) {
  if (!options.text.trim()) {
    throw new Error("Enter text or a URL before exporting.");
  }

  if (options.format === "svg") {
    const svg = await QRCode.toString(options.text, {
      type: "svg",
      margin: options.margin,
      width: options.width || 1024,
      color: {
        dark: options.darkColor,
        light: options.lightColor,
      },
      errorCorrectionLevel: options.errorCorrection,
    });

    return new Blob([svg], { type: "image/svg+xml" });
  }

  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, options.text, {
    margin: options.margin,
    width: options.width || 1024,
    color: {
      dark: options.darkColor,
      light: options.lightColor,
    },
    errorCorrectionLevel: options.errorCorrection,
  });

  return new Promise<Blob>((resolve, reject) => {
    const mime = options.format === "jpeg" ? "image/jpeg" : "image/png";
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(`${options.format.toUpperCase()} export is not available in this browser`));
        return;
      }
      resolve(blob);
    }, mime, 0.92);
  });
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function getContrastRatio(foreground: string, background: string) {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const values = [r, g, b].map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };

  const first = luminance(fg);
  const second = luminance(bg);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
