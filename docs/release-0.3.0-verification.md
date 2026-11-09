# MediaForge 0.3.0 verification

Published 9 November 2026. Application/release source: [`1acbf5d754a4198b64149310dd17b0f34f7ba573`](https://github.com/Gurtejhundal/MediaForge/commit/1acbf5d754a4198b64149310dd17b0f34f7ba573). Documentation-only follow-ups do not move these release tags or replace their binaries.

[Live app](https://mediaforge-tau.vercel.app/) · [Desktop 0.3.0](https://github.com/Gurtejhundal/MediaForge/releases/tag/v0.3.0) · [Android 0.3.0](https://github.com/Gurtejhundal/MediaForge/releases/tag/android-v0.3.0) · [Audit and fixes](audit-0.3.0.md) · [Real screenshots and GIFs](readme/README.md)

## Completed release gates

| Gate | Observed result | Evidence |
| --- | --- | --- |
| Web | Clean install, lint, types, 24 unit tests, advisory policy, build, all 73 browser tests pass | [Web run](https://github.com/Gurtejhundal/MediaForge/actions/runs/42553732295) |
| Desktop | Linux x64, Windows x64, macOS arm64 and macOS x64 each pass all 73 browser tests and launch/export/restart/isolation/native leave-warning checks on their native builders | [Native matrix and publisher](https://github.com/Gurtejhundal/MediaForge/actions/runs/42553732557) |
| Desktop publication | Seven native installers/archives plus matching source; draft assets downloaded and checksummed before public promotion | [Publisher](https://github.com/Gurtejhundal/MediaForge/actions/runs/42553732557) |
| Android | Non-debuggable signed APK; all bundled bytes/permissions checked; four offline API 35 emulator journeys pass, including all 20 pages, actual picker/Save, cancel/retry, PNG/WAV/PDF/ZIP bytes, persistence and Back → Keep working | [Android verify and publisher](https://github.com/Gurtejhundal/MediaForge/actions/runs/42553732256) |
| Local adapter | 29 file/HTTP/preflight/driver tests on both Windows and Linux, simulated engine/hardware | [Adapter safety](https://github.com/Gurtejhundal/MediaForge/actions/runs/42553732249) |
| Signing recovery | Four disposable signing/recovery tests pass; actual encrypted owner backup recovered privately; retained key fingerprint matches the public APK | [Android signing gates](https://github.com/Gurtejhundal/MediaForge/actions/runs/42553732256) |

The earlier native candidate failed on an early-preference race and companion startup; its Android run was cancelled before publication. Those findings were fixed and the complete native matrix repeated on the release commit. Successful earlier jobs were not substituted for this source.

## Live and independent checks

The corrected production deployment `dpl_GZF9v3hHKGjf8uBVXWDnphKEUjqG` served the release commit through the public canonical domain. Health returned HTTP 200/version 0.3.0. Actual QR PNG download, working-file Stay behavior, mobile two-image WebP ZIP/report, no horizontal overflow, and preference dimensions surviving refresh were checked in Chrome. No page errors were observed. The legacy deployment URL redirects to the canonical app.

The HTTPS app also connected to the real loopback companion with standard local-network permission in a disposable browser profile. It returned the actual unavailable-engine message, submitted no image and persisted no token. This verifies the connection/failure boundary, not CUDA inference.

A real CPU background-model run returned a 512 × 512 PNG with alpha extrema 0–255. A real English OCR run returned a three-page searchable PDF with the expected fixture text on all three pages. These checks do not certify every image or OCR layout. README captures use synthetic inputs and real tool operations; the four GIFs have static reduced-motion alternatives.

All 20 public assets were independently downloaded and compared with GitHub's SHA-256 digests. The seven desktop binaries, APK and both source archives also match each release's global checksum manifest. Matching source archives include the release commit's 272 tracked files and the bundled IMG.LY original-source maps. The Windows Gradle wrapper receives its declared CRLF conversion from `.gitattributes`; all other tracked bytes match directly. Private signing keys/passwords are absent from source archives.

Android APK signing-certificate SHA-256:

`af1be3992aee33de50954ed27617f08c64bc2fee547c96b0cbd5e1e7921f2fcd`

The signing backup was recovered outside Git and outside the application profile, with owner-only permissions, and its artifact digest verified. Retain an offline copy; future releases require the retained key/password/alias as protected CI secrets. Upgrading from Android 0.2.0 requires one uninstall/reinstall because its old preview certificate cannot be reused.

## Public artifact hashes

| Download | SHA-256 |
| --- | --- |
| [MediaForge-0.3.0-linux-x64.AppImage](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.3.0/MediaForge-0.3.0-linux-x64.AppImage) | `22ad0ccbe32a471140a37d31cfa198491902f41c32759a13652cb6127deeb102` |
| [MediaForge-0.3.0-linux-x64.deb](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.3.0/MediaForge-0.3.0-linux-x64.deb) | `7307fcc06e34073b63513fe01efee1de493d6552e685734b2fe25d4b1a76a040` |
| [MediaForge-0.3.0-mac-arm64.dmg](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.3.0/MediaForge-0.3.0-mac-arm64.dmg) | `124cef73327692d42e5fb4bc459b24814d5887031c8789fa16bb9708ccecbe96` |
| [MediaForge-0.3.0-mac-arm64.zip](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.3.0/MediaForge-0.3.0-mac-arm64.zip) | `ee00ab64736934c54ce591bef0b6d5b627c1d381fed3182c6463fa82cc9f30ec` |
| [MediaForge-0.3.0-mac-x64.dmg](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.3.0/MediaForge-0.3.0-mac-x64.dmg) | `b771844ce94a7df5834151cd7cc7bb34858b88ddc20ca5236d31bf4b09e8fe4c` |
| [MediaForge-0.3.0-mac-x64.zip](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.3.0/MediaForge-0.3.0-mac-x64.zip) | `f2a039760c4317288ffb96fa3e25989df4a2d02401050344d14fb01c8f3c553e` |
| [MediaForge-0.3.0-source.zip](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.3.0/MediaForge-0.3.0-source.zip) | `43a1f0d5831f9fe101df89cf0c459ed4a4da7cfe9e09d83427480d6a811a73bf` |
| [MediaForge-0.3.0-win-x64.exe](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.3.0/MediaForge-0.3.0-win-x64.exe) | `88919443e8d422d560684c9fdf243e9a5b92d1d465a88ba028116c477006c44c` |
| [MediaForge-0.3.0-android-source.zip](https://github.com/Gurtejhundal/MediaForge/releases/download/android-v0.3.0/MediaForge-0.3.0-android-source.zip) | `ce6808db1eb2e0c5fc94cfb3b125cfce3a231949e7b8497160ee5652d0c698db` |
| [MediaForge-0.3.0-android.apk](https://github.com/Gurtejhundal/MediaForge/releases/download/android-v0.3.0/MediaForge-0.3.0-android.apk) | `ff0f4eb9cc137991fb04ca163905a0606b0d6329e1caa4eb3e687b84ca377373` |

## Remaining limits

- No real NVIDIA/model or official SynthID before/after trial was available. CUDA is required for the optional engine; 12 GiB is an initial trial target, not a verified minimum. The owner's RTX 3050 with 4 GB remains unverified. Results are labeled SynthID unverified.
- Windows/macOS installers are unsigned; macOS is not notarized. Native unpacked-app smoke checks do not certify privileged installer execution, AppImage FUSE setup, all OS versions or physical Android phones/codecs.
- Working-file warnings are not autosave. OCR cancellation during initial setup can wait for setup; GPU stopping waits for the current bounded image. Model/OCR assets need first-use connectivity.
- The existing exact-version, time-limited dependency advisory exception remains visible. A passing policy is not a clean-audit claim. [Dependency review](dependencies.md).

No existing 0.2.0 release assets, source media or user profiles were replaced. The unrelated original-checkout changes were preserved.
