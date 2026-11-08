# Dependencies, advisories and distribution

The release candidate upgrades Next and its ESLint config to 16.4.5, PDF.js to a patched current 6.x release, PostCSS to 8.5.32, image-size to 2.1.0 and minimatch to 11.0.5. Overrides are checked with the full application and packaging tests. The unused shadcn CLI, ytdl downloader and animation dependency are removed; the small UI CSS variant definitions remain local. Two downloaded 2.5 MB third-party player bundles had no application imports and were removed from the release branch; they remain recoverable in Git history and in the untouched original checkout.

`npm run audit:dependencies` invokes npm's current production audit. It fails on unknown high/critical advisories and network/audit-service failure. It prints rather than hides the temporary exception below. `npm audit` remains useful for the complete development dependency tree.

## Temporary background-removal exception

[GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) reports resource exhaustion while Zod validates oversized constrained collections. IMG.LY 1.7.0 bundles a Zod 3 implementation and declares Zod 3. Overriding the separately installed package to Zod 4 would not repair the bundled implementation.

MediaForge passes a small fixed configuration (model/device/output/progress callback) to this library in the browser. Uploaded image bytes are not parsed as a Zod configuration and no Zod server request validator exists. This bounds the reachable impact for the current integration; it does not mean the upstream issue is fixed.

[Machine-readable exception](dependency-exception.json) is restricted to the exact package versions and advisory, expires **7 December 2026**, and fails closed if versions change. Production npm audit currently reports the underlying advisory and its dependent package as two high entries. Reevaluate on an upstream fix. This exception is not a clean-audit claim or a license clearance.

## License and source distribution

On 8 November 2026 the owner selected **AGPL-3.0-only** and authorized the public 0.2.0 release. The project [LICENSE](../LICENSE), [third-party notices](../THIRD_PARTY_NOTICES.md), package metadata and application source/license links now record that choice.

The IMG.LY package retains its original AGPL license, bundled ThirdPartyLicenses.json and complete source-map contents. Desktop preparation preserves installed production-package notices and all three font notices. The matching release source archive includes the application, lockfile/build scripts and an unmodified copy of IMG.LY 1.7.0 with its original-source maps. Electron/Chromium notices remain in official runtime distributions. No commercial IMG.LY license or code-signing certificate is claimed.

This license decision resolves the earlier owner-decision blocker. It does not fix the upstream advisory or certify legal obligations for future modifications, new dependencies, model redistribution or proprietary distribution. See [release procedure](releasing.md) for the exact verification boundary.
