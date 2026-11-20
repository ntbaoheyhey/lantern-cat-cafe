"""Compare exact committed report bytes before choosing an archive format."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import lzma
import platform
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'reports/v4-ship/S11/evidence-archive-study-1.json'
CANDIDATES = ROOT / 'work/v4ship-prep/evidence-archive-1/candidates'
KEEP = {'history-residual-regression-1', 'history-case-keys-regression-1',
        'history-text-prefix2-regression-1', 'palette-endurance-regression-1',
        'ranged-palette-production-regression-1', 'ranged-roster-regression-1'}
assert not OUTPUT.exists() and not CANDIDATES.exists()
assert not (ROOT / 'STOP-V4SHIP').exists()
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
assert commit == '1ff998a8d28562ac58c0bf5b2104066088cda22a'
paths = [p for p in sorted((ROOT / 'reports/v4-ship/S11').glob('*regression*/parity-probe.json')) if p.parent.name not in KEEP]
assert len(paths) == 37 and sum(p.stat().st_size for p in paths) == 5558103
sha = lambda data: hashlib.sha256(data).hexdigest()
methods = [('gzip1', lambda data: gzip.compress(data, compresslevel=1, mtime=0), gzip.decompress),
           ('gzip9', lambda data: gzip.compress(data, compresslevel=9, mtime=0), gzip.decompress),
           ('xz6', lambda data: lzma.compress(data, preset=6), lzma.decompress)]
rows = []
for path in paths:
    name = str(path.relative_to(ROOT))
    original = path.read_bytes()
    blob = subprocess.check_output(['git', 'rev-parse', commit + ':' + name], cwd=ROOT, text=True).strip()
    committed = subprocess.check_output(['git', 'cat-file', 'blob', blob], cwd=ROOT)
    assert original == committed and json.loads(original)['probePass']
    row = {'path': name, 'bytes': len(original), 'sha256': sha(original), 'gitBlob': blob, 'methods': []}
    for method, compress, decompress in methods:
        started = time.perf_counter(); encoded = compress(original); encode_seconds = time.perf_counter() - started
        started = time.perf_counter(); decoded = decompress(encoded); decode_seconds = time.perf_counter() - started
        assert decoded == original and sha(decoded) == row['sha256']
        candidate = CANDIDATES / method / (path.parent.name + ('.xz' if method == 'xz6' else '.gz'))
        candidate.parent.mkdir(parents=True, exist_ok=True)
        with candidate.open('xb') as stream:
            stream.write(encoded)
        row['methods'].append({'method': method, 'bytes': len(encoded), 'sha256': sha(encoded),
                               'encodeSeconds': encode_seconds, 'decodeSeconds': decode_seconds,
                               'path': str(candidate.relative_to(ROOT)), 'exactRoundTrip': True})
    rows.append(row)
totals = [{'method': name, **{field: sum(next(m for m in r['methods'] if m['method'] == name)[field] for r in rows)
                            for field in ['bytes', 'encodeSeconds', 'decodeSeconds']}} for name, _, _ in methods]
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'sourceCommit': commit,
          'learn': 'reports/v4-ship/LEARN/S11-evidence-archive.md',
          'harness': {'path': str(Path(__file__).relative_to(ROOT)), 'sha256': sha(Path(__file__).read_bytes())},
          'python': platform.python_version(), 'rawBytes': sum(r['bytes'] for r in rows), 'rows': rows,
          'totals': totals, 'allExact': True, 'selected': None, 'storageChanged': False}
OUTPUT.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'files': len(rows), 'rawBytes': report['rawBytes'], 'totals': totals, 'allExact': True}))
