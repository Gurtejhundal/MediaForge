# README media provenance

Browser screenshots and the four workflow GIFs are actual Playwright captures of the production MediaForge build, using synthetic non-sensitive data. The GIF shortens waiting time by sampling working UI states; it is a workflow capture, not an illustrative mockup. The app uses its own HTML/CSS/fonts. No generated mockup is presented as product evidence.

`upi-qr.png` is a byte-for-byte copy of the existing Traqu README QR, reused with explicit owner approval on 7 November 2026. SHA-256: `15c7b045cc25a1b8eee2e4e4806aeecdf17052e0a85daf65a8811660e2abc848`. No payment address or payment link was invented.

To refresh captures, build the app, start the production preview on `127.0.0.1:4317`, and run `node scripts/capture-readme.cjs`. This uses a local installed Chrome when `PLAYWRIGHT_CHROME_CHANNEL=1`, otherwise Playwright Chromium. The intermediate PNG frames are under `work/readme-frames/` and are not committed. Use the documented ffmpeg palette generation command in that script to create the small GIF. Recheck captures after any visual/layout change.

The Windows, Apple and Linux card icons are reused from the owner’s Traqu README at `frontend/public/os/`; the browser globe is a simple local SVG. The download layout follows Traqu while retaining MediaForge’s wording and workbench identity.

On 8 November 2026 the capture script also recorded real image resizing (the repository's own 512px icon to a verified 256px PNG), PDF extraction (pages 1 and 3 of the synthetic three-page fixture, verified as a two-page export), and a completed Audio Studio operation with its synthetic WAV fixture. `resize-workflow.gif` and `document-workflow.gif` sample these working states at 0.8 frames/second; the animations are lightweight sampled captures. `image-resizer.png`, `document-studio.png` and `audio-studio.png` are static production-build captures, not mockups. Every GIF has a static reduced-motion alternative in the README. The Android icon is reused from the same owner-provided Traqu icon set.

The script encodes all four GIFs itself and requires `ffmpeg` on PATH. `batch-workflow.gif` shows two real image-compression jobs and a ZIP containing two WebP outputs plus its report; the downloaded ZIP entries are verified. `visible-cropper.png` shows a real crop of deliberately synthetic gradient artwork with a DEMO corner label, verified as a 512 × 280 PNG. This is an actual tool capture with illustrative input, not a SynthID-removal demonstration. The 0.3.0 animations total about 1.4 MB.

`android-workbench.png`, `android-qr.png` and `android-import.png` are direct screenshots of the installed, non-debuggable APK on an Android 15/API 35 emulator with Wi-Fi and mobile data disabled. The instrumentation test generates the QR and imports the CSV through the system picker. Refresh these with `bash scripts/test-android.sh`, then copy the captures from `android-captures/` after checking them visually. They are emulator captures, not physical-phone certification.

The app header, README, browser icons and native launcher reuse the repository’s existing illustrated MediaForge icon. The captures use sample content and contain no private user media.

The 0.3.0 refresh on 9 November 2026 captures the same real production-build workflows with working-file warnings and batch resume/retry controls. Capture automation explicitly accepts discard prompts between completed sample journeys. Static images remain the reduced-motion alternatives; synthetic inputs are clearly described above. Downloaded image/PDF/ZIP bytes are checked during capture.

The Android screenshots were refreshed from the passing 0.3.0 offline emulator run on 9 November 2026, including the corrected illustrated header/Updates control.
