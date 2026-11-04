"""Additional local release-kit checks at each frozen review head."""
import argparse
import json
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('--name', required=True)
p.add_argument('--port', type=int, required=True)
p.add_argument('--dist', required=True)
a = p.parse_args()
root = Path.cwd()
out = root / 'reports/ui/logs' / a.name
out.mkdir(parents=True, exist_ok=False)
receipt = {'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(), 'checks': []}

def run(label, argv):
    print('START', label, flush=True)
    with (out / (label + '.log')).open('w') as stream:
        result = subprocess.run(argv, stdout=stream, stderr=subprocess.STDOUT)
        stream.write('\nexit=' + str(result.returncode) + '\n')
    receipt['checks'].append({'label': label, 'command': argv, 'exit': result.returncode})
    (out / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print('END', label, result.returncode, flush=True)
    if result.returncode:
        raise SystemExit(result.returncode)

run('release-barriers', ['python3', '-B', 'scripts/release-stack.test.py'])
run('archive-integrity', ['python3', '-B', 'scripts/repo-functions-rehearsal.test.py'])
with socket.socket() as sock:
    sock.bind(('127.0.0.1', a.port))
with (out / 'local-http.log').open('w') as server_log:
    server = subprocess.Popen([sys.executable, '-m', 'http.server', str(a.port), '--bind', '127.0.0.1', '--directory', str(root / 'apps/web' / a.dist)], stdout=server_log, stderr=subprocess.STDOUT)
    try:
        address = 'http://127.0.0.1:' + str(a.port)
        for attempt in range(100):
            try:
                with urllib.request.urlopen(address, timeout=1) as response:
                    assert response.status == 200
                break
            except OSError:
                if server.poll() is not None:
                    raise RuntimeError('Owned local HTTP server failed')
                time.sleep(0.1)
        else:
            raise RuntimeError('Owned local HTTP server unavailable')
        run('local-release-smoke', ['node', 'scripts/release-smoke.mjs', str(root), address, str(out / 'smoke'), '--require-reward'])
    finally:
        server.terminate()
        server.wait(timeout=10)
receipt['complete'] = True
(out / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
