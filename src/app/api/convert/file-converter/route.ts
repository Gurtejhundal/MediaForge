import { NextRequest, NextResponse } from "next/server";
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

const TEXT_FORMATS = ["csv", "json", "xml", "yaml", "html", "txt", "pdf"];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown conversion error";
}

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

    if (file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error:
            "Image conversion is browser-local only. Use Image Modifier, Format Converter, Resizer, or Compressor.",
        },
        { status: 410 },
      );
    }

    // DATA / TEXT / DOCUMENT CONVERSIONS
    if (TEXT_FORMATS.includes(targetFormat)) {
      const textContent = await file.text();
      let intermediateJson: unknown = null;

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
        } catch (parseError: unknown) {
          return NextResponse.json({ error: `Failed to parse input file: ${getErrorMessage(parseError)}` }, { status: 400 });
        }
      }

      // STEP 2b: Convert to target format
      let outputContent: string | Buffer = "";
      let mimeType = "text/plain";
      const downloadExt = targetFormat;

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

  } catch (error: unknown) {
    console.error("Universal file converter error:", error);
    return NextResponse.json({ error: getErrorMessage(error) || "Failed to convert file." }, { status: 500 });
  }
}
