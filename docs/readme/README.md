# README media provenance

Screenshots and `qr-workflow.gif` are actual Playwright captures of the production MediaForge build, using synthetic non-sensitive data. The GIF shortens waiting time by sampling working UI states; it is a workflow capture, not an illustrative mockup. The app uses its own HTML/CSS/fonts. No generated mockup is presented as product evidence.

`upi-qr.png` is a byte-for-byte copy of the existing Traqu README QR, reused with explicit owner approval on 7 November 2026. SHA-256: `15c7b045cc25a1b8eee2e4e4806aeecdf17052e0a85daf65a8811660e2abc848`. No payment address or payment link was invented.

To refresh captures, build the app, start the production preview on `127.0.0.1:4317`, and run `node scripts/capture-readme.cjs`. This uses a local installed Chrome when `PLAYWRIGHT_CHROME_CHANNEL=1`, otherwise Playwright Chromium. The intermediate PNG frames are under `work/readme-frames/` and are not committed. Use the documented ffmpeg palette generation command in that script to create the small GIF. Recheck captures after any visual/layout change.
