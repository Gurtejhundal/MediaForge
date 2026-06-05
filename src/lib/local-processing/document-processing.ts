import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { safeBaseName } from "./blob-utils";
import { processImageLocally, type BrowserImageFormat } from "./image-processing";

type StructuredValue = string | number | boolean | null | StructuredValue[] | { [key: string]: StructuredValue };
type StructuredRecord = Record<string, StructuredValue>;

export type LocalFileConversionResult = {
  blob: Blob;
  filename: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function csvToJson(csv: string): StructuredRecord[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((header) => header.trim().replace(/^["']|["']$/g, ""));

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim().replace(/^["']|["']$/g, ""));
    return headers.reduce<StructuredRecord>((record, header, index) => {
      record[header] = values[index] || "";
      return record;
    }, {});
  });
}

function jsonToCsv(value: unknown) {
  const rows = Array.isArray(value) ? value : [value];
  const normalized = rows.map((row): Record<string, unknown> => (isRecord(row) ? row : { value: row }));
  const headers = Object.keys(normalized[0] || {});
  const lines = [headers.join(",")];

  for (const row of normalized) {
    lines.push(headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(","));
  }

  return lines.join("\n");
}

function jsonToXml(value: unknown, rootName = "root") {
  function nodeToXml(node: unknown, indent = "  "): string {
    if (Array.isArray(node)) {
      return node.map((item) => `${indent}<item>\n${nodeToXml(item, `${indent}  `)}\n${indent}</item>`).join("\n");
    }

    if (isRecord(node)) {
      return Object.entries(node).map(([key, item]) => {
        const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, "_") || "item";
        if (isRecord(item) || Array.isArray(item)) {
          return `${indent}<${cleanKey}>\n${nodeToXml(item, `${indent}  `)}\n${indent}</${cleanKey}>`;
        }
        return `${indent}<${cleanKey}>${escapeXml(item)}</${cleanKey}>`;
      }).join("\n");
    }

    return `${indent}${escapeXml(node)}`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${nodeToXml(value)}\n</${rootName}>`;
}

function xmlToJson(xml: string): StructuredRecord {
  const result: StructuredRecord = {};
  const tagRegex = /<([^!?/\s][^>\s]*)[^>]*>([^<]*)<\/\1>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(xml)) !== null) {
    const key = match[1];
    const value = match[2].trim();

    if (key && value) {
      result[key] = value;
    }
  }

  return result;
}

function yamlToJson(yaml: string): StructuredRecord {
  const result: StructuredRecord = {};

  for (const line of yaml.split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#")) continue;
    const separator = clean.indexOf(":");
    if (separator <= 0) continue;
    result[clean.slice(0, separator).trim()] = clean.slice(separator + 1).trim();
  }

  return result;
}

function jsonToYaml(value: unknown, indent = ""): string {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (Array.isArray(item) || isRecord(item)) return `${indent}-\n${jsonToYaml(item, `${indent}  `)}`;
      return `${indent}- ${String(item ?? "")}\n`;
    }).join("");
  }

  if (isRecord(value)) {
    return Object.entries(value).map(([key, item]) => {
      if (Array.isArray(item) || isRecord(item)) return `${indent}${key}:\n${jsonToYaml(item, `${indent}  `)}`;
      return `${indent}${key}: ${String(item ?? "")}\n`;
    }).join("");
  }

  return `${indent}${String(value ?? "")}\n`;
}

function mdToHtml(md: string) {
  let html = md
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/^\s*-\s*(.*$)/gim, "<li>$1</li>");

  html = html.split(/\n\s*\n/).map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<h") || trimmed.startsWith("<li")) return trimmed;
    return `<p>${trimmed}</p>`;
  }).join("\n");

  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
}

async function textToPdfBlob(text: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  const fontSize = 11;
  const lineHeight = 16;
  const usableChars = 88;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const lines = text.split(/\r?\n/).flatMap((line) => {
    if (line.length <= usableChars) return [line];
    const wrapped: string[] = [];
    for (let index = 0; index < line.length; index += usableChars) {
      wrapped.push(line.slice(index, index + usableChars));
    }
    return wrapped;
  });

  for (const line of lines) {
    if (y < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(line || " ", { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
    y -= lineHeight;
  }

  const bytes = await pdf.save();
  const copy = new Uint8Array(bytes);
  return new Blob([copy.buffer], { type: "application/pdf" });
}

function parseStructuredInput(ext: string, text: string): unknown {
  if (ext === "json") return JSON.parse(text);
  if (ext === "csv") return csvToJson(text);
  if (ext === "xml") return xmlToJson(text);
  if (ext === "yaml" || ext === "yml") return yamlToJson(text);
  return null;
}

function structuredToText(value: unknown, targetFormat: string) {
  if (targetFormat === "json") return JSON.stringify(value, null, 2);
  if (targetFormat === "csv") return jsonToCsv(value);
  if (targetFormat === "xml") return jsonToXml(value);
  if (targetFormat === "yaml") return jsonToYaml(value);
  if (targetFormat === "txt") return JSON.stringify(value, null, 2);
  throw new Error(`Cannot export structured data as ${targetFormat.toUpperCase()} locally`);
}

function textMime(format: string) {
  if (format === "json") return "application/json";
  if (format === "csv") return "text/csv";
  if (format === "xml") return "application/xml";
  if (format === "yaml") return "application/x-yaml";
  if (format === "html") return "text/html";
  return "text/plain";
}

export async function convertFileLocally(file: File, targetFormat: string): Promise<LocalFileConversionResult> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const baseName = safeBaseName(file.name);

  if (file.type.startsWith("image/")) {
    if (!["png", "jpeg", "webp", "avif"].includes(targetFormat)) {
      throw new Error("This browser-local converter supports PNG, JPEG, WEBP, and AVIF image output only.");
    }

    const result = await processImageLocally(file, {
      format: targetFormat as BrowserImageFormat,
      quality: targetFormat === "png" ? undefined : 90,
    });

    return { blob: result.blob, filename: result.filename };
  }

  const text = await file.text();
  const structured = ["json", "csv", "xml", "yaml", "yml"].includes(ext)
    ? parseStructuredInput(ext, text)
    : null;

  if (structured !== null) {
    if (targetFormat === "pdf") {
      return { blob: await textToPdfBlob(JSON.stringify(structured, null, 2)), filename: `${baseName}.pdf` };
    }

    const output = structuredToText(structured, targetFormat);
    return { blob: new Blob([output], { type: textMime(targetFormat) }), filename: `${baseName}.${targetFormat}` };
  }

  if (ext === "md" || ext === "markdown") {
    if (targetFormat === "html") return { blob: new Blob([mdToHtml(text)], { type: "text/html" }), filename: `${baseName}.html` };
    if (targetFormat === "txt") return { blob: new Blob([text], { type: "text/plain" }), filename: `${baseName}.txt` };
    if (targetFormat === "pdf") return { blob: await textToPdfBlob(text), filename: `${baseName}.pdf` };
  }

  if (ext === "html") {
    const plainText = text.replace(/<[^>]*>/g, "");
    if (targetFormat === "txt") return { blob: new Blob([plainText], { type: "text/plain" }), filename: `${baseName}.txt` };
    if (targetFormat === "pdf") return { blob: await textToPdfBlob(plainText), filename: `${baseName}.pdf` };
  }

  if (ext === "txt") {
    if (targetFormat === "html") {
      return { blob: new Blob([`<!doctype html><html><body><pre>${escapeXml(text)}</pre></body></html>`], { type: "text/html" }), filename: `${baseName}.html` };
    }
    if (targetFormat === "json") return { blob: new Blob([JSON.stringify({ text }, null, 2)], { type: "application/json" }), filename: `${baseName}.json` };
    if (targetFormat === "pdf") return { blob: await textToPdfBlob(text), filename: `${baseName}.pdf` };
    if (targetFormat === "txt") return { blob: new Blob([text], { type: "text/plain" }), filename: `${baseName}.txt` };
  }

  throw new Error("This file type is not supported by the browser-local converter yet.");
}
