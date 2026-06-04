# MediaForge Design Specification

## 1. Product Direction

MediaForge should feel like a serious local media workstation, not a flashy AI-generated landing page.

The current product is a practical toolkit: favicon packaging, image conversion, resizing, compression, video downloading, frame extraction, GIF creation, and QR generation. The design must communicate speed, control, privacy, and precision without looking heavy, gamer-style, or over-decorated.

### Design Thesis

**MediaForge is a clean light-mode utility suite for people who need to process media files quickly and trust the output.**

It should look closer to a polished developer tool, Apple utility panel, Linear workspace, Raycast preference screen, and Figma export panel — not a neon dashboard, AI SaaS template, or glassmorphism experiment.

### Primary Feeling

- Calm
- Sharp
- Local-first
- Professional
- Fast
- Practical
- Minimal but not empty

### What to Remove

- Dark-mode-first design
- Heavy glassmorphism
- Excessive gradients
- Huge glowing cards
- Emoji-heavy UI
- Overhyped marketing language
- Fake AI-style copy like “supercharge,” “revolutionary,” “magic,” or “blazing-fast” everywhere
- Random decorative blobs that do not explain the product

### What to Build Instead

- A bright professional workspace
- Clear file-processing flows
- Strong upload, preview, settings, and export panels
- Calm white surfaces with soft borders
- Controlled accent color usage
- Precise microcopy
- Obvious system states: ready, processing, complete, error

---

## 2. Brand Positioning

### Product Category

MediaForge is not just a converter. It is a **local media operations toolkit**.

### One-Line Positioning

**Convert, resize, compress, package, and export media files from one clean local workspace.**

### Homepage Hero Copy

Use:

> A clean media toolkit for fast local conversions.

Supporting line:

> Convert images, build favicons, compress assets, extract video frames, and generate QR codes without sending your workflow through a cluttered cloud dashboard.

CTA labels:

- **Open Workspace**
- **View Tools**

Avoid:

- “All-in-one revolutionary multimedia platform”
- “Powered by cutting-edge technology”
- “AI-grade blazing fast magic”
- “Unlock your creativity”

### Brand Tone

Short, technical, calm.

Good examples:

- “Drop an image to begin.”
- “Choose an output format.”
- “Compression estimate updates after upload.”
- “Files are processed locally where supported.”
- “Export package ready.”

Bad examples:

- “Let’s forge your media masterpiece!”
- “Unleash powerful creativity!”
- “Your ultimate epic conversion machine!”

---

## 3. Visual Identity

### Design Style

**Light technical minimalism.**

The UI should use white, warm off-white, soft gray borders, strong black text, and one confident accent color. The goal is restraint. MediaForge should look like something a developer, designer, YouTuber, student, or startup founder can trust.

### Visual References

Use these as direction only, not as copies:

- Linear: clarity, spacing, typography discipline
- Apple settings panels: clean controls and hierarchy
- Figma export panel: precision and utility
- Raycast: command-like efficiency
- Vercel dashboard: developer-tool confidence
- Arc browser preferences: soft modern surfaces

### Core Visual Rule

If an element does not help the user choose a tool, upload a file, preview output, or export a result, remove it.

---

## 4. Color System

MediaForge must use **light mode as the default and primary experience**.

### Base Palette

| Token | Hex | Usage |
|---|---:|---|
| `--background` | `#FAFAF8` | Main app background |
| `--surface` | `#FFFFFF` | Cards, panels, nav |
| `--surface-soft` | `#F5F6F8` | Tool zones, secondary panels |
| `--surface-raised` | `#FFFFFF` | Floating panels, dialogs |
| `--text-primary` | `#111827` | Main text |
| `--text-secondary` | `#4B5563` | Descriptions |
| `--text-muted` | `#7C8594` | Helper labels |
| `--border` | `#E5E7EB` | Default borders |
| `--border-strong` | `#D1D5DB` | Active panel borders |
| `--accent` | `#2563EB` | Primary actions, selected states |
| `--accent-hover` | `#1D4ED8` | Button hover |
| `--accent-soft` | `#DBEAFE` | Active backgrounds |
| `--success` | `#0F766E` | Completed exports |
| `--warning` | `#B45309` | Format limitations |
| `--danger` | `#B42318` | Failed uploads/errors |
| `--focus` | `#2563EB` | Keyboard focus rings |

