# Security

MediaForge's core conversion tools process selected files in browser memory. A selected file must not be posted to a MediaForge processing API. Optional model/runtime downloads do not authorize uploading that file. Legacy upload conversion routes intentionally return HTTP 410.

The public downloader is a separate network boundary. Keep its protocol/port validation, DNS address validation and connection pinning, redirect revalidation, response size/deadline limits, MIME restrictions, attachment disposition, and bounded concurrent requests. No random download-provider discovery or automatic third-party URL sharing.

Desktop renderer code must have no Node integration or privileged preload bridge. Preserve context isolation, Chromium sandboxing, same-origin navigation checks, explicit external-link policy, loopback binding, per-launch HTTP token, and a stable profile origin. Never package `.env` files or inherit developer credentials into the desktop server. Tests must use isolated profiles, including packaged-app tests.

Report sensitive issues privately through the repository's **Security → Report a vulnerability** feature if enabled. If unavailable, contact the owner through a verified private channel; do not post exploits containing private data or credentials in public issues. No private reporting email has been supplied, so none is invented here.

[Dependency review and the temporary exception](docs/dependencies.md) records known advisories. Automated checks supplement source review; they do not establish that every input, browser, or operating system is safe.
