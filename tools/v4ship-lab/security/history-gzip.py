"""Checkpoint scans of exact historical gzip contents; never persist raw matches.

LEARN: reports/v4-ship/LEARN/S11-history-gzip.md. This supplements, but does not
replace, textual history scans or establish full-history acceptance.
"""
from pathlib import Path
import datetime
import fcntl
import gzip
import hashlib
import json
import os
import signal
import subprocess
import sys
import time

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]
assert attempt.isdecimal()
folder = root / 'reports/v4-ship/S11' / ('history-gzip-' + attempt)
stop_file = root / 'STOP-V4SHIP'
assert not stop_file.exists()
assert subprocess.check_output(['git', 'branch', '--show-current'], cwd=root, text=True).strip() == 'codex/v4-ship-2026-11-16'
sha = lambda data: hashlib.sha256(data).hexdigest()
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()


def atomic(path, data):
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_bytes(data)
    os.replace(temporary, path)


lock_path = root / 'work/v4ship-prep' / ('history-gzip-' + attempt + '.lock')
lock = lock_path.open('a+')
fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
lock.seek(0)
lock.truncate()
lock.write(str(os.getpid()))
lock.flush()
scope_bytes = (folder / 'scope.json').read_bytes()
scope = json.loads(scope_bytes)
inventory_bytes = (folder / 'inventory.json.gz').read_bytes()
assert sha(inventory_bytes) == scope['inventory']['sha256']
inventory = json.loads(gzip.decompress(inventory_bytes))
assert len(inventory) == len({row['oid'] for row in inventory}) == scope['uniqueBlobs']
order = sorted(inventory, key=lambda row: (row['compressedBytes'], row['oid']))
scanner = subprocess.check_output(['gitleaks', 'version'], text=True).strip()
command = ['gitleaks', 'stdin', '--no-banner', '--no-color', '--redact=100',
           '--log-level=fatal', '--report-format=json', '--report-path=-',
           '--ignore-gitleaks-allow']
binding = {'scopeSha256': sha(scope_bytes), 'inventorySha256': sha(inventory_bytes),
           'harnessSha256': sha(Path(__file__).read_bytes()), 'scanner': scanner,
           'command': command, 'order': 'compressedBytes, then Git oid',
           'contentOnly': True, 'fullHistoryPass': False}
binding_path = folder / 'binding.json'
if binding_path.exists():
    assert json.loads(binding_path.read_text()) == binding
else:
    atomic(binding_path, (json.dumps(binding, indent=2) + '\n').encode())
checkpoint = folder / 'check.json.gz'
state = json.loads(gzip.decompress(checkpoint.read_bytes())) if checkpoint.exists() else {
    'bindingSha256': sha(binding_path.read_bytes()), 'rows': [], 'interruptions': []}
assert state['bindingSha256'] == sha(binding_path.read_bytes())
cache = {}
for index, row in enumerate(state['rows']):
    assert row['index'] == index and row['oid'] == order[index]['oid'] and row['complete']
    cache.setdefault(row['expandedSha256'], row)
stopping = False


def request_stop(*_):
    global stopping
    stopping = True


signal.signal(signal.SIGTERM, request_stop)
signal.signal(signal.SIGINT, request_stop)


def save():
    progress = {'at': now(), 'supervisorPid': os.getpid(),
                'complete': len(state['rows']) == len(order),
                'scannedBlobs': len(state['rows']), 'totalBlobs': len(order),
                'compressedBytes': sum(row['compressedBytes'] for row in state['rows']),
                'expandedBytes': sum(row['expandedBytes'] for row in state['rows']),
                'findings': sum(len(row['findings']) for row in state['rows']),
                'nonUtf8Blobs': sum(not row['utf8'] for row in state['rows']),
                'fullHistoryPass': False,
                'note': 'Expanded gzip content-only stdin scans. Findings require exact contextual triage; text history, path-dependent rules, embedded archives, other binary formats and later refs are separate.'}
    state.update(progress)
    packed = gzip.compress(json.dumps(state, separators=(',', ':')).encode(), mtime=0)
    atomic(checkpoint, packed)
    progress['checkpointSha256'] = sha(packed)
    atomic(folder / 'progress.json', (json.dumps(progress, indent=2) + '\n').encode())
    return progress


save()
limit = int(os.environ.get('V4_GZIP_MAX_BLOBS', str(len(order))))
completed = 0
for index in range(len(state['rows']), len(order)):
    if stopping or stop_file.exists() or completed >= limit:
        break
    entry = order[index]
    started = time.monotonic()
    process = None
    try:
        packed = subprocess.check_output(['git', 'cat-file', 'blob', entry['oid']], cwd=root)
        assert len(packed) == entry['compressedBytes']
        assert hashlib.sha1(b'blob ' + str(len(packed)).encode() + b'\0' + packed).hexdigest() == entry['oid']
        assert packed.startswith(b'\x1f\x8b'), 'Non-gzip blob at a gzip path'
        expanded = gzip.decompress(packed)
        digest = sha(expanded)
        try:
            expanded.decode('utf-8')
            utf8 = True
        except UnicodeDecodeError:
            utf8 = False
        reused = cache.get(digest)
        if reused:
            findings = reused['findings']
            exit_code = reused['scannerExitCode']
        else:
            process = subprocess.Popen(command, cwd=root, stdin=subprocess.PIPE,
                                       stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                       env={**os.environ, 'GOMAXPROCS': '1'})
            print(json.dumps({'index': index, 'oid': entry['oid'], 'expandedBytes': len(expanded),
                              'scannerPid': process.pid, 'status': 'running'}), flush=True)
            first = True
            while True:
                try:
                    output, errors = process.communicate(input=expanded if first else None, timeout=2)
                    break
                except subprocess.TimeoutExpired:
                    first = False
                    if stopping or stop_file.exists():
                        process.terminate()
                        process.communicate()
                        state['interruptions'].append({'at': now(), 'index': index,
                                                       'reason': 'Stop requested; blob incomplete and must rerun'})
                        save()
                        sys.exit(0)
            exit_code = process.returncode
            if exit_code not in (0, 1):
                raise RuntimeError('Scanner error; raw diagnostics suppressed')
            matches = json.loads(output or b'[]')
            findings = [{'line': match.get('StartLine'), 'endLine': match.get('EndLine'),
                         'type': match.get('RuleID'), 'classification': 'unresolved'} for match in matches]
        row = {'index': index, 'oid': entry['oid'], 'complete': True,
               'compressedBytes': len(packed), 'compressedSha256': sha(packed),
               'expandedBytes': len(expanded), 'expandedSha256': digest, 'utf8': utf8,
               'gzipIntegrity': True, 'scannerExitCode': exit_code, 'findings': findings,
               'reusedExactExpandedResult': reused['oid'] if reused else None,
               'seconds': round(time.monotonic() - started, 3)}
        state['rows'].append(row)
        cache.setdefault(digest, row)
        completed += 1
        print(json.dumps(save()), flush=True)
        del packed, expanded
    except Exception as error:
        if process is not None and process.poll() is None:
            process.terminate()
            process.communicate()
        state['interruptions'].append({'at': now(), 'index': index,
                                       'errorType': type(error).__name__,
                                       'reason': 'Blob incomplete; preserve evidence and diagnose without raw output'})
        save()
        raise RuntimeError('Historical gzip check failed; raw diagnostics suppressed') from None
print(json.dumps(save()), flush=True)
