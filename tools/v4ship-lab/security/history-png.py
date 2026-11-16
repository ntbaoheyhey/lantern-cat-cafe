"""Scan standard PNG text chunks from exact historical blobs; never decode pixels."""
from pathlib import Path
import collections
import datetime
import gzip
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from png_metadata import inspect, MAX_TEXT_BYTES
from stdin_worker import communicate

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]
assert attempt.isdecimal()
out = root / f'reports/v4-ship/S11/history-png-{attempt}'
assert not out.exists() and not (root / 'STOP-V4SHIP').exists()
assert subprocess.check_output(['git', 'branch', '--show-current'], cwd=root, text=True).strip() == 'codex/v4-ship-2026-11-16'
assert not any(os.environ.get(k) for k in ['GITLEAKS_CONFIG', 'GITLEAKS_CONFIG_TOML'])
assert not (root / '.gitleaks.toml').exists() and not (root / '.gitleaksignore').exists()
sha = lambda b: hashlib.sha256(b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(root)), 'sha256': sha(p.read_bytes())}
folder = root / 'reports/v4-ship/S11/history-paths-1'
scope = json.loads((folder / 'scope.json').read_text())
packed = (folder / 'inventory.json.gz').read_bytes()
assert sha(packed) == scope['inventorySha256']
inventory = json.loads(gzip.decompress(packed))
review_path = root / 'reports/v4-ship/S11/history-path-review-1.json'
review = json.loads(review_path.read_text())
assert review['pass']
for ref in review['inputs']:
    assert sha((root / ref['path']).read_bytes()) == ref['sha256']
parser_check = root / 'reports/v4-ship/S11/history-png-parser-check-2.json'
test = json.loads(parser_check.read_text())
assert test['pass'] and len(test['rows']) == 18
for ref in test['harness']:
    assert sha((root / ref['path']).read_bytes()) == ref['sha256']
assert subprocess.check_output(['gitleaks', 'version'], text=True).strip() == scope['binding']['scanner']
config = root / 'work/v4ship-prep/security-rules/gitleaks-8.30.1.toml'
assert sha(config.read_bytes()) == scope['binding']['sourceConfigSha256']
groups = {}
for index, item in enumerate(inventory):
    if item['kind'] == 'blob' and Path(item['path']).suffix.lower() == '.png':
        assert not any(re.search(r['path'], item['path'], re.ASCII) for r in scope['binding']['rules'])
        groups.setdefault(item['oid'], []).append(index)
assert len(groups) == 27892 and sum(map(len, groups.values())) == 64003
out.mkdir()
rows, scans, scanned = [], [], {}
started = time.monotonic()
stop = lambda: (root / 'STOP-V4SHIP').exists() or (root / 'reports/v4-ship/STOP-V4SHIP').exists()


def checkpoint(complete=False):
    raw = out / 'rows.json.gz'
    raw.write_bytes(gzip.compress(json.dumps({'rows': rows, 'scans': scans}, separators=(',', ':')).encode(), mtime=0))
    chunks = collections.Counter()
    nontext = collections.Counter()
    for row in rows:
        chunks.update(row['chunks'])
        nontext.update(row['nonTextBytesByType'])
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'learn': 'reports/v4-ship/LEARN/S11-history-png.md',
              'harness': [sign(Path(__file__)), sign(Path(__file__).with_name('png_metadata.py')), sign(Path(__file__).with_name('stdin_worker.py'))],
              'inputs': [sign(folder / 'scope.json'), sign(folder / 'inventory.json.gz'), sign(review_path), sign(parser_check)],
              'rows': sign(raw), 'scanner': scope['binding']['scanner'],
              'command': ['gitleaks', 'stdin', *scope['binding']['flags']],
              'commits': scope['commitCount'], 'pathBlobPairs': sum(map(len, groups.values())),
              'selectedBlobs': len(groups), 'inspectedBlobs': len(rows),
              'inspectedBytes': sum(r['bytes'] for r in rows), 'chunkCounts': dict(chunks),
              'unscannedNonTextBytesByType': dict(nontext), 'uniqueDecodedTexts': len(scans),
              'uniqueDecodedBytes': sum(s['bytes'] for s in scans),
              'mappedDecodedBytes': sum(r['decodedBytes'] for r in rows),
              'objectsWithErrors': sum(bool(r['errors']) for r in rows),
              'textResourceCeilingPerObject': MAX_TEXT_BYTES,
              'findings': sum(len(s['findings']) for s in scans), 'complete': complete,
              'allSelectedMetadataParsed': complete and not any(r['errors'] for r in rows),
              'fullHistoryPass': False, 'binaryCoveragePass': False, 'imageOpens': 0,
              'runtimeChanged': False, 'seconds': time.monotonic() - started,
              'limits': ['Only standard tEXt/zTXt/iTXt fields are decoded and scanned; no pixel decoding or rendering.',
                         'EXIF, ICC, unknown chunks, compressed pixels, steganography, encoded subcontent and trailing data are not scanned.',
                         'Malformed containers, unsupported text and resource-limit errors remain explicit gaps.',
                         'Later refs, archives, submodules and the original unfinished text history remain open.']}
    (out / 'check.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: report[k] for k in ['inspectedBlobs', 'selectedBlobs', 'inspectedBytes', 'uniqueDecodedTexts', 'objectsWithErrors', 'findings', 'complete', 'seconds']}), flush=True)


batch = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=root, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
try:
    for oid, indices in sorted(groups.items()):
        if stop():
            raise InterruptedError('Stop requested')
        batch.stdin.write((oid + '\n').encode())
        batch.stdin.flush()
        header = batch.stdout.readline().decode('ascii').split()
        expected_bytes = inventory[indices[0]]['bytes']
        assert header == [oid, 'blob', str(expected_bytes)]
        data = batch.stdout.read(expected_bytes)
        assert len(data) == expected_bytes and batch.stdout.read(1) == b'\n'
        assert all(inventory[i]['bytes'] == len(data) for i in indices)
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == oid
        metadata, payloads = inspect(data)
        for text_index, payload in payloads:
            digest = sha(payload)
            if digest not in scanned:
                process = subprocess.Popen(['gitleaks', 'stdin', *scope['binding']['flags']], cwd=root,
                                           env={**os.environ, 'GOMAXPROCS': '1'}, stdin=subprocess.PIPE,
                                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                stdout, _ = communicate(process, payload, stop)
                assert process.returncode in (0, 1), 'Scanner failed; raw diagnostics suppressed'
                findings = json.loads(stdout or b'[]')
                scanned[digest] = len(scans)
                scans.append({'sha256': digest, 'bytes': len(payload), 'scannerExitCode': process.returncode,
                              'findings': [{'line': f.get('StartLine'), 'endLine': f.get('EndLine'),
                                            'type': f.get('RuleID'), 'classification': 'unresolved'} for f in findings]})
            metadata['texts'][text_index]['scanIndex'] = scanned[digest]
        rows.append({'oid': oid, 'inventoryIndices': indices, 'bytes': len(data), 'sha256': sha(data), **metadata})
        if len(rows) % 1000 == 0:
            checkpoint()
    batch.stdin.close()
    assert batch.wait() == 0
    checkpoint(complete=True)
except BaseException:
    checkpoint()
    raise
finally:
    if batch.poll() is None:
        batch.terminate()
        batch.wait()
