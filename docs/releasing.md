# Releases and installation

[Public app](https://mediaforge-tau.vercel.app/) · [All releases](https://github.com/Gurtejhundal/MediaForge/releases) · [0.2.0 notes](releases/0.2.0.md)

MediaForge 0.2.0 targets Linux x64 AppImage/deb, Windows x64 NSIS, macOS Apple Silicon and Intel DMG/ZIP. Native CI checks the actual packaged executable before producing installers. Builds are unsigned; macOS builds are not notarized. There is no automatic updater. Native smoke tests are not a certification of every OS version or a substitute for actual installer execution. See [observed evidence and limits](hosted-verification.md).

## Install and verify

1. Choose the file matching your OS and CPU from the README or release page.
2. Download `SHA256SUMS.txt` beside it. On Linux run `sha256sum --check SHA256SUMS.txt` in a folder containing all listed files, or compare `sha256sum filename` for a single download. On macOS use `shasum -a 256 filename`; Windows PowerShell uses `Get-FileHash filename -Algorithm SHA256`.
3. Windows: open the per-user installer. Mac: open the matching DMG and drag the app to Applications, or extract the ZIP. Linux: use the DEB package manager or mark the AppImage executable and open it. FUSE 2 and a compatible user-namespace/sandbox setup are needed for AppImage; prefer DEB when those requirements are unavailable.
4. Review the source/checksum and your OS prompt before approving an unsigned app. Keep OS security and Chromium sandbox protections enabled.

A checksum detects corruption; it is not a signing certificate. Keep source media and exports backed up separately. Conversion drafts live in memory; activity counters and desktop profile data are separate from installed program files. [Storage and backups](architecture.md#storage-and-backups).

## Maintainer workflow

- `ci.yml`: read-only clean install, lint, TypeScript, unit tests, production dependency policy, build and 53 browser journeys.
- `desktop.yml`: native Linux x64, Windows x64 and both Mac architectures. Each performs the source/browser checks, prepares the standalone runtime, launches the actual unpacked executable in a disposable profile, then builds candidates and checksums. Installer artifacts are uploaded only after success. Jobs have a 35-minute timeout; temporary artifact retention is 14 days.
- `publish.yml`: manual dispatch defaults to a draft. An explicitly committed version-specific `.github/release-requests/v<version>.json` can authorize publication on a push to main. The 0.2.0 request records the owner's approval on 8 November 2026. Changing unrelated code or documentation does not trigger publication.

Publication verifies the exact version, approved license and versioned release notes, rejects tags pointing to different source, and reruns the complete native matrix. Only the final release job receives `contents: write`. It verifies all seven native artifact names and checksums, creates a matching source archive with the bundled AGPL library's original source maps, uploads a draft, downloads its assets again and checks every checksum. Only an explicit publication request promotes that verified draft to a public latest release. A public release is never overwritten on rerun; draft resume is restricted to the exact same commit.

The publisher creates a version tag at its exact tested source commit. Do not force-move tags or replace public binaries from a different source commit. Versioned download names are `MediaForge-<version>-<linux|win|mac>-<x64|arm64>.<AppImage|deb|exe|dmg|zip>`; source is `MediaForge-<version>-source.zip`. `SHA256SUMS.txt` covers all native installers and the source archive; per-builder manifests are also retained.

## Local reproduction

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run audit:dependencies
npm run build
npx playwright install chromium
npm run test:e2e
npm run desktop:prepare
npx electron-builder --dir --publish never
npm run test:desktop
npx electron-builder --publish never
npm run release:checksums
```

Set `MEDIAFORGE_TEST_EXECUTABLE` to the actual packaged executable's absolute path. Linux headless tests require Xvfb and a working Chromium sandbox; the CI unpacked helper is explicitly configured before launch. Tests isolate all profile data and check export bytes, renderer isolation, unauthorized loopback HTTP, stable origin/activity after restart, and child-server shutdown.

The owner selected AGPL-3.0-only. The application LICENSE, generated production-package/font notices and original Electron/Chromium notices ship with desktop candidates. The source release includes scripts and lockfile needed to reproduce the app. [Distribution notices](../THIRD_PARTY_NOTICES.md) explain the bundled IMG.LY library. The upstream Zod advisory remains under its exact-version exception until 7 December 2026; [dependency review](dependencies.md) is not a clean-audit claim.

The former repository homepage at converter-ashen-five.vercel.app was a deleted deployment. It now returns a permanent HTTP 308 redirect to mediaforge-tau.vercel.app, the verified public production domain. Team/deployment-specific Vercel URLs may require Vercel Authentication; protection settings were not weakened.
