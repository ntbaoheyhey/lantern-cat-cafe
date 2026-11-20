"""Read historical SVG as text bytes only; no image rendering or mutation."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import os
import re
import subprocess
import sys
import time

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]; assert attempt.isdecimal()
out = root / ('reports/v4-ship/S11/history-svg-' + attempt + '.json')
raw = out.with_suffix('.rows.json.gz')
assert not out.exists() and not raw.exists() and not (root / 'STOP-V4SHIP').exists()
assert not any(os.environ.get(k) for k in ['GITLEAKS_CONFIG', 'GITLEAKS_CONFIG_TOML'])
assert not (root / '.gitleaks.toml').exists() and not (root / '.gitleaksignore').exists()
sha = lambda b: hashlib.sha256(b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(root)), 'sha256': sha(p.read_bytes())}
folder = root / 'reports/v4-ship/S11/history-paths-1'
scope = json.loads((folder / 'scope.json').read_text())
packed = (folder / 'inventory.json.gz').read_bytes(); assert sha(packed) == scope['inventorySha256']
inventory = json.loads(gzip.decompress(packed))
review_path = root / 'reports/v4-ship/S11/history-path-review-1.json'
review = json.loads(review_path.read_text()); assert review['pass']
for reference in review['inputs']:
    assert sha((root / reference['path']).read_bytes()) == reference['sha256']
scanner = subprocess.check_output(['gitleaks', 'version'], text=True).strip()
assert scanner == scope['binding']['scanner']
groups = {}
for index, item in enumerate(inventory):
    if item['kind'] == 'blob' and Path(item['path']).suffix.lower() == '.svg':
        assert not any(re.search(r['path'], item['path'], re.ASCII) for r in scope['binding']['rules'])
        groups.setdefault(item['oid'], []).append(index)
assert len(groups) == 189 and sum(map(len, groups.values())) == 259
rows = []
for oid, indices in sorted(groups.items()):
    assert not (root / 'STOP-V4SHIP').exists()
    started = time.monotonic()
    data = subprocess.check_output(['git', 'cat-file', 'blob', oid], cwd=root)
    assert all(len(data) == inventory[i]['bytes'] for i in indices)
    assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == oid
    try:
        data.decode('utf-8'); utf8 = True
    except UnicodeDecodeError:
        utf8 = False
    result = subprocess.run(['gitleaks', 'stdin', *scope['binding']['flags']], input=data,
                            cwd=root, capture_output=True, env={**os.environ, 'GOMAXPROCS': '1'})
    assert result.returncode in [0, 1], 'Scanner failed; raw diagnostics suppressed'
    findings = json.loads(result.stdout or b'[]')
    rows.append({'oid': oid, 'inventoryIndices': indices, 'bytes': len(data), 'sha256': sha(data),
                 'utf8': utf8, 'containsNul': b'\0' in data, 'scannerExitCode': result.returncode,
                 'numericReferenceMarkers': len(re.findall(rb'&#(?:x[0-9a-fA-F]+|[0-9]+);', data)),
                 'base64Markers': len(re.findall(rb'(?i)base64', data)),
                 'entityDeclarationMarkers': len(re.findall(rb'(?i)<!ENTITY', data)),
                 'findings': [{'line': f.get('StartLine'), 'endLine': f.get('EndLine'),
                               'type': f.get('RuleID'), 'classification': 'unresolved'} for f in findings],
                 'seconds': time.monotonic() - started})
    if len(rows) % 50 == 0:
        print(json.dumps({'completed': len(rows), 'total': len(groups)}), flush=True)
raw.write_bytes(gzip.compress(json.dumps(rows, separators=(',', ':')).encode(), mtime=0))
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'learn': 'reports/v4-ship/LEARN/S11-history-svg.md', 'harness': sign(Path(__file__)),
          'inputs': [sign(folder / 'scope.json'), sign(folder / 'inventory.json.gz'), sign(review_path)],
          'rows': sign(raw), 'scanner': scanner, 'command': ['gitleaks', 'stdin', *scope['binding']['flags']],
          'commits': scope['commitCount'], 'pathBlobPairs': sum(map(len, groups.values())),
          'scannedBlobs': len(rows), 'scannedBytes': sum(r['bytes'] for r in rows),
          'nonUtf8Blobs': sum(not r['utf8'] for r in rows),
          'containsNulBlobs': sum(r['containsNul'] for r in rows),
          'numericReferenceMarkers': sum(r['numericReferenceMarkers'] for r in rows),
          'base64Markers': sum(r['base64Markers'] for r in rows),
          'entityDeclarationMarkers': sum(r['entityDeclarationMarkers'] for r in rows),
          'findings': sum(len(r['findings']) for r in rows), 'complete': len(rows) == len(groups),
          'fullHistoryPass': False, 'imageOpens': 0, 'artFilesChanged': False,
          'limits': ['Raw exact SVG bytes only; encoded/entity-resolved or external-resource contents are not established.',
                     'Other binary formats, archives, submodules, original textual history and subsequent references remain open.']}
out.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k not in ['harness', 'inputs', 'rows', 'command']}))
