"""Exercise real signing/encryption in a disposable fixture; never use owner keys."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]


class AndroidSigningTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix='mediaforge-signing-test-')
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        for directory in ['.github/android-release-requests', 'bin', 'runner']:
            (self.root / directory).mkdir(parents=True)
        (self.root / 'package.json').write_text('{"version":"0.3.0"}')
        (self.root / '.github/android-release-requests/android-v0.3.0.json').write_text('{}')
        gh = self.root / 'bin/gh'
        gh.write_text('#!/usr/bin/env python3\nimport os,sys\nprint(os.environ["TEST_RELEASES"])\nsys.exit(int(os.environ.get("TEST_API_STATUS", "0")))\n')
        gh.chmod(0o700)
        self.env = {key: value for key, value in os.environ.items() if not key.startswith('MEDIAFORGE_ANDROID_')}
        self.env.update(PATH=str(self.root / 'bin') + os.pathsep + os.environ['PATH'], RUNNER_TEMP=str(self.root / 'runner'), GITHUB_ENV=str(self.root / 'environment'), GITHUB_REF='refs/heads/main', GITHUB_REPOSITORY='fixture/fixture', GITHUB_SHA='fixture-source', TEST_RELEASES='[]')

    def run_signing(self):
        return subprocess.run(['bash', str(ROOT / 'scripts/prepare-android-signing.sh')], cwd=self.root, env=self.env, capture_output=True, timeout=60)

    def test_real_key_backup_recovers_identical_bytes_and_certificate(self):
        private = self.root / 'fixture-private.pem'
        certificate = self.root / '.github/android-backup-recovery-public.pem'
        subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', str(private), '-out', str(certificate), '-days', '1', '-subj', '/CN=Disposable test'], check=True, capture_output=True)
        result = self.run_signing()
        self.assertEqual(result.returncode, 0, 'Signing bootstrap failed; private subprocess output is intentionally suppressed.')
        archive = self.root / 'recovered.zip'
        subprocess.run(['openssl', 'cms', '-decrypt', '-binary', '-inform', 'DER', '-in', str(self.root / 'android-signing-backup/MediaForge-Android-signing-backup.cms'), '-inkey', str(private), '-out', str(archive)], check=True, capture_output=True)
        with zipfile.ZipFile(archive) as backup:
            self.assertEqual(set(backup.namelist()), {'mediaforge-release.p12', 'password.txt'})
            self.assertEqual(backup.read('mediaforge-release.p12'), (self.root / 'runner/mediaforge-release.p12').read_bytes())
            password = backup.read('password.txt').decode()
        self.assertEqual(len(password), 64)
        self.assertNotIn(password, result.stderr.decode())
        fingerprint = subprocess.run(['keytool', '-list', '-v', '-keystore', str(self.root / 'runner/mediaforge-release.p12'), '-storepass:env', 'FIXTURE_PASSWORD'], env={**self.env, 'FIXTURE_PASSWORD': password}, capture_output=True, check=True).stdout.decode()
        recorded = (self.root / 'android-signing-backup/certificate-fingerprint.txt').read_text().strip()
        self.assertIn(recorded, fingerprint)
        self.assertFalse((self.root / 'runner/mediaforge-signing-private.zip').exists())
        self.assertEqual({item.name for item in (self.root / 'android-signing-backup').iterdir()}, {'MediaForge-Android-signing-backup.cms', 'certificate-fingerprint.txt'})

    def test_public_release_is_preserved_without_generating_another_key(self):
        self.env['TEST_RELEASES'] = json.dumps([{'tag_name': 'android-v0.3.0', 'draft': False, 'target_commitish': 'old-source'}])
        self.assertEqual(self.run_signing().returncode, 0)
        self.assertFalse((self.root / 'environment').exists())
        self.assertFalse((self.root / 'runner/mediaforge-release.p12').exists())

    def test_api_failure_and_wrong_source_draft_cannot_generate_keys(self):
        self.env['TEST_API_STATUS'] = '1'
        self.assertNotEqual(self.run_signing().returncode, 0)
        self.env['TEST_API_STATUS'] = '0'
        self.env['TEST_RELEASES'] = json.dumps([{'tag_name': 'android-v0.3.0', 'draft': True, 'target_commitish': 'wrong-source'}])
        self.assertNotEqual(self.run_signing().returncode, 0)
        self.assertFalse((self.root / 'runner/mediaforge-release.p12').exists())

    def test_feature_branch_never_bootstraps_release_credentials(self):
        self.env['GITHUB_REF'] = 'refs/heads/codex/test'
        self.assertEqual(self.run_signing().returncode, 0)
        self.assertFalse((self.root / 'environment').exists())
        self.assertFalse((self.root / 'runner/mediaforge-release.p12').exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
