import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { 
  csvToJson, 
  jsonToCsv, 
  jsonToXml, 
  xmlToJson, 
  jsonToYaml, 
  yamlToJson, 
  mdToHtml, 
  textToPdf 
} from "@/lib/fileConverter";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds limit

const IMAGE_FORMATS = ["png", "jpeg", "webp", "tiff", "gif", "avif"];
const TEXT_FORMATS = ["csv", "json", "xml", "yaml", "html", "txt", "pdf"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetFormat = (formData.get("format") as string || "").toLowerCase().trim();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const inputName = file.name;
    const inputExt = (inputName.split('.').pop() || "").toLowerCase();
    const baseName = inputName.replace(/\.[^.]+$/, "");

    // 1. IMAGE CONVERSIONS (using Sharp)
    if (IMAGE_FORMATS.includes(targetFormat)) {
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);
      let pipeline = sharp(inputBuffer);

      switch (targetFormat) {
        case "png":
          pipeline = pipeline.png();
          break;
        case "jpeg":
          pipeline = pipeline.jpeg({ quality: 90 });
          break;
        case "webp":
          pipeline = pipeline.webp({ quality: 80 });
          break;
        case "tiff":
          pipeline = pipeline.tiff();
          break;
        case "gif":
          pipeline = pipeline.gif();
          break;
        case "avif":
          pipeline = pipeline.avif();
          break;
      }

      const resultBuffer = await pipeline.toBuffer();
      const mimeType = `image/${targetFormat === "jpeg" ? "jpeg" : targetFormat}`;
      const downloadExt = targetFormat === "jpeg" ? "jpg" : targetFormat;

      return new NextResponse(new Uint8Array(resultBuffer), {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${baseName}.${downloadExt}"`,
        },
      });
    }

    // 2. DATA / TEXT / DOCUMENT CONVERSIONS
    if (TEXT_FORMATS.includes(targetFormat)) {
      const textContent = await file.text();
      let intermediateJson: any = null;

      // STEP 2a: Parse input file to JSON (if data file)
      if (["json", "csv", "xml", "yaml"].includes(inputExt)) {
        try {
          if (inputExt === "json") {
            intermediateJson = JSON.parse(textContent);
          } else if (inputExt === "csv") {
            intermediateJson = csvToJson(textContent);
          } else if (inputExt === "xml") {
            intermediateJson = xmlToJson(textContent);
          } else if (inputExt === "yaml" || inputExt === "yml") {
            intermediateJson = yamlToJson(textContent);
          }
        } catch (parseError: any) {
          return NextResponse.json({ error: `Failed to parse input file: ${parseError.message}` }, { status: 400 });
        }
      }

      // STEP 2b: Convert to target format
      let outputContent: string | Buffer = "";
      let mimeType = "text/plain";
      let downloadExt = targetFormat;

      if (intermediateJson !== null) {
        // Output from Data to Data
        switch (targetFormat) {
          case "json":
            outputContent = JSON.stringify(intermediateJson, null, 2);
            mimeType = "application/json";
            break;
          case "csv":
            outputContent = jsonToCsv(intermediateJson);
            mimeType = "text/csv";
            break;
          case "xml":
            outputContent = jsonToXml(intermediateJson);
            mimeType = "application/xml";
            break;
          case "yaml":
            outputContent = jsonToYaml(intermediateJson);
            mimeType = "application/x-yaml";
            break;
          case "txt":
            outputContent = JSON.stringify(intermediateJson, null, 2);
            mimeType = "text/plain";
            break;
          case "pdf":
            // Convert intermediate JSON string to PDF
            outputContent = textToPdf(JSON.stringify(intermediateJson, null, 2));
            mimeType = "application/pdf";
            break;
          default:
            return NextResponse.json({ error: `Conversion from ${inputExt} to ${targetFormat} not supported.` }, { status: 400 });
        }
      } else {
        // Document structures (Markdown, HTML, Plain Text)
        if (inputExt === "md" || inputExt === "markdown") {
          if (targetFormat === "html") {
            outputContent = mdToHtml(textContent);
            mimeType = "text/html";
          } else if (targetFormat === "txt") {
            outputContent = textContent;
            mimeType = "text/plain";
          } else if (targetFormat === "pdf") {
            outputContent = textToPdf(textContent);
            mimeType = "application/pdf";
          } else {
            return NextResponse.json({ error: `Cannot convert Markdown to ${targetFormat}` }, { status: 400 });
          }
        } else if (inputExt === "html") {
          if (targetFormat === "txt") {
            // Strip tags
            outputContent = textContent.replace(/<[^>]*>/g, "");
            mimeType = "text/plain";
          } else if (targetFormat === "pdf") {
            outputContent = textToPdf(textContent.replace(/<[^>]*>/g, ""));
            mimeType = "application/pdf";
          } else {
            return NextResponse.json({ error: `Cannot convert HTML to ${targetFormat}` }, { status: 400 });
          }
        } else if (inputExt === "txt") {
          if (targetFormat === "html") {
            outputContent = `<!DOCTYPE html><html><body><pre>${textContent}</pre></body></html>`;
            mimeType = "text/html";
          } else if (targetFormat === "pdf") {
            outputContent = textToPdf(textContent);
            mimeType = "application/pdf";
          } else if (targetFormat === "json") {
            outputContent = JSON.stringify({ text: textContent }, null, 2);
            mimeType = "application/json";
          } else {
            outputContent = textContent;
            mimeType = "text/plain";
          }
        } else if (inputExt === "pdf") {
          return NextResponse.json({ error: "Converting FROM PDF is not supported client-side." }, { status: 400 });
        } else {
          return NextResponse.json({ error: `Unsupported input format: ${inputExt}` }, { status: 400 });
        }
      }

      const body = typeof outputContent === "string" ? Buffer.from(outputContent, "utf-8") : outputContent;

      return new NextResponse(new Uint8Array(body), {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${baseName}.${downloadExt}"`,
        },
      });
    }

    return NextResponse.json({ error: `Target format ${targetFormat} not supported.` }, { status: 400 });

  } catch (error: any) {
    console.error("Universal file converter error:", error);
    return NextResponse.json({ error: error.message || "Failed to convert file." }, { status: 500 });
  }
}
