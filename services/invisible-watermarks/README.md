# Optional invisible-watermark GPU adapter

**Experimental local NVIDIA adapter and opt-in web/desktop companion. Not certified for SynthID removal.** The selected direction is each computer's own NVIDIA GPU, starting with the owner's Windows RTX 3050 with 4 GB VRAM. Its model fit is unverified. No paid service, GPU, model cache or account was created. The companion connects to the 0.3.0 web/desktop image cleanup panel; Android does not expose it.

Start with the [local Windows hardware check and trial guide](../../docs/invisible-watermarks-local.md). `Check-GPU.cmd` requires only the existing NVIDIA driver and Windows PowerShell; `diagnose.py` is a Python standard-library alternative. Neither downloads models, processes images or uploads anything.

**Hardware:** NVIDIA CUDA is required. Plan for at least **12 GiB dedicated VRAM** for initial trials, based on the upstream SDXL global-stack residency threshold. This is not a verified minimum or a promise the full pipeline fits. The 4 GB RTX 3050 remains unverified; lower-memory offloading can be very slow. No NVIDIA hardware is needed for MediaForge's ordinary tools.

`engine.py` provides a file-to-file adapter around the external, pinned `remove-ai-watermarks` 0.54.1 CLI. It selects the Google strength cohort, SDXL-ZImage profile, seed 0, CPU offload and a 1536-pixel processing cap. Its result says **regenerated / SynthID unverified**. Regeneration changes pixels and may change faces, text and detail. It does not run Google's detector or certify an output as watermark-free.

The external library is Apache-2.0; model weights retain separate licenses. No library/model code is copied here. The research-only `reverse-SynthID` project is not bundled. Review the exact model licenses and lock the GPU image's complete dependency graph before deployment; pinning this adapter's package version alone is not a complete reproducible GPU environment.

## What is implemented and tested

- Original and existing output files are never overwritten, including an output created while the engine runs.
- Only still PNG/JPEG/WebP inputs, at most 25 MB and 16 MP, are accepted. Transparent and high-bit-depth inputs are rejected explicitly.
- Private temporary input/output files are deleted after success, failure or timeout. Process termination may still require cleanup by a future host wrapper.
- No shell execution, arbitrary URL/path fetching, cloud provisioning or automatic package installation. The optional HTTP companion binds only loopback and accepts authenticated, exact-origin bounded image bytes.
- A missing engine or CUDA device is an error, never a successful removal.
- Returned images are decoded and re-encoded before atomic publication; malformed/missing engine outputs cannot be saved as a successful result.

The earlier twenty tests passed on both Windows and Linux in [native CI](https://github.com/Gurtejhundal/MediaForge/actions/runs/42476485220). The 0.3.0 suite contains 28 diagnostic, batch, preflight, file-safety and HTTP-boundary tests with simulated hardware/engine outputs. File handling is exercised on each OS. **These tests do not exercise the real CUDA engine, model, GPU performance, or SynthID removal.** Actual local preflight returns `unavailable`: this development computer has AMD graphics, no NVIDIA CUDA device and no installed PyTorch/removal engine. A driver's visible GPU or a successful CUDA preflight does not establish model fit.

Run the lightweight adapter tests in an environment with Pillow:

```sh
python3 -m unittest discover -s services/invisible-watermarks -p 'test_*.py' -v
python3 services/invisible-watermarks/diagnose.py
python3 services/invisible-watermarks/engine.py --check
```

On a compatible NVIDIA computer, create a separate Python environment, install a compatible CUDA PyTorch distribution and the requirements, review/cache the models, then run. Follow the local guide first for the 4 GB RTX 3050. The upstream engine may fetch missing model weights when processing; do not invoke it until the model licenses, traffic, storage and compute have been reviewed:

```sh
python engine.py --check
python engine.py original.png regenerated.png
python batch.py first.png second.jpg --output-dir new-results
```

The optional batch runner processes 1–20 images sequentially (100 MB combined), writes a local progress report, preserves completed exports and stops after a failure without automatic retries. Existing output folders cannot be reused. For an explicit browser/desktop connection, start `python companion.py`, then enter its port and fresh token in Image cleanup → Experimental invisible-watermark processing. The default allowed origin is the canonical MediaForge HTTPS app; a local app needs `--origin http://127.0.0.1:<actual-port>`. One active job, 900-second timeout, exact origin/Host/token checks and private temporary cleanup are enforced. The token stays in memory; selected images go only to that loopback process. Stop after current image cannot instantly cancel a running engine. [Connection, browser permissions and limits](../../docs/invisible-watermarks-local.md#connect-the-web-or-desktop-app). [Hosted options](../../docs/invisible-watermarks-hosting.md) are retained as an alternative, not the selected plan.

## Engine references

- [Pinned upstream implementation](https://github.com/wiltodelta/remove-ai-watermarks/tree/3168d878461eed072bf86c237b219611261cf85f)
- [Published 0.54.1 package](https://pypi.org/project/remove-ai-watermarks/0.54.1/)
- [Upstream command reference](https://github.com/wiltodelta/remove-ai-watermarks/blob/3168d878461eed072bf86c237b219611261cf85f/docs/cli.md)
- [Upstream limits and validation scope](https://github.com/wiltodelta/remove-ai-watermarks/blob/3168d878461eed072bf86c237b219611261cf85f/docs/known-limitations.md)
- [Official SynthID explanation and detector entry](https://deepmind.google/models/synthid/)
