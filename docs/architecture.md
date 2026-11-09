# Architecture and data boundaries

MediaForge 0.3.0 is a Next.js 16 / React 19 / TypeScript application. Its audience is creators, students, and developers performing short media tasks without sending selected files to a conversion service. The existing identity is a hardware console: dark chassis, cream faceplates, condensed headings, mono labels, orange controls, green lamps.

## Pages and modules

| Entry | Engine | Output / boundary |
| --- | --- | --- |
| `/` | `tool-catalog.ts`, browser resource estimates, activity stats | 18 tools in image, video, audio, document and network groups |
| Image modifier, format converter, resize, compress | `image-processing.ts` | Canvas PNG/JPEG/WebP/AVIF when encodable; SVG embeds a PNG rather than vectorizing |
| Image detailer | Canvas scale and detail kernel | PNG; interpolated detail, not generative restoration |
| Background remover | Disposable IMG.LY worker, ONNX/WASM, alpha cleanup | Transparent PNG; initial external model/runtime download |
| Favicon builder | Canvas + JSZip | PNG sizes, ICO and manifest in ZIP |
| QR generator | `qrcode` | PNG/JPEG/SVG; generated format stays attached to output |
| Frame extractor | Browser video decode, Canvas, JSZip | Sampled frames in ZIP, at most 1,800 frames |
| Video converter, upscaler, region cleanup | Canvas + MediaRecorder | WebM; real-time timing; audio retained by default, optional mute |
| Audio Studio, video to audio | Web Audio + local PCM encoder | Eight operations; WAV; codec support varies |
| Document Studio | pdf-lib, PDF.js worker, DOCX/PPTX/Excel parsers, OCR | PDF operations and text-oriented Office conversions; some features deliberately unavailable |
| Universal converter | Canvas, strict CSV, YAML parser, XML DOM, text/PDF generators | Images, JSON/CSV/XML/YAML, Markdown/HTML/TXT; reject unsupported input rather than lose records |
| Media downloader | `/api/convert/yt-download`, `network.ts` | Bounded network media download; optional explicitly configured Cobalt-compatible provider |
| `/report` | `/api/report` | Text-only webhook; unavailable/failing delivery preserves the message |
| `/api/health` | Version + optional desktop instance identity | No-store readiness check; desktop token still required |
| Retired `/api/convert/*`, `/api/fetch-url` | 410 responses | No uploaded file processing or arbitrary-content proxy |

Shared navigation, tool dock, upload bay, settings, status and output panels preserve a consistent workspace. Canvas/document/audio engines live under `src/lib/local-processing/`; the server downloader lives separately in `src/lib/network.ts`. The old `src/lib/fileConverter.ts` is unused legacy code; new changes must use the tested local engine.

## Storage and backups

Inputs, previews and unsaved outputs are session-memory objects. Refreshing, closing a tab or quitting the app discards them. MediaForge does not promise draft/project autosave. Download each finished output before closing; source files are never overwritten by the processing engine. A browser or desktop download dialog decides the destination and overwrite behavior.

Activity counters record export initiation, not confirmation that a browser save dialog completed. Canceling a save can still increment a counter. Activity counters, total exported bytes, last output filename and timestamp are stored under `mediaforge.localActivity.v1` in origin localStorage. Invalid data and blocked/full storage cannot stop a download. These counters are convenience telemetry on this device, not a file backup. No analytics service receives them. Selected bounded processing preferences use `mediaforge.setting.*` keys (batch settings, conversion format, compression quality and video mute). Validators reject corrupt values; blocked storage is nonfatal. Files, captions, QR payloads, report contents and GPU tokens are never persisted as settings.

`WorkspaceGuard` registers working inputs/results and report drafts without retaining file bytes. It warns on internal navigation, refresh/close, supported browser history navigation, Electron close and Android Back. Some browsers suppress prompts without a prior gesture; crashes/OS termination bypass them. This is a warning, not autosave.

Desktop Chromium data lives in Electron's `userData` directory (Linux `~/.config/MediaForge`, macOS `~/Library/Application Support/MediaForge`, Windows `%APPDATA%/MediaForge`, subject to OS configuration). The actual name is determined by the packaged `productName`. Back up the **entire profile while the app is closed**, including `server-port.json` and the persistent Chromium session. Its saved loopback port forms part of the storage origin; changing it can make existing counters appear absent. If the saved port is occupied, startup stops without deleting/remapping the profile. `--user-data-dir=/absolute/path` selects an isolated profile for tests or troubleshooting. Never remove a profile as the first troubleshooting step.

Browser backups require that browser's profile export/backup process. Downloads are ordinary user-owned files; back those up independently.

## Desktop runtime

Electron hosts a sandboxed window with context isolation, no Node integration and no preload bridge. A utility process runs the Next standalone server on `127.0.0.1`, using the saved profile port. Each launch has a new HTTP token attached only to that app origin; other local HTTP clients receive 403. The token is not stored in the profile. A separate instance nonce verifies startup health.

Only GitHub and the existing author website can open externally, using HTTPS. Unknown protocols, new embedded windows and cross-origin app navigation are denied. Device permissions are denied because selected local files need no microphone/camera access. The local server exits when the application quits. Desktop children receive a small OS environment allowlist, not developer secrets or web deployment webhook credentials. Network feedback is therefore unavailable in a default desktop build; the GitHub draft fallback remains available.

`output: standalone` bundles server dependencies. Build scripts copy static assets and public files, strip environment files, and stage a separate desktop manifest with no renderer Node dependencies. Packagers run natively for Linux x64, Windows x64, macOS arm64 and macOS x64. Configured targets are not a claim of verification.

## Android and batch processing

The Android shell bundles a separate static export of these pages and uses a main-frame, exact-origin message bridge for chunked exports through the system document picker. Server routes stay in the web/Electron builds. [Android architecture and build details](ANDROID.md).

Image conversion, resizing and compression have single and multiple-file views. A reusable queue processes one image at a time, retains individual failures, keeps duplicate filenames distinct in ZIPs, and preserves completed outputs when switching views. Limits are 20 inputs, 25 MB per file, 100 MB of inputs and 128 MB of finished image data; ZIP export is bounded to 256 MB. Selected files, results and queue state are memory-only. The visible watermark cropper changes image edges and previews a new PNG. It does not detect SynthID or verify invisible watermark removal.

## Optional local NVIDIA companion

`local-gpu-panel.tsx` is lazy-mounted inside image cleanup on web/desktop. It connects only to `http://127.0.0.1:<port>` with a memory-only session token, explicit consent and an exact allowed app origin. `companion.py` checks Host/Origin/Authorization, bounds inputs, serializes GPU jobs and cleans private temporary files before returning PNG bytes. A live job can run up to 900 seconds; Stop after current image affects subsequent jobs. Abrupt termination can leave private temporary files. No remote GPU or cloud fallback is provisioned. Model weights may be fetched by the separately installed engine. Results remain SynthID unverified. [Setup and privacy](invisible-watermarks-local.md).