### Accent Philosophy

Use blue as the single main accent. Do not turn every card into a different color. Different tools may have tiny icon accents, but the system should still feel unified.

### Background Treatment

Use this structure:

- Main background: warm off-white
- Cards: pure white
- Tool input zones: very light gray
- Borders: visible but soft
- Shadows: rare, subtle, and realistic

### Avoid

- Full-page gradients
- Purple-blue AI SaaS backgrounds
- Neon cyan and pink
- Glass panels with low contrast
- Overuse of dark navy
- Random rainbow tool cards

---

## 5. Typography

### Font Stack

Use:

```css
font-family: Geist, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

For technical values, file extensions, timestamps, dimensions, and output settings:

```css
font-family: "Geist Mono", "SF Mono", Consolas, monospace;
```

### Type Scale

| Role | Size | Weight | Line Height |
|---|---:|---:|---:|
| Hero title | 56px | 650 | 1.02 |
| Page title | 40px | 650 | 1.1 |
| Section title | 24px | 620 | 1.25 |
| Card title | 17px | 600 | 1.35 |
| Body | 15px | 400 | 1.65 |
| Small text | 13px | 400 | 1.5 |
| Label | 12px | 550 | 1.2 |
| Mono metadata | 12px | 500 | 1.4 |

### Typography Rules

- Never center large blocks of text except the homepage hero.
- Tool screens should be left-aligned.
- Keep headings short.
- Use sentence case, not title case everywhere.
- File extensions and dimensions should use mono font.

Example:

```txt
Convert image
PNG → WEBP
Quality 82%
1280 × 720 px
```

---

## 6. Layout System

### Grid

Use a 12-column desktop grid with a max width of `1200px` to `1280px`.

```css
.container {
  width: min(100% - 48px, 1240px);
  margin-inline: auto;
}
```

### Spacing Scale

Use a 4px-based scale.

| Token | Value |
|---|---:|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-20` | 80px |

### Radius

| Token | Value | Usage |
|---|---:|---|
| `radius-sm` | 8px | Inputs, tags |
| `radius-md` | 12px | Buttons, small cards |
| `radius-lg` | 16px | Panels |
| `radius-xl` | 24px | Hero preview, major cards |

### Shadows

Use shadows only for raised surfaces, not every card.

```css
--shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.04);
--shadow-md: 0 12px 30px rgba(16, 24, 40, 0.08);
--shadow-focus: 0 0 0 4px rgba(37, 99, 235, 0.14);
```

---

## 7. Information Architecture

### Main Navigation

Top nav should be simple:

- MediaForge logo
- Tools
- Workspace
- History
- GitHub

Right side:

- Theme indicator: Light
- Optional local-processing badge
- Primary action: Open Workspace

### Tool Categories

Group tools by user intent, not by technical implementation.

#### Convert

- Image format converter
- PNG/JPEG/WEBP/AVIF/HEIF conversion

#### Optimize

- Image compressor
- Image resizer

#### Package

- Favicon builder
- Apple touch icon export
- ZIP output

#### Extract

- Video downloader
- Frame extractor
- GIF generator

#### Generate

- QR code generator

### Recommended App Routes

```txt
/
/tools
/tools/favicon
/tools/convert
/tools/compress
/tools/resize
/tools/video-download
/tools/frame-extract
/tools/qr
/history
/settings
```

---

## 8. Homepage Design

### Hero Section

The hero should not look like a fake AI product. It should show the actual workflow.

#### Layout

Left side:

- Product eyebrow: `Local media toolkit`
- Hero title
- Short description
- Two CTAs
- Trust row

Right side:

- A realistic workspace preview card
- Upload zone
- Format chips
- Output package preview
- Progress row

#### Hero Title

```txt
Convert and export media without the clutter.
```

#### Hero Description

```txt
MediaForge gives you one clean workspace for image conversion, favicon packages, compression, video frames, GIFs, and QR codes.
```

#### Trust Row

Use small badges:

- Local-first workflow
- Built with Next.js
- Sharp-powered image processing
- No bloated dashboard

### Hero Preview Card

The preview should look like a real app screenshot.

Elements:

- Header: `Workspace / Convert`
- File row: `hero-image.png · 2.4 MB`
- Conversion: `PNG → WEBP`
- Quality slider at 82%
- Output estimate: `742 KB estimated`
- Primary button: `Export file`

