"""Bind banner working-tree checks to exact runtime/test sources; preserve failures."""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import json
import os
import re
import subprocess
import traceback

ROOT = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('--attempt', required=True)
args = parser.parse_args()
assert re.fullmatch(r'r[1-9][0-9]*', args.attempt)
OUT = ROOT / ('reports/v4-art/REVIEW/A11/banner-runtime-' + args.attempt)
OUT.mkdir(parents=True, exist_ok=True)
TARGET = OUT / 'validation-preflight.json'
assert not TARGET.exists()
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
now = lambda: datetime.now(timezone.utc).isoformat()
paths = list(json.loads((ROOT / 'reports/v4-art/REVIEW/A11/placement-runtime-r1/source-hashes.json').read_text()))
paths += ['apps/web/src/game/cardrpg/battle-v3/' + n for n in ['banner-layout.ts', 'identified-focus.ts', 'world-label-status.ts']]
runtime = {p: sha(ROOT / p) for p in sorted(set(paths))}
tests = {p: sha(ROOT / p) for p in ['apps/web/src/game/cardrpg/battle-v3/banner-layout.test.ts', 'apps/web/src/game/cardrpg/battle-v3/presentation.test.ts', 'apps/web/src/game/cardrpg/battle-v3/world-label-status.test.ts', 'apps/web/src/game/cardrpg/battle-v3/banner-status-regression.json']}
stable = lambda: all(sha(ROOT / p) == h for p, h in (runtime | tests).items())
report = {'started': now(), 'pid': os.getpid(), 'parentCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
          'scope': 'Working-tree banner implementation preflight; full tests/parity/runtime replay/films pending.',
          'runtimeHashes': runtime, 'testHashes': tests, 'scriptSha256': sha(Path(__file__)), 'steps': [], 'complete': False, 'pass': False, 'fullAcceptance': False}
save = lambda: TARGET.write_text(json.dumps(report, indent=2) + '\n')
save()
try:
    for name, command in [
        ('focused', ['pnpm', '--filter', '@taskbar-hero/web', 'exec', 'vitest', 'run', 'src/game/cardrpg/battle-v3/banner-layout.test.ts', 'src/game/cardrpg/battle-v3/presentation.test.ts', 'src/game/cardrpg/battle-v3/world-label-status.test.ts', '--reporter=dot']),
        ('typecheck', ['pnpm', '--filter', '@taskbar-hero/web', 'typecheck']),
    ]:
        assert stable(), 'Source changed during preflight'
        log = OUT / (name + '.log')
        row = {'name': name, 'command': command, 'log': str(log.relative_to(ROOT)), 'started': now()}
        report['steps'].append(row)
        with log.open('xb') as output:
            child = subprocess.Popen(command, cwd=ROOT, stdin=subprocess.DEVNULL, stdout=output, stderr=subprocess.STDOUT)
            row['pid'] = child.pid
            save()
            row['exitCode'] = child.wait()
        row['finished'] = now()
        report[name] = row
        save()
        assert row['exitCode'] == 0, name + ' failed'
        if name == 'focused':
            text = re.sub(r'\x1b\[[0-9;]*m', '', log.read_text(errors='replace'))
            row['passedTests'] = int(re.search(r'\bTests\s+(\d+) passed', text).group(1))
            row['passedFiles'] = int(re.search(r'Test Files\s+(\d+) passed', text).group(1))
    assert stable(), 'Source changed during preflight'
    report.update(complete=True, runtimeUnchanged=True, pass_=True, finished=now())
    report['pass'] = report.pop('pass_')
    assert not (OUT / 'source-hashes.json').exists()
    (OUT / 'source-hashes.json').write_text(json.dumps(runtime, indent=2) + '\n')
    save()
    print(json.dumps({'pass': True, 'focused': report['focused']['passedTests'], 'runtimeHashes': len(runtime)}), flush=True)
except Exception:
    report.update(complete=True, finished=now(), failure=traceback.format_exc())
    save()
    raise
