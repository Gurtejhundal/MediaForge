# MediaForge Local-First Architecture

## 1. Product Principle

MediaForge must be designed as a **local-first web application**.

That means users open the website, select files from their computer or mobile device, process those files inside the browser/device, and download/export the result directly from the same browser session.

The default user promise is:

> Your files stay on your device. MediaForge processes them locally in your browser whenever technically possible.

This is not a normal upload-to-server converter. The product should not silently upload a user file, process it on a backend, and return a download unless the user explicitly chooses a server-assisted mode.

---

## 2. Non-Negotiable Rule

### Default Mode

```txt
Input file → Browser memory / local browser storage → Local processing → Browser download
```

### Forbidden Default Flow

```txt
Input file → Upload to MediaForge server → Server processing → Download from server
```

This second flow destroys the privacy promise and makes MediaForge look like every other online converter.

---

## 3. Core UX Promise

Use this language across the interface:

```txt
No upload required
Files are processed in your browser.
```

```txt
Your file stays on this device unless you choose a server-assisted feature.
```

```txt
Processed locally. Ready to export.
```

Avoid vague wording:

```txt
Secure upload
Cloud optimized
Private processing
Fast online conversion
```

Those phrases are weak because they imply server handling.

---

## 4. Technical Architecture

## 4.1 Browser-Only Processing Pipeline

The ideal processing flow:

```txt
User selects file
↓
File API creates File object
↓
Object URL / ArrayBuffer / stream is created locally
↓
Processing runs in browser using Canvas, Web Workers, WebAssembly, WebCodecs, or browser-native APIs
↓
Output Blob is generated
↓
Download link is created with URL.createObjectURL()
↓
User saves result locally
```

No file should be sent to `/api/upload`, `/api/convert`, `/api/compress`, or any server route by default.

---

## 4.2 Recommended Browser APIs

### File Selection

Use:

- `<input type="file">`
- Drag and drop
- `File` / `Blob`
- `ArrayBuffer`
- `URL.createObjectURL()`

Purpose:

- Let users open files from their own device
- Preview files without uploading them
- Generate downloadable output blobs

### Background Processing

Use:

- Web Workers
- Worker pools for batch jobs
- Progress messages from worker to UI

Purpose:

- Prevent the UI from freezing
- Keep heavy conversion/compression work off the main thread

### Temporary Local Storage

Use:

- IndexedDB for job history and small generated files
- Origin Private File System when large local temporary files are needed
- Browser memory for simple one-shot jobs

Purpose:

- Store temporary processing artifacts locally
- Allow larger workflows without server storage

### Image Processing

Use:

- Canvas / OffscreenCanvas where supported
- `createImageBitmap()` for decoding
- `canvas.toBlob()` or `OffscreenCanvas.convertToBlob()` for export
- WebAssembly codecs for formats the browser cannot natively encode

Purpose:

- Resize
- Compress
- Convert common image formats
- Generate thumbnails/previews

### Video Processing

Use:

- Native `<video>` element for preview and frame seeking
- Canvas for basic frame extraction
- WebCodecs where available for advanced frame-level processing
- `ffmpeg.wasm` only for heavier local video/audio operations

Purpose:

- Extract frames
- Generate GIFs or short clips
- Convert small videos locally

Important: browser video processing is CPU/RAM-heavy. Do not pretend it will handle every large 4K video smoothly.

---

## 5. Current Stack Reality Check

The current repo includes server-oriented or Node-oriented dependencies. These are useful, but they conflict with a strict browser-local promise if used for user files by default.

### Problematic for Strict Local-First

| Dependency / Pattern | Issue |
|---|---|
| `sharp` | Node/server-side image processing, not normal browser processing |
| `multer` | Used for server-side uploads |
| Server Actions for file processing | Can move user file work to the server |
| API routes receiving files | Means user files leave the browser |
| `@distube/ytdl-core` | Server-side YouTube/download logic; not a local document processor |

### Keep Only If Clearly Separated

These can remain only if the UI clearly labels them as server-assisted or network-based features.

Example:

```txt
Server-assisted feature
This action may contact external services or process data outside your browser.
```

But for core image/document/file tools, the default should be local.

---

## 6. Recommended Stack Shift

## 6.1 Frontend

Keep:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Shadcn/Base UI components
- Framer Motion, used lightly

