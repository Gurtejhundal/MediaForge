import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type PdfMode = "merge" | "split" | "rotate" | "watermark" | "pageNumbers" | "organize" | "jpgToPdf";
type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const MAX_FILE_BYTES = 35 * 1024 * 1024;

function sanitizeBaseName(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "").trim();
  const sanitized = withoutExtension
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "document";
}

async function readFileBytes(file: File) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} exceeds the 35MB limit`);
  }

  return Buffer.from(await file.arrayBuffer());
}

function parsePages(input: string | null, totalPages: number) {
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

function parseOrder(input: string | null, totalPages: number) {
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

function responsePdf(bytes: Uint8Array, filename: string) {
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const mode = ((formData.get("mode") as string | null) || "merge") as PdfMode;
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (mode === "jpgToPdf") {
      const outputPdf = await PDFDocument.create();

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          return NextResponse.json({ error: "JPG to PDF only accepts image files" }, { status: 400 });
        }

        const bytes = await readFileBytes(file);
        const image = file.type === "image/png"
          ? await outputPdf.embedPng(bytes)
          : await outputPdf.embedJpg(bytes);

        const page = outputPdf.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }

      return responsePdf(await outputPdf.save(), "images-to-pdf.pdf");
    }

    if (files.some((file) => file.type && file.type !== "application/pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported for this operation" }, { status: 400 });
    }

    if (mode === "merge") {
      const outputPdf = await PDFDocument.create();

      for (const file of files) {
        const sourcePdf = await PDFDocument.load(await readFileBytes(file), { ignoreEncryption: true });
        const copiedPages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        copiedPages.forEach((page) => outputPdf.addPage(page));
      }

      return responsePdf(await outputPdf.save(), "merged.pdf");
    }

    const sourceFile = files[0];
    const sourcePdf = await PDFDocument.load(await readFileBytes(sourceFile), { ignoreEncryption: true });
    const totalPages = sourcePdf.getPageCount();
    const baseName = sanitizeBaseName(sourceFile.name);

    if (mode === "split" && formData.get("splitEveryPage") === "true") {
      const zip = new JSZip();

      for (let index = 0; index < totalPages; index += 1) {
        const singlePdf = await PDFDocument.create();
        const [page] = await singlePdf.copyPages(sourcePdf, [index]);
        singlePdf.addPage(page);
        zip.file(`${baseName}-page-${index + 1}.pdf`, await singlePdf.save());
      }

      const zipBytes = await zip.generateAsync({ type: "uint8array" });
      return new NextResponse(Buffer.from(zipBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${baseName}-split-pages.zip"`,
        },
      });
    }

    const outputPdf = await PDFDocument.create();

    if (mode === "split") {
      const pageIndices = parsePages(formData.get("pages") as string | null, totalPages);
      const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach((page) => outputPdf.addPage(page));
      return responsePdf(await outputPdf.save(), `${baseName}-split.pdf`);
    }

    if (mode === "organize") {
      const pageIndices = parseOrder(formData.get("pageOrder") as string | null, totalPages);
      const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach((page) => outputPdf.addPage(page));
      return responsePdf(await outputPdf.save(), `${baseName}-organized.pdf`);
    }

    const copiedPages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => outputPdf.addPage(page));

    if (mode === "rotate") {
      const angle = Number.parseInt((formData.get("angle") as string | null) || "90", 10);
      const pageIndices = new Set(parsePages(formData.get("pages") as string | null, totalPages));

      outputPdf.getPages().forEach((page, index) => {
        if (pageIndices.has(index)) {
          page.setRotation(degrees(angle));
        }
      });

      return responsePdf(await outputPdf.save(), `${baseName}-rotated.pdf`);
    }

    if (mode === "watermark") {
      const text = ((formData.get("watermarkText") as string | null) || "CONFIDENTIAL").trim();
      const opacity = Math.min(1, Math.max(0.05, Number.parseFloat((formData.get("opacity") as string | null) || "0.25")));
      const position = ((formData.get("position") as string | null) || "center") as WatermarkPosition;
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

      return responsePdf(await outputPdf.save(), `${baseName}-watermarked.pdf`);
    }

    if (mode === "pageNumbers") {
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

      return responsePdf(await outputPdf.save(), `${baseName}-numbered.pdf`);
    }

    return NextResponse.json({ error: "Unsupported PDF operation" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process PDF";
    console.error("PDF organizer error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
