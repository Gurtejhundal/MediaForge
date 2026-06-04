# Codex Build Prompt — MediaForge Local-First Redesign

Copy this entire prompt into Codex when starting the implementation task.

---

## Role

You are acting as a senior frontend/product engineer. Your task is to redesign and partially re-architect MediaForge into a light-mode, local-first media utility web application.

Do not treat this as a cosmetic redesign only. The core product promise is local-first processing: user files should stay on the user’s device by default.

---

## Repository

Repository: `Gurtejhundal/MediaForge`

Before editing, inspect the repo structure, current routes, components, API routes, server actions, styles, package dependencies, and existing tool implementations.

Read these files first:

1. `design.md`
2. `LOCAL_FIRST.md`
3. `README.md`
4. `package.json`
5. Existing app/source files under `app`, `src`, `components`, `lib`, and `pages` if present

---

## Product Goal

MediaForge should become a clean, professional, minimal, light-mode local media workstation.

The user opens the website, selects files from their computer/mobile device, processes those files in the browser whenever technically possible, and downloads the output directly from the browser.

Default flow:

```txt
Input file → Browser memory/local browser storage → Local processing → Browser download
```

Forbidden default flow:

```txt
Input file → Upload to server → Server processing → Download from server
```

Do not send user files to API routes by default for image conversion, resizing, compression, favicon packaging, QR generation, or frame extraction.

---

## Design Direction

Follow `design.md` strictly.

The UI must be:

- Light mode by default
- Professional
- Minimal
- Clean
- Utility-focused
- Calm and trustworthy
- Not AI-template-looking
- Not dark glassmorphism
- Not neon
- Not gradient-heavy
- Not emoji-heavy

The app should feel like a serious local media workstation, closer to Linear/Figma/Vercel/Apple utility panels than a flashy AI SaaS landing page.

---

## Architecture Direction

Follow `LOCAL_FIRST.md` strictly.

Core browser-local technologies to prefer:

- File API
- Blob
- ArrayBuffer
- URL.createObjectURL()
- Canvas
- OffscreenCanvas where useful
- createImageBitmap()
- Web Workers for heavy processing
- JSZip for browser-side ZIP output
- IndexedDB only for optional local history/settings

Server-side file processing must not be used by default.

If the app currently uses `sharp`, `multer`, server actions, or API routes for core user-file processing, do not blindly keep that behavior. Separate or replace it with browser-local processing.

Server/network tools are allowed only if clearly labelled as server-assisted or network-based.

---

## Important Product Boundary

Image tools and QR tools should be local-first.

Video downloader is different. It is a network tool by nature. Do not advertise it as local-only. Label it clearly:

```txt
Network tool
This feature fetches media from a URL. It is not a local-only file operation.
```

Also include:

```txt
Only download media you own or have permission to use.
```

---

## Implementation Strategy

Do not rewrite the whole application blindly.

Work in phases.

---

## Phase 1 — Audit and Plan Inside the Repo

First inspect the codebase and identify:

- Current app router/page structure
- Existing UI components
- Existing API routes
- Existing file upload paths
- Existing use of `sharp`
- Existing use of `multer`
- Existing server actions for file processing
- Existing tool pages and utilities
- Current styling system

Then make a concise implementation plan before modifying major files.

---

## Phase 2 — Design Foundation

Implement the light-mode design foundation from `design.md`.

Requirements:

- Add global design tokens
- Make light mode the default
- Remove/replace heavy dark glassmorphism styling
- Create or update reusable components:
  - `AppShell`
  - `TopNav`
  - `ToolSidebar`
  - `ToolCard`
  - `UploadDropzone`
  - `PreviewPanel`
  - `SettingsPanel`
  - `OutputCard`
  - `StatusPill`
  - `ProcessingProgress`
  - `ErrorNotice`
  - `ExportButton`

Use restrained spacing, soft borders, white surfaces, and one blue accent.

Do not over-animate.

---

## Phase 3 — Local Processing Foundation

Create a local processing layer.

Suggested structure:

```txt
src/lib/local-processing/
  file-utils.ts
  blob-utils.ts
  capability-detect.ts
  image-processing.ts
  favicon-processing.ts
  qr-processing.ts
  video-frame-processing.ts

src/workers/
  image-converter.worker.ts
  compressor.worker.ts
  resizer.worker.ts
  favicon.worker.ts
  video-frame.worker.ts
```

