# MediaForge

MediaForge is a light-mode, local-first media utility for browser-based media, video, image, PDF, and document operations.

The default file workflow is:

```txt
Input file -> Browser memory -> Local processing -> Browser Blob download
```

The app should not upload selected user files to MediaForge API routes for normal conversion, modification, PDF organization, background removal, image detail/upscale, or browser-native video exports.

## Local tools

- Image Modifier: resize, crop, rotate, watermark, caption, compress, and convert images with Canvas.
- Image Format Converter: export images through browser-native Canvas encoders.
- Image Resizer: resize images locally.
- Image Compressor: compress images locally where supported by the browser.
- Favicon Builder: generate PNG sizes, ICO, manifest, and ZIP locally with Canvas and JSZip.
- QR Generator: generate PNG, JPEG, or SVG QR codes in the browser.
- Frame Extractor: seek a local video and export a still image with video and Canvas APIs.
- Image Detailer: upscale and apply a local detail pass without server upload.
- Background Remover: removes backgrounds with a browser-side model. The model/WASM assets may download on first use, but the image file is processed in the browser.
- Video Converter: exports local WebM through browser Canvas and MediaRecorder.
- Video Detail Upscaler: renders a larger local WebM through Canvas and MediaRecorder.
- Watermark Remover: softens a selected video region locally and exports WebM.
- PDF Organizer: merge, split, rotate, watermark, number, reorder, and create PDFs from images in the browser with pdf-lib.
- Universal File Converter: convert images, structured data, Markdown, HTML, TXT, and PDF exports locally.

## Network tool

- Video Downloader: fetches media from a public URL. This is a network tool by definition and is separate from local file conversion. Only download media you own or have permission to use.
- Report Feedback: sends text-only feedback through `/api/report`. This is a network/contact feature, not a local file processor. It does not accept file attachments.

## Report delivery

The report form logs submissions server-side and can forward them to an external webhook.

Set this environment variable in deployment settings for reliable delivery:

```txt
MEDIAFORGE_REPORT_WEBHOOK_URL=https://...
```

Supported webhook targets:

- Discord incoming webhook
- Slack incoming webhook
- Generic JSON webhook

If the webhook is not configured, reports are accepted and written to server logs only.

## Known limitations

- Browser-native video export is WebM. MP4, MOV, AVI, MKV, GIF, audio extraction, and high-quality muxing require a future local FFmpeg WASM engine.
- Browser-native video processing runs in real time and can be slow for long clips.
- Canvas video export currently strips audio.
- Background removal downloads and caches model/runtime assets on first use.
- Browser image export support varies. Some browsers may not support AVIF or WebP encoding.
- Local processing depends on the user's CPU, RAM, browser, and available memory.

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
