# Contributing

MediaForge is for people who need small, private, repeatable media tasks. Preserve its local file boundary and industrial console design. Keep network tools visibly separate.

Start with [development](docs/development.md) and [architecture](docs/architecture.md). Use Node 24 and `npm ci`. Run lint, typecheck, unit tests, production build, and browser tests before submitting a change. Desktop changes also need a packaged application smoke test on the affected operating systems.

A useful issue includes the tool, version, OS/browser, file type and approximate size, settings, reproduction steps, and expected outcome. Use synthetic fixtures. Do not upload private media, passwords, tokens, webhook URLs, or documents containing personal data.

For a pull request, describe the user-visible problem and behavior after the fix, then include verification and any remaining limits. Add regression tests for data corruption, persistence, network boundaries, and broken exports. Do not add a library for a small presentational change.

There is currently no project license granting redistribution rights. The owner must choose a project license and resolve third-party distribution terms before public binary publication. Do not introduce a license or sign release artifacts on the owner's behalf.
