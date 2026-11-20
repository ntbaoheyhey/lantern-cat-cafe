"""Exercise pipe backpressure, cancellation and child exit without raw scan data."""
from pathlib import Path
import datetime
import hashlib
import json
import subprocess
import sys
import threading
import time
from stdin_worker import communicate

output = Path(sys.argv[1])
assert not output.exists()
payload = b'v4-ship-safe-pipe-probe\n' * 400000
rows = []


def child(code):
    return subprocess.Popen([sys.executable, '-c', code], stdin=subprocess.PIPE,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)


consumer = ('import sys,time,hashlib,json;time.sleep(0.25);'
            'data=sys.stdin.buffer.read();'
            'print(json.dumps({"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()}))')
process = child(consumer)
started = time.monotonic()
checks = []
stdout, stderr = communicate(process, payload, lambda: checks.append(True), interval=0.02)
received = json.loads(stdout)
assert process.returncode == 0 and not stderr and checks
assert received == {'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest()}
rows.append({'case': 'slow-reader-exact-bytes', 'pass': True, 'bytes': len(payload),
             'watchdogChecks': len(checks), 'seconds': round(time.monotonic() - started, 3)})

process = child('import time;time.sleep(5)')
started = time.monotonic()
try:
    communicate(process, payload, lambda: time.monotonic() - started >= 0.15, interval=0.02)
    raise AssertionError('Expected cancellation')
except InterruptedError:
    assert process.poll() is not None
    assert not any(thread.name == 'scanner-stdin' for thread in threading.enumerate())
rows.append({'case': 'cancel-while-stdin-unread', 'pass': True, 'childReaped': True,
             'workerJoined': True, 'seconds': round(time.monotonic() - started, 3)})

process = child('import sys;sys.stdout.buffer.write(b"fixture");sys.exit(7)')
stdout, stderr = communicate(process, payload, lambda: False, interval=0.02)
assert process.returncode == 7 and stdout == b'fixture' and not stderr
rows.append({'case': 'early-nonzero-child-exit', 'pass': True, 'exitCodePreserved': 7})

process = child('import sys;print(len(sys.stdin.buffer.read()))')
stdout, stderr = communicate(process, b'', lambda: False, interval=0.02)
assert process.returncode == 0 and stdout.strip() == b'0' and not stderr
rows.append({'case': 'empty-input-eof', 'pass': True})

report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'python': sys.version.split()[0],
          'helperSha256': hashlib.sha256(Path(__file__).with_name('stdin_worker.py').read_bytes()).hexdigest(),
          'rows': rows, 'pass': True, 'fullHistoryPass': False}
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
