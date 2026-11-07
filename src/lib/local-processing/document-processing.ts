import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
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

export function csvToJson(csv: string): StructuredRecord[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false, touched = false;
  const input = csv.replace(/^\uFEFF/, "");
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') { quoted = false; closed = true; }
      else cell += char;
    } else if (char === "," || char === "\n" || char === "\r") {
      if (char === ",") touched = true;
      row.push(cell); cell = ""; closed = false;
      if (char !== ",") {
        if (touched || row.length > 1) rows.push(row);
        row = []; touched = false;
        if (char === "\r" && input[index + 1] === "\n") index += 1;
      }
    } else if (char === '"' && cell === "" && !closed) { quoted = true; touched = true; }
    else {
      if (closed || char === '"') throw new Error("Invalid CSV quoting.");
      cell += char; touched = true;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(cell);
  if (touched || row.length > 1) rows.push(row);
  const headers = rows.shift() || [];
  if (headers.some((header) => !header) || new Set(headers).size !== headers.length) {
    throw new Error("CSV headers must be non-empty and unique to preserve every column.");
  }
  return rows.map((values) => {
    if (values.length !== headers.length) throw new Error("CSV row has a different number of columns than its header.");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

export function jsonToCsv(value: unknown) {
  const rows = Array.isArray(value) ? value : [value];
  const normalized = rows.map((row): Record<string, unknown> => (isRecord(row) ? row : { value: row }));
  const headers = Array.from(new Set(normalized.flatMap((row) => Object.keys(row))));
  const quote = (item: unknown) => `"${(typeof item === "object" && item !== null ? JSON.stringify(item) : String(item ?? "")).replace(/"/g, '""')}"`;
  return [headers.map(quote).join(","), ...normalized.map((row) => headers.map((header) => quote(row[header])).join(","))].join("\r\n");
}

function jsonToXml(value: unknown, rootName = "root") {
  function nodeToXml(node: unknown, indent = "  "): string {
    if (Array.isArray(node)) {
      return node.map((item) => `${indent}<item>\n${nodeToXml(item, `${indent}  `)}\n${indent}</item>`).join("\n");
    }

    if (isRecord(node)) {
      return Object.entries(node).map(([key, item]) => {
        if (!/^[a-zA-Z_][a-zA-Z0-9_.-]*$/.test(key)) throw new Error(`XML cannot preserve the field name "${key}". Use JSON for arbitrary field names.`);
        const cleanKey = key;
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
  const documentValue = new DOMParser().parseFromString(xml, "application/xml");
  if (documentValue.querySelector("parsererror") || documentValue.doctype) throw new Error("Invalid XML or unsupported document type.");
  function read(element: Element): StructuredValue {
    const children = Array.from(element.children);
    if (!children.length && !element.attributes.length) return element.textContent || "";
    if (children.length && Array.from(element.childNodes).some((node) => node.nodeType === 3 && node.textContent?.trim())) {
      throw new Error("Mixed-content XML is not supported; convert text-only elements to avoid losing data.");
    }
    const entries: Array<[string, StructuredValue]> = Array.from(element.attributes).map((attribute) => [`@${attribute.name}`, attribute.value]);
    const groups = new Map<string, StructuredValue[]>();
    for (const child of children) groups.set(child.tagName, [...(groups.get(child.tagName) || []), read(child)]);
    for (const [key, values] of groups) entries.push([key, values.length === 1 ? values[0] : values]);
    if (!children.length) entries.push(["#text", element.textContent || ""]);
    return Object.fromEntries(entries);
  }
  return { [documentValue.documentElement.tagName]: read(documentValue.documentElement) };
}

function yamlToJson(yaml: string): unknown {
  return parseYaml(yaml, { maxAliasCount: 50, uniqueKeys: true });
}

function jsonToYaml(value: unknown) {
  return stringifyYaml(value);
}

function mdToHtml(md: string) {
  let html = escapeXml(md)
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
    if (!["png", "jpeg", "webp", "avif", "svg"].includes(targetFormat)) {
      throw new Error("This browser-local converter supports PNG, JPEG, WEBP, AVIF, and raster-backed SVG output only.");
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

  if (["json", "csv", "xml", "yaml", "yml"].includes(ext)) {
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
