# Development and configuration

Use Node **24.12 or newer in the 24.x line**, with npm. The lockfile is checked in. This application is private to npm; it has no npm publication target.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. The dev server binds loopback. Do not expose the development server to the internet.

Production preview:

```sh
npm run build
npm start
```

The build creates Next standalone output and copies its static/public assets. `npm start -- --port 4317 --hostname 127.0.0.1` selects a local port. An intentional self-hosted network deployment can use `--hostname 0.0.0.0` behind HTTPS, request limits and appropriate egress policy. This is a Node server application; API routes mean it is not an unmodified GitHub Pages/static export.

## Configuration

Copy `.env.example` to `.env.local` for local development, or set variables in the hosting environment. Never commit real values.

| Variable | Purpose |
| --- | --- |
| `MEDIAFORGE_REPORT_WEBHOOK_URL` | Optional Discord/Slack/generic JSON webhook. Without it, reports return 503 and users retain the draft. Message/contact data goes only to that destination; logs contain report ID/type, not report contents. Webhook timeout: 8 seconds. |
| `MEDIAFORGE_DOWNLOADER_URL` | Optional trusted public HTTP/S Cobalt-compatible endpoint. URLs are sent only to this explicitly selected provider. Its returned media URL goes through the same public-address checks. Without it, direct media links work and platform links return 503. |
| `NEXT_TELEMETRY_DISABLED=1` | Disable Next's build/runtime telemetry. Desktop always sets this. |

Desktop launch token/instance variables are internal to the launcher. Do not configure them for a normal web deployment. Webhook and provider configuration is deliberately not inherited into packaged desktop processes. The default desktop supports direct media downloads and the external GitHub feedback fallback.

Downloader boundaries: standard HTTP/S ports, no embedded credentials; all resolved IPs must be public; inspected DNS result is pinned to the socket; every redirect is revalidated; at most three redirects, 50 MB and 20 seconds per direct fetch, two concurrent buffered downloads per server process. Only supported video/audio MIME types return as no-store attachments. This in-process cap is not a distributed abuse-control system; a public deployment also needs infrastructure request limits.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run audit:dependencies
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
npm run desktop:prepare
npm run desktop:pack
npm run test:desktop
```

On a Linux CI machine, wrap desktop tests in `xvfb-run --auto-servernum`. Keep Chromium's sandbox enabled. For a system Chrome already installed locally, set `PLAYWRIGHT_CHROME_CHANNEL=1` for browser tests. `MEDIAFORGE_TEST_EXECUTABLE` selects a packaged executable for the desktop smoke test; every test creates a temporary profile and must not touch the user's normal profile.

Fixtures in `tests/fixtures/` are synthetic PNG/SVG, short tone/video, structured files, Office documents and a three-page PDF. Browser tests inspect downloaded bytes/ZIP entries/PDF pages, exercise all routes at 320/390/1440 px, and check important keyboard/reduced-motion and WCAG A/AA rules. See [audit](audit.md) for the exact observed coverage and exclusions.

## Troubleshooting

- **Install fails:** use the documented Node version and `npm ci`. Do not delete user profiles or source media. If a newer npm flags lockfile drift, fix the lockfile deliberately and rerun clean install.
- **Blank or unstyled production UI:** stop the preview before rebuilding. Serving an old in-memory Next process against newly replaced `.next` files can return failing asset requests. Restart `npm start` after the build.
- **Format unavailable:** browser Canvas must encode the requested type; unsupported AVIF is an explicit error, not a PNG mislabeled as AVIF. HEIC/HEIF and legacy Office files depend on browser support or require resaving to a supported format.
- **Video slow/missing audio:** Canvas export is real-time WebM with no audio; use Audio Studio separately for WAV. Keep the tab visible. Long/high-resolution work can exceed device memory.
- **Frame ZIP too large:** reduce sample rate or trim the source; exports stop above 1,800 frames.
- **Model/OCR fails:** first use needs reachable runtime/model assets and browser WASM/worker support. Files still stay local. Try a smaller supported image or PDF and report the exact error. Fully offline first use is not supported.
- **PDF/Office fidelity:** Office-to-PDF rebuilds readable text, not original layout; standard PDF font exports have limited Unicode support. Image-based PDF exports preserve appearance. A visible signature is not a cryptographic signature. Secure redaction, encryption and PDF/A are intentionally unavailable.
- **Feedback cannot send:** the message is retained; use the GitHub issue draft. No webhook is embedded into desktop installers.
- **Desktop fails on its saved port:** close the conflicting process and retry. Do not casually edit `server-port.json`; back up the profile first.
