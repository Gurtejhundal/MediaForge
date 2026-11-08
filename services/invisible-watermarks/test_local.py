"""Local diagnostics and batch behavior, with simulated hardware/engine only."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image
import batch
import diagnose


class DiagnosticTests(unittest.TestCase):
    def test_inventory_does_not_claim_runtime_or_model_readiness(self):
        with patch.object(diagnose.shutil, 'which', return_value='nvidia-smi'), patch.object(diagnose.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, 'NVIDIA GeForce RTX 3050 Laptop GPU, 4096, 3100, 580.0\n')) as process:
            report = diagnose.diagnose()
        self.assertEqual(report['status'], 'driver_visible')
        self.assertEqual(report['gpus'][0]['memory_total_mib'], 4096)
        self.assertEqual(report['model_fit'], 'unverified')
        self.assertEqual(process.call_args.kwargs['timeout'], 5)
        self.assertNotIn('shell', process.call_args.kwargs)
        process.assert_called_once()

    def test_missing_driver_never_starts_a_process(self):
        with patch.object(diagnose.shutil, 'which', return_value=None), patch.object(diagnose.subprocess, 'run') as process:
            self.assertEqual(diagnose.diagnose()['status'], 'driver_unavailable')
            process.assert_not_called()

    def test_failure_timeout_and_malformed_inventory_remain_unavailable(self):
        for failure in [subprocess.TimeoutExpired([], 5), OSError('failed')]:
            with patch.object(diagnose.shutil, 'which', return_value='nvidia-smi'), patch.object(diagnose.subprocess, 'run', side_effect=failure):
                self.assertEqual(diagnose.diagnose()['status'], 'driver_unavailable')
        for output in ['', 'GPU, [N/A], [N/A], driver', 'GPU, 4096, 5000, driver', 'unexpected']:
            with patch.object(diagnose.shutil, 'which', return_value='nvidia-smi'), patch.object(diagnose.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, output)):
                report = diagnose.diagnose()
            self.assertEqual(report['status'], 'driver_unavailable')
            self.assertEqual(report['gpus'], [])


class BatchTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.root = Path(self.folder.name).resolve()
        self.sources = []
        for name in ['one', 'two', 'three']:
            parent = self.root / name
            parent.mkdir()
            source = parent / 'same-name.png'
            Image.new('RGB', (8, 6), 'orange').save(source)
            self.sources.append(source)
        self.before = [source.read_bytes() for source in self.sources]
        self.output = self.root / 'results'
        ready = patch.object(batch, 'preflight', return_value={})
        ready.start(); self.addCleanup(ready.stop)

    def assert_originals(self):
        self.assertEqual([source.read_bytes() for source in self.sources], self.before)

    @staticmethod
    def produce(source, destination, **options):
        Image.new('RGB', (8, 6), 'blue').save(destination)
        return {'status': 'regenerated', 'synthid_after': 'unverified'}

    def test_duplicate_names_get_distinct_outputs_and_durable_report(self):
        with patch.object(batch, 'regenerate', side_effect=self.produce) as process:
            report = batch.run_batch(self.sources, self.output)
        self.assertEqual(process.call_count, 3)
        self.assertEqual(report['status'], 'completed')
        self.assertEqual(len(list(self.output.glob('*.png'))), 3)
        self.assertEqual(json.loads((self.output / 'report.json').read_text()), report)
        self.assert_originals()

    def test_error_stops_queue_preserves_completed_output_and_marks_skipped(self):
        def fail_second(source, destination, **options):
            if source == self.sources[1]:
                raise RuntimeError('GPU out of memory')
            return self.produce(source, destination, **options)
        with patch.object(batch, 'regenerate', side_effect=fail_second) as process:
            report = batch.run_batch(self.sources, self.output)
        self.assertEqual(process.call_count, 2)
        self.assertEqual([entry['status'] for entry in report['files']], ['regenerated', 'error', 'skipped'])
        self.assertEqual(report['status'], 'stopped_after_error')
        self.assertTrue((self.output / '01-regenerated.png').is_file())
        self.assert_originals()

    def test_interruption_keeps_successful_files_and_records_cancel(self):
        def interrupt_second(source, destination, **options):
            if source == self.sources[1]:
                raise KeyboardInterrupt()
            return self.produce(source, destination, **options)
        with patch.object(batch, 'regenerate', side_effect=interrupt_second):
            report = batch.run_batch(self.sources, self.output)
        self.assertEqual(report['status'], 'cancelled')
        self.assertEqual([entry['status'] for entry in report['files']], ['regenerated', 'skipped', 'skipped'])
        self.assertEqual(json.loads((self.output / 'report.json').read_text())['status'], 'cancelled')
        self.assertTrue((self.output / '01-regenerated.png').is_file())
        self.assert_originals()

    def test_reused_folder_invalid_input_and_unavailable_engine_do_not_start_jobs(self):
        with patch.object(batch, 'regenerate') as process:
            self.output.mkdir()
            (self.output / 'keep').write_text('preserve')
            with self.assertRaisesRegex(ValueError, 'new output folder'):
                batch.run_batch(self.sources, self.output)
            self.assertEqual((self.output / 'keep').read_text(), 'preserve')
            fresh = self.root / 'fresh'
            invalid = self.root / 'invalid.png'; invalid.write_bytes(b'corrupt')
            with self.assertRaises(OSError): batch.run_batch([self.sources[0], invalid], fresh)
            self.assertFalse(fresh.exists())
            with patch.object(batch, 'preflight', side_effect=RuntimeError('no CUDA')):
                with self.assertRaises(RuntimeError): batch.run_batch(self.sources, fresh)
            self.assertFalse(fresh.exists())
            process.assert_not_called()
        self.assert_originals()

    def test_count_and_total_size_limits_are_checked_before_processing(self):
        with patch.object(batch, 'regenerate') as process:
            for selection in [[], self.sources * 7]:
                with self.assertRaisesRegex(ValueError, '1 and 20'):
                    batch.run_batch(selection, self.output)
            with patch.object(batch, 'MAX_BATCH_BYTES', 1):
                with self.assertRaisesRegex(ValueError, '100 MB'):
                    batch.run_batch(self.sources, self.output)
            process.assert_not_called()
        self.assertFalse(self.output.exists())
        self.assert_originals()


if __name__ == '__main__':
    unittest.main()
