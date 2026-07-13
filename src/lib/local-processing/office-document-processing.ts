import JSZip from "jszip";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { safeBaseName } from "./blob-utils";

export type DocumentConversionMode =
  | "wordToPdf"
  | "powerpointToPdf"
  | "excelToPdf"
  | "htmlToPdf"
  | "pdfToJpg"
  | "pdfToWord"
  | "pdfToPowerPoint"
  | "pdfToExcel"
  | "ocrPdf"
  | "comparePdf";

export interface DocumentProcessResult {
  blob: Blob;
  filename: string;
}

type PdfTextItem = {
  str?: string;
  transform?: number[];
};

type ExtractedPdfPage = {
  lines: string[];
  width: number;
  height: number;
};

const OFFICE_MIME = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

let sharedPdfWorker: Worker | null = null;

function extensionOf(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

function textBlob(text: string) {
  return new Blob([text], { type: "text/plain;charset=utf-8" });
}

function bufferBlob(value: Blob | ArrayBuffer | Uint8Array, type: string) {
  if (value instanceof Blob) return value;
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return new Blob([new Uint8Array(bytes).buffer], { type });
}

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!pdfjs.GlobalWorkerOptions.workerPort) {
    sharedPdfWorker = new Worker(
      new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url),
      { type: "module", name: "mediaforge-pdf-worker" },
    );
    pdfjs.GlobalWorkerOptions.workerPort = sharedPdfWorker;
  }
  return pdfjs;
}

function groupTextItems(items: PdfTextItem[]) {
  const positioned = items
    .filter((item): item is PdfTextItem & { str: string; transform: number[] } => Boolean(item.str?.trim() && item.transform?.length))
    .map((item) => ({ text: item.str.trim(), x: item.transform[4] || 0, y: item.transform[5] || 0 }))
    .sort((left, right) => Math.abs(right.y - left.y) > 4 ? right.y - left.y : left.x - right.x);

  const rows: Array<{ y: number; parts: Array<{ x: number; text: string }> }> = [];
  for (const item of positioned) {
    const row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 4);
    if (row) row.parts.push({ x: item.x, text: item.text });
    else rows.push({ y: item.y, parts: [{ x: item.x, text: item.text }] });
  }

  return rows
    .sort((left, right) => right.y - left.y)
    .map((row) => row.parts.sort((left, right) => left.x - right.x).map((part) => part.text).join(" ").trim())
    .filter(Boolean);
}

async function openPdf(file: File) {
  const pdfjs = await loadPdfJs();
  return pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useWorkerFetch: false,
  }).promise;
}

async function extractPdfPages(file: File): Promise<ExtractedPdfPage[]> {
  const pdf = await openPdf(file);
  const pages: ExtractedPdfPage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    pages.push({
      lines: groupTextItems(content.items as PdfTextItem[]),
      width: viewport.width,
      height: viewport.height,
    });
  }

  return pages;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not render PDF page")), type, quality);
  });
}

function parseXml(xml: string) {
  const documentValue = new DOMParser().parseFromString(xml, "application/xml");
  if (documentValue.querySelector("parsererror")) throw new Error("The Office document XML is invalid");
  return documentValue;
}

async function extractDocxText(file: File) {
  if (extensionOf(file) !== "docx") {
    throw new Error("Legacy .doc files are not browser-readable. Save the file as .docx in Word and try again.");
  }
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entry = zip.file("word/document.xml");
  if (!entry) throw new Error("This DOCX file does not contain a readable document body");
  const xml = parseXml(await entry.async("text"));
  const paragraphs = Array.from(xml.getElementsByTagNameNS("*", "p"))
    .map((paragraph) => Array.from(paragraph.getElementsByTagNameNS("*", "t")).map((node) => node.textContent || "").join(""))
    .filter((line) => line.trim());
  if (paragraphs.length === 0) throw new Error("No readable text was found in this DOCX file");
  return [paragraphs];
}

async function extractPptxText(file: File) {
  if (extensionOf(file) !== "pptx") {
    throw new Error("Legacy .ppt files are not browser-readable. Save the file as .pptx in PowerPoint and try again.");
  }
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((left, right) => Number(left.match(/\d+/)?.[0] || 0) - Number(right.match(/\d+/)?.[0] || 0));
  if (slideNames.length === 0) throw new Error("No readable slides were found in this PPTX file");
  const slides: string[][] = [];
  for (const slideName of slideNames) {
    const entry = zip.file(slideName);
    if (!entry) continue;
    const xml = parseXml(await entry.async("text"));
    slides.push(Array.from(xml.getElementsByTagNameNS("*", "t")).map((node) => node.textContent || "").filter(Boolean));
  }
  return slides;
}