### Homepage Sections

Order:

1. Hero
2. Tool library cards
3. Workflow preview
4. Feature details
5. Privacy/local processing section
6. Final CTA

### Tool Library Cards

Each card should show:

- Icon
- Tool name
- One-line description
- Supported outputs
- Small CTA

Example:

```txt
Favicon builder
Generate ICO, PNG sizes, and Apple touch icons from one source image.
Outputs: ICO, PNG, ZIP
```

---

## 9. Workspace Design

The workspace is the most important part. Make it feel like a professional editor, not a form page.

### Desktop Layout

Use a three-zone structure:

```txt
┌────────────────────────────────────────────────────────────┐
│ Top bar: Tool name / file state / export button             │
├───────────────┬────────────────────────────┬───────────────┤
│ Tool sidebar  │ Main preview + upload      │ Settings panel│
│               │ File queue                 │ Output config │
└───────────────┴────────────────────────────┴───────────────┘
```

### Zones

#### Left Sidebar

Purpose: tool switching.

Width: `240px` desktop.

Items:

- Convert
- Resize
- Compress
- Favicon
- Video
- Frame
- QR

Each sidebar item:

- Icon
- Label
- Short capability text
- Active state using accent-soft background

#### Main Panel

Purpose: upload, preview, file queue, output preview.

Contains:

- Drag-and-drop area
- File preview
- Metadata table
- Processing progress
- Output result card

#### Right Settings Panel

Purpose: precise controls.

Width: `320px` to `360px` desktop.

Contains:

- Format selector
- Quality slider
- Dimensions
- Toggles
- Advanced options accordion
- Export button

### Mobile Layout

Mobile should not squeeze three columns.

Use:

1. Tool selector dropdown
2. Upload panel
3. Settings accordion
4. Preview panel
5. Export button sticky at bottom

---

## 10. Core Components

## 10.1 App Header

### Visual

- Height: 64px
- Background: `rgba(255,255,255,0.82)`
- Backdrop blur: subtle only
- Border bottom: `1px solid --border`
- Sticky top

### Logo

Logo concept:

- Simple rounded square mark
- Inside: abstract file corner + small spark/forge cut
- Avoid literal hammer/anvil; it looks childish
- Wordmark: `MediaForge`

### Header Actions

- `Tools`
- `Workspace`
- `History`
- `GitHub`
- Primary button: `Open Workspace`

---

## 10.2 Buttons

### Primary Button

Use for final actions.

```css
background: #2563EB;
color: white;
border-radius: 12px;
height: 40px;
padding-inline: 16px;
font-weight: 560;
```

States:

- Hover: `#1D4ED8`
- Active: slightly lower transform, no bounce
- Disabled: `#CBD5E1`, cursor not-allowed
- Loading: spinner + label

### Secondary Button

White background, soft border.

Use for navigation or non-final actions.

### Ghost Button

Use only in dense panels and nav.

### Destructive Button

Use only for removing files or clearing queue.

---

## 10.3 Upload Zone

This is the emotional center of the app. It must feel obvious and reliable.

### Default State

```txt
Drop files here
PNG, JPEG, WEBP, AVIF, HEIF, MP4, WEBM supported
or browse from device
```

### Visual

- Large rounded rectangle
- Dashed border
- Soft gray background
- Upload icon inside a small white icon tile
- Clear supported formats row

### States

| State | UI Behavior |
|---|---|
| Empty | Calm dashed area |
| Drag over | Blue border + accent-soft background |
| Uploading | Progress bar and file name |
| Valid file | Preview thumbnail + metadata |
| Invalid file | Red border + exact reason |
| Complete | Output card appears below |

### Invalid File Microcopy

Bad:

```txt
Something went wrong.
```

Good:

```txt
HEIC is not available in this browser session. Try PNG, JPEG, WEBP, or AVIF.
```

---

## 10.4 File Queue

Show the queue when there are multiple files.

Each row:

- Thumbnail/icon
- File name
- Original size
- Target format
- Status pill
- Remove action

Status pills:

- Ready
- Processing
- Complete
- Failed

Use mono font for sizes and dimensions.

---

## 10.5 Settings Panel

The settings panel should feel like a professional export inspector.

### Structure

```txt
Output
- Format
- Quality
- Dimensions

Options
- Preserve metadata
- Keep aspect ratio
- Transparent background

Advanced
- Compression method
- Chroma subsampling
- Lossless mode
```

