"""Adapter/file safety tests. These do not certify watermark removal or a GPU."""
import importlib.util
from pathlib import Path
import subprocess
import shutil
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace
import sys
from PIL import Image

spec = importlib.util.spec_from_file_location('mediaforge_invisible_engine', Path(__file__).with_name('engine.py'))
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)


class AdapterTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.root = Path(self.folder.name)
        self.source, self.output = self.root/'original.png', self.root/'result.png'
        Image.new('RGB', (16, 12), '#c45f31').save(self.source)
        self.original = self.source.read_bytes()
        self.ready = patch.object(engine, 'preflight', return_value={'version': engine.ENGINE_VERSION, 'executable': 'test-engine'})
        self.ready.start(); self.addCleanup(self.ready.stop)

    def assert_preserved(self):
        self.assertEqual(self.source.read_bytes(), self.original)
        self.assertFalse(any(self.root.glob('.mediaforge-regeneration-*')))

    @staticmethod
    def produce(command, **options):
        Image.new('RGB', (16, 12), '#b35430').save(command[command.index('-o')+1])
        return subprocess.CompletedProcess(command, 0)

    def test_valid_output_is_new_file_and_detection_remains_unverified(self):
        with patch.object(engine.subprocess, 'run', side_effect=self.produce):
            report = engine.regenerate(self.source, self.output)
        with Image.open(self.output) as image:
            self.assertEqual(image.size, (16, 12))
        self.assertEqual(report['status'], 'regenerated')
        self.assertEqual(report['synthid_after'], 'unverified')
        self.assertEqual(report['synthid_before'], 'unverified')
        self.assertNotEqual(report['input_sha256'], report['output_sha256'])
        self.assert_preserved()

    def test_existing_output_and_input_cannot_be_overwritten(self):
        for destination in [self.source, self.output]:
            if destination == self.output: destination.write_bytes(b'keep this export')
            before = destination.read_bytes()
            with self.assertRaisesRegex(ValueError, 'never overwritten'):
                engine.regenerate(self.source, destination)
            self.assertEqual(destination.read_bytes(), before)
        self.assert_preserved()

    def test_broken_destination_symlink_is_not_followed(self):
        target = self.root / 'missing.png'
        try:
            self.output.symlink_to(target)
        except OSError as error:
            if getattr(error, 'winerror', None) == 1314:
                self.skipTest('This Windows account lacks symbolic-link creation permission; Linux exercises this regression.')
            raise
        with self.assertRaisesRegex(ValueError, 'never overwritten'):
            engine.regenerate(self.source, self.output)
        self.assertTrue(self.output.is_symlink())
        self.assertFalse(target.exists())
        self.assert_preserved()

    def test_a_destination_created_during_processing_is_preserved(self):
        def compete(command, **options):
            self.output.write_bytes(b'created by another operation')
            return self.produce(command, **options)
        with patch.object(engine.subprocess, 'run', side_effect=compete):
            with self.assertRaises(FileExistsError): engine.regenerate(self.source, self.output)
        self.assertEqual(self.output.read_bytes(), b'created by another operation')
        self.assert_preserved()

    def test_failed_timed_out_or_missing_outputs_are_not_published(self):
        for failure in [subprocess.CalledProcessError(1, ['test-engine']), subprocess.TimeoutExpired(['test-engine'], 1)]:
            with patch.object(engine.subprocess, 'run', side_effect=failure):
                with self.assertRaises(RuntimeError): engine.regenerate(self.source, self.output, timeout=1)
            self.assertFalse(self.output.exists()); self.assert_preserved()
        with patch.object(engine.subprocess, 'run', return_value=None):
            with self.assertRaisesRegex(RuntimeError, 'valid output'): engine.regenerate(self.source, self.output)
        self.assertFalse(self.output.exists()); self.assert_preserved()

    def test_corrupt_engine_output_cannot_escape_validation(self):
        def corrupt(command, **options):
            Path(command[command.index('-o')+1]).write_bytes(b'not an image')
        with patch.object(engine.subprocess, 'run', side_effect=corrupt):
            with self.assertRaises(OSError): engine.regenerate(self.source, self.output)
        self.assertFalse(self.output.exists()); self.assert_preserved()

    def test_an_engine_passthrough_is_not_reported_as_regeneration(self):
        def passthrough(command, **options):
            shutil.copyfile(command[2], command[command.index('-o')+1])
        with patch.object(engine.subprocess, 'run', side_effect=passthrough):
            with self.assertRaisesRegex(RuntimeError, 'unchanged pixels'):
                engine.regenerate(self.source, self.output)
        self.assertFalse(self.output.exists()); self.assert_preserved()

    def test_corrupt_transparent_and_oversized_inputs_do_not_start_processing(self):
        invalid=self.root/'invalid.png';invalid.write_bytes(b'not an image')
        transparent=self.root/'alpha.png';Image.new('RGBA',(4,4),(0,0,0,0)).save(transparent)
        with patch.object(engine.subprocess, 'run') as process:
            with self.assertRaises(OSError): engine.regenerate(invalid,self.output)
            with self.assertRaisesRegex(ValueError,'Transparent'): engine.regenerate(transparent,self.output)
            with patch.object(engine,'MAX_PIXELS',100):
                with self.assertRaisesRegex(ValueError,'megapixels'): engine.regenerate(self.source,self.output)
            process.assert_not_called()
        self.assert_preserved()


