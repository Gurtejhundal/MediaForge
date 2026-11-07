# Hosted verification — 7 November 2026

Source under test: `bd73700d60e0a33a76e158c0d8d55e8e15106589`.

- [Web checks](https://github.com/Gurtejhundal/MediaForge/actions/runs/42342905835): clean install, lint, TypeScript, 18 unit tests, dependency policy gate, production build and 53 browser tests passed.
- [Desktop candidates](https://github.com/Gurtejhundal/MediaForge/actions/runs/42342905934): Linux x64, Windows x64, macOS Apple Silicon and macOS Intel passed static checks, 18 unit tests, 53 browser tests, packaged native smoke tests, installer builds and checksum generation.

Each desktop job runs the same static, unit and browser checks, then launches the packaged executable in an isolated profile. The native smoke test verifies PNG export, renderer isolation, sandbox preferences, rejection of unauthenticated loopback HTTP, stable origin/activity after restart, and child-process shutdown. Installers and checksums are uploaded only after that test passes. These checks do not establish signing, notarization, privileged installer execution, FUSE mounting, all codecs or all devices.

The first hosted run found two delivery issues: Ubuntu needed its unpacked Chromium sandbox helper configured, and Windows checkout changed embedded CSV fixture newlines. The follow-up configures only the runner's helper (sandbox remains enabled), enables launch diagnostics, and pins CSV fixture LF endings. The CSV converter continues to preserve input data rather than rewriting user newlines.

Unsigned candidates are retained for 14 days in the desktop workflow's artifacts. They are CI candidates, not a public release. Project licensing and background-removal distribution terms remain unresolved. The narrowly scoped upstream dependency advisory exception remains unchanged.

A Vercel preview built by the existing Git integration reports the tested commit and returns HTTP 200 with MediaForge 0.2.0 from `/api/health`. This is a limited route check, not a complete hosted-browser or production certification.

The original local audit and verification JSON record preparation before source publication; this page records the later hosted checks. The source archive and local Linux packages supplied with that earlier snapshot retain their original commit/checksums.
