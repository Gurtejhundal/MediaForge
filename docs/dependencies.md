# Dependencies, advisories and distribution

The release candidate upgrades Next and its ESLint config to 16.4.5, PDF.js to a patched current 6.x release, PostCSS to 8.5.32, image-size to 2.1.0 and minimatch to 11.0.5. Overrides are checked with the full application and packaging tests. The unused shadcn CLI, ytdl downloader and animation dependency are removed; the small UI CSS variant definitions remain local. Two downloaded 2.5 MB third-party player bundles had no application imports and were removed from the release branch; they remain recoverable in Git history and in the untouched original checkout.

`npm run audit:dependencies` invokes npm's current production audit. It fails on unknown high/critical advisories and network/audit-service failure. It prints rather than hides the temporary exception below. `npm audit` remains useful for the complete development dependency tree.

## Temporary background-removal exception

[GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) reports resource exhaustion while Zod validates oversized constrained collections. IMG.LY 1.7.0 bundles a Zod 3 implementation and declares Zod 3. Overriding the separately installed package to Zod 4 would not repair the bundled implementation.

MediaForge passes a small fixed configuration (model/device/output/progress callback) to this library in the browser. Uploaded image bytes are not parsed as a Zod configuration and no Zod server request validator exists. This bounds the reachable impact for the current integration; it does not mean the upstream issue is fixed.

[Machine-readable exception](dependency-exception.json) is restricted to the exact package versions and advisory, expires **7 December 2026**, and fails closed if versions change. Production npm audit currently reports the underlying advisory and its dependent package as two high entries. Reevaluate on an upstream fix. This exception is not a clean-audit claim or a license clearance.

## License status

No project license existed at the baseline. The owner has not selected one, so no project license has been invented or added.

The installed `@imgly/background-removal/LICENSE.md` contains GNU AGPL v3, and the package offers separate commercial licensing information in its own documentation. Its bundled model/runtime dependencies have separate notices. Before public installer distribution, the owner needs to settle project licensing and how the background-removal dependency is distributed. This release candidate keeps publication blocked rather than selecting terms or claiming compliance on the owner's behalf.

Electron, Chromium, Next, React, fonts and other packages also carry their own notices. Packaged files retain included dependency notices; a distribution review still needs to confirm all obligations for the chosen release model. An npm advisory result is not a license check.
