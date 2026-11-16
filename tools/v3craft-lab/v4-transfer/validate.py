"""Detached validation with compact receipts; detailed logs stay local."""
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
root = Path(__file__).resolve().parents[3]
out = root / 'reports/v4-art/REVIEW/A10/transfer'
stages = [
    ('web', ['pnpm', '--filter', '@taskbar-hero/web', 'test']),
    ('typecheck', ['pnpm', '--filter', '@taskbar-hero/web', 'typecheck']),
    ('parity', ['node', 'scripts/v3feel/parity.mjs', 'check']),
    ('network', ['node', 'tools/v3craft-lab/v4-transfer/network.mjs']),
    ('capture', ['node', 'scripts/v3feel/capture.mjs', '--item', 'V4-A10-TRANSFER', '--seconds', '30', '--video-seconds', '30', '--frame-marker']),
]
report = {'at': datetime.now(timezone.utc).isoformat(), 'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(), 'stages': []}
for name, command in stages:
    log = root / f'reports/v4-art/jobs/a10-{name}-final.log'
    with log.open('w') as stream:
        result = subprocess.run(command, cwd=root, stdout=stream, stderr=subprocess.STDOUT)
    report['stages'].append({'name': name, 'exit': result.returncode, 'log': str(log.relative_to(root))})
    (out / 'regression.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'{name.upper()}_EXIT={result.returncode}', flush=True)
    if result.returncode:
        break
print('VALIDATION_DONE', flush=True)