### Rules

- Most users should not see advanced settings immediately.
- Collapse dangerous/technical options under `Advanced`.
- Always show a short helper line under complex controls.
- Never place all options in one giant form.

---

## 10.6 Preview Panel

Preview should adapt by file type.

### Image Preview

- Centered image on checker/light grid background
- Before/after toggle when compression is used
- Metadata below

### Video Preview

- Native video player
- Timestamp scrubber
- Frame capture button
- Selected frame preview below

### QR Preview

- White QR preview card
- Download options underneath
- Contrast warning if foreground/background colors are too close

### Favicon Preview

Show real output sizes:

- 16 × 16
- 32 × 32
- 48 × 48
- 180 × 180 Apple touch icon

Do not only show one giant favicon preview. That hides real quality issues.

---

## 10.7 Output Card

After processing, show a clear result card.

```txt
Export ready
favicon-package.zip
ICO, PNG sizes, Apple touch icon
[Download ZIP]
```

For compression:

```txt
Export ready
image.webp
2.4 MB → 742 KB
69% smaller
[Download]
```

---

## 11. Tool-Specific Design

## 11.1 Favicon Builder

### Goal

Make it obvious that one image becomes a full deployable favicon package.

### Layout

- Upload source image
- Show detected dimensions
- Warn if source is too small
- Preview generated sizes
- Export package list
- Download ZIP

### Required UI Details

- Show generated assets before export:
  - `favicon.ico`
  - `favicon-16x16.png`
  - `favicon-32x32.png`
  - `apple-touch-icon.png`
  - `site.webmanifest` if added later

### Warning Example

```txt
Source image is 96 × 96. Use at least 512 × 512 for sharper icons.
```

---

## 11.2 Universal Image Converter

### Goal

Make format conversion feel instant and controlled.

### Controls

- Source format detected automatically
- Target format selector
- Quality slider when applicable
- Lossless toggle when applicable
- Metadata preservation toggle
- Batch convert support if available

### Format Selector UI

Use segmented cards instead of a basic dropdown on desktop:

```txt
PNG   JPEG   WEBP   AVIF   HEIF
```

On mobile, use a select dropdown.

### Output Estimate

Show estimated size only after file analysis.

---

## 11.3 Image Resizer

### Goal

Make resizing safe. Users fear ruining aspect ratio.

### Controls

- Width
- Height
- Lock aspect ratio
- Fit mode:
  - Contain
  - Cover
  - Stretch
- Presets:
  - 512 square
  - 1080 social
  - 1920 HD
  - Custom

### Preview

Show original vs output dimensions clearly.

```txt
Original: 4032 × 3024
Output: 1920 × 1440
```

---

## 11.4 Image Compressor

### Goal

Make compression measurable.

### Controls

- Quality slider
- Format selector
- Keep original dimensions toggle
- Strip metadata toggle

### Preview

Show:

- Original size
- Estimated output size
- Percentage reduction
- Before/after preview toggle

Do not promise exact size before processing unless the system can calculate it.

---

## 11.5 Video Downloader

### Goal

Make the URL workflow feel safe and plain.

### Layout

- URL input
- Paste button
- Analyze button
- Video metadata card
- Download options
- Progress indicator

### URL Input Placeholder

```txt
Paste a public video URL
```

### Warning Copy

```txt
Only download media you own or have permission to use.
```

Keep this visible but not dramatic.

---

## 11.6 Frame Extractor

### Goal

Let users capture the exact moment.

### Controls

- Video upload
- Video player
- Timestamp input
- Capture frame button
- Export format selector: JPG / PNG

### UI Details

- Show current timestamp in mono font
- Let user step forward/backward by frame or 0.1s if technically supported
- Show captured frame as a result card

---

## 11.7 GIF Generator

### Goal

Make short clip creation simple.

### Controls

- Start time
- End time
- FPS
- Width
- Quality
- Loop toggle

### Guardrails

Show warnings for long GIFs:

```txt
GIFs longer than 8 seconds can become very large. Consider reducing FPS or width.
```

---

## 11.8 QR Code Generator

### Goal

Make QR generation clean and trustworthy.

### Controls

- Content input
- Foreground color
- Background color
- Margin
- Error correction level
- Export format: PNG / JPEG

