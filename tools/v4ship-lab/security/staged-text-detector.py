"""Supplement the staged CLI scan with exact complete text and gzip fragments.

Neutral aliases avoid path exclusions (including go.mod/go.sum); filename rules
also receive the original path. Match values are never stored or printed.
"""
from pathlib import Path
import datetime
import gzip
import json
import os
import re
import subprocess
import sys
import tomllib
from text_detector_client import CONFIG, ROOT, Detector, sha

assert not (ROOT / 'STOP-V4SHIP').exists()
assert subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip() == 'codex/v4-ship-2026-11-16'
output = ROOT / sys.argv[1]
assert not output.exists()
names = [os.fsdecode(p) for p in subprocess.check_output(['git', 'diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'], cwd=ROOT).split(b'\0') if p]
assert names and not any(Path(name).name == '.DS_Store' for name in names)
config = tomllib.loads(CONFIG.read_text())
predicates = [re.compile(r['path'], re.ASCII) for r in config['rules'] if r.get('path')]
paths = config['allowlist']['paths'] + [p for r in config['rules'] for a in r.get('allowlists', []) for p in a.get('paths', [])]
exclusions = [re.compile(p, re.ASCII) for p in paths]
files, scanned, excluded, findings = [], [], [], []
with Detector() as detector:
    for name in names:
        data = subprocess.check_output(['git', 'show', ':' + name], cwd=ROOT)
        files.append({'path': name, 'bytes': len(data), 'sha256': sha(data)})
        inputs = [('raw', data)]
        if name.endswith('.gz'):
            inputs.append(('expanded-gzip', gzip.decompress(data)))
        for representation, payload in inputs:
            record = {'path': name, 'representation': representation, 'bytes': len(payload), 'sha256': sha(payload)}
            try:
                payload.decode('utf-8'); utf8 = True
            except UnicodeDecodeError:
                utf8 = False
            if not utf8 or b'\0' in payload:
                excluded.append({**record, 'utf8': utf8, 'containsNul': b'\0' in payload})
                assert representation != 'expanded-gzip', 'Expanded gzip must be exact eligible text'
                continue
            alias = sha(payload) + '.txt'
            assert not any(p.search(alias) for p in exclusions)
            aliases = [alias] + ([name] if any(p.search(name) for p in predicates) else [])
            for path in aliases:
                result = detector.scan(str(len(scanned)), path, payload)
                scanned.append({**record, 'alias': path, 'seconds': result['seconds'], 'findings': result['findings']})
                findings.extend({'path': name, 'representation': representation, **f} for f in result['findings'])
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'harness': {'path': str(Path(__file__).relative_to(ROOT)), 'sha256': sha(Path(__file__).read_bytes())},
              'ready': detector.ready, 'files': files, 'scans': scanned, 'excluded': excluded,
              'findings': findings, 'unresolved': len(findings), 'pass': not findings,
              'limits': 'Full exact UTF-8/no-NUL staged bytes and expanded gzip; default content allowlists remain. Excluded binary bytes are not covered. Generated report checked separately.'}
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'files': len(files), 'textScans': len(scanned), 'expandedGzip': sum(s['representation'] == 'expanded-gzip' for s in scanned),
                  'excluded': len(excluded), 'findings': len(findings), 'pass': not findings}))
if findings:
    sys.exit(1)