## 6.2 Local Processing Layer

Add a dedicated local processing layer:

```txt
/src/lib/local-processing/
  image-worker.ts
  video-worker.ts
  qr-worker.ts
  favicon-worker.ts
  file-utils.ts
  blob-utils.ts
  capability-detect.ts
```

## 6.3 Workers

Use workers for heavy work:

```txt
/src/workers/
  image-converter.worker.ts
  compressor.worker.ts
  resizer.worker.ts
  favicon.worker.ts
  video-frame.worker.ts
  gif.worker.ts
```

## 6.4 Storage

Use:

```txt
/src/lib/storage/
  indexeddb.ts
  opfs.ts
  local-job-history.ts
```

Store only:

- Job settings
- Recent tool choices
- Optional local history metadata
- Optional temporary blobs with user consent

Do not silently store sensitive files forever.

---

## 7. Feature-by-Feature Local Strategy

## 7.1 Image Converter

### Local-First Plan

- Read selected file as `Blob` or `ArrayBuffer`
- Decode using browser image APIs where supported
- Convert using Canvas/WebAssembly codecs
- Export result as a local `Blob`
- Trigger browser download

### UX Copy

```txt
Converted locally in your browser.
```

### Limitation Copy

```txt
This browser cannot export HEIF locally. Choose PNG, JPEG, WEBP, or AVIF.
```

---

## 7.2 Image Resizer

### Local-First Plan

- Decode image locally
- Draw to Canvas/OffscreenCanvas
- Apply dimensions and fit mode
- Export with `toBlob()` / `convertToBlob()`

### UX Copy

```txt
Resize runs on this device. No upload required.
```

---

## 7.3 Image Compressor

### Local-First Plan

- Use browser-native export for JPEG/WEBP/PNG where available
- Use WASM codecs for advanced formats if needed
- Show estimated output only after local processing or analysis

### UX Copy

```txt
Compression happens locally. Large files may use more memory.
```

---

## 7.4 Favicon Builder

### Local-First Plan

- Decode source image locally
- Generate required sizes using Canvas
- Generate `.ico` in browser using a client-side ICO encoder or WASM helper
- Package outputs with `JSZip`
- Download ZIP directly from browser

### UX Copy

```txt
Favicon package generated on your device.
```

---

## 7.5 QR Code Generator

### Local-First Plan

This should be fully local.

- Generate QR matrix in browser
- Render preview locally
- Export PNG/JPEG/SVG as Blob

### UX Copy

```txt
QR code generated locally.
```

---

## 7.6 Frame Extractor

### Local-First Plan

- User selects video file locally
- Preview using `<video>` object URL
- Seek to timestamp
- Draw current frame to Canvas
- Export PNG/JPEG/WebP Blob

### UX Copy

```txt
Frame extracted locally from your selected video.
```

---

## 7.7 GIF Generator

### Local-First Plan

- For short clips: use browser video + Canvas frame capture + GIF encoder worker
- For heavier jobs: use `ffmpeg.wasm`
- Run inside worker
- Warn users about memory cost

### UX Copy

```txt
GIF generation uses your device CPU. Keep clips short for best performance.
```

---

## 7.8 Video Downloader

This is different from local document processing.

A downloader needs network access by definition. It is not the same privacy story as converting a local file.

### Required UX Separation

Label this feature separately:

```txt
Network tool
This feature fetches media from a URL. It is not a local-only file operation.
```

### Legal/Permission Copy

```txt
Only download media you own or have permission to use.
```

### Architecture Rule

Do not mix this feature into the same privacy promise as local file conversion.

---

## 8. Server Policy

The server should be used for:

- Serving the web app
- Serving static assets
- Optional analytics if privacy-safe and disclosed
- Optional server-assisted tools clearly labeled as such

The server should not be used by default for:

- Uploading user files
- Processing user images
- Processing user videos
- Storing user files
- Returning converted documents

---

## 9. Capability Detection

Different browsers support different local features. MediaForge must detect capabilities at runtime.

Create:

```txt
capability-detect.ts
```

It should check:

- Canvas export support
- WebP export support
- AVIF support
- File System Access API support
- OPFS support
- Web Workers support
- WebCodecs support
- SharedArrayBuffer support for ffmpeg.wasm multi-threading
- Available memory hints where possible

