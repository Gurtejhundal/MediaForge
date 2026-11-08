# MediaForge for Android 0.2.0

Your media workbench, in your pocket. Choose a file, do the small job, save it where you want it.

Download **MediaForge-0.2.0-android.apk**, open it on your phone and follow Android's installation prompt. Requires **Android 8 or newer and an updated Android System WebView (Chromium 111+)**. This is a sideload preview, not a Play Store release.

- Bundled workbench opens offline; core file processing runs on the phone.
- Native file selection and Save dialog. Choose the destination for every export; no broad storage permission.
- Chunked export transfer, up to 256 MB. Cancel a save without losing the current result or incrementing the activity counter.
- Android Back navigation, system bar/keyboard insets and an update notice for obsolete WebView versions.
- Batch image conversion, resizing and compression: sequential queue, Stop, per-file errors and ZIP or individual saves.
- Visible watermark cropper previews edge trims as PNG. Invisible SynthID removal is not detected or verified.
- Local activity survives reopening. Inputs and unsaved conversion drafts remain memory-only.
- URL downloading opens the separate web tool. Feedback uses the GitHub issue flow in your browser. Model/OCR downloads need internet; device codecs and memory limit large media tasks.

Publication is gated by an Android 15 emulator test with Wi-Fi and mobile data disabled: actual QR PNG bytes saved through Android's file dialog, cancellation/retry, CSV import through the real picker, JSON export, activity persistence and Back navigation. All 20 bundled pages also open offline. Image resizing with invalid-input recovery, WAV export and PDF page extraction are checked in the Android renderer; Android’s PDF renderer verifies the extracted page count. Batch ZIP contents and a visible-edge crop also pass through the real Android Save dialog. Browser regression checks run separately before APK verification. This does not certify every tool, physical phone, Android version or OEM file provider.

**Signing:** this preview uses a development signing certificate with renderer debugging disabled. A future build may use a different certificate and require uninstalling the preview first. Save your files separately; uninstalling clears local activity and drafts. No automatic updater is included. A durable owner-controlled release key is needed before promising in-place updates.

The APK and matching source ZIP have SHA-256 checksums. The source archive includes the unmodified AGPL background-removal package and its source maps. [Build, privacy and troubleshooting guide](https://github.com/Gurtejhundal/MediaForge/blob/android-v0.2.0/docs/ANDROID.md).
