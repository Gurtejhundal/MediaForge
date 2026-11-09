"""Opt-in loopback bridge. No cloud, arbitrary paths/URLs, or unauthenticated jobs."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import hmac
import json
from pathlib import Path
import secrets
import socket
from socketserver import TCPServer
import tempfile
import threading
from urllib.parse import urlsplit

from engine import EngineUnavailable, MAX_INPUT, _read_image, preflight, regenerate


def allowed_origin(value: str) -> str:
    parsed = urlsplit(value)
    if parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment:
        raise ValueError('Specify an origin only, without credentials, path or query.')
    if value != 'https://mediaforge-tau.vercel.app' and not (parsed.scheme == 'http' and parsed.hostname in {'127.0.0.1', 'localhost'} and parsed.port):
        raise ValueError('Only the canonical MediaForge HTTPS origin or an explicit local app port is allowed.')
    return value


class LoopbackServer(ThreadingHTTPServer):
    def server_bind(self):
        # HTTPServer normally reverse-resolves this address. A fixed loopback
        # listener needs no DNS and must start even when reverse DNS stalls.
        TCPServer.server_bind(self)
        self.server_name = '127.0.0.1'
        self.server_port = self.server_address[1]


def create_server(port: int, token: str, origins: set[str]):
    if len(token) < 32:
        raise ValueError('A random session token of at least 32 characters is required.')
    origins = {allowed_origin(origin) for origin in origins}
    gate = threading.BoundedSemaphore(1)

    class Handler(BaseHTTPRequestHandler):
        server_version = 'MediaForgeLocal/0.3'
        def log_message(self, *_): pass  # Never log image names, tokens or body data.

        def setup(self):
            super().setup()
            self.connection.settimeout(10)

        def send(self, status, value, content_type='application/json'):
            data = json.dumps(value).encode() if content_type == 'application/json' else value
            self.send_response(status)
            if self.headers.get('Origin') in origins:
                self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
                self.send_header('Vary', 'Origin')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Connection', 'close')
            self.end_headers()
            self.wfile.write(data)

        def boundary(self, auth=True):
            host = f'127.0.0.1:{self.server.server_port}'
            if self.client_address[0] != '127.0.0.1' or self.headers.get('Host') != host:
                self.send(403, {'message': 'Loopback host required.'}); return False
            if self.headers.get('Origin') not in origins:
                self.send(403, {'message': 'This origin is not allowed.'}); return False
            if auth and not hmac.compare_digest(self.headers.get('Authorization', '').encode(), ('Bearer ' + token).encode()):
                self.send(401, {'message': 'Enter the current companion session token.'}); return False
            return True

        def do_OPTIONS(self):
            if not self.boundary(auth=False): return
            if self.path not in {'/check', '/regenerate'}:
                self.send(404, {'message': 'Unknown endpoint.'}); return
            self.send_response(204)
            self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            self.send_header('Access-Control-Allow-Private-Network', 'true')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', '0')
            self.end_headers()

        def do_GET(self):
            if not self.boundary(): return
            if self.path != '/check':
                self.send(404, {'message': 'Unknown endpoint.'}); return
            try:
                result = preflight()
                result.pop('executable', None)
                self.send(200, result)
            except (EngineUnavailable, OSError, RuntimeError) as error:
                self.send(503, {'status': 'unavailable', 'message': str(error), 'synthid_after': 'unverified'})

        def do_POST(self):
            if not self.boundary(): return
            if self.path != '/regenerate':
                self.send(404, {'message': 'Unknown endpoint.'}); return
            try: size = int(self.headers.get('Content-Length', '0'))
            except ValueError: size = 0
            if self.headers.get('Transfer-Encoding') or not 0 < size <= MAX_INPUT:
                self.send(413, {'message': 'Choose one still PNG/JPEG/WebP image up to 25 MB.'}); return
            if self.headers.get('Content-Type') not in {'application/octet-stream', 'image/png', 'image/jpeg', 'image/webp'}:
                self.send(415, {'message': 'Unsupported input type.'}); return
            if not gate.acquire(blocking=False):
                self.send(429, {'message': 'A local GPU job is already running. Wait for it to finish.'}); return
            try:
                with tempfile.TemporaryDirectory(prefix='mediaforge-local-gpu-') as folder:
                    source, output = Path(folder) / 'input', Path(folder) / 'regenerated.png'
                    data = self.rfile.read(size)
                    if len(data) != size: raise ValueError('The upload was interrupted.')
                    source.write_bytes(data)
                    image = _read_image(source); image.close()
                    regenerate(source, output)
                    exported = output.read_bytes()
                status, response, content_type = 200, exported, 'image/png'
            except EngineUnavailable as error:
                status, response, content_type = 503, {'message': str(error), 'synthid_after': 'unverified'}, 'application/json'
            except (ValueError, OSError, RuntimeError) as error:
                status, response, content_type = 422, {'message': str(error), 'synthid_after': 'unverified'}, 'application/json'
            finally:
                gate.release()
            try: self.send(status, response, content_type)
            except (OSError, socket.timeout): pass

    server = LoopbackServer(('127.0.0.1', port), Handler)
    # Graceful shutdown waits for the bounded current job rather than orphaning it.
    server.daemon_threads = False
    server.gpu_gate = gate
    return server


def main():
    parser = argparse.ArgumentParser(description='MediaForge opt-in local NVIDIA companion. SynthID outcomes remain unverified.')
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--origin', action='append', default=['https://mediaforge-tau.vercel.app'])
    args = parser.parse_args()
    token = secrets.token_urlsafe(32)
    try:
        with create_server(args.port, token, set(args.origin)) as server:
            print(f'Local companion: http://127.0.0.1:{server.server_port}', flush=True)
            print(f'Session token (paste into MediaForge; never share): {token}', flush=True)
            print('No image is sent to a cloud service. Review model downloads first. Stop in the app after the current image; Ctrl+C waits for that bounded job.', flush=True)
            try: server.serve_forever()
            except KeyboardInterrupt: print('Closing after current local work finishes.', flush=True)
    except (ValueError, OSError) as error:
        parser.exit(2, f'{error}\n')


if __name__ == '__main__': main()
