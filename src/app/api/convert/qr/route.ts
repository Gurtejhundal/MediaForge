import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const text = formData.get("text") as string;
    const format = formData.get("format") as "png" | "jpeg" | "webp" || "png";
    const darkColor = (formData.get("dark") as string) || "#000000";
    const lightColor = (formData.get("light") as string) || "#ffffff";
    const margin = parseInt(formData.get("margin") as string) || 4;
    const errorCorrection = (formData.get("errorCorrection") as string) || "M";
    
    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Text content is required to generate a QR Code." }, { status: 400 });
    }

    const options: QRCode.QRCodeToDataURLOptions = {
      type: format === 'jpeg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png'),
      margin: margin,
      color: {
        dark: darkColor,
        light: lightColor
      },
      errorCorrectionLevel: errorCorrection as "L" | "M" | "Q" | "H",
      width: 1024 // Generate high resolution by default
    };

    const qrOptions: any = {
       ...options, // QRCode package handles toBuffer options similarly
       type: format === 'jpeg' ? 'jpeg' : 'png' // toBuffer only directly supports png/jpeg formally, but we can return it.
    };

    // For direct image streaming, Buffer is best.
    const resultBuffer = (await QRCode.toBuffer(text, qrOptions)) as unknown as ArrayBufferLike;

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';

    return new NextResponse(new Uint8Array(resultBuffer) as any, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="qr-code.${format === 'jpeg' ? 'jpg' : 'png'}"`
      }
    });

  } catch (error: any) {
    console.error("QR Code generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate QR Code." }, { status: 500 });
  }
}
