import sharp from "sharp";

export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'avif' | 'heif';

export async function convertFormat(inputBuffer: Buffer, targetFormat: ImageFormat, quality?: number): Promise<Buffer> {
  let pipeline = sharp(inputBuffer);

  switch (targetFormat) {
    case 'png':
      pipeline = pipeline.png({ quality });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: quality || 90 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: quality || 80 });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: quality || 80 });
      break;
    case 'heif':
      pipeline = pipeline.heif({ quality: quality || 80 });
      break;
  }

  return await pipeline.toBuffer();
}

export async function resizeImage(inputBuffer: Buffer, width?: number, height?: number): Promise<Buffer> {
  const metadata = await sharp(inputBuffer).metadata();
  
  return await sharp(inputBuffer)
    .resize(width || null, height || null, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent
    })
    .toBuffer();
}

export async function compressImage(inputBuffer: Buffer, quality: number, format: ImageFormat = 'webp'): Promise<Buffer> {
  return await convertFormat(inputBuffer, format, quality);
}
