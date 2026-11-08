# Hosted verification — 7 November 2026

Source under test: `bd73700d60e0a33a76e158c0d8d55e8e15106589`.

- [Web checks](https://github.com/Gurtejhundal/MediaForge/actions/runs/42342905835): clean install, lint, TypeScript, 18 unit tests, dependency policy gate, production build and 53 browser tests passed.
- [Desktop candidates](https://github.com/Gurtejhundal/MediaForge/actions/runs/42342905934): Linux x64, Windows x64, macOS Apple Silicon and macOS Intel passed static checks, 18 unit tests, 53 browser tests, packaged native smoke tests, installer builds and checksum generation.

Each desktop job runs the same static, unit and browser checks, then launches the packaged executable in an isolated profile. The native smoke test verifies PNG export, renderer isolation, sandbox preferences, rejection of unauthenticated loopback HTTP, stable origin/activity after restart, and child-process shutdown. Installers and checksums are uploaded only after that test passes. These checks do not establish signing, notarization, privileged installer execution, FUSE mounting, all codecs or all devices.

The first hosted run found two delivery issues: Ubuntu needed its unpacked Chromium sandbox helper configured, and Windows checkout changed embedded CSV fixture newlines. The follow-up configures only the runner's helper (sandbox remains enabled), enables launch diagnostics, and pins CSV fixture LF endings. The CSV converter continues to preserve input data rather than rewriting user newlines.

Unsigned candidates are retained for 14 days in the desktop workflow's artifacts. They are CI candidates, not a public release. Project licensing and background-removal distribution terms remain unresolved. The narrowly scoped upstream dependency advisory exception remains unchanged.

A Vercel preview built by the existing Git integration reports the tested commit and returns HTTP 200 with MediaForge 0.2.0 from `/api/health`. This is a limited route check, not a complete hosted-browser or production certification.

The original local audit and verification JSON record preparation before source publication; this page records the later hosted checks. The source archive and local Linux packages supplied with that earlier snapshot retain their original commit/checksums.

## Public 0.2.0 release follow-up (8 November 2026)

The owner selected AGPL-3.0-only and approved publishing unsigned installers. The new release workflow rebuilds all four targets from the release commit, preserves dependency/font notices, and verifies uploaded bytes before publication. The permanent public app is https://mediaforge-tau.vercel.app/; it returns the app without Vercel sign-in. The earlier team-specific alias remains protected. See the [current release page](https://github.com/Gurtejhundal/MediaForge/releases) for the versioned source and the fresh release run.

The old converter-ashen-five.vercel.app link was restored as a verified project-domain redirect: HTTP 308 to the public domain, followed by HTTP 200 with the actual app. Vercel Authentication settings were retained.

The public [0.2.0 release](https://github.com/Gurtejhundal/MediaForge/releases/tag/v0.2.0) was published from source `79d348efb3545aac176bdf847b44a5d1b22677b0` after [release workflow 42453262785](https://github.com/Gurtejhundal/MediaForge/actions/runs/42453262785) passed on all four targets: 19 unit tests, 53 browser tests and packaged native smoke tests, including app/dependency/font notices. All seven native artifacts and the matching source archive were downloaded from the uploaded draft and checked against their SHA-256 manifests before publication. The first download encountered a transient HTTP/2 transport error; retrying the failed publishing job passed, without rerunning successful native builds or publishing unchecked files. Future publishers retry draft downloads up to three times.
