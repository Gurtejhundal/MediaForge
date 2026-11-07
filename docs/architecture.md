# Architecture and data boundaries

MediaForge 0.2.0 is a Next.js 16 / React 19 / TypeScript application. Its audience is creators, students, and developers performing short media tasks without sending selected files to a conversion service. The existing identity is a hardware console: dark chassis, cream faceplates, condensed headings, mono labels, orange controls, green lamps.

## Pages and modules

| Entry | Engine | Output / boundary |
| --- | --- | --- |
| `/` | `tool-catalog.ts`, browser resource estimates, activity stats | 17 tools in image, video, audio, document and network groups |
| Image modifier, format converter, resize, compress | `image-processing.ts` | Canvas PNG/JPEG/WebP/AVIF when encodable; SVG embeds a PNG rather than vectorizing |
| Image detailer | Canvas scale and detail kernel | PNG; interpolated detail, not generative restoration |
| Background remover | Lazy-loaded IMG.LY model, ONNX/WASM, alpha cleanup | Transparent PNG; initial external model/runtime download |
| Favicon builder | Canvas + JSZip | PNG sizes, ICO and manifest in ZIP |
| QR generator | `qrcode` | PNG/JPEG/SVG; generated format stays attached to output |
| Frame extractor | Browser video decode, Canvas, JSZip | Sampled frames in ZIP, at most 1,800 frames |
| Video converter, upscaler, region cleanup | Canvas + MediaRecorder | WebM; real-time timing; no audio track |
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

Activity counters record export initiation, not confirmation that a browser save dialog completed. Canceling a save can still increment a counter. Only activity counters, total exported bytes, last output filename and timestamp are stored under `mediaforge.localActivity.v1` in origin localStorage. Invalid data and blocked/full storage cannot stop a download. These counters are convenience telemetry on this device, not a file backup. No analytics service receives them.

Desktop Chromium data lives in Electron's `userData` directory (Linux `~/.config/MediaForge`, macOS `~/Library/Application Support/MediaForge`, Windows `%APPDATA%/MediaForge`, subject to OS configuration). The actual name is determined by the packaged `productName`. Back up the **entire profile while the app is closed**, including `server-port.json` and the persistent Chromium session. Its saved loopback port forms part of the storage origin; changing it can make existing counters appear absent. If the saved port is occupied, startup stops without deleting/remapping the profile. `--user-data-dir=/absolute/path` selects an isolated profile for tests or troubleshooting. Never remove a profile as the first troubleshooting step.

Browser backups require that browser's profile export/backup process. Downloads are ordinary user-owned files; back those up independently.

## Desktop runtime

Electron hosts a sandboxed window with context isolation, no Node integration and no preload bridge. A utility process runs the Next standalone server on `127.0.0.1`, using the saved profile port. Each launch has a new HTTP token attached only to that app origin; other local HTTP clients receive 403. The token is not stored in the profile. A separate instance nonce verifies startup health.

Only GitHub and the existing author website can open externally, using HTTPS. Unknown protocols, new embedded windows and cross-origin app navigation are denied. Device permissions are denied because selected local files need no microphone/camera access. The local server exits when the application quits. Desktop children receive a small OS environment allowlist, not developer secrets or web deployment webhook credentials. Network feedback is therefore unavailable in a default desktop build; the GitHub draft fallback remains available.

`output: standalone` bundles server dependencies. Build scripts copy static assets and public files, strip environment files, and stage a separate desktop manifest with no renderer Node dependencies. Packagers run natively for Linux x64, Windows x64, macOS arm64 and macOS x64. Configured targets are not a claim of verification.
