"""Optional GPU-side adapter. No HTTP listener, uploads or package installation."""
from __future__ import annotations

import argparse
from hashlib import sha256
from importlib import metadata
import json
import os
from pathlib import Path
import subprocess
import sys
import sysconfig
import tempfile
import warnings

ENGINE_VERSION = '0.54.1'
MAX_INPUT = 25 * 1024 * 1024
MAX_PIXELS = 16_000_000


class EngineUnavailable(RuntimeError):
    pass


def preflight() -> dict:
    try:
        version = metadata.version('remove-ai-watermarks')
    except metadata.PackageNotFoundError as error:
        raise EngineUnavailable('The optional GPU processing engine is not installed.') from error
    if version != ENGINE_VERSION:
        raise EngineUnavailable(f'Engine {ENGINE_VERSION} is required; found {version}. Revalidate before upgrading.')
    try:
        import torch
    except ImportError as error:
        raise EngineUnavailable('Install a CUDA-enabled PyTorch build in the worker environment.') from error
    # ROCm deliberately exposes torch.cuda too; it cannot run this CUDA-only profile.
    if getattr(torch.version, 'hip', None) or not getattr(torch.version, 'cuda', None) or not torch.cuda.is_available():
        raise EngineUnavailable('Invisible watermark processing requires an NVIDIA CUDA GPU. This machine cannot run it.')
    executable = Path(sysconfig.get_path('scripts')) / ('remove-ai-watermarks.exe' if os.name == 'nt' else 'remove-ai-watermarks')
    if not executable.is_file():
        raise EngineUnavailable('The engine command is missing from this Python environment.')
    properties = torch.cuda.get_device_properties(0)
    free_memory, total_memory = torch.cuda.mem_get_info(0)
    return {'status': 'ready_for_trial', 'version': version, 'gpu': properties.name,
            'gpu_total_bytes': total_memory, 'gpu_free_bytes': free_memory,
            'cuda_build': torch.version.cuda, 'executable': str(executable),
            'model_fit': 'unverified', 'synthid_after': 'unverified'}


def _read_image(path: Path):
    from PIL import Image, ImageOps
    if not path.is_file() or path.stat().st_size > MAX_INPUT:
        raise ValueError('Choose a PNG, JPEG or WebP file up to 25 MB.')
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        with Image.open(path) as image:
            if image.format not in {'PNG', 'JPEG', 'WEBP'} or getattr(image, 'n_frames', 1) != 1:
                raise ValueError('Only still PNG, JPEG and WebP images are supported.')
            if image.mode in {'I', 'F', 'I;16', 'I;16B', 'I;16L'}:
                raise ValueError('High-bit-depth inputs are not supported; keep the original and use an 8-bit copy.')
            if image.width * image.height > MAX_PIXELS:
                raise ValueError('Use an image of at most 16 megapixels.')
            image.load()
            if 'A' in image.getbands() or 'transparency' in image.info:
                if image.convert('RGBA').getchannel('A').getextrema()[0] != 255:
                    raise ValueError('Transparent artwork is not supported by this regeneration engine.')
            return ImageOps.exif_transpose(image).convert('RGB')


def regenerate(source: Path, destination: Path, *, timeout: int = 900) -> dict:
    """Run real regeneration when provisioned; success never means SynthID absent."""
    source, destination = Path(source).resolve(), Path(os.path.abspath(destination))
    if source == destination.resolve() or os.path.lexists(destination):
        raise ValueError('Choose a new output file. Originals and existing exports are never overwritten.')
    if destination.suffix.lower() != '.png' or not destination.parent.is_dir():
        raise ValueError('Choose a PNG output in an existing folder.')
    if not 1 <= timeout <= 1800:
        raise ValueError('Worker timeout must be between 1 and 1,800 seconds.')
    image = _read_image(source)
    try:
        engine = preflight()
        original_hash = sha256(source.read_bytes()).hexdigest()
        # A private directory beside the destination permits atomic no-overwrite publication.
        with tempfile.TemporaryDirectory(prefix='.mediaforge-regeneration-', dir=destination.parent) as folder:
            input_file, result_file = Path(folder) / 'input.png', Path(folder) / 'result.png'
            image.save(input_file, format='PNG')
            command = [engine['executable'], 'invisible', str(input_file), '-o', str(result_file),
                       '--pipeline', 'sdxl-zimage', '--vendor', 'google', '--seed', '0',
                       '--max-resolution', '1536', '--cpu-offload', '--force']
            # No shell, user-controlled flags, source overwrite or unbounded in-memory process logs.
            with (Path(folder) / 'engine.log').open('wb') as log:
                try:
                    subprocess.run(command, check=True, timeout=timeout, stdout=log, stderr=subprocess.STDOUT)
                except subprocess.TimeoutExpired as error:
                    raise RuntimeError('Processing timed out. No output was published; the original is unchanged.') from error
                except subprocess.CalledProcessError as error:
                    raise RuntimeError('The GPU engine failed. No output was published; check the worker setup.') from error
            if not result_file.is_file() or result_file.is_symlink():
                raise RuntimeError('The engine did not produce a valid output.')
            result = _read_image(result_file)
            try:
                if result.size == image.size and result.tobytes() == image.tobytes():
                    raise RuntimeError('The engine returned unchanged pixels. No output was published.')
                width, height = result.size
                # Re-encode a validated still image rather than publishing arbitrary subprocess bytes.
                final_file = Path(folder) / 'validated.png'
                result.save(final_file, format='PNG')
                os.chmod(final_file, 0o600)
                output_hash = sha256(final_file.read_bytes()).hexdigest()
                # link() fails atomically if a destination appeared while processing.
                os.link(final_file, destination)
            finally:
                result.close()
        return {'status': 'regenerated', 'synthid_before': 'unverified', 'synthid_after': 'unverified',
                'engine_version': ENGINE_VERSION, 'pipeline': 'sdxl-zimage', 'vendor': 'google',
                'seed': 0, 'width': width, 'height': height,
                'input_sha256': original_hash, 'output_sha256': output_hash,
                'notice': 'Pixels were regenerated. Review text, faces and detail; verify before/after with Google SynthID Detector.'}
    finally:
        image.close()


def main() -> int:
    parser = argparse.ArgumentParser(description='Optional MediaForge GPU regeneration adapter; not a SynthID detector.')
    parser.add_argument('--check', action='store_true', help='Check installed engine and CUDA availability without installing anything.')
    parser.add_argument('source', nargs='?', type=Path)
    parser.add_argument('destination', nargs='?', type=Path)
    args = parser.parse_args()
    try:
        if args.check:
            result = preflight()
        else:
            if args.source is None or args.destination is None:
                parser.error('Choose a source image and a new PNG destination, or use --check.')
            result = regenerate(args.source, args.destination)
        print(json.dumps(result))
        return 0
    except (EngineUnavailable, ValueError, OSError, RuntimeError) as error:
        print(json.dumps({'status': 'unavailable' if isinstance(error, EngineUnavailable) else 'error',
                          'message': str(error), 'synthid_after': 'unverified'}))
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
