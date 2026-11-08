# MediaForge licensing and source

Copyright © 2026 Gurtejbir Singh. MediaForge is licensed under **AGPL-3.0-only**; see [LICENSE](LICENSE). The owner selected this license on 8 November 2026. There is no warranty to the extent permitted by law.

The matching application source, lockfile and build/installation scripts accompany each release as `MediaForge-<version>-source.zip`. The application footer links to the matching tagged source and license. Dependencies retain their original licenses; MediaForge's license does not replace third-party terms.

## Included notices

Desktop preparation generates `THIRD_PARTY_LICENSES.txt` from the installed production dependency graph, including original license/notice files and resolved package-source URLs. That file, this document and MediaForge's LICENSE are included in the application archive. Electron's own LICENSE and Chromium third-party notices remain in the platform package.

- **IMG.LY background removal 1.7.0:** GNU AGPL v3. Its original LICENSE, bundled ThirdPartyLicenses.json and source maps containing the original source content are preserved. The source release also includes an unmodified copy of the installed package and its source maps under `vendor/background-removal-1.7.0/`. [Upstream project](https://github.com/imgly/background-removal-js).
- **Electron / Chromium / FFmpeg:** platform binaries are unmodified official Electron distributions. Retain the included Electron and Chromium notices. [Electron source and build instructions](https://github.com/electron/electron/tree/v45.2.3) and its [runtime source pins](https://github.com/electron/electron/blob/v45.2.3/DEPS) identify the distributed runtime. No application-specific codec modifications are made.
- **Instrument Sans, Barlow Condensed and IBM Plex Mono:** SIL Open Font License 1.1. Original notices are under [docs/licenses](docs/licenses) and included in the generated desktop notices.
- **Other npm packages:** exact versions and integrity hashes are in package-lock.json. The generated notices identify their registry source tarballs and preserve installed license text. Build tools are obtained with `npm ci` using that lockfile.

Background-removal and OCR model/runtime downloads are external first-use resources, not model files bundled in these installers. They retain their upstream terms. Optional owner-configured network providers have their own terms.

Keep the corresponding source and all notices with redistributed versions; publish the source of modified hosted versions as required by the license. Signing certificates, a commercial IMG.LY license and automatic updates are not included.

## Android runtime

The Android shell uses AndroidX Activity 1.10.1 and AndroidX WebKit 1.14.0, with their Gradle-resolved AndroidX/Kotlin runtime dependencies. These retain Apache 2.0 terms; the full license is preserved in `docs/android-runtime-LICENSE.txt` and appended to the in-app notices. Sources are available from [AndroidX](https://android.googlesource.com/platform/frameworks/support/) and [Kotlin](https://github.com/JetBrains/kotlin); exact direct versions are pinned in `android/app/build.gradle` and transitive versions are shown by `./gradlew :app:dependencies --configuration previewRuntimeClasspath`. Gradle's wrapper retains its upstream copyright headers and its distribution checksum is pinned.