### Preview

Always show QR on a white card even in light mode.

### Contrast Warning

```txt
Low contrast may make this QR difficult to scan.
```

---

## 12. Component Styling Rules

### Cards

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
}
```

Cards should not float aggressively. Most surfaces only need borders.

### Inputs

```css
.input {
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #FFFFFF;
  color: var(--text-primary);
}

.input:focus-visible {
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
  outline: none;
}
```

### Sliders

- Thin track
- Blue active fill
- Show value on the right
- Use labels like `Quality 82%`, not only a number

### Tabs

Use for top-level tool modes only. Do not overuse tabs inside panels.

### Accordions

Use for advanced settings.

### Toasts

Use Sonner-style toasts sparingly.

Good toast:

```txt
Export complete: image.webp
```

Bad toast:

```txt
Boom! Your masterpiece has been forged!
```

---

## 13. Motion Design

Motion must be restrained.

### Use Motion For

- Upload zone drag state
- Progress transitions
- Result card entrance
- Tool card hover
- Accordion open/close

### Do Not Use Motion For

- Constant floating blobs
- Infinite glow animations
- Hero elements moving forever
- Bouncy buttons
- Overanimated page transitions

### Motion Tokens

```css
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--duration-fast: 120ms;
--duration-base: 180ms;
--duration-slow: 260ms;
```

### Framer Motion Guidance

Use subtle animation:

```ts
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
```

Do not use large scale animations.

---

## 14. Icons

Use `lucide-react` icons.

Recommended icons:

| Tool | Icon |
|---|---|
| Convert | `RefreshCcw` |
| Resize | `Maximize2` |
| Compress | `Archive` or `Minimize2` |
| Favicon | `BadgeIcon` or `PanelTop` |
| Video download | `Download` |
| Frame extract | `ImageDown` |
| GIF | `Film` |
| QR | `QrCode` |
| Settings | `SlidersHorizontal` |
| Output | `PackageCheck` |

Icon rules:

- Stroke width: 1.75 or 2
- Size: 18px in nav, 20px in cards, 24px in feature blocks
- Do not use filled cartoon icons
- Do not use 3D icons

---

## 15. Accessibility

This app handles files and settings, so accessibility is non-negotiable.

### Requirements

- Minimum body text contrast: WCAG AA
- All controls keyboard accessible
- Visible focus rings
- Upload zone must have clickable fallback button
- Do not rely on color alone for status
- Every icon-only button needs an `aria-label`
- Progress bars need accessible labels
- Errors must explain the problem and the fix

### Keyboard Behavior

- `Tab`: move through controls
- `Enter`: trigger focused button
- `Escape`: close dialogs/menus
- Arrow keys: move through segmented controls where applicable

---

## 16. Responsive Behavior

### Desktop

- Full three-panel workspace
- Persistent sidebar
- Sticky settings panel
- Large preview area

### Tablet

- Sidebar becomes horizontal tool rail
- Settings panel moves below preview or becomes a drawer

### Mobile

- Single-column flow
- Sticky bottom export button
- Tool switcher as dropdown
- Settings collapsed by default
- File queue rows simplified

### Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

---

## 17. Empty, Loading, Error, and Success States

### Empty State

```txt
No file selected
Drop a file here or choose one from your device.
```

### Loading State

Use progress bars for real processing.

Avoid fake skeletons after upload if actual progress is available.

### Error State

Error messages must be specific.

Examples:

```txt
This file is larger than the current limit of 100 MB.
```

```txt
The selected format does not support transparency. Choose PNG or WEBP instead.
```

```txt
Video analysis failed. Check that the URL is public and reachable.
```

### Success State

```txt
Export ready
Your converted file is ready to download.
```

---

## 18. Copywriting Rules

### Voice

- Direct
- Technical
- Calm
- Useful

### Sentence Length

Keep UI copy short. Most helper text should be one sentence.

### Replace These Words

| Avoid | Use Instead |
|---|---|
| Blazing-fast | Fast |
| Ultimate | Complete |
| Magic | Automatic |
| Revolutionary | Modern |
| Violently slash | Reduce |
| Unleash | Use |
| Forge masterpiece | Export file |

### Preferred Terms

- Convert
- Resize
- Compress
- Extract
- Generate
- Export
- Package
- Local
- Output
- Preview
- Queue

---

## 19. Implementation With Tailwind CSS v4

Add design tokens in the global CSS file.

```css
:root {
  --background: #FAFAF8;
  --surface: #FFFFFF;
  --surface-soft: #F5F6F8;
  --surface-raised: #FFFFFF;

  --text-primary: #111827;
  --text-secondary: #4B5563;
  --text-muted: #7C8594;

  --border: #E5E7EB;
  --border-strong: #D1D5DB;

  --accent: #2563EB;
  --accent-hover: #1D4ED8;
  --accent-soft: #DBEAFE;

  --success: #0F766E;
  --warning: #B45309;
  --danger: #B42318;
  --focus: #2563EB;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.04);
  --shadow-md: 0 12px 30px rgba(16, 24, 40, 0.08);
  --shadow-focus: 0 0 0 4px rgba(37, 99, 235, 0.14);
}

