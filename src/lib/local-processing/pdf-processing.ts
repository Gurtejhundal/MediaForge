import JSZip from "jszip";
import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { safeBaseName } from "./blob-utils";

export type PdfMode = "merge" | "split" | "rotate" | "watermark" | "pageNumbers" | "organize" | "jpgToPdf";
export type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface PdfProcessOptions {
  mode: PdfMode;
  pages?: string;
  pageOrder?: string;
  splitEveryPage?: boolean;
  angle?: string;
  watermarkText?: string;
  position?: WatermarkPosition;
  opacity?: number;
}

export interface PdfProcessResult {
  blob: Blob;
  filename: string;
}

function parsePages(input: string | undefined, totalPages: number) {
  if (!input?.trim()) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const selected = new Set<number>();
  const parts = input.split(",").map((part) => part.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const [startRaw, endRaw] = part.split("-");
      const start = Number.parseInt(startRaw, 10);
      const end = Number.parseInt(endRaw, 10);

      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) {
        throw new Error("Invalid page range");
      }

      for (let page = start; page <= end; page += 1) {
        if (page <= totalPages) selected.add(page - 1);
      }
    } else {
      const page = Number.parseInt(part, 10);
      if (!Number.isFinite(page) || page < 1 || page > totalPages) {
        throw new Error("Invalid page number");
      }
      selected.add(page - 1);
    }
  }

  return [...selected];
}

function parseOrder(input: string | undefined, totalPages: number) {
  if (!input?.trim()) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const order = input
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((page) => Number.isFinite(page));

  if (order.length === 0 || order.some((page) => page < 1 || page > totalPages)) {
    throw new Error("Invalid page order");
  }

  return order.map((page) => page - 1);
}

function getPosition(position: WatermarkPosition, pageWidth: number, pageHeight: number, textWidth: number, fontSize: number) {
  const margin = 42;

  switch (position) {
    case "top-left":
      return { x: margin, y: pageHeight - margin - fontSize };
    case "top-right":
      return { x: pageWidth - margin - textWidth, y: pageHeight - margin - fontSize };
    case "bottom-left":
      return { x: margin, y: margin };
    case "bottom-right":
      return { x: pageWidth - margin - textWidth, y: margin };
    case "center":
    default:
      return { x: (pageWidth - textWidth) / 2, y: pageHeight / 2 };
  }
}

async function fileBytes(file: File) {
  return new Uint8Array(await file.arrayBuffer());
}

function pdfBlob(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes);
  return new Blob([copy.buffer], { type: "application/pdf" });
}

export async function processPdfLocally(files: File[], options: PdfProcessOptions): Promise<PdfProcessResult> {
  if (files.length === 0) throw new Error("Choose files first");

  if (options.mode === "jpgToPdf") {
    const outputPdf = await PDFDocument.create();

    for (const file of files) {
      if (!file.type.startsWith("image/")) throw new Error("Images to PDF only accepts image files");
      const bytes = await fileBytes(file);
      const image = file.type === "image/png"
        ? await outputPdf.embedPng(bytes)
        : await outputPdf.embedJpg(bytes);
      const page = outputPdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }

    return { blob: pdfBlob(await outputPdf.save()), filename: "images-to-pdf.pdf" };
  }

  if (files.some((file) => file.type && file.type !== "application/pdf")) {
    throw new Error("Only PDF files are supported for this operation");
  }

  if (options.mode === "merge") {
    if (files.length < 2) throw new Error("Merge needs at least two PDFs");
    const outputPdf = await PDFDocument.create();

    for (const file of files) {
      const sourcePdf = await PDFDocument.load(await fileBytes(file), { ignoreEncryption: true });
      const copiedPages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      copiedPages.forEach((page) => outputPdf.addPage(page));
    }

    return { blob: pdfBlob(await outputPdf.save()), filename: "merged.pdf" };
  }

  const sourceFile = files[0];
  const baseName = safeBaseName(sourceFile.name);
  const sourcePdf = await PDFDocument.load(await fileBytes(sourceFile), { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();

  if (options.mode === "split" && options.splitEveryPage) {
    const zip = new JSZip();

    for (let index = 0; index < totalPages; index += 1) {
      const singlePdf = await PDFDocument.create();
      const [page] = await singlePdf.copyPages(sourcePdf, [index]);
      singlePdf.addPage(page);
      zip.file(`${baseName}-page-${index + 1}.pdf`, await singlePdf.save());
    }

    return {
      blob: await zip.generateAsync({ type: "blob" }),
      filename: `${baseName}-split-pages.zip`,
    };
  }

  const outputPdf = await PDFDocument.create();

  if (options.mode === "split") {
    const copiedPages = await outputPdf.copyPages(sourcePdf, parsePages(options.pages, totalPages));
    copiedPages.forEach((page) => outputPdf.addPage(page));
    return { blob: pdfBlob(await outputPdf.save()), filename: `${baseName}-split.pdf` };
  }

  if (options.mode === "organize") {
    const copiedPages = await outputPdf.copyPages(sourcePdf, parseOrder(options.pageOrder, totalPages));
    copiedPages.forEach((page) => outputPdf.addPage(page));
    return { blob: pdfBlob(await outputPdf.save()), filename: `${baseName}-organized.pdf` };
  }

  const copiedPages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  copiedPages.forEach((page) => outputPdf.addPage(page));

  if (options.mode === "rotate") {
    const angle = Number.parseInt(options.angle || "90", 10);
    const pageIndices = new Set(parsePages(options.pages, totalPages));

    outputPdf.getPages().forEach((page, index) => {
      if (pageIndices.has(index)) page.setRotation(degrees(angle));
    });

    return { blob: pdfBlob(await outputPdf.save()), filename: `${baseName}-rotated.pdf` };
  }

  if (options.mode === "watermark") {
    const text = (options.watermarkText || "CONFIDENTIAL").trim();
    const opacity = Math.min(1, Math.max(0.05, options.opacity ?? 0.25));
    const position = options.position || "center";
    const font = await outputPdf.embedFont(StandardFonts.HelveticaBold);

    outputPdf.getPages().forEach((page) => {
      const { width, height } = page.getSize();
      const fontSize = Math.max(24, Math.round(width * 0.055));
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const point = getPosition(position, width, height, textWidth, fontSize);

      page.drawText(text, {
        ...point,
        size: fontSize,
        font,
        color: rgb(0.85, 0.1, 0.1),
        opacity,
        rotate: position === "center" ? degrees(-32) : undefined,
      });
    });

    return { blob: pdfBlob(await outputPdf.save()), filename: `${baseName}-watermarked.pdf` };
  }

  if (options.mode === "pageNumbers") {
    const font = await outputPdf.embedFont(StandardFonts.Helvetica);

    outputPdf.getPages().forEach((page, index) => {
      const { width } = page.getSize();
      const text = `${index + 1} / ${totalPages}`;
      const fontSize = 10;
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: 24,
        size: fontSize,
        font,
        color: rgb(0.28, 0.28, 0.28),
      });
    });

    return { blob: pdfBlob(await outputPdf.save()), filename: `${baseName}-numbered.pdf` };
  }

  throw new Error("Unsupported PDF operation");
}
