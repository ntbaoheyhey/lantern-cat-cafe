"""Validate production activation using the existing web, parity and Vite entry points."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import os
import subprocess
import sys

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]
out = root / 'reports/v4-art/REVIEW/activation' / attempt
out.mkdir(parents=True, exist_ok=True)
report_path = out / 'validation.json'
assert not report_path.exists(), 'Preserve every validation attempt'
now = lambda: datetime.now(timezone.utc).isoformat()
sha = lambda path: hashlib.sha256((root / path).read_bytes()).hexdigest()
paths = json.loads((root / 'tools/v3craft-lab/v4-clarity/source-paths.json').read_text())
paths.append('apps/web/src/game/cardrpg/vfx-craft/encounter.ts')
hashes = {path: sha(path) for path in paths}
stable = lambda: all(sha(path) == digest for path, digest in hashes.items())
build = root / 'tools/v3craft-lab/v4-activation/raw' / ('production-' + attempt)
report = {'started': now(), 'pid': os.getpid(), 'sourceCommit': subprocess.check_output(
    ['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(), 'runtimeSourceHashes': hashes,
    'preflight': json.loads((out / 'preflight.json').read_text()), 'steps': [], 'pass': False}
assert report['preflight']['runtimeSourceHashes'] == hashes
assert report['preflight']['typecheck']['exitCode'] == 0
save = lambda: report_path.write_text(json.dumps(report, indent=2) + '\n')
save()
env = os.environ.copy()
env.pop('VITE_CRAFT_PILOT', None)
steps = [('web', ['pnpm', '--dir', 'apps/web', 'test']),
         ('parity', ['node', 'scripts/v3feel/parity.mjs', 'check']),
         ('production-build', ['pnpm', '--dir', 'apps/web', 'exec', 'vite', 'build',
                               '--outDir', str(build), '--emptyOutDir'])]
for name, command in steps:
    assert stable(), 'Runtime changed during validation'
    log = root / 'reports/v4-art/jobs' / ('activation-' + attempt + '-' + name + '.log')
    row = {'name': name, 'command': command, 'log': str(log.relative_to(root)), 'started': now()}
    report['steps'].append(row)
    save()
    with log.open('xb') as output:
        result = subprocess.run(command, cwd=root, env=env, stdout=output, stderr=subprocess.STDOUT)
    row.update(exitCode=result.returncode, finished=now())
    save()
    print(name, 'EXIT=' + str(result.returncode), flush=True)
    if result.returncode:
        break
report['runtimeUnchanged'] = stable()
report['finished'] = now()
report['pass'] = len(report['steps']) == len(steps) and all(
    row['exitCode'] == 0 for row in report['steps']) and report['runtimeUnchanged']
save()
raise SystemExit(0 if report['pass'] else 1)