html {
  background: var(--background);
  color: var(--text-primary);
}

body {
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.06), transparent 32rem),
    var(--background);
  color: var(--text-primary);
}
```

### Important

The radial gradient must be extremely subtle. If the page starts looking like a purple AI landing page, remove it.

---

## 20. Suggested Component Names

```txt
AppShell
TopNav
ToolSidebar
ToolCard
UploadDropzone
FileQueue
PreviewPanel
SettingsPanel
OutputCard
FormatSelector
QualitySlider
DimensionInput
ProcessingProgress
StatusPill
EmptyState
ErrorNotice
ExportButton
```

---

## 21. Page-Level Wireframes

## 21.1 Homepage

```txt
TopNav

Hero
├─ Left: title, copy, CTAs, trust badges
└─ Right: realistic workspace preview

ToolLibrary
├─ Convert card
├─ Optimize card
├─ Package card
├─ Extract card
└─ Generate card

WorkflowPreview
├─ Upload
├─ Configure
└─ Export

LocalFirstSection
FinalCTA
Footer
```

## 21.2 Tool Workspace

```txt
TopNav

WorkspaceShell
├─ ToolSidebar
├─ MainPanel
│  ├─ UploadDropzone
│  ├─ PreviewPanel
│  ├─ FileQueue
│  └─ OutputCard
└─ SettingsPanel
   ├─ Output settings
   ├─ Tool-specific settings
   ├─ Advanced accordion
   └─ Export button
```

## 21.3 QR Tool

```txt
TopNav

ToolPage
├─ MainPanel
│  ├─ Content input
│  ├─ Live QR preview
│  └─ Export result
└─ SettingsPanel
   ├─ Foreground color
   ├─ Background color
   ├─ Margin
   ├─ Error correction
   └─ Export format
```

---

## 22. Quality Bar

Before considering the redesign done, check every screen against this list.

### Visual Quality

- Light mode is the default
- No dark glassmorphism remains as the main style
- Borders are consistent
- Buttons have clear hierarchy
- Cards are not over-decorated
- Text alignment is disciplined
- Accent color is not overused

### Product Quality

- User can identify each tool in under 3 seconds
- Upload flow is obvious
- Output settings are visible before export
- Errors are specific
- Export result is clear
- Mobile flow is usable

### Trust Quality

- The UI does not exaggerate
- Privacy/local processing is explained plainly
- Video download has a permission warning
- Unsupported formats are handled honestly
- File sizes and dimensions are visible

---

## 23. Redesign Priority Plan

### Priority 1 — Foundation

- Replace dark theme with light tokens
- Remove heavy gradients and glass effects
- Normalize typography
- Build AppShell, TopNav, cards, buttons, inputs

### Priority 2 — Workspace

- Build three-zone desktop workspace
- Create upload, preview, settings, and output components
- Add empty/loading/error/success states

### Priority 3 — Tool Pages

- Apply the same structure to converter, favicon, resize, compress, video, frame, GIF, and QR tools
- Keep settings patterns consistent
- Add tool-specific preview states

### Priority 4 — Polish

- Improve copywriting
- Add subtle motion
- Improve mobile layouts
- Check keyboard accessibility
- Remove anything that looks decorative but useless

---

## 24. Final Design Standard

MediaForge should look like this:

> A precise local media utility that a serious developer, creator, or founder would keep bookmarked.

It should not look like this:

> A dark, glowing, AI-generated template pretending to be a startup.

The winning direction is simple: **white workspace, sharp controls, quiet confidence, real utility.**
