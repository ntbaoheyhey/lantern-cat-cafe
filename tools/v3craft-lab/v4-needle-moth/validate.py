"""Detached item regression; preserve failures and the unchanged parity baseline."""
from pathlib import Path
from datetime import datetime, timezone
import json
import subprocess

root = Path(__file__).resolve().parents[3]
out = root / 'reports/v4-art/REVIEW/A7/needle-moth'
jobs = root / 'reports/v4-art/jobs'
report = {'started': datetime.now(timezone.utc).isoformat(),
          'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
          'steps': []}
steps = [('web', ['pnpm', '--dir', 'apps/web', 'test']),
         ('typecheck', ['pnpm', '--dir', 'apps/web', 'typecheck']),
         ('parity', ['node', 'scripts/v3feel/parity.mjs', 'check'])]
for name, command in steps:
    log = jobs / ('a7-needle-' + name + '.log')
    with log.open('wb') as stream:
        result = subprocess.run(command, cwd=root, stdout=stream, stderr=subprocess.STDOUT)
    report['steps'].append({'name': name, 'exitCode': result.returncode, 'log': str(log)})
    (out / 'validation.json').write_text(json.dumps(report, indent=2) + '\n')
    print(name.upper() + '_EXIT=' + str(result.returncode), flush=True)
    if name == 'parity':
        latest = root / 'reports/v3-feel/parity-latest.json'
        if latest.exists():
            (out / 'parity.json').write_bytes(latest.read_bytes())
report['finished'] = datetime.now(timezone.utc).isoformat()
report['pass'] = all(step['exitCode'] == 0 for step in report['steps'])
(out / 'validation.json').write_text(json.dumps(report, indent=2) + '\n')
raise SystemExit(0 if report['pass'] else 1)