The exact structure may change based on the existing repo, but keep the separation clear.

Requirements:

- Keep large file blobs out of React state when possible
- Use object URLs for preview
- Revoke object URLs after use
- Generate downloadable output through Blob URLs
- Add cancellation/progress architecture where feasible
- Avoid base64 for large files
- Avoid sending files to API routes for core local tools

---

## Phase 4 — Build Local-First Core Tools

Implement or refactor these tools first:

### 1. QR Generator

This should be fully local.

- Input text/URL locally
- Render QR preview in browser
- Export PNG/JPEG/SVG if supported
- No server call

### 2. Image Resizer

- User selects local image
- Decode locally
- Resize with Canvas/OffscreenCanvas
- Export local Blob
- Download directly from browser

### 3. Image Compressor

- User selects local image
- Use browser-native canvas export where possible
- Generate output Blob locally
- Show original size, output size, and percentage reduction

### 4. Image Converter

- Convert common supported formats locally
- Be honest about unsupported browser formats
- Do not pretend HEIF/AVIF is available if the browser cannot encode it

### 5. Favicon Builder

- Generate favicon sizes locally
- Use JSZip in browser to package files
- Export ZIP from browser

---

## Phase 5 — Frame Extractor

Refactor video frame extraction to be local-first:

- User selects video file locally
- Use `<video>` object URL for preview
- Seek to timestamp
- Draw current frame to Canvas
- Export PNG/JPEG/WebP Blob
- No server upload

Add warning for very large files:

```txt
Large videos may be slow because processing uses this device's CPU and memory.
```

---

## Phase 6 — Separate Network/Server Features

Review URL video downloader.

If it requires server/network code, separate it visually and technically as a network tool.

Requirements:

- Do not include it under the same “No upload required” promise
- Add network-tool label
- Add permission/legal warning
- Keep API/server logic isolated from local file tools

---

## Phase 7 — UX Copy and Trust Layer

Add privacy/status copy across the app:

Upload zone:

```txt
Drop a file here
Processed locally in your browser. No upload required.
```

Workspace badge:

```txt
Local processing
No upload
```

Processing state:

```txt
Processing on this device...
Keep this tab open until export is complete.
```

Success state:

```txt
Export ready
Generated locally. Download your file below.
```

Server/network feature label:

```txt
Server-assisted
This action may contact external services or process data outside your browser.
```

---

## Phase 8 — Verification

Before finishing, run:

```bash
npm install
npm run lint
npm run build
```

If tests exist, run them too.

Also manually verify:

- Core image tools do not POST files to server routes
- Browser devtools Network tab does not show file upload requests during local tools
- Output downloads are generated from local Blob URLs
- Object URLs are revoked after use where appropriate
- Local-first badges do not appear on network/server-assisted tools
- Mobile layout is usable
- Large file warnings appear where needed
- Unsupported formats show honest messages

---

## Acceptance Criteria

The implementation is acceptable only if:

1. App is light-mode-first.
2. Core file tools process locally by default.
3. User files are not uploaded to the server for core tools.
4. UI clearly communicates “No upload required” only where true.
5. Network/server-assisted features are clearly separated.
6. Design follows `design.md` and avoids dark AI-template styling.
7. Local architecture follows `LOCAL_FIRST.md`.
8. Build and lint pass or failures are explicitly documented.
9. The app remains usable on desktop and mobile.
10. The codebase is cleaner after the change, not more chaotic.

---

## What Not To Do

Do not:

- Rewrite everything without understanding the current repo
- Keep server upload flows while claiming local-first
- Use dark glassmorphism as the main UI
- Add random gradients, glowing cards, or decorative blobs
- Store user files on the server
- Put large files in React state
- Load ffmpeg.wasm on the homepage
- Hide browser limitations
- Break existing working tools without replacing them
- Use fake privacy claims

---

## Expected Final Response From Codex

When finished, summarize:

- Files changed
- Tools converted to local-first
- Tools still server/network-assisted
- How local Blob export works
- What verification commands were run
- Any known limitations
- Any follow-up tasks recommended

Be honest. If something is not fully local, say it clearly.
