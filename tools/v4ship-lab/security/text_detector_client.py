"""Framed, cancellable local detector client; raw contents stay in pipes/memory."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import threading
import time

ROOT = Path(__file__).resolve().parents[3]
CONFIG = ROOT / 'work/v4ship-prep/security-rules/gitleaks-8.30.1.toml'
BINARY = ROOT / 'work/v4ship-prep/text-detector-api-1'
sha = lambda data: hashlib.sha256(data).hexdigest()


class Detector:
    def exchange(self, operation):
        done, result = threading.Event(), {}

        def run():
            try:
                result['value'] = operation()
            except BaseException:
                result['failed'] = True
            finally:
                done.set()

        worker = threading.Thread(target=run, name='text-detector-frame')
        worker.start()
        try:
            while not done.wait(.2):
                if (ROOT / 'STOP-V4SHIP').exists():
                    raise InterruptedError('STOP-V4SHIP')
        except BaseException:
            if self.process.poll() is None:
                self.process.terminate()
            if not done.wait(5):
                self.process.kill()
            worker.join(5)
            if worker.is_alive():
                raise RuntimeError('Owned detector did not close') from None
            raise
        worker.join()
        if result.get('failed'):
            raise RuntimeError('Detector protocol failed; raw details suppressed')
        return result['value']

    def __enter__(self):
        assert not (ROOT / 'STOP-V4SHIP').exists()
        build = json.loads((ROOT / 'reports/v4-ship/S11/text-detector-build-1.json').read_bytes())
        assert build['pass'] and sha(BINARY.read_bytes()) == build['binary']['sha256']
        env = {k: v for k, v in os.environ.items() if not k.startswith('GITLEAKS_')}
        self.process = subprocess.Popen([str(BINARY), str(CONFIG)], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                        stderr=subprocess.PIPE, env={**env, 'GOMAXPROCS': '1'})
        try:
            self.ready = self.exchange(lambda: json.loads(self.process.stdout.readline()))
            assert self.ready == build['ready']
        except BaseException:
            self.__exit__(None, None, None)
            raise
        return self

    def __exit__(self, *_):
        if self.process.stdin and not self.process.stdin.closed:
            self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill();self.process.wait(timeout=5)
        self.process.stdout.close();self.process.stderr.close()

    def scan(self, identity, path, data):
        assert not (ROOT / 'STOP-V4SHIP').exists()
        header = {'id': identity, 'path': path, 'bytes': len(data), 'sha256': sha(data)}

        def transfer():
            self.process.stdin.write(json.dumps(header).encode() + b'\n')
            self.process.stdin.write(data);self.process.stdin.flush()
            return json.loads(self.process.stdout.readline())

        started = time.monotonic();row = self.exchange(transfer)
        assert all(row[k] == v for k, v in header.items()) and row['complete']
        row['wallSeconds'] = round(time.monotonic() - started, 6)
        assert all(set(f) == {'file', 'line', 'endLine', 'type', 'classification'} and f['file'] == path for f in row['findings'])
        return row
