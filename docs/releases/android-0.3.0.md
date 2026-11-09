# MediaForge for Android 0.3.0

The bundled workbench includes tool search, working-file warnings, remembered processing preferences, image-batch resume/retry, recoverable crop errors and the updated audio-preserving video engine. [Full application changes](0.3.0.md).

Download `MediaForge-0.3.0-android.apk` and check its SHA-256 against `SHA256SUMS.txt`. Android 8+ and a current WebView are required; native verification runs on an Android 15 emulator, not every physical phone or codec. Native file selection/Save dialogs, cancellation, exports, reopen and Back are exercised before publication. Export limit: 256 MB. Inputs/drafts remain memory-only.

**Upgrade from 0.2.0:** the old preview signing certificate cannot be reused. Save exported files outside the app, uninstall the old preview, then install 0.3.0. Uninstall clears private counters. This release bootstraps a retained signing key with an owner-encrypted backup; future upgrades must use that same key. It is a direct APK distribution, not a Play Store listing.

Ordinary tools do not require an NVIDIA GPU. The experimental CUDA companion requires a separate NVIDIA computer/process and is not supported on Android. Invisible SynthID removal remains unverified. Network download/feedback flows keep their documented external-browser behavior. First-use model/OCR downloads still require connectivity.

This release includes matching AGPL source and notices, checksums and an installed-app verification gate. Older Android 0.2.0 remains available unchanged.
