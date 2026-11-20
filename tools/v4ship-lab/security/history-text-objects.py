"""Checkpoint a complete-fragment scan of each frozen eligible text blob.

Never replace or stop the original history scanner. No raw detector matches persist.
LEARN: reports/v4-ship/LEARN/S11-history-text-objects.md.
"""
from pathlib import Path
import datetime
import fcntl
import gzip
import hashlib
import json
import os
import re
import signal
import subprocess
import sys
import time
import tomllib
from text_detector_client import ROOT, CONFIG, BINARY, Detector, sha

now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()


def sign(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': sha(path.read_bytes())}


def atomic(path, data):
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_bytes(data);os.replace(temporary, path)


def run(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    assert subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip() == 'codex/v4-ship-2026-11-16'
    assert not subprocess.check_output(['git', 'for-each-ref', '--format=%(refname)', 'refs/replace'], cwd=ROOT).strip()
    study_path = ROOT / 'reports/v4-ship/S11/history-text-detector-study-1.json'
    study = json.loads(study_path.read_bytes());assert study['complete'] and study['pass']
    input_scope = ROOT / 'reports/v4-ship/S11/history-paths-1/scope.json'
    inventory_path = input_scope.with_name('inventory.json.gz')
    frozen = json.loads(input_scope.read_bytes());packed = inventory_path.read_bytes()
    assert sha(packed) == frozen['inventorySha256']
    entries = json.loads(gzip.decompress(packed));assert len(entries) == frozen['uniquePathObjectPairs']
    unique = {}
    for entry in entries:
        if entry['kind'] == 'blob':
            assert unique.get(entry['oid'], entry['bytes']) == entry['bytes']
            unique[entry['oid']] = entry['bytes']
    objects = sorted(unique)
    assert len(objects) == frozen['uniqueBlobs'] == 91187
    config = tomllib.loads(CONFIG.read_text())
    predicates = [(r['id'], re.compile(r['path'], re.ASCII)) for r in config['rules'] if r.get('path')]
    assert {r for r, _ in predicates} == {'freemius-secret-key', 'hashicorp-tf-password', 'kubernetes-secret-yaml', 'nuget-config-password', 'pkcs12-file'}
    contexts = {}
    counts = {}
    for rule, pattern in predicates:
        matched = [r for r in entries if pattern.search(r['path'])]
        counts[rule] = {'pairs': len(matched), 'objects': len({r['oid'] for r in matched})}
        for row in matched:
            assert row['kind'] == 'blob'
            contexts.setdefault(row['oid'], set()).add(rule)
    # Frozen inventory has only YAML-sensitive files; don't silently generalize.
    assert counts['kubernetes-secret-yaml'] == {'pairs': 51, 'objects': 51}
    assert all(v['pairs'] == 0 for k, v in counts.items() if k != 'kubernetes-secret-yaml')
    exclusions = [re.compile(p, re.ASCII) for p in config['allowlist']['paths']]
    exclusions += [re.compile(p, re.ASCII) for r in config['rules'] for a in r.get('allowlists', []) for p in a.get('paths', [])]
    for oid in objects:
        for suffix in ['.txt'] + (['.yaml'] if oid in contexts else []):
            assert not any(p.search(oid + suffix) for p in exclusions)

    lock = (ROOT / f'work/v4ship-prep/history-text-objects-{attempt}.lock').open('a+')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    lock.seek(0);lock.truncate();lock.write(str(os.getpid()));lock.flush()
    folder = ROOT / f'reports/v4-ship/S11/history-text-objects-{attempt}'
    folder.mkdir(exist_ok=True)
    binding = {'harness': sign(Path(__file__)), 'client': sign(Path(__file__).with_name('text_detector_client.py')),
               'binary': sign(BINARY), 'config': sign(CONFIG), 'study': sign(study_path),
               'build': sign(ROOT / 'reports/v4-ship/S11/text-detector-build-1.json'),
               'frozenScope': sign(input_scope), 'inventory': sign(inventory_path)}
    scope_path = folder / 'scope.json'
    scope = {'binding': binding, 'uniqueBlobs': len(objects), 'uniqueBlobBytes': sum(unique.values()),
             'sortedOidListSha256': sha(('\n'.join(objects) + '\n').encode()),
             'frozenCommits': frozen['commitCount'], 'frozenPathObjectPairs': len(entries), 'filenamePredicates': counts,
             'selection': 'All frozen blobs read and Git object identity verified. Full exact UTF-8 bytes without NUL reach the pinned detector once under a neutral .txt name; all 51 YAML contexts also run under an exact .yaml alias.',
             'limits': ['Default content allowlists remain; neutral aliases avoid path exclusions but are not original paths. Findings map by object ID to all frozen mappings.',
                        'Invalid UTF-8 and NUL-containing blobs are excluded, with counts and bytes retained; binary/encoded/archive/submodule/later-reference coverage is not inferred.',
                        'This supplements the original active history scanner. No original branch, reference, scanner process or output is modified.']}
    if scope_path.exists():
        assert json.loads(scope_path.read_bytes()) == scope
    else:
        atomic(scope_path, (json.dumps(scope, indent=2) + '\n').encode())
    checkpoint = folder / 'check.json.gz'
    state = json.loads(gzip.decompress(checkpoint.read_bytes())) if checkpoint.exists() else {'scopeSha256': sha(scope_path.read_bytes()), 'rows': [], 'interruptions': [], 'elapsedSeconds': 0}
    assert state['scopeSha256'] == sha(scope_path.read_bytes())
    for index, row in enumerate(state['rows']):
        assert row['index'] == index and row['oid'] == objects[index] and row['bytes'] == unique[row['oid']] and row['complete']
    started, previous_seconds = time.monotonic(), state['elapsedSeconds']

    def save():
        rows = state['rows'];text = [r for r in rows if r['status'] == 'text-scanned']
        scanned_pairs = set(r['oid'] for r in text)
        summary = {'at': now(), 'supervisorPid': os.getpid(), 'complete': len(rows) == len(objects),
                   'classifiedBlobs': len(rows), 'totalBlobs': len(objects), 'classifiedBytes': sum(r['bytes'] for r in rows),
                   'scannedTextBlobs': len(text), 'scannedTextBytes': sum(r['bytes'] for r in text),
                   'scannedTextPathPairs': sum(r['oid'] in scanned_pairs for r in entries if r['kind'] == 'blob'),
                   'excludedNonUtf8Blobs': sum(not r['utf8'] for r in rows), 'containsNulBlobs': sum(r['containsNul'] for r in rows),
                   'excludedBlobs': len(rows) - len(text), 'excludedBytes': sum(r['bytes'] for r in rows if r['status'] != 'text-scanned'),
                   'yamlContextScans': sum(s['context'] == 'kubernetes-secret-yaml' for r in text for s in r['scans']),
                   'rawFindings': sum(len(s['findings']) for r in text for s in r['scans']), 'fullHistoryPass': False,
                   'elapsedSeconds': round(previous_seconds + time.monotonic() - started, 3)}
        state.update(summary)
        compressed = gzip.compress(json.dumps(state, separators=(',', ':')).encode(), compresslevel=6 if summary['complete'] else 1, mtime=0)
        atomic(checkpoint, compressed)
        atomic(folder / 'progress.json', (json.dumps({**summary, 'checkpointSha256': sha(compressed)}, indent=2) + '\n').encode())
        return summary

    def interrupt(*_):
        raise InterruptedError('Owned scan interrupted')

    signal.signal(signal.SIGTERM, interrupt);signal.signal(signal.SIGINT, interrupt)
    print(json.dumps(save()), flush=True)
    if len(state['rows']) == len(objects):
        return
    reader = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    try:
        with Detector() as detector:
            for index in range(len(state['rows']), len(objects)):
                if (ROOT / 'STOP-V4SHIP').exists():
                    raise InterruptedError('STOP-V4SHIP')
                oid = objects[index];reader.stdin.write(oid.encode() + b'\n');reader.stdin.flush()
                header = reader.stdout.readline().decode('ascii').split();assert header == [oid, 'blob', str(unique[oid])]
                data = reader.stdout.read(unique[oid]);assert len(data) == unique[oid] and reader.stdout.read(1) == b'\n'
                identity = hashlib.sha1();identity.update(b'blob ' + str(len(data)).encode() + b'\0');identity.update(data)
                assert identity.hexdigest() == oid
                try:
                    data.decode('utf-8');utf8 = True
                except UnicodeDecodeError:
                    utf8 = False
                nul = b'\0' in data
                row = {'index': index, 'oid': oid, 'bytes': len(data), 'utf8': utf8, 'containsNul': nul, 'complete': True}
                if utf8 and not nul:
                    row.update(status='text-scanned', sha256=sha(data), scans=[])
                    for context, suffix in [('content', '.txt')] + ([('kubernetes-secret-yaml', '.yaml')] if oid in contexts else []):
                        if len(data) > 5000000:
                            print(json.dumps({'index': index, 'oid': oid, 'context': context, 'bytes': len(data), 'status': 'scanning'}), flush=True)
                        result = detector.scan(str(index) + ':' + context, oid + suffix, data)
                        row['scans'].append({'context': context, 'path': result['path'], 'seconds': round(result['seconds'], 6), 'findings': result['findings']})
                else:
                    row['status'] = 'excluded-non-utf8' if not utf8 else 'excluded-nul'
                state['rows'].append(row)
                if (index + 1) % 500 == 0 or len(state['rows']) == len(objects):
                    print(json.dumps(save()), flush=True)
    except BaseException as error:
        state['interruptions'].append({'at': now(), 'index': len(state['rows']), 'reason': type(error).__name__, 'partialObjectDiscarded': True})
        print(json.dumps(save()), flush=True)
        if not isinstance(error, InterruptedError):
            raise
    finally:
        reader.stdin.close()
        try:
            reader.wait(timeout=5)
        except subprocess.TimeoutExpired:
            reader.terminate();reader.wait(timeout=5)
        reader.stdout.close()


if __name__ == '__main__':
    run(sys.argv[1])
