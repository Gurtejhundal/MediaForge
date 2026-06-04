# MediaForge

MediaForge is a light-mode, local-first media utility for common browser-safe media operations.

Most core file tools run directly in the browser. Files selected for those tools stay in the current browser session, are processed with browser APIs such as File, Blob, Canvas, object URLs, and JSZip, then export through a local Blob download.

MediaForge is not 100% local. Network and server-assisted tools are marked separately.

## Local-first tools

- Image Modifier: resize, crop, rotate, watermark, meme text, compress, and convert images with Canvas.
- Image Format Converter: convert images through browser-native Canvas export.
- Image Resizer: resize images locally.
- Image Compressor: compress to WebP locally where supported by the browser.
- Favicon Builder: generate PNG sizes, ICO, manifest, and ZIP locally with Canvas and JSZip.
- QR Generator: generate PNG, JPEG, or SVG QR codes in the browser.
- Frame Extractor: open a local video, seek to a timestamp, draw the frame to Canvas, and export an image Blob.

## Server-assisted or network tools

These features may upload files to an app route, use Node/FFmpeg/Sharp, or fetch external URLs:

- Video Downloader
- Video Converter
- Video Detail Upscaler
- Video Watermark Remover
- Background Remover
- Image Detailer
- PDF Organizer
- Universal File Converter

## Local-first contract

For local tools, the default flow is:

```txt
Input file -> Browser memory -> Local processing -> Browser Blob download
```

Server-assisted tools are not covered by the no-upload promise.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

Before shipping changes, run:

```bash
npm run lint
npm run build
```

Browser verification should confirm that local tools do not send selected files to `/api/convert/*` routes and that downloads are generated from local Blob URLs.
