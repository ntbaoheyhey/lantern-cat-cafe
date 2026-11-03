#!/usr/bin/env python3
"""Run detached from an exact gallery checkout; preserve each result separately."""
import argparse
import datetime
import json
import os
from pathlib import Path
import subprocess
import sys

p = argparse.ArgumentParser()
p.add_argument('--pass-name', required=True)
p.add_argument('--port', type=int, required=True)
a = p.parse_args()
root = Path.cwd()
ledger = Path(__file__).resolve().parent
out = root / 'reports/ui/logs' / a.pass_name
out.mkdir(parents=True, exist_ok=True)
assert not (out / 'gallery-receipt.json').exists(), 'Preserve earlier results'
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
checks = []

def run(label, command, cwd=root, env=None):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    print('START', label, flush=True)
    with (out / (label + '.log')).open('w') as log:
        result = subprocess.run(command, cwd=cwd, env=env, stdout=log, stderr=subprocess.STDOUT)
        log.write('\nexit=' + str(result.returncode) + '\n')
    checks.append({'label': label, 'command': command, 'exit': result.returncode, 'started': started})
    (out / 'gallery-receipt.json').write_text(json.dumps({'head': head, 'cwd': str(root), 'pid': os.getpid(), 'checks': checks}, indent=2) + '\n')
    print('END', label, 'exit=' + str(result.returncode), flush=True)
    if result.returncode:
        sys.exit(result.returncode)

run('product-gate', ['python3', str(ledger / 'run-card-gate.py'), '--pass-name', a.pass_name,
                    '--port', str(a.port), '--specs', 'e2e/ui/art2-flag-off.spec.ts', 'e2e/ui/merged-redesign.spec.ts'])
run('generate', ['python3', 'reports/ui/build-gallery.py'])
run('generated-clean', ['git', 'diff', '--exit-code', '--', 'reports/ui/gallery.html', 'docs/ui/demo/index.html',
                        'reports/ui/cards/index.html', 'reports/ui/FINAL-REPORT.md', 'reports/ui/gallery-manifest.json'])
for size in ['1280x720', '1600x900']:
    env = dict(os.environ, E2E_VIEWPORT=size, GALLERY_SCREENSHOTS=str(root / 'screenshots/ui' / a.pass_name),
               UI_AXE_SOURCE='/private/tmp/taskbar-hero-ui-axe-4.10.3.min.js')
    run('standalone-' + size, ['npx', '-y', 'pnpm@10.28.0', 'exec', 'playwright', 'test', '--config',
                             str(root / 'reports/ui/gallery.config.mjs'), '--repeat-each=3', '--retries=0', '--reporter=line'],
        root / 'apps/web', env)
print('Gallery commands PASS; exact-head scope, diff and native visual review remain required.', flush=True)
