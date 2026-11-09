"""Real loopback HTTP/file tests. GPU engine and hardware remain simulated."""
from io import BytesIO
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from PIL import Image
import companion

ORIGIN = 'https://mediaforge-tau.vercel.app'
TOKEN = 'test-only-token-' + 'x' * 32


class CompanionTests(unittest.TestCase):
    def setUp(self):
        self.server = companion.create_server(0, TOKEN, {ORIGIN})
        self.thread = threading.Thread(target=self.server.serve_forever)
        self.thread.start()
        self.addCleanup(self.close)
        image = BytesIO(); Image.new('RGB', (8, 6), 'orange').save(image, 'PNG')
        self.image = image.getvalue()

    def close(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join()

    def request(self, path='/check', method='GET', data=None, headers=None):
        values = {'Origin': ORIGIN, 'Authorization': 'Bearer ' + TOKEN}
        values.update(headers or {})
        request = Request(f'http://127.0.0.1:{self.server.server_port}{path}', data=data, headers=values, method=method)
        try: response = urlopen(request, timeout=3)
        except HTTPError as error:
            with error as response:
                return response.code, response.headers, response.read()
        with response: return response.status, response.headers, response.read()

    def test_loopback_startup_does_not_require_reverse_dns(self):
        with patch('socket.getfqdn', side_effect=RuntimeError('DNS unavailable')):
            server = companion.create_server(0, 'x' * 43, {ORIGIN})
            try:
                self.assertEqual(server.server_name, '127.0.0.1')
                self.assertGreater(server.server_port, 0)
            finally:
                server.server_close()

    def test_exact_origin_host_and_session_token_are_required(self):
        with patch.object(companion, 'preflight') as check:
            for headers in [{'Origin': 'https://evil.example'}, {'Authorization': ''}, {'Authorization': 'Bearer wrong'}, {'Host': 'evil.example'}]:
                status, response_headers, _ = self.request(headers=headers)
                self.assertIn(status, {401, 403})
                if headers.get('Origin') == 'https://evil.example':
                    self.assertIsNone(response_headers.get('Access-Control-Allow-Origin'))
            check.assert_not_called()

    def test_preflight_cors_only_accepts_known_origins(self):
        status, headers, _ = self.request(method='OPTIONS')
        self.assertEqual(status, 204)
        self.assertEqual(headers['Access-Control-Allow-Origin'], ORIGIN)
        self.assertEqual(headers['Access-Control-Allow-Private-Network'], 'true')
        self.assertEqual(self.request(method='OPTIONS', headers={'Origin': 'null'})[0], 403)

    def test_check_filters_executable_and_does_not_certify_model_fit(self):
        with patch.object(companion, 'preflight', return_value={'status': 'ready_for_trial', 'gpu': 'Test NVIDIA', 'executable': 'private-path', 'model_fit': 'unverified'}):
            status, _, body = self.request()
        self.assertEqual(status, 200)
        self.assertNotIn(b'private-path', body)
        self.assertIn(b'unverified', body)
        with patch.object(companion, 'preflight', side_effect=companion.EngineUnavailable('no CUDA')):
            self.assertEqual(self.request()[0], 503)

    def test_regeneration_returns_real_png_and_cleans_private_input(self):
        temporary = []
        def simulate(source, output):
            self.assertEqual(source.read_bytes(), self.image)
            temporary.append(source.parent)
            Image.new('RGB', (8, 6), 'blue').save(output, 'PNG')
        with patch.object(companion, 'regenerate', side_effect=simulate) as engine:
            status, headers, body = self.request('/regenerate', 'POST', self.image, {'Content-Type': 'image/png'})
        self.assertEqual(status, 200)
        self.assertEqual(headers['Content-Type'], 'image/png')
        self.assertEqual(headers['Cache-Control'], 'no-store')
        with Image.open(BytesIO(body)) as output: self.assertEqual(output.size, (8, 6))
        engine.assert_called_once()
        self.assertTrue(all(not path.exists() for path in temporary))

    def test_invalid_oversized_and_unauthorized_images_never_start_gpu(self):
        with patch.object(companion, 'regenerate') as engine:
            self.assertEqual(self.request('/regenerate', 'POST', b'not-image', {'Content-Type': 'image/png'})[0], 422)
            self.assertEqual(self.request('/regenerate', 'POST', b'x', {'Content-Type': 'image/png', 'Content-Length': str(companion.MAX_INPUT + 1)})[0], 413)
            self.assertEqual(self.request('/regenerate', 'POST', self.image, {'Content-Type': 'text/plain'})[0], 415)
            self.assertEqual(self.request('/regenerate', 'POST', self.image, {'Authorization': '', 'Content-Type': 'image/png'})[0], 401)
            self.assertEqual(self.request('/regenerate?url=https://example.com', 'POST', self.image, {'Content-Type': 'image/png'})[0], 404)
            engine.assert_not_called()

    def test_busy_engine_rejects_another_job_without_queueing(self):
        self.server.gpu_gate.acquire()
        try:
            with patch.object(companion, 'regenerate') as engine:
                self.assertEqual(self.request('/regenerate', 'POST', self.image, {'Content-Type': 'image/png'})[0], 429)
                engine.assert_not_called()
        finally: self.server.gpu_gate.release()

    def test_engine_failure_cleans_input_and_releases_capacity(self):
        temporary = []
        def fail(source, output):
            temporary.append(source.parent)
            raise RuntimeError('GPU failed')
        with patch.object(companion, 'regenerate', side_effect=fail):
            self.assertEqual(self.request('/regenerate', 'POST', self.image, {'Content-Type': 'image/png'})[0], 422)
        self.assertTrue(all(not path.exists() for path in temporary))
        self.assertTrue(self.server.gpu_gate.acquire(blocking=False))
        self.server.gpu_gate.release()

    def test_configuration_refuses_remote_or_ambiguous_origins(self):
        for origin in ['https://evil.example', 'http://192.168.1.2:3000', 'http://localhost:3000/path', 'http://user@localhost:3000', 'null']:
            with self.assertRaises(ValueError): companion.allowed_origin(origin)
        self.assertEqual(companion.allowed_origin('http://127.0.0.1:3000'), 'http://127.0.0.1:3000')
        with self.assertRaises(ValueError): companion.create_server(0, 'short', {ORIGIN})


if __name__ == '__main__': unittest.main()
