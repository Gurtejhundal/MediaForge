# Invisible SynthID: use the computer's own GPU

8 November 2026. **Experimental local adapter, not an enabled app feature or a verified remover.** The owner has a Windows RTX 3050 computer with **4 GB dedicated VRAM**. That computer is not connected to this development workspace. No model trial has run on it. No hosted GPU is being provisioned.

## What works locally

The [optional adapter](../services/invisible-watermarks/README.md) can invoke a separately installed CUDA engine on the same computer. Selected image files and regenerated PNGs are handled locally; no upload endpoint, cloud key or listening port is included. Initial package/model downloads require internet access. Review the upstream environment before claiming complete network isolation.

Vercel continues serving [MediaForge](https://mediaforge-tau.vercel.app/). Visiting the website does not give it access to a Python CUDA installation. A future desktop integration or explicitly installed companion must bridge those environments. **That bridge is not implemented**, and invisible processing is not available in the web app or existing Android/desktop 0.2.0 installers.

Browser GPU computation is possible through [WebGPU](https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html), but this Python diffusion pipeline has not been ported or verified in that runtime. An available browser GPU is not evidence that this engine will work. The chosen image profiles are [CUDA-only](https://github.com/wiltodelta/remove-ai-watermarks/blob/3168d878461eed072bf86c237b219611261cf85f/docs/installation.md); AMD, Intel, Apple and Android support is not claimed for invisible image regeneration.

## First check on the Windows RTX 3050

**NVIDIA CUDA is required. For initial trials, plan for at least 12 GiB dedicated VRAM** (typically a card sold as 12 GB or larger), based on the upstream SDXL global-stack residency threshold. This is a trial target, not a measured minimum or proof the complete pipeline fits. MediaForge's verified minimum is unknown. Cards below that target can require extensive offloading; the 4 GB RTX 3050 remains an unverified trial candidate, not a supported configuration. Ordinary MediaForge tools do not require an NVIDIA GPU.

1. Open `services/invisible-watermarks/Check-GPU.cmd` on the RTX computer. It uses the installed NVIDIA driver tool and Windows PowerShell. No Python, administrator access, model download or paid account is needed. It displays GPU name, total/free dedicated memory, driver version and system RAM. It does not save or upload the report.
2. Return those values before installing the large processing stack. A 4 GB card is a trial candidate, **not a verified supported configuration**. Upstream streams the SDXL global stack below 12 GiB and warns that Windows can spill GPU allocations into shared RAM. CPU offload reduces memory pressure but does not establish fit or acceptable speed. [Upstream memory behavior](https://github.com/wiltodelta/remove-ai-watermarks/blob/3168d878461eed072bf86c237b219611261cf85f/docs/known-limitations.md#resolution-and-memory).
3. If Python is already installed, `py -3 services/invisible-watermarks/diagnose.py` provides the same driver inventory as JSON without importing PyTorch or downloading anything. `driver_visible` means only the driver sees a card. `driver_unavailable` also covers a missing driver tool; it is not proof that the machine has no NVIDIA hardware.

The Windows command file was inspected but cannot be executed on this Linux development machine. Python diagnostic parsing and failure behavior are covered by simulated-driver tests. Real local diagnosis on the development machine reports `driver_unavailable`; it has AMD Radeon Vega graphics.

## Isolated engine setup after the hardware check

Use a separate Python 3.11–3.14 virtual environment, never MediaForge's web runtime or a shared system Python. For Windows PowerShell, from the repository root:

```powershell
py -3.11 -m venv services/invisible-watermarks/.venv
$gpuPython = ".\services\invisible-watermarks\.venv\Scripts\python.exe"
& $gpuPython -m pip install --upgrade pip
```

Use an installed supported Python version if 3.11 is unavailable. Choose the CUDA-enabled PyTorch installation command for this Windows machine from the [official PyTorch installer](https://pytorch.org/get-started/locally/), using `$gpuPython -m pip` rather than a global `pip`. Do not install an unverified driver/toolkit or a ROCm build. Then install the pinned optional engine:

```powershell
& $gpuPython -m pip install -r services/invisible-watermarks/requirements.txt
& $gpuPython services/invisible-watermarks/engine.py --check
```

`ready_for_trial` establishes the pinned engine, current-environment launcher, CUDA device and available memory. **Model fit and SynthID status remain unverified.** It does not load model weights. AMD ROCm's `torch.cuda` compatibility namespace is explicitly rejected. Windows uses the current virtual environment's `.exe` launcher.

Before a real run: review the exact model licenses, cache sizes and upstream download behavior; check available disk/RAM and close unnecessary GPU-heavy programs. Do not assume a 4 GB card can handle the current 1536-pixel cap. Start with one small, non-sensitive image at its native dimensions. The adapter has no automatic fallback to cloud, larger hardware or a different unreviewed algorithm. An out-of-memory result stops the trial; it does not silently switch to CPU.

## Single and multiple files

After model/environment review, one trial uses a **new** PNG destination:

```powershell
& $gpuPython services/invisible-watermarks/engine.py .\original.png .\regenerated.png
```

The batch runner accepts explicit selections of 1–20 still PNG/JPEG/WebP images, each at most 25 MB/16 MP and 100 MB total, and creates a **new** output directory:

```powershell
& $gpuPython services/invisible-watermarks/batch.py .\first.png .\second.jpg --output-dir .\trial-results
```

Jobs run sequentially with a 900-second limit per image, adjustable from 1–1800 seconds using `--timeout`. Indexed filenames avoid duplicate-name collisions. Originals and existing output directories are preserved. The runner validates the complete selection before starting, records progress in local `report.json`, stops at the first engine failure, and marks remaining items skipped. Ctrl+C records cancellation; successful outputs remain available. Abrupt process/machine termination cannot guarantee a final report or temporary-file cleanup. Check private `.mediaforge-regeneration-*` folders after a crash before sharing an output directory.

The result is **regenerated / SynthID unverified**, never “removed.” Review text, faces, colors and detail. Use known-positive originals and clean controls and check originals/results with [Google's SynthID detector](https://deepmind.google/models/synthid/). Record exact file hashes, engine/runtime versions, seed, dimensions, peak GPU/RAM use and elapsed time. A changed image, stripped metadata or low AI-classifier score does not verify SynthID removal. Do not ship an app integration until that actual trial establishes useful output and acceptable performance on the target card.

Use an NTFS output folder on Windows. Atomic publication uses a hard link; a filesystem that does not support hard links (for example, exFAT) returns an error rather than falling back to an overwrite-prone copy. Do not reuse an earlier batch folder; select a new one for each run.

## Verification and audit

Run the lightweight tests in an environment with Pillow; no PyTorch/model download is needed:

```sh
python3 -m unittest discover -s services/invisible-watermarks -p 'test_*.py' -v
```

20 tests pass on each of Windows and Linux in [native CI](https://github.com/Gurtejhundal/MediaForge/actions/runs/42476485220), using simulated hardware and engine outputs. They verify actual file handling on each OS, bounded sequential batches, interruption/error reports, duplicate names, no overwrite (including a dangling output symlink), driver-query failure handling and CUDA-vs-ROCm checks. They do not verify actual Windows CUDA-engine execution, RTX 3050 memory fit, real regeneration or watermark removal. Windows fixture paths are normalized before comparison, and the inventory reads the platform from Python rather than running an extra OS command.

| Feature or component | Expected behavior | Finding | Severity | Fix | Verification |
| --- | --- | --- | --- | --- | --- |
| Local launcher | Use the isolated environment on Windows | POSIX launcher name assumed | Medium | Use Python's scripts directory and Windows `.exe` | Simulated Windows path test; actual Windows run pending |
| Device boundary | Accept only this engine's CUDA backend | ROCm also exposes `torch.cuda` | Medium | Require CUDA build; reject HIP | CPU/ROCm regression tests pass |
| Existing exports | Never alter an existing destination | A dangling symlink could be followed | High | Reject existing leaf entries before processing | Symlink regression passes |
| Local multiple files | Preserve originals and stop repeated failures | No local batch workflow | Medium | 20-file sequential runner, durable local report, stop on first error | Success/failure/cancel/bounds/duplicate-name tests pass |
| Windows RTX 3050, 4 GB | Run useful local regeneration | Hardware information supplied; no connected test machine | Blocker | Read-only check prepared; actual model/detector trial required | Not verified; no support claim |

[Hosted options](invisible-watermarks-hosting.md) remain a historical alternative, not the selected plan. No cloud resources or paid services were created.
