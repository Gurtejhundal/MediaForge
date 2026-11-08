"""Read-only local GPU inventory. Standard library only; no model/package downloads."""
import csv
from importlib import metadata
import io
import json
import shutil
import subprocess
import sys


def diagnose() -> dict:
    # platform.system() can invoke an additional Windows command. Inventory has
    # exactly one bounded subprocess: the explicitly requested NVIDIA query.
    report = {'status': 'not_checked', 'platform': {'win32': 'Windows', 'linux': 'Linux', 'darwin': 'Darwin'}.get(sys.platform, sys.platform),
              'python': '.'.join(str(part) for part in sys.version_info[:3]), 'gpus': [],
              'model_fit': 'unverified', 'synthid_after': 'unverified',
              'notice': 'Driver inventory only. Run engine.py --check in the isolated engine environment before a trial.'}
    try:
        report['engine_version'] = metadata.version('remove-ai-watermarks')
    except metadata.PackageNotFoundError:
        report['engine_version'] = None
    executable = shutil.which('nvidia-smi')
    if executable is None:
        report.update(status='driver_unavailable', message='NVIDIA driver tool was not found. No compatibility or model-fit claim can be made.')
        return report
    try:
        result = subprocess.run([executable, '--query-gpu=name,memory.total,memory.free,driver_version',
                                 '--format=csv,noheader,nounits'],
                                capture_output=True, text=True, check=True, timeout=5)
        for row in csv.reader(io.StringIO(result.stdout)):
            if len(row) != 4:
                raise ValueError('Unexpected driver response')
            name, total, free, driver = (value.strip() for value in row)
            total, free = int(total), int(free)
            if total <= 0 or not 0 <= free <= total:
                raise ValueError('Unexpected GPU memory values')
            report['gpus'].append({'name': name, 'memory_total_mib': total,
                                   'memory_free_mib': free, 'driver_version': driver})
        if not report['gpus']:
            raise ValueError('No GPU reported')
        report['status'] = 'driver_visible'
    except (OSError, ValueError, subprocess.SubprocessError):
        report.update(status='driver_unavailable', gpus=[], message='The NVIDIA driver query failed, timed out, or returned an unsupported response.')
    return report


if __name__ == '__main__':
    print(json.dumps(diagnose(), indent=2))
