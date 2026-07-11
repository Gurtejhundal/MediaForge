# Design System — MediaForge Mastering Console

## 1. Product Context

- Product: Browser-based media conversion, editing, extraction, packaging, and export suite.
- Primary users: Creators, developers, students, and operators who need a dependable file utility without a cloud-dashboard workflow.
- Primary tasks: Select a local file, configure an operation, inspect the result, and export it.
- Business goal: Make MediaForge memorable, trustworthy, and useful enough to become a bookmarked production tool.
- Device priority: Desktop first for production work; fully usable on phone and tablet.
- Trust level: High. The interface must distinguish local, local-model, and network-assisted operations before the user acts.
- Typical session length: Five to thirty minutes, often across several tools.

## 2. Design Objective

MediaForge should feel like a compact physical mastering workstation: a graphite chassis containing brushed-metal faceplates, inset media bays, engraved labels, status lamps, meters, and tactile controls. The metaphor must clarify input, processing, and output. It must never obscure form labels, reduce contrast, or make the product look like a novelty audio plugin.

## 3. Chosen Direction

- Primary UI style: Restrained skeuomorphism.
- Secondary influence: Minimalist utility UI.
- Style ratio: 70% tactile workstation / 30% quiet utility UI.
- Reason for selection: Creative media tools benefit from physical control metaphors, while frequent and dense tasks require modern clarity.
- Main risks: Visual clutter, low-contrast bevels, excessive shadows, and outdated metaphors.
- Areas where the style should be strongest: App chrome, hero, upload bay, tool headers, mode indicators, meters, primary actions, output-ready states.
- Areas where utility UI should remain restrained: Long descriptions, dense settings, text fields, previews, validation, and route directories.

## 4. Design Principles

1. Every physical metaphor explains state, hierarchy, or action.
2. The file boundary is visible before processing begins.
3. Controls look tactile but remain standard, accessible HTML controls.
4. Dark chassis frames warm, high-contrast work surfaces.
5. Motion communicates mechanical response; nothing floats or pulses without purpose.

## 5. Color System

### Foundations

- Background: `#171813` graphite chassis.
- Surface: `#d8d2c3` warm aluminum.
- Elevated surface: `#eee9dc` ivory faceplate.
- Primary text: `#20211d` charcoal.
- Secondary text: `#55584f`.
- Border: `#817d70`.

### Brand

- Primary: `#c94b26` forge orange.
- Secondary: `#35372f` gunmetal.
- Accent: `#e6aa43` amber indicator.

### Semantic

- Success: `#3f7448` green lamp.
- Warning: `#95630f` amber.
- Error: `#a83b32` red.
- Information: `#365f78` steel blue.

### Rules

- Maximum accent colors per screen: Orange plus one semantic lamp color.
- Contrast target: WCAG 2.2 AA; 4.5:1 for body text and 3:1 for large text and component boundaries.
- Gradient rules: Only short material gradients for bevels, metal, lamps, and inset depth. No atmospheric marketing gradients.
- Transparency rules: Never use transparency behind text. Backdrop blur is prohibited.

## 6. Typography

- Display font: Barlow Condensed.
- Interface font: Instrument Sans.
- Monospace font: IBM Plex Mono.
- Display size: `clamp(3.75rem, 9vw, 8rem)`.
- H1: 56–128px, 600, condensed.
- H2: 36–64px, 600, condensed.
- H3: 24–36px, 600, condensed.
- Body: 15–18px, 400–500.
- Small: 13px.
- Label: 10–11px uppercase mono, 0.12–0.18em tracking.
- Line-height rules: Display 0.84–0.95; body 1.55–1.75.
- Maximum line length: 70 characters for prose.

## 7. Spacing

- Base unit: 4px.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- Section spacing: 24–32px inside the workstation frame.
- Card padding: 16–28px.
- Form spacing: 16px between related controls, 24px between groups.
- Mobile adjustments: 12px page gutters, 16px panel padding, no decorative space that pushes controls below the fold.

## 8. Grid and Breakpoints

