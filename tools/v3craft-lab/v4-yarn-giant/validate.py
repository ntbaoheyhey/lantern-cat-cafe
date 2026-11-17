"""Detached item regression; preserve failures and the unchanged parity baseline."""
from pathlib import Path
from datetime import datetime, timezone
import json
import hashlib
import subprocess
import sys
attempt=sys.argv[1] if len(sys.argv)>1 else "r2"

root = Path(__file__).resolve().parents[3]
out = root / 'reports/v4-art/REVIEW/A7/yarn-giant'
jobs = root / 'reports/v4-art/jobs'
report = {'started': datetime.now(timezone.utc).isoformat(),
          'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
          'steps': []}
report['runtimeSourceHashes']={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [root/'apps/web/src/game/cardrpg/spine/scene.ts',root/'apps/web/src/game/cardrpg/stage/layout-c2.ts',root/'apps/web/src/game/cardrpg/vfx-craft/yarn-surge.ts']}
(out / 'validation.json').write_text(json.dumps(report, indent=2) + '\n')
steps = [('web', ['pnpm', '--dir', 'apps/web', 'test']),
         ('typecheck', ['pnpm', '--dir', 'apps/web', 'typecheck']),
         ('parity', ['node', 'scripts/v3feel/parity.mjs', 'check'])]
for name, command in steps:
    log = jobs / ('a7-yarn-' + name + '-' + attempt + '.log')
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