async function extractXlsxText(file: File) {
  if (extensionOf(file) !== "xlsx") {
    throw new Error("Legacy .xls files are not supported by the safe local engine. Save the workbook as .xlsx and try again.");
  }
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer() as never);
  const pages: string[][] = [];
  workbook.eachSheet((sheet) => {
    const lines: string[] = [`Worksheet: ${sheet.name}`];
    sheet.eachRow((row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      lines.push(values.map((value) => {
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return "text" in value ? String(value.text) : JSON.stringify(value);
        return String(value);
      }).join("    "));
    });
    pages.push(lines);
  });
  if (pages.length === 0) throw new Error("No readable worksheets were found in this XLSX file");
  return pages;
}

function extractHtmlText(fileContent: string) {
  const documentValue = new DOMParser().parseFromString(fileContent, "text/html");
  const blocks = Array.from(documentValue.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,tr,blockquote,pre"))
    .map((node) => node.textContent?.replace(/\s+/g, " ").trim() || "")
    .filter(Boolean);
  return [blocks.length ? blocks : [documentValue.body.textContent?.trim() || "Empty HTML document"]];
}

function wrapText(text: string, maxWidth: number, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, fontSize: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) line = candidate;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

async function textPagesToPdf(pages: string[][], title: string, landscape = false) {
  const output = await PDFDocument.create();
  const font = await output.embedFont(StandardFonts.Helvetica);
  const bold = await output.embedFont(StandardFonts.HelveticaBold);
  const dimensions: [number, number] = landscape ? [960, 540] : [595.28, 841.89];
  const margin = 48;
  const fontSize = landscape ? 20 : 11;
  const lineHeight = fontSize * 1.45;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    let page = output.addPage(dimensions);
    let y = dimensions[1] - margin;
    page.drawText(pageIndex === 0 ? title : `${title} — ${pageIndex + 1}`, { x: margin, y, size: landscape ? 26 : 16, font: bold, color: rgb(0.16, 0.17, 0.15) });
    y -= landscape ? 48 : 30;

    for (const sourceLine of pages[pageIndex]) {
      for (const line of wrapText(sourceLine || " ", dimensions[0] - margin * 2, font, fontSize)) {
        if (y < margin) {
          page = output.addPage(dimensions);
          y = dimensions[1] - margin;
        }
        page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.12, 0.13, 0.11) });
        y -= lineHeight;
      }
      y -= lineHeight * 0.35;
    }
  }

  return new Blob([new Uint8Array(await output.save()).buffer], { type: "application/pdf" });
}

async function officeToPdf(file: File, mode: DocumentConversionMode): Promise<DocumentProcessResult> {
  const baseName = safeBaseName(file.name);
  let pages: string[][];
  let landscape = false;

  if (mode === "wordToPdf") pages = await extractDocxText(file);
  else if (mode === "powerpointToPdf") {
    pages = await extractPptxText(file);
    landscape = true;
  } else if (mode === "excelToPdf") pages = await extractXlsxText(file);
  else pages = extractHtmlText(await file.text());

  return {
    blob: await textPagesToPdf(pages, file.name, landscape),
    filename: `${baseName}.pdf`,
  };
}

async function pdfToJpg(file: File): Promise<DocumentProcessResult> {
  const pdf = await openPdf(file);
  const zip = new JSZip();
  const baseName = safeBaseName(file.name);
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.7 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport, background: "#ffffff" }).promise;
    zip.file(`${baseName}-page-${String(pageNumber).padStart(3, "0")}.jpg`, await canvasToBlob(canvas, "image/jpeg", 0.92));
  }
  return { blob: await zip.generateAsync({ type: "blob" }), filename: `${baseName}-jpg-pages.zip` };
}

async function pdfToWord(file: File): Promise<DocumentProcessResult> {
  const pages = await extractPdfPages(file);
  const { Document, Packer, Paragraph, PageBreak, TextRun } = await import("docx");
  const children: InstanceType<typeof Paragraph>[] = [];
  pages.forEach((page, index) => {
    children.push(new Paragraph({ children: [new TextRun({ text: `Page ${index + 1}`, bold: true, size: 30 })] }));
    page.lines.forEach((line) => children.push(new Paragraph(line)));
    if (index < pages.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
  });
  const documentValue = new Document({ sections: [{ children }] });
  return { blob: await Packer.toBlob(documentValue), filename: `${safeBaseName(file.name)}.docx` };
}

async function pdfToPowerPoint(file: File): Promise<DocumentProcessResult> {
  const pdf = await openPdf(file);
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "MediaForge";
  pptx.subject = `Converted from ${file.name}`;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.45 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport, background: "#ffffff" }).promise;
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    const slideWidth = 13.333;
    const slideHeight = 7.5;
    const imageRatio = canvas.width / canvas.height;
    const slideRatio = slideWidth / slideHeight;
    const width = imageRatio > slideRatio ? slideWidth : slideHeight * imageRatio;
    const height = imageRatio > slideRatio ? slideWidth / imageRatio : slideHeight;
    slide.addImage({
      data: canvas.toDataURL("image/jpeg", 0.9),
      x: (slideWidth - width) / 2,
      y: (slideHeight - height) / 2,
      w: width,
      h: height,
    });
  }

  const value = await pptx.write({ outputType: "blob", compression: true });
  return { blob: bufferBlob(value as Blob | ArrayBuffer | Uint8Array, OFFICE_MIME.pptx), filename: `${safeBaseName(file.name)}.pptx` };
}