- Mobile: 360px.
- Tablet: 768px.
- Laptop: 1024px.
- Desktop: 1440px.
- Maximum content width: 1440px.
- Grid columns: 12 desktop, 8 tablet, 4 mobile.
- Gutter: 24px desktop, 16px tablet, 12px mobile.
- Margin: 24px desktop, 12px mobile.

## 9. Shape, Border, and Radius

- Standard border: 1px solid `#817d70`.
- Strong border: 2px solid `#3a3c35`.
- Small radius: 4px.
- Medium radius: 8px.
- Large radius: 14px.
- Pill usage: Status lamps and compact mode labels only.
- Forbidden shapes: Large floating rounded cards, blob masks, excessive capsules, and inconsistent radii.

## 10. Shadow, Depth, and Surface

- Level 0: Inset work well, `inset 0 2px 5px rgba(0,0,0,.35)`.
- Level 1: Faceplate, highlight top/left and 1px lower edge.
- Level 2: Raised module, `0 8px 18px rgba(0,0,0,.24)` plus bevel.
- Level 3: Workstation chassis, `0 24px 70px rgba(0,0,0,.42)`.
- Pressed state: Translate down 1–2px and invert the vertical bevel.
- Dark-mode behavior: The graphite chassis is the sole theme; work surfaces stay warm and bright.
- Performance constraints: CSS gradients and shadows only; no bitmap textures, filters, or continuous decorative animation.

## 11. Iconography

- Icon family: Lucide React.
- Stroke width: Library default, visually 1.75–2px.
- Standard sizes: 14, 16, 20, 24px.
- Filled vs outline: Outline icons; status lamps may be filled circles.
- Icon container rules: Inset square keycaps or bare icons beside labels.
- Icon-only action rules: Minimum 40px target and required accessible label.

## 12. Imagery and Illustration

- Photography style: Product output only; no stock photography.
- Crop rules: Preserve media aspect ratios and use `object-contain` for inspection.
- Aspect ratios: Source-driven.
- Illustration style: Technical diagrams made from CSS and icons.
- 3D usage: CSS depth on controls and surfaces only.
- Texture usage: Very subtle CSS noise-like crosshatch and brushed lines.
- Prohibited imagery: Generic AI art, anvils, flames, hammers, floating 3D blobs, and decorative stock imagery.

## 13. Components

### Buttons

- Primary: Orange enamel key with dark edge, top highlight, and short mechanical travel.
- Secondary: Aluminum key with charcoal label.
- Tertiary: Flat engraved text action.
- Destructive: Red-tinted key, never the default emphasis.
- Hover: Increase surface contrast, no scale animation.
- Focus: 3px amber/orange outer ring with 2px chassis gap.
- Pressed: Translate 1px and use inset shadow.
- Disabled: Reduced contrast, no travel, `not-allowed` cursor.
- Loading: Spinner plus stable action label.

### Forms

- Input: Ivory inset well with dark inner top edge and readable charcoal text.
- Textarea: Same material; resize behavior preserved.
- Select: Inset field with clear chevron.
- Checkbox: Square mechanical switch with explicit checked mark.
- Radio: Circular selector with filled lamp center.
- Toggle: Short physical track with labeled state.
- Validation: Semantic border, icon, and exact corrective message.
- Help text: 13px secondary text beneath the control.

### Cards

- Standard: Warm faceplate with border, bevel, and optional four screw details.
- Interactive: Raised module with stronger lower shadow and visible hover edge.
- Selected: Orange edge plus inset orange indicator strip.
- Dense: Flat inset list inside a single faceplate.
- Media: Dark inspection well surrounded by a warm frame.

### Navigation

- Desktop: Sticky graphite rack header with brand plate, category keys, local status lamp, and report key.
- Mobile: Same header plus horizontally scrollable category key rail.
- Active state: Pressed key or orange indicator.
- Sticky behavior: Top header; tool dock sticks only when vertical space permits.
- Dropdowns: Warm faceplate, dark edge, clear keyboard focus.

### Feedback

- Toast: Compact raised metal notice with semantic lamp.
- Alert: Inset semantic strip with icon and direct copy.
- Empty: Quiet recessed bay with one clear next action.
- Loading: Real progress meter or spinner; no fake skeleton after file selection.
- Error: Red indicator plus specific cause and recovery.
- Success: Green lamp and a raised export key.

