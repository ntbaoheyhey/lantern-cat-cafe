"""Probe the existing F6 baseline without rewriting inherited parity reports."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import os
import subprocess

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A10/scene-ready-transfer'
REPORT = OUT / 'parity-pma-r2.json'
BASELINE = ROOT / 'reports/v3-feel/parity-new.json'
LATEST = ROOT / 'reports/v3-feel/parity-latest.json'
assert not REPORT.exists()
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
now = lambda: datetime.now(timezone.utc).isoformat()
before = set((ROOT / 'reports/v3-feel').glob('parity-probe-*.json'))
latest_hash = sha(LATEST)
baseline_hash = sha(BASELINE)
source = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
runtime = json.loads((OUT / 'validation-pma-r2.json').read_text())['runtimeHashes']
assert all(sha(ROOT / path) == expected for path, expected in runtime.items())
receipt = {'started': now(), 'pid': os.getpid(), 'sourceCommit': source,
           'runtimeHashes': runtime, 'baselineSha256': baseline_hash,
           'scriptSha256': sha(Path(__file__)), 'complete': False, 'pass': False}
REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
result = subprocess.run(['node', 'scripts/v3feel/parity.mjs', 'probe'], cwd=ROOT,
                        stdin=subprocess.DEVNULL)
new = set((ROOT / 'reports/v3-feel').glob('parity-probe-*.json')) - before
receipt.update(exitCode=result.returncode, newProbes=[str(p.relative_to(ROOT)) for p in sorted(new)])
if len(new) == 1:
    probe = next(iter(new))
    observed = json.loads(probe.read_text())
    expected = {row['fixture']: row for row in json.loads(BASELINE.read_text())['rows']}
    receipt['probeSha256'] = sha(probe)
    receipt['probeSourceMatches'] = observed['sourceCommit'] == source
    receipt['rows'] = [dict(fixture=row['fixture'], hash=row['hash'],
                            baselineHash=expected.get(row['fixture'], {}).get('hash'),
                            baselineMatches=row['hash'] == expected.get(row['fixture'], {}).get('hash'),
                            parity=row['parity'], errors=row['errors'], result=row['result'])
                       for row in observed['rows']]
receipt.update(complete=True, finished=now(), baselineUnchanged=sha(BASELINE) == baseline_hash,
               inheritedLatestUnchanged=sha(LATEST) == latest_hash,
               runtimeUnchanged=all(sha(ROOT / path) == expected for path, expected in runtime.items()))
rows = receipt.get('rows', [])
receipt['pass'] = (result.returncode == 0 and len(new) == 1 and len(rows) == 3
                   and {row['fixture'] for row in rows} == {'wave1', 'wave3', 'boss'}
                   and receipt.get('probeSourceMatches') and receipt['baselineUnchanged']
                   and receipt['inheritedLatestUnchanged'] and receipt['runtimeUnchanged']
                   and all(row['baselineMatches'] and row['parity'] and not row['errors']
                           and row['result'] == 'party' for row in rows))
REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
print('F6 baseline comparison:', receipt['pass'], flush=True)
raise SystemExit(0 if receipt['pass'] else 1)
