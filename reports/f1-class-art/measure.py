"""Reproduce paired 5-sample G1 runs; restore F1 sources even on failure."""
import json
import os
from pathlib import Path
import statistics
import subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'reports/f1-class-art'
BASE = '47f0893'
FILES = [
    'apps/web/src/game/arena/ArenaScene.ts',
    'apps/web/src/game/arena/playBossFight.ts',
    'apps/web/src/game/rig/compose.ts',
    'apps/web/src/game/rig/palettes.ts',
    'apps/web/src/game/rig/parts.ts',
    'apps/web/src/game/stage/StageCanvas.tsx',
    'apps/web/src/game/stage/StageScene.ts',
    'apps/web/src/layout/StageLayout.tsx',
    'apps/web/src/layout/layout.css',
]
saved = {name: (ROOT / name).read_bytes() for name in FILES}
env = dict(os.environ, E2E_PORT_CLASSIC='4273', E2E_PORT_V2='4274')
command = ['npx', '-y', 'pnpm@10.28.0', 'test:e2e', 'ui/g1-perf.spec.ts', '--workers=1', '--repeat-each=5']

def run(phase):
    log = OUT / f'perf-{phase}-5.log'
    with log.open('w') as stream:
        result = subprocess.run(command, cwd=ROOT / 'apps/web', env=env, stdout=stream, stderr=subprocess.STDOUT)
    rows = [json.loads(line.split('G1 metrics ', 1)[1]) for line in log.read_text().splitlines() if 'G1 metrics {' in line]
    print(phase, 'exit', result.returncode, 'samples', len(rows), flush=True)
    return {'exitCode': result.returncode, 'samples': rows}

try:
    for name in FILES:
        (ROOT / name).write_bytes(subprocess.check_output(['git', 'show', f'{BASE}:{name}'], cwd=ROOT))
    before = run('before')
finally:
    for name, data in saved.items():
        (ROOT / name).write_bytes(data)
after = run('after')
summary = {'base': BASE, 'command': ' '.join(command), 'before': before, 'after': after}
summary['medianFeedbackMs'] = {
    phase: {action: {metric: statistics.median(row['feedback'][action][metric] for row in result['samples'])
                     for metric in ['clickToPendingMs', 'nextFrameMs']}
            for action in ['equip', 'craft', 'fight']}
    for phase, result in [('before', before), ('after', after)] if result['samples']
}
(OUT / 'perf-comparison.json').write_text(json.dumps(summary, indent=2) + '\n')
subprocess.run(['git', 'restore', 'reports/g1-speed/metrics.json'], cwd=ROOT, check=True)
print(json.dumps(summary['medianFeedbackMs'], indent=2), flush=True)
assert before['exitCode'] == after['exitCode'] == 0
assert len(before['samples']) == len(after['samples']) == 5
