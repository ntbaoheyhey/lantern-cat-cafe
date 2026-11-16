"""Detached sequential validation; logs stay local and failures remain receipts."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import subprocess
import sys
import re

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A10/scene-ready-transfer'
label = sys.argv[1] if len(sys.argv) > 1 else 'resolution-r1'
phase = sys.argv[2] if len(sys.argv) > 2 else 'all'
assert re.fullmatch('[a-z0-9-]+', label) and phase in ('all', 'preview', 'regression')
REPORT = OUT / ('validation-' + label + '.json')
assert not REPORT.exists()
steps = [
    ('web-tests', ['pnpm', '--filter', '@taskbar-hero/web', 'test', '--reporter=dot']),
    ('typecheck', ['pnpm', '--filter', '@taskbar-hero/web', 'typecheck']),
    ('candidate-browser', ['node', 'tools/v3craft-lab/v4-transfer/resolution-browser.mjs', label + '-candidate']),
    ('fallback-browser', ['node', 'tools/v3craft-lab/v4-transfer/resolution-browser.mjs', label + '-fallback', '--block-sampled']),
]
if phase == 'preview':
    steps[0] = ('focused-tests', ['pnpm', '--filter', '@taskbar-hero/web', 'exec', 'vitest', 'run',
        'src/game/cardrpg/spine/atlas-delivery.test.ts', 'src/game/cardrpg/spine/sampled-atlases.test.ts',
        'src/game/cardrpg/vfx-layered/atlas.test.ts', 'src/game/cardrpg/vfx-layered/player.test.ts',
        'src/game/rig/cutout.test.ts', '--reporter=dot'])
elif phase == 'regression':
    steps = steps[:1]
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
receipt = {'started': now(), 'pid': os.getpid(),
           'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
           'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
           'runtimeHashes': {path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in (
               'apps/web/src/game/cardrpg/spine/assets.ts', 'apps/web/src/game/cardrpg/spine/atlas-delivery.ts',
               'apps/web/src/game/cardrpg/spine/sampled-atlases.json', 'apps/web/src/game/cardrpg/vfx-layered/player.ts',
               'apps/web/src/game/cardrpg/vfx-layered/atlas.ts', 'apps/web/src/game/cardrpg/vfx-layered/sampled-atlases.json',
               'apps/web/src/game/rig/atlas-color.ts', 'apps/web/src/game/rig/cutout.ts')},
           'phase': phase,
           'steps': [], 'complete': False, 'pass': False}
for name, command in steps:
    log = ROOT / 'reports/v4-art/jobs' / ('a10-' + label + '-' + name + '.log')
    assert not log.exists()
    row = {'name': name, 'command': command, 'log': str(log), 'started': now()}
    receipt['steps'].append(row)
    with log.open('w') as output:
        worker = subprocess.Popen(command, cwd=ROOT, stdin=subprocess.DEVNULL, stdout=output, stderr=subprocess.STDOUT)
        row['pid'] = worker.pid
        REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
        code = worker.wait()
    row.update(exitCode=code, finished=now())
    REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
    print(name, 'exitCode=' + str(code), flush=True)
    if code:
        break
receipt.update(complete=len(receipt['steps']) == len(steps),
               passedSteps=sum(row['exitCode'] == 0 for row in receipt['steps']),
               finished=now())
receipt['pass'] = receipt['complete'] and all(row['exitCode'] == 0 for row in receipt['steps'])
REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
print('complete', receipt['complete'], 'pass', receipt['pass'], flush=True)
