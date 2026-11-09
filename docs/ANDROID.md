# Android workbench

MediaForge's Android app bundles a static build of the existing workbench. It runs locally inside Android System WebView; opening the app does not fetch the website. Android 8+ is the manifest minimum. An updated WebView with Chromium 111+ is required; older engines receive an update notice instead of a blank screen.

## Install and use

Download the APK and checksums from the [Android 0.3.0 release](https://github.com/Gurtejhundal/MediaForge/releases/tag/android-v0.3.0). Open the APK in your browser or file manager and approve installation from that app if Android asks. This is a directly distributed APK with a retained signing certificate, not a Play Store listing. Upgrading from the old 0.2.0 preview requires one uninstall/reinstall; save exports first because uninstall clears private counters/preferences.

Choose a file in a tool. Android's file picker grants access only to that selection. After processing, Save opens Android's destination picker. Choose Downloads or another writable location. Cancelling retains the result in the open tool and does not count as an export. Exports are limited to 256 MB. Saved files are ordinary files, independent of MediaForge's app storage.

Back returns through workbench navigation and exits at the root. Rotation and keyboard/system-bar insets are handled by the shell. Inputs, previews and conversion drafts are memory-only: navigating away, process termination, restart or an out-of-memory recovery can discard them. Keep originals and saved results separately. Activity counters and selected processing preferences persist in private WebView storage. Working-file warnings cover internal navigation and Android Back but cannot survive OS termination. Uninstalling clears that storage. Automatic Android backup is disabled.

Core image/QR/data/PDF processing can work offline. Background-removal models and OCR runtimes may fetch HTTPS assets on first use. Audio/video decoding and recording depend on your WebView/device codecs and available memory; large files work better on desktop. URL downloading needs the web server, so Android links to the web tool in your browser. Feedback is prepared as a GitHub issue for you to review and submit externally; no reports are sent automatically.

## Build from source

Install Node 24, JDK 17, Android SDK platform 36 and build-tools 35.0.0. Set `ANDROID_HOME` to your SDK. The checked-in Gradle 8.13 wrapper validates the distribution checksum.

```sh
npm ci
npm run android:apk
# android/app/build/outputs/apk/preview/app-preview.apk
```

`android:web` copies source into ignored `work/android-web/`, excludes server API routes and the desktop proxy, then builds Next's static export. It never renames or removes source routes in your checkout, and never copies environment files. The normal web and Electron builds remain independent. The generated bundle and dependency notices are copied into Android assets.

Open `android/` in Android Studio for device development. `assembleDebug` allows renderer debugging locally; the distributed `preview` variant disables it and uses a temporary local development key for independent verification unless release credentials are supplied. Published 0.3.0 uses a retained release certificate with an owner-encrypted backup. Upgrading from the old 0.2.0 certificate requires one uninstall/reinstall; save exports first. Future releases must reuse the retained key through protected CI secrets. Do not commit keys. [Signing and backup procedure](releasing.md#android-signing-and-upgrades). Updates open the release page; installation is manual.

## Verification

The Android workflow builds and lints the APK, then installs it on an Android 15/API 35 x86_64 emulator with networking disabled. Instrumentation exercises all 20 bundled pages, actual WebView rendering, QR creation, Android Save cancellation/retry, PNG signature verification, native CSV file selection, JSON content verification, reopen/persistence and Back navigation. Additional synthetic fixtures exercise image resizing/invalid-dimension recovery, WAV export and two-page PDF extraction. The PDF is reopened with Android’s own PDF renderer. Batch ZIPs and visible-edge cropped PNGs are also saved and their contents/dimensions checked. Screenshots and reports are retained as CI artifacts. The APK contains no architecture-specific native libraries; physical ARM phones and other Android/OEM versions still require device testing.

With an API 35 emulator running:

```sh
npm run android:web
cd android
./gradlew :app:assemblePreview :app:assemblePreviewAndroidTest :app:lintPreview
cd ..
bash scripts/test-android.sh
```

The workflow also reruns the browser suite before Android verification. Release publication downloads its draft APK and corresponding source archive again and checks their SHA-256 hashes before making the independent Android tag public. Older release assets remain immutable; the separate Android tag does not replace the desktop latest release.

## Security and troubleshooting

The renderer loads bundled assets through `WebViewAssetLoader` at a fixed HTTPS origin. File-system URLs and cleartext HTTP subresources are disabled. The bounded save bridge accepts only messages from that exact origin's main frame and writes only a private temporary file followed by a user-selected document URI. Remote top-level links open in the system browser and never receive the bridge. Only the Internet permission is requested: no camera, microphone or broad storage permission. Temporary exports are removed on completion/cancellation and cleaned on the next launch after process death. No file analytics or automatic uploads are added.

- **Update notice:** update Android System WebView (and Chrome on devices using it as the provider), then reopen.
- **No file picker:** enable/install your system Files/Documents provider. MediaForge doesn't request permission to scan your entire storage.
- **Save failure:** choose a writable local location and check free storage. A failed provider write is not counted as success; partial documents are removed where the provider permits it.
- **Blank preview or failed codec:** try a smaller PNG/JPEG, WAV or supported video codec. Report device/Android/WebView versions without attaching private media.
- **App closed during processing:** reopen and try a smaller file. Previously saved exports are safe; unsaved results must be recreated.

AGPL application source is linked in the footer at the matching Android tag. Full dependency notices are available inside the app; AndroidX and Kotlin runtime components retain their Apache 2.0 licenses.

## Watermarks and batches

Conversion, resizing and compression include a Multiple files view. The local queue processes sequentially, retains per-file failures, supports stopping after the current file, resuming queued files and retrying failures with the original settings, and saves finished outputs as a ZIP with a JSON report. Duplicate input names receive distinct indexed ZIP filenames. Native Android exports still use the system Save dialog, including ZIPs. Existing PDF merge and audio merge already accept multiple files. Video tools remain single-file to avoid unbounded simultaneous recording and decoding on phones.

The visible watermark cropper can trim an edge containing a logo, including the Gemini sparkle. It previews a cropped PNG and preserves the original. This changes composition and does not restore covered pixels. It is not a verified invisible SynthID remover: no detection/removal claim is made. Google describes SynthID as a pixel-embedded watermark designed to survive many edits; [official explanation](https://deepmind.google/models/synthid/).

The optional NVIDIA companion is intentionally hidden on Android: this CUDA pipeline does not run in Android WebView. Ordinary tools need no NVIDIA hardware. Video exports retain audio by default with optional mute, subject to the actual device codecs; desktop Chromium tests do not certify all phone codecs.
