#!/usr/bin/env python3
"""Serial, local-only UI gate. Run detached; each command has its own log/receipt."""
import argparse
import datetime
import json
import os
from pathlib import Path
import socket
import subprocess
import sys

p = argparse.ArgumentParser()
p.add_argument('--pass-name', required=True)
p.add_argument('--port', type=int, required=True)
p.add_argument('--full', action='store_true')
p.add_argument('--release', action='store_true', help='Lock/fresh-main subset: typecheck, lint, build, changed specs at both sizes.')
p.add_argument('--specs', nargs='+', default=['e2e/ui/cxu3-forge.spec.ts', 'e2e/ui/cxu3-market.spec.ts', 'e2e/layout/character-bag.spec.ts', 'e2e/ui/merged-redesign.spec.ts'])
a = p.parse_args()
root = Path.cwd()
out = root / 'reports/ui/logs' / a.pass_name
if (out / 'receipt.json').exists():
    p.error('Pass name already has evidence; choose a fresh name to preserve earlier logs')
out.mkdir(parents=True, exist_ok=True)
env = dict(os.environ)
env.update({name: str(a.port + i) for i, name in enumerate(['E2E_PORT_CLASSIC', 'E2E_PORT_V2', 'E2E_PORT_SERVER', 'E2E_PORT_API'])})
env['CXU3_SCREENSHOTS'] = str(root / 'screenshots/ui' / a.pass_name)
env['CXR2_SCREENSHOTS'] = env['CXU3_SCREENSHOTS']
env['ART2_SCREENSHOTS'] = env['CXU3_SCREENSHOTS']
env['ORIGINAL_SCREENSHOTS'] = env['CXU3_SCREENSHOTS']
env['MOTION_SCREENSHOTS'] = env['CXU3_SCREENSHOTS']
env['PREVIEWS_SCREENSHOTS'] = str(Path(env['CXU3_SCREENSHOTS']) / 'feature-samples')
env['FIRSTPLAY_SCREENSHOTS'] = env['CXU3_SCREENSHOTS']
env['NODE_OPTIONS'] = env.get('NODE_OPTIONS', '') + ' --import=/Users/bao/taskbar-hero-ui-ledger/reports/ui/ports-aux-loader.mjs'
pnpm = ['npx', '-y', 'pnpm@10.28.0']
receipt = {'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(), 'pass': a.pass_name, 'pid': os.getpid(), 'cwd': str(root), 'ports': list(range(a.port, a.port + 5)), 'checks': []}

def run(label, command, cwd=root, ports=False):
    if ports:
        for port in receipt['ports']:
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', port))
    log = out / (label + '.log')
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    print('START', label, flush=True)
    with log.open('w') as output:
        result = subprocess.run(command, cwd=cwd, env=env, stdout=output, stderr=subprocess.STDOUT)
        output.write('\nexit=' + str(result.returncode) + '\n')
    receipt['checks'].append({'label': label, 'command': command, 'started': started, 'exit': result.returncode, 'log': str(log.relative_to(root))})
    (out / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print('END', label, 'exit=' + str(result.returncode), flush=True)
    if result.returncode:
        sys.exit(result.returncode)

if not a.release:
    run('scripts', ['node', '--test', *map(str, sorted(Path('scripts').glob('*.test.mjs')))])
    run('packages', pnpm + ['--filter', '!@taskbar-hero/web', '-r', '--workspace-concurrency=1', 'test'])
    run('web-units', pnpm + ['exec', 'vitest', 'run', '--maxWorkers=2'], root / 'apps/web')
run('docs-links', ['node', 'scripts/check-links.mjs', 'docs/submission.md', 'docs/security-overview.md', 'docs/video-script.md', 'docs/release-status.md', 'docs/judge-walkthrough.md', 'docs/pitch-slides.md', 'docs/submission/pitch-3-minute.md', 'docs/submission/shot-list-90-second.md', 'docs/submission/avalanche-proof.md', 'docs/submission/judge-faq.md'])
run('typecheck', pnpm + ['typecheck'])
run('lint', pnpm + ['lint'])
if not a.release:
    run('art-delivery', ['python3', '-B', '-m', 'unittest', 'discover', '-s', 'tools/art', '-v'])
    run('art-catalog', ['python3', 'tools/art/catalog.py', '--check'])
run('build', pnpm + ['build'])
for size in ['1280x720', '1600x900']:
    env['E2E_VIEWPORT'] = size
    run('changed-' + size, pnpm + ['exec', 'playwright', 'test', *a.specs, '--repeat-each=' + ('1' if a.release else '3'), '--workers=2', '--retries=0', '--reporter=line'], root / 'apps/web', True)
if a.full:
    for size in ['1280x720', '1600x900']:
        env['E2E_VIEWPORT'] = size
        run('full-' + size, pnpm + ['exec', 'playwright', 'test', '--workers=2', '--retries=0', '--reporter=line'], root / 'apps/web', True)
if not a.release:
    for size in ['1280x720', '1600x900']:
        env['E2E_VIEWPORT'] = size
        run('resize-five-' + size, pnpm + ['exec', 'playwright', 'test', 'e2e/layout/resize-burst.spec.ts', '--repeat-each=5', '--workers=2', '--retries=0', '--reporter=line'], root / 'apps/web', True)
print('GATE COMMANDS PASS; human diff/visual review and scope checks still required.', flush=True)

if not a.release:
    env['UI_AUDIT_PORT'] = str(a.port + 4)
    env['SCREENSHOTS'] = '1'
    run('strict-ui-audit', ['node', '--import', '/Users/bao/taskbar-hero-ui/reports/ui/ports-loader.mjs', 'tools/ui-audit.mjs', str(root / 'screenshots/ui' / (a.pass_name + '-audit')), 'bossReadyStrong', '--strict'], root / 'apps/web')
    mode = 'all' if (root / 'apps/web/src/runes/FeatureSamples.tsx').exists() else 'motion'
    run('axe-wcag-aa', ['node', '/Users/bao/taskbar-hero-ui-ledger/reports/ui/single2-axe.mjs', str(root), 'dist-v2/e2e-' + str(a.port + 1), str(a.port + 4), str(out / 'axe'), mode])
