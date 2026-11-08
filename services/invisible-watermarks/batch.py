"""Sequential local-only batch runner. No HTTP server or arbitrary engine flags."""
import argparse
import json
import os
from pathlib import Path
import tempfile

from engine import MAX_INPUT, _read_image, preflight, regenerate

MAX_FILES = 20
MAX_BATCH_BYTES = 100 * 1024 * 1024


def _save_report(folder: Path, report: dict):
    path = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=folder,
                                         prefix='.report-', delete=False) as temporary:
            path = Path(temporary.name)
            json.dump(report, temporary, indent=2)
            temporary.flush()
            os.fsync(temporary.fileno())
        os.replace(path, folder / 'report.json')
    finally:
        if path is not None:
            path.unlink(missing_ok=True)


def run_batch(sources: list[Path], folder: Path, *, timeout: int = 900) -> dict:
    if not 1 <= len(sources) <= MAX_FILES:
        raise ValueError('Choose between 1 and 20 images.')
    if not 1 <= timeout <= 1800:
        raise ValueError('Per-image timeout must be between 1 and 1,800 seconds.')
    folder = Path(os.path.abspath(folder))
    if os.path.lexists(folder) or not folder.parent.is_dir():
        raise ValueError('Choose a new output folder inside an existing directory.')
    sources = [Path(source).resolve() for source in sources]
    # Reject the whole selection before launching a GPU job or creating an output folder.
    size = 0
    for source in sources:
        if not source.is_file() or source.stat().st_size > MAX_INPUT:
            raise ValueError('Each image must be a local file up to 25 MB.')
        size += source.stat().st_size
        if size > MAX_BATCH_BYTES:
            raise ValueError('The complete selection must be at most 100 MB.')
        image = _read_image(source)
        image.close()
    preflight()
    folder.mkdir(mode=0o700)  # Atomic; an existing or racing directory is never reused.
    report = {'status': 'processing', 'synthid_after': 'unverified',
              'files': [{'source_name': source.name, 'output': f'{index:02d}-regenerated.png',
                         'status': 'pending'} for index, source in enumerate(sources, 1)]}
    _save_report(folder, report)
    try:
        for source, entry in zip(sources, report['files']):
            try:
                entry.update(regenerate(source, folder / entry['output'], timeout=timeout))
            except (ValueError, OSError, RuntimeError) as error:
                entry.update(status='error', message=str(error))
                report['status'] = 'stopped_after_error'
                break  # No repeated OOM/model failures or automatic retries.
            _save_report(folder, report)
        else:
            report['status'] = 'completed'
    except KeyboardInterrupt:
        report['status'] = 'cancelled'
    finally:
        for entry in report['files']:
            if entry['status'] == 'pending':
                entry['status'] = 'skipped'
        _save_report(folder, report)
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description='Experimental local GPU batch regeneration; SynthID status stays unverified.')
    parser.add_argument('sources', nargs='+', type=Path)
    parser.add_argument('--output-dir', required=True, type=Path, help='A new directory; existing directories are never reused.')
    parser.add_argument('--timeout', type=int, default=900, help='Per-image limit in seconds, 1–1800.')
    args = parser.parse_args()
    try:
        report = run_batch(args.sources, args.output_dir, timeout=args.timeout)
        print(json.dumps(report))
        return 0 if report['status'] == 'completed' else 130 if report['status'] == 'cancelled' else 2
    except (ValueError, OSError, RuntimeError) as error:
        print(json.dumps({'status': 'error', 'message': str(error), 'synthid_after': 'unverified'}))
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
