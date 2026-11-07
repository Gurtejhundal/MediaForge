# Release procedure

Version 0.2.0 is a release candidate, not a public installer release. The [hosted verification record](hosted-verification.md) covers subsequent source upload, native CI candidates and the preview created by the existing Git integration. No version tag or public installer release was created.

## Local candidates

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

Test the packaged executable, not only development Electron. Set `MEDIAFORGE_TEST_EXECUTABLE` to its absolute path. The smoke test uses `--user-data-dir` to isolate all profile data and verifies real export, privilege isolation, unauthorized-local-HTTP rejection, restart persistence and server shutdown. Linux headless CI requires Xvfb and a functioning Chromium sandbox.

Files use `MediaForge-0.2.0-{linux|win|mac}-{x64|arm64}.{AppImage|deb|exe|dmg|zip}`. SHA-256 files are named by builder OS/architecture, such as `SHA256SUMS-linux-x64.txt`. Check them from the directory containing the artifacts:

```sh
sha256sum --check SHA256SUMS-linux-x64.txt
```

On macOS use `shasum -a 256 filename`; on Windows use `Get-FileHash filename -Algorithm SHA256` and compare with the published checksum. A checksum detects corruption; it is not a signing certificate or independent proof of origin.

Linux: run an AppImage after making it executable, or install the deb with the OS package manager. A no-FUSE environment can extract an AppImage with `--appimage-extract` and run its `AppRun`. Do not advise globally disabling the Chromium sandbox. Windows: the NSIS candidate is per-user and lets the user choose a folder. macOS: use the dmg or zip matching Apple Silicon/Intel. None of those installation instructions are a claim that local testing ran on Windows/macOS.

## CI and publication boundaries

1. `ci.yml`: clean install, static checks, unit tests, current production-advisory gate, production build and browser journeys. No deployment or publication credentials.
2. `desktop.yml`: native Linux x64, Windows x64, macOS arm64/x64 runners. Each builds and runs browser tests, packages an unpacked app, launches that actual executable in an isolated profile, then makes installers/checksums. Only passing jobs upload candidate artifacts. These are retained CI artifacts, not a public release. No signing or automatic updates are implied.
3. `publish.yml`: manual dispatch only. Requires a project LICENSE decision and a pre-existing version tag pointing at the exact source commit, reruns the native candidate workflow, verifies all checksums and creates a **draft** release. Only that final job gets `contents: write`; it does not automatically publish the draft. Owner review/publication is a separate explicit action.

Do not trigger a release merely by pushing an arbitrary tag. Do not reuse artifacts from a different commit, OS, architecture or failed job. Inspect download links and install/launch behavior after publication. A successful web build does not prove native installation or provider integrations.

## Outstanding release decisions

- The owner has not chosen a project license. No license was added. Review the background-removal package's AGPL/commercial terms and dependency notices before public distribution.
- No signing credentials were supplied. Windows signing and macOS Developer ID/notarization are not configured. macOS/Windows candidate builds are explicitly unsigned; release notes must disclose their status. Do not promise removal of OS warnings.
- Native CI passed on all four configured targets. Review its artifacts and installation limits, then verify actual installer execution and signing status before publishing downloads.
- The background-removal Zod advisory is still visible under an expiring, exact-version [exception](dependency-exception.json). It is not fixed by overriding a dependency external to its bundle.
- The GitHub repository’s configured homepage (`https://converter-ashen-five.vercel.app/`) returned HTTP 404 during read-only verification on 7 November 2026. No production deployment was changed. Validate the actual target's API configuration, route responses, local-file privacy, model availability and saved browser activity separately before promotion.
