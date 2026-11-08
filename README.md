<div align="center">

<img src="public/android-chrome-192x192.png" width="88" height="88" alt="MediaForge illustrated MF app icon">

`MF / LOCAL MEDIA WORKBENCH`

# MediaForge

### Put your media on the bench.

Resize an image. Organize a PDF. Cut a sound. Make a QR code.<br>
**One workbench for the small file jobs that interrupt your day.**

[**Open MediaForge ↗**](https://mediaforge-tau.vercel.app/) &nbsp; · &nbsp; [**↓ Get the app**](#get-the-app) &nbsp; · &nbsp; [See it in action](#see-it-in-action) &nbsp; · &nbsp; [Run from source](#run-from-source) &nbsp; · &nbsp; [Coffee ☕](#keep-the-forge-caffeinated)

`Android · Web · Windows · macOS · Linux` &nbsp; `No account` &nbsp; `Core processing stays on your device`

</div>

![The real MediaForge workbench: cream faceplates, dark chassis, local activity monitor and a directory of file tools](docs/readme/workbench-desktop.png)

<sub>The working app, captured from a production build. [Open the live workbench ↗](https://mediaforge-tau.vercel.app/)</sub>

---

## Get the app

**[MediaForge 0.2.0](https://github.com/Gurtejhundal/MediaForge/releases/tag/v0.2.0)** · Choose your workbench. Keep your files.

<table>
  <tr>
    <td width="50%" valign="top">
      <h3><img src="docs/readme/os/android.svg" width="24" height="24" alt=""> &nbsp; Android</h3>
      <p>The little file jobs. Now in your pocket.</p>
      <p><a href="https://github.com/Gurtejhundal/MediaForge/releases/download/android-v0.2.0/MediaForge-0.2.0-android.apk"><b>↓ Download APK</b></a></p>
      <sub>Android 8+ · Updated WebView · Sideload preview</sub>
    </td>
    <td width="50%" valign="top">
      <h3><img src="docs/readme/os/windows.svg" width="24" height="24" alt=""> &nbsp; Windows</h3>
      <p>Your media workbench, ready from the desktop.</p>
      <p><a href="https://github.com/Gurtejhundal/MediaForge/releases/download/v0.2.0/MediaForge-0.2.0-win-x64.exe"><b>↓ Intel / AMD</b></a></p>
      <sub>64-bit · Per-user installer · Unsigned</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3><img src="docs/readme/os/apple.svg" width="24" height="24" alt=""> &nbsp; macOS</h3>
      <p>A little room on your Mac for the next file job.</p>
      <p><a href="https://github.com/Gurtejhundal/MediaForge/releases/download/v0.2.0/MediaForge-0.2.0-mac-arm64.dmg"><b>↓ Apple Silicon</b></a> &nbsp; · &nbsp; <a href="https://github.com/Gurtejhundal/MediaForge/releases/download/v0.2.0/MediaForge-0.2.0-mac-x64.dmg"><b>↓ Intel</b></a></p>
      <sub>DMG installers · Unsigned, not notarized</sub>
    </td>
    <td width="50%" valign="top">
      <h3><img src="docs/readme/os/linux.svg" width="24" height="24" alt=""> &nbsp; Linux</h3>
      <p>Local tools. Ordinary files. Your desktop.</p>
      <p><a href="https://github.com/Gurtejhundal/MediaForge/releases/download/v0.2.0/MediaForge-0.2.0-linux-x64.AppImage"><b>↓ AppImage</b></a> &nbsp; · &nbsp; <a href="https://github.com/Gurtejhundal/MediaForge/releases/download/v0.2.0/MediaForge-0.2.0-linux-x64.deb"><b>↓ DEB</b></a></p>
      <sub>64-bit Intel / AMD · Ubuntu 24.04 native CI</sub>
    </td>
  </tr>
</table>

**Current web and Android preview:** batch images and the visible watermark cropper. Desktop 0.2.0 downloads retain their original verified feature set.

[All releases](https://github.com/Gurtejhundal/MediaForge/releases) &nbsp; · &nbsp; [Checksums](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.2.0/SHA256SUMS.txt) &nbsp; · &nbsp; [Matching source](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.2.0/MediaForge-0.2.0-source.zip)

<details>
<summary>Installation help &amp; release details</summary>

- **Android:** open the APK and follow the system install prompt. Preview certificate; future builds may require a reinstall. [Android release](https://github.com/Gurtejhundal/MediaForge/releases/tag/android-v0.2.0) · [APK checksums](https://github.com/Gurtejhundal/MediaForge/releases/download/android-v0.2.0/SHA256SUMS.txt) · [Build, storage and installation guide](docs/ANDROID.md).
- **Windows:** open the setup file and choose an installation folder. This release provides x64, not a native ARM64 build.
- **macOS:** choose the DMG for your processor, open it, and drag MediaForge into Applications. Prefer a ZIP? [Apple Silicon](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.2.0/MediaForge-0.2.0-mac-arm64.zip) · [Intel](https://github.com/Gurtejhundal/MediaForge/releases/download/v0.2.0/MediaForge-0.2.0-mac-x64.zip).
- **Linux:** install the DEB with your package manager, or allow execution of the AppImage and open it. AppImage requires FUSE 2 and a compatible sandbox/user-namespace setup. If those are unavailable, prefer the DEB; keep the Chromium sandbox enabled. Linux ARM builds are not provided.

Windows and Mac downloads are **unsigned**; macOS builds are **not notarized**. Your OS may ask you to approve the app. Review the source and checksum before approving an unsigned download. No automatic updater is included.

All four targets run source, browser and packaged-app launch/export/restart checks in native CI. These checks do not certify every OS version or exercise privileged installer execution and AppImage FUSE mounting. [Verification and installation limits](docs/hosted-verification.md) · [Release notes](docs/releases/0.2.0.md).

Downloads are public GitHub release assets and do not require GitHub sign-in. Model/OCR assets may need a network on first use. Save inputs and exports separately; conversion drafts are memory-only.

</details>

## See it in action

### The same workbench, in your pocket

<p align="center">
  <img src="docs/readme/android-workbench.png" width="280" alt="Actual installed Android app running the bundled workbench offline">
  &nbsp;
  <img src="docs/readme/android-qr.png" width="280" alt="Actual Android app with a generated QR code and local export controls">
</p>

<sub>Real Android 15 emulator captures, with networking disabled. Native file selection and Save dialogs; your files stay yours. [Android guide](docs/ANDROID.md).</sub>

### A whole folder’s worth of small jobs

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/batch-images.png">
  <img src="docs/readme/batch-workflow.gif" alt="Actual batch image workflow: select two images, compress them locally and save both outputs with a report in one ZIP" width="1080">
</picture>

<sub>Batch conversion, resizing and compression. Files run one at a time; failures stay visible and finished files can be saved individually or together.</sub>

### Resize it. Save it. Move on.

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/image-resizer.png">
  <img src="docs/readme/resize-workflow.gif" alt="Actual image workflow: choose an image, set 256 by 256 pixels, resize and save a verified PNG" width="1080">
</picture>

<sub>A real image import, dimension change and PNG export. The capture script checks the downloaded image dimensions.</sub>

### Keep the PDF pages you need

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/document-studio.png">
  <img src="docs/readme/document-workflow.gif" alt="Actual Document Studio workflow: select a three-page PDF, extract pages 1 and 3, and save the two-page result" width="1080">
</picture>

<sub>Pages 1 and 3, in a new PDF. The downloaded result is opened and its page count verified.</sub>

### Make a QR in a few clicks

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/qr-workspace.png">
  <img src="docs/readme/qr-workflow.gif" alt="Actual MediaForge workflow: enter text, generate a QR preview, choose SVG and export locally" width="1080">
</picture>

<sub>Real production-build captures with sample content. The GIF shortens waiting time; it shows the working app.</sub>

### A workbench for sound, too

![Actual Audio Studio with a selected WAV file and local audio export controls](docs/readme/audio-studio.png)

<details>
<summary>Explore the mobile view</summary>

<img src="docs/readme/qr-mobile.png" alt="Actual generated QR preview and export controls at a 390-pixel viewport" width="300">

[Capture provenance and regeneration](docs/readme/README.md)

</details>

### Visible marks, with an honest preview

![Actual visible-edge cropper using synthetic sample artwork with a DEMO corner label; the cropped PNG is previewed before saving](docs/readme/visible-cropper.png)

<sub>This trims visible edge marks. It does not detect SynthID or verify invisible watermark removal. [How the tool works and its limits](docs/ANDROID.md#watermarks-and-batches).</sub>

## One workbench. Five benches.

| Bring… | Take away… |
| --- | --- |
| **An image** | Resized, cropped, rotated, captioned, compressed or converted files; batch ZIPs; visible edge crops; favicon ZIPs; model-based background removal. |
| **A video** | Extracted image frames, a muted WebM, an upscaled clip or a softened region. |
| **A sound** | WAV exports, a trimmed ringtone, merged clips, normalized volume, reverse or speed changes. |
| **Documents & data** | Organized PDFs, text-oriented Office conversions, OCR, JSON/CSV/XML/YAML conversions, Markdown/HTML/TXT and QR codes. |
| **A public media URL** | A direct download with bounded server fetching; platform downloads require an owner-configured provider. |

**Selected files stay on your device for core processing.** Green local paths use browser file APIs, Canvas, Web Audio and local libraries. Model/OCR tools may download assets. URL downloads and optional text feedback use clearly marked network routes.

<details>
<summary>A few practical limits</summary>

- **Save your output.** Refreshing or quitting discards input files, previews and drafts. Only activity counters and the last export's filename/time persist locally. Downloads remain ordinary files you control. [Storage and backups](docs/architecture.md#storage-and-backups).
- **Formats depend on the browser.** Video exports are muted WebM; audio exports are WAV. Input codecs and optional image encoders vary. SVG image exports embed raster artwork rather than vectorizing it.
- **Document layout is best-effort.** Office/PDF conversions prioritize readable content. Secure redaction, PDF encryption, archival PDF/A and cryptographic signatures are not included.
- **First-use models need a network.** Background removal and OCR fetch runtime/model assets. Frame ZIPs stop at 1,800 frames; large jobs depend on device memory.
- **Network tools need configuration.** Platform download providers and feedback webhooks are optional. Failed feedback stays in the form. Direct media downloads are capped at 50 MB.

</details>

## Run from source

Use **Node.js 24.12+ in the 24.x line** and npm:

```sh
git clone https://github.com/Gurtejhundal/MediaForge.git
cd MediaForge
npm ci
npm run dev
```

Open **http://127.0.0.1:3000**. Build a production preview with `npm run build` then `npm start`; build a desktop installer for your current OS with `npm run desktop:dist`.

| Need the details? | Start here |
| --- | --- |
| Configuration, development, tests and troubleshooting | [Development guide](docs/development.md) |
| Architecture, privacy, storage and backups | [How the workbench works](docs/architecture.md) |
| Versions, packaging, source and checksums | [Release guide](docs/releasing.md) |
| Findings and observed checks | [Audit](docs/audit.md) · [Android & interface audit](docs/android-audit.md) · [Hosted verification](docs/hosted-verification.md) |
| Licensing and dependencies | [AGPL-3.0](LICENSE) · [Third-party notices](THIRD_PARTY_NOTICES.md) · [Dependency review](docs/dependencies.md) |

[Contribute](CONTRIBUTING.md) · [Report a problem](https://github.com/Gurtejhundal/MediaForge/issues) · [Security](SECURITY.md)

## Keep the forge caffeinated

The pixels stay local. The coffee is optional. ☕<br>
If MediaForge saved your afternoon, you can put a little fuel in the next one.

<p align="center">
  <a href="docs/readme/upi-qr.png"><img src="docs/readme/upi-qr.png" alt="Optional UPI support QR for Gurtejbir Singh, reused unchanged from Traqu with permission" width="190" height="190"></a><br>
  <b>Scan with your UPI app · any amount, zero pressure.</b><br>
  <sub>The workbench works just as well without a tip.</sub>
</p>

---

<p align="center"><b>MediaForge</b> — keep the file. Use the console.<br><sub>Made by <a href="https://github.com/Gurtejhundal">Gurtejbir Singh</a> · AGPL-3.0 · no warranty</sub></p>