### UI Pattern

Show honest feature status:

```txt
Available locally
Limited in this browser
Server-assisted option required
Unsupported
```

Do not hide limitations.

---

## 10. Privacy UI Requirements

Add a visible privacy/local status badge in the workspace.

### Badge Examples

```txt
Local processing
No upload
Browser-only
```

For server-assisted features:

```txt
Server-assisted
Uploads required
```

### File Handling Notice

Place near upload zone:

```txt
Files selected here stay in your browser session unless a feature is marked server-assisted.
```

### Export Notice

Place near download button:

```txt
Download is generated locally from this browser.
```

---

## 11. UI Flow

## 11.1 Correct Local File Flow

```txt
Open MediaForge
↓
Choose a tool
↓
Select/drop local file
↓
Browser previews file using object URL
↓
User adjusts settings
↓
Worker processes file locally
↓
Output Blob is created
↓
User downloads result
```

## 11.2 Upload Zone Copy

```txt
Drop a file here
Processed locally in your browser. No upload required.
```

## 11.3 Processing State

```txt
Processing on this device...
Keep this tab open until export is complete.
```

## 11.4 Success State

```txt
Export ready
Generated locally. Download your file below.
```

## 11.5 Large File Warning

```txt
Large files may be slow because processing uses this device's CPU and memory.
```

---

## 12. Mobile Strategy

Mobile is harder. Do not assume phones can process everything smoothly.

### Mobile Rules

- Support simple image conversion, resizing, compression, QR, and frame extraction first
- Warn for large video/GIF operations
- Use smaller default output settings
- Avoid loading heavy WASM modules until the user opens a video/GIF tool
- Show battery/performance warning for long operations

### Mobile Warning Copy

```txt
This operation may be slow on mobile. For large videos, use a desktop browser.
```

---

## 13. Performance Rules

### Must-Have

- Use Web Workers for heavy processing
- Lazy-load heavy codecs and ffmpeg.wasm
- Never block the main UI thread during conversion
- Show real progress when possible
- Allow canceling active jobs
- Release object URLs after use
- Clear temporary blobs after export unless user saves them

### Avoid

- Loading ffmpeg.wasm on homepage
- Keeping huge files in React state
- Base64 encoding large media files
- Sending large blobs through props
- Processing large files on the main thread
- Creating multiple full-size copies of the same file in memory

---

## 14. Data Handling Contract

MediaForge should follow this contract:

```txt
1. Files are selected by the user.
2. Files remain in the browser by default.
3. Processing happens locally whenever technically possible.
4. Output is generated as a local Blob.
5. Download happens directly from the browser.
6. Temporary files are cleared after the session unless the user chooses to keep history.
7. Any server-assisted feature must be clearly labeled before use.
```

This contract should be shown in simplified form in the app.

---

## 15. Suggested README Claim

Use this only after the implementation actually follows it.

```txt
MediaForge is a local-first media toolkit. Most conversions run directly in your browser, so your files do not need to be uploaded to a server before export.
```

Do not claim “100% local” unless every feature is actually local.

Better wording:

```txt
Local-first by default. Server-assisted features are clearly marked.
```

---

## 16. Implementation Priority

### Phase 1 — Remove Server Upload Dependency From Core Tools

- Stop using `multer` for image conversion/resizing/compression/favicons
- Remove file upload API routes from default image workflows
- Move basic image processing into browser-side utilities

### Phase 2 — Build Local Worker System

- Add dedicated workers
- Add job progress events
- Add cancellation support
- Add local Blob export helpers

### Phase 3 — Convert Tool Pages to Local-First UX

- Add local-processing badge
- Add no-upload upload zone copy
- Add capability detection
- Add browser limitation messages

### Phase 4 — Add Advanced Local Processing

- Add WASM codecs where browser-native support is weak
- Add ffmpeg.wasm only for heavy video/GIF tools
- Lazy-load heavy modules only when needed

### Phase 5 — Separate Network Tools

- Split video downloader into a network-tool category
- Add legal/permission copy
- Clearly mark server/network behavior

---

## 17. Final Standard

MediaForge should feel like this:

> Open the site, drop a file, process it on your own device, export immediately.

Not this:

> Upload private files to an unknown server and wait for a processed download.

The correct direction is **local-first, browser-powered, no-upload by default**.