async function pdfToExcel(file: File): Promise<DocumentProcessResult> {
  const pages = await extractPdfPages(file);
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MediaForge";
  pages.forEach((page, index) => {
    const sheet = workbook.addWorksheet(`Page ${index + 1}`);
    page.lines.forEach((line) => sheet.addRow(line.split(/\s{2,}|\t/).filter(Boolean)));
    sheet.columns.forEach((column) => { column.width = 24; });
  });
  const bytes = await workbook.xlsx.writeBuffer();
  return { blob: bufferBlob(new Uint8Array(bytes), OFFICE_MIME.xlsx), filename: `${safeBaseName(file.name)}.xlsx` };
}

async function ocrPdf(file: File): Promise<DocumentProcessResult> {
  const pdf = await openPdf(file);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const output = await PDFDocument.create();
  const font = await output.embedFont(StandardFonts.Helvetica);

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport, background: "#ffffff" }).promise;
      const imageBlob = await canvasToBlob(canvas, "image/png");
      const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
      const image = await output.embedPng(imageBytes);
      const outputPage = output.addPage([viewport.width, viewport.height]);
      outputPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
      const recognition = await worker.recognize(canvas);
      const text = recognition.data.text.replace(/\s+/g, " ").trim();
      if (text) outputPage.drawText(text.slice(0, 12000), { x: 2, y: 2, size: 1, font, color: rgb(1, 1, 1), opacity: 0.01, maxWidth: viewport.width - 4 });
    }
  } finally {
    await worker.terminate();
  }

  return { blob: new Blob([new Uint8Array(await output.save()).buffer], { type: "application/pdf" }), filename: `${safeBaseName(file.name)}-ocr.pdf` };
}

async function comparePdfs(files: File[]): Promise<DocumentProcessResult> {
  if (files.length !== 2) throw new Error("PDF comparison requires exactly two files");
  const [leftPages, rightPages] = await Promise.all(files.map(extractPdfPages));
  const maximumPages = Math.max(leftPages.length, rightPages.length);
  const lines = [
    "MediaForge PDF text comparison",
    `A: ${files[0].name}`,
    `B: ${files[1].name}`,
    "",
  ];
  for (let index = 0; index < maximumPages; index += 1) {
    const left = leftPages[index]?.lines.join("\n") || "[missing page]";
    const right = rightPages[index]?.lines.join("\n") || "[missing page]";
    lines.push(`PAGE ${index + 1}: ${left === right ? "MATCH" : "DIFFERENT"}`);
    if (left !== right) {
      lines.push("--- A ---", left, "--- B ---", right);
    }
    lines.push("");
  }
  return { blob: textBlob(lines.join("\n")), filename: `${safeBaseName(files[0].name)}-comparison.txt` };
}

export async function processDocumentConversion(files: File[], mode: DocumentConversionMode): Promise<DocumentProcessResult> {
  if (files.length === 0) throw new Error("Choose a file first");
  if (["wordToPdf", "powerpointToPdf", "excelToPdf", "htmlToPdf"].includes(mode)) return officeToPdf(files[0], mode);
  if (mode === "pdfToJpg") return pdfToJpg(files[0]);
  if (mode === "pdfToWord") return pdfToWord(files[0]);
  if (mode === "pdfToPowerPoint") return pdfToPowerPoint(files[0]);
  if (mode === "pdfToExcel") return pdfToExcel(files[0]);
  if (mode === "ocrPdf") return ocrPdf(files[0]);
  if (mode === "comparePdf") return comparePdfs(files);
  throw new Error("Unsupported document conversion");
}

export function acceptedDocumentTypes(mode: DocumentConversionMode) {
  if (mode === "wordToPdf") return ".docx,.doc";
  if (mode === "powerpointToPdf") return ".pptx,.ppt";
  if (mode === "excelToPdf") return ".xlsx,.xls";
  if (mode === "htmlToPdf") return ".html,.htm,text/html";
  return "application/pdf,.pdf";
}

export function documentModeSupportsMultiple(mode: DocumentConversionMode) {
  return mode === "comparePdf";
}