class PreflightTests(unittest.TestCase):
    def torch(self, *, cuda='12.8', hip=None, available=True):
        return SimpleNamespace(version=SimpleNamespace(cuda=cuda, hip=hip),
            cuda=SimpleNamespace(is_available=lambda: available,
                get_device_properties=lambda index: SimpleNamespace(name='Test NVIDIA GPU'),
                mem_get_info=lambda index: (3 * 1024**3, 4 * 1024**3)))

    def test_cpu_and_rocm_do_not_qualify_as_cuda_even_if_cuda_namespace_exists(self):
        for torch in [self.torch(cuda=None), self.torch(cuda=None, hip='6.4'),
                      self.torch(cuda='12.8', hip='6.4'), self.torch(available=False)]:
            with patch.object(engine.metadata, 'version', return_value=engine.ENGINE_VERSION), patch.dict(sys.modules, torch=torch):
                with self.assertRaisesRegex(engine.EngineUnavailable, 'NVIDIA CUDA'):
                    engine.preflight()

    def test_ready_reports_memory_but_does_not_certify_model_fit(self):
        with tempfile.TemporaryDirectory() as folder:
            executable = Path(folder) / ('remove-ai-watermarks.exe' if engine.os.name == 'nt' else 'remove-ai-watermarks')
            executable.touch()
            with patch.object(engine.metadata, 'version', return_value=engine.ENGINE_VERSION), patch.dict(sys.modules, torch=self.torch()), patch.object(engine.sysconfig, 'get_path', return_value=folder):
                report = engine.preflight()
            self.assertEqual(report['gpu_total_bytes'], 4 * 1024**3)
            self.assertEqual(report['model_fit'], 'unverified')
            self.assertEqual(report['synthid_after'], 'unverified')

    def test_windows_launcher_is_selected_from_current_environment(self):
        # Test path selection without changing pathlib's host OS implementation.
        with patch.object(engine.metadata, 'version', return_value=engine.ENGINE_VERSION), patch.dict(sys.modules, torch=self.torch()), patch.object(engine.sysconfig, 'get_path', return_value='test-scripts'), patch.object(engine.os, 'name', 'nt'), patch.object(engine, 'Path') as path:
            path.return_value.__truediv__.return_value.is_file.return_value = True
            engine.preflight()
            path.return_value.__truediv__.assert_called_once_with('remove-ai-watermarks.exe')

    def test_unreviewed_engine_version_is_rejected(self):
        with patch.object(engine.metadata, 'version', return_value='999.0'):
            with self.assertRaisesRegex(engine.EngineUnavailable, 'Revalidate'):
                engine.preflight()


if __name__ == '__main__':
    unittest.main()
