# MediaForge 🚀

**MediaForge** (formerly ImageForge) is a blazing-fast, modern, all-in-one multimedia conversion and optimization toolkit built for developers, creators, and power users. 

Built on the latest standard of **Next.js (App Router)** and designed with an utterly beautiful Dark Mode UI via **Tailwind CSS v4** & **Shadcn/UI**, MediaForge executes high-intensity visual tasks locally on your system without invasive tracking or uploading data to arbitrary locked-down APIs.

## 🛠️ Features Set

MediaForge bridges multiple independent utilities into a single, cohesive workflow:

### 1. **Core Feature: PNG to Favicon Builder**
Automatically converts any raw image into a fully structured, multi-scale Favicon package. It intelligently downscales your graphic into `16x16`, `32x32`, and `48x48` dimensions, packaging them cleanly into a multi-layered `.ico` file along with modern Apple Touch icons, zipping them instantly for deployment.

### 2. **Universal Format Converter**
Seamlessly cross-converts visual imagery between standard and Next-Gen formats. Supports dynamic converting to and from:
- `PNG`
- `JPEG / JPG`
- `WEBP`
- `AVIF` *(Ultra high-compression capability)*
- `HEIF / HEIC` *(Hardware-standard efficiency)*

### 3. **Image Resizer & Compressor**
Take absolute control over your imagery footprint. Utilize the **Resizer** to forcefully container-fit your images into exact pixel dimensions while maintaining crisp fidelity. Switch to the **Compressor** to violently slash down file sizes utilizing the `sharp` compression algorithms.

### 4. **URL Video Downloader & Frame Extractor**
Bypass browser CORS logic with our proxy engine. 
- **Universal Downloader**: Paste any standard YouTube link or public `.mp4` / `.webm` URL to securely stream the raw file down to your local desktop.
- **Video to Image Suite**: Drag in a video, scrub the built-in HTML5 player to your exact favorite timestamp (e.g. `00:00:15`), and immediately extract that single frame as a crisp `.jpg` or encode small bursts into compressed Animated `.gif` files!

### 5. **QR Code Generator**
A fully responsive, live-previewing matrix generator. Swap foreground and background tracking colors, dial in your quiet-zone margins, and generate high-density, heavily error-corrected `.png` or `.jpeg` QR codes on the fly. 

## 🏗️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org) (TypeScript)
- **Engine**: [Sharp](https://sharp.pixelplumbing.com/) (Standardized, High-performance Node.js image processing) & `@distube/ytdl-core`
- **Frontend Architecture**: React 19 Client components synced beautifully with Server-Side Actions.
- **Styling**: Tailwind CSS v4 featuring glassmorphism and animated Framer Motion primitives.

## 🚀 Getting Started

Simply run the boot script to instantly grab dependencies, launch the system server, and automatically spin up your default browser target:

```bash
# Windows users can double-click:
launcher.bat
```

Or manually initialize the suite using industry standard CLI:
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000` to access the MediaForge suite!
