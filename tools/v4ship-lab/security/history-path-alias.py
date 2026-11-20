"""Inspect exact lockfile blobs under a neutral YAML name, retaining all rules."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]; assert attempt.isdecimal()
folder = root / 'reports/v4-ship/S11/history-paths-1'
output = root / ('reports/v4-ship/S11/history-path-alias-' + attempt + '.json')
assert not output.exists() and not (root / 'STOP-V4SHIP').exists()
sha = lambda b: hashlib.sha256(b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(root)), 'sha256': sha(p.read_bytes())}
scope = json.loads((folder / 'scope.json').read_text())
packed = (folder / 'inventory.json.gz').read_bytes(); assert sha(packed) == scope['inventorySha256']
inventory = json.loads(gzip.decompress(packed))
check = json.loads(gzip.decompress((folder / 'check.json.gz').read_bytes()))
assert check['complete'] and check['scopeSha256'] == sha((folder / 'scope.json').read_bytes())
assert not any(os.environ.get(k) for k in ['GITLEAKS_CONFIG', 'GITLEAKS_CONFIG_TOML'])
assert subprocess.check_output(['gitleaks', 'version'], text=True).strip() == scope['binding']['scanner']
rows = []
for selected in scope['selected']:
    if not selected['defaultPathExcluded']:
        continue
    assert not (root / 'STOP-V4SHIP').exists()
    entry = inventory[selected['inventoryIndex']]
    assert entry['path'] == 'pnpm-lock.yaml' and selected['rules'] == ['kubernetes-secret-yaml']
    alias = 'payload.yaml'
    matching = [r['id'] for r in scope['binding']['rules'] if re.search(r['path'], alias, re.ASCII)]
    assert matching == selected['rules']
    assert not any(re.search(p, alias, re.ASCII) for p in scope['defaultGlobalPathExclusions'])
    data = subprocess.check_output(['git', 'cat-file', 'blob', entry['oid']], cwd=root)
    assert len(data) == entry['bytes']
    assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == entry['oid']
    original = next(r for r in check['rows'] if r['inventoryIndex'] == selected['inventoryIndex'])
    assert sha(data) == original['sha256']
    started = time.monotonic()
    with tempfile.TemporaryDirectory(prefix='v4ship-yaml-') as temporary:
        path = Path(temporary) / alias
        with path.open('xb') as handle:
            os.fchmod(handle.fileno(), 0o600); handle.write(data)
        result = subprocess.run(['gitleaks', 'dir', str(path), *scope['binding']['flags']],
                                cwd=temporary, capture_output=True, env={**os.environ, 'GOMAXPROCS': '1'})
        assert result.returncode in (0, 1), 'Scanner error; raw diagnostics suppressed'
        findings = json.loads(result.stdout or b'[]')
    rows.append({'inventoryIndex': selected['inventoryIndex'], 'path': entry['path'], 'alias': alias,
                 'oid': entry['oid'], 'commit': entry['commit'], 'bytes': len(data), 'sha256': sha(data),
                 'samePathRulePredicates': matching, 'scannerExitCode': result.returncode,
                 'seconds': time.monotonic() - started,
                 'findings': [{'line': f.get('StartLine'), 'endLine': f.get('EndLine'),
                               'type': f.get('RuleID'), 'classification': 'unresolved'} for f in findings]})
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'method': 'Exact historical lockfile bytes under payload.yaml preserve every matching positive filename predicate and avoid the default lockfile exclusion. No detector rules, thresholds or allowlists changed. Original excluded scans remain preserved.',
          'learn': 'reports/v4-ship/LEARN/S11-history-paths.md',
          'inputs': [sign(folder / p) for p in ['scope.json', 'inventory.json.gz', 'check.json.gz']],
          'harness': sign(Path(__file__)), 'rows': rows, 'scannedPairs': len(rows),
          'findings': sum(len(r['findings']) for r in rows), 'fullHistoryPass': False,
          'limits': ['Only the 19 captured pnpm-lock.yaml versions; original context and submodule/encoded/archive/binary gaps remain separately recorded.']}
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['scannedPairs', 'findings', 'fullHistoryPass']}))