## 14. Motion

- Motion principle: Mechanical response, not decoration.
- Fast duration: 100ms.
- Standard duration: 180ms.
- Large transition: 260ms.
- Easing: `cubic-bezier(.2, 0, 0, 1)`.
- Hover motion: Color and one-pixel lift for modules only.
- Page transition: None.
- Loading: Meter fill or spinner.
- Reduced motion: Disable nonessential transitions and all animated meter stripes.
- Forbidden motion: Bounce, floating, parallax, glow loops, and large scale transforms.

## 15. Accessibility

- Contrast target: WCAG 2.2 AA.
- Focus style: Clearly visible 3px ring on every interactive element.
- Touch target: 44px preferred, 40px absolute minimum for compact desktop controls.
- Keyboard behavior: Native tab order; Enter/Space activate; arrow keys remain native where appropriate.
- Form labeling: Every control has a visible label or programmatic label.
- Error handling: `role=alert` and actionable text.
- Reduced motion: Honored globally.
- High-contrast fallback: Borders remain visible without shadows; status always includes text or icon, never color alone.

## 16. Responsive Behavior

- Navigation: Full category rack at 1280px; scrollable key rail below it on smaller screens.
- Hero: Split console at 1024px; stacked faceplates below.
- Cards: Directory rows on desktop, full-width tactile modules on mobile.
- Tables: Horizontal scroll within an inset well.
- Forms: Two-column groups collapse to one column.
- Modals: Centered desktop, near-full-screen mobile.
- Drawers: Full-width mobile with 12px edge gap.
- Media: Preserve aspect ratio and avoid viewport overflow.
- Typography: Clamp display text; body remains at least 15px.
- Spacing: 24–48px desktop, 12–24px mobile.
- Sticky controls: Tool dock sticky only at 1024px+; export controls may stick on small screens where implemented.

## 17. Page-Specific Rules

### Home

The home page is a complete mastering console: brand faceplate, live meters, three-stage signal path, operation rack, and visible processing contract.

### Product or Dashboard

Each tool opens inside a numbered rack unit with a scope plate, tool ledger, inset workspace, and explicit processing-mode lamp.

### Detail Page

Preview and result content use dark inspection wells; settings remain warm and calm.

### Pricing

Not present. Do not invent it.

### Authentication

Not present. Do not invent it.

### Settings

Tool-specific settings use grouped faceplates and inset controls.

### Error and Empty States

Use labeled indicator lamps and exact recovery actions; never generic illustrations.

## 18. Forbidden Patterns

- Glassmorphism and backdrop blur.
- Generic gradient hero backgrounds.
- Floating rounded SaaS cards.
- Oversized pills and excessive corner rounding.
- Decorative knobs that imply an action but do nothing.
- Low-contrast neumorphic controls.
- Fake analog gauges with fabricated values.
- Continuous ambient animation.
- Claims that a network tool is local.

## 19. Implementation Rules

- Styling method: Tailwind CSS v4 plus shared material utility classes in `src/app/globals.css`.
- Token location: `:root` in `src/app/globals.css`.
- Component location: `src/components` and `src/components/ui`.
- Icon package: `lucide-react`.
- Animation library: CSS only unless existing tool behavior already uses another library.
- Image handling: Native preview elements for browser-local Blob URLs; Next Image for stable application assets.
- Testing commands: `npm run lint`, `npx tsc --noEmit --incremental false`, `npm run build`, then browser verification at 360, 768, 1024, and 1440px.
- Browser support: Current Chromium, Firefox, and Safari where required browser APIs exist.

## 20. QA Checklist

- [ ] 360px layout tested
- [ ] 768px layout tested
- [ ] 1024px layout tested
- [ ] 1440px layout tested
- [ ] Keyboard navigation tested
- [ ] Focus states visible
- [ ] Contrast checked
- [ ] Forms validated
- [ ] Loading, empty, success, and error states complete
- [ ] Reduced motion supported
- [ ] Build passes
- [ ] Type checking passes
- [ ] Lint passes
- [ ] Console is clean
- [ ] Images optimized where application-owned
- [ ] No horizontal overflow
- [ ] Existing functionality preserved
