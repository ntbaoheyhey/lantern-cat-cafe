"""Run every browser project using only lane A's two available test ports."""
import argparse
import datetime
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('label')
parser.add_argument('--groups', default='local,server,fallback')
args = parser.parse_args()
if not re.fullmatch(r'[a-zA-Z0-9-]+', args.label):
    raise SystemExit('Invalid evidence label')
groups = args.groups.split(',')
if any(group not in ['local', 'server', 'fallback'] for group in groups):
    raise SystemExit('Unknown browser group')
root = Path(__file__).resolve().parents[2]
folder = root / 'reports/v3-feel/tests'
result_path = folder / (args.label + '-browser.json')
if result_path.exists():
    raise SystemExit('Preserve the prior result; choose a new label')
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
rows = []
for group in groups:
    env = os.environ.copy()
    # The other pair only supplies unused URLs to the shared project config.
    ports = [5991, 5992, 6191, 6192] if group == 'local' else [6190, 6191, 5991, 5992]
    env.update(zip(['E2E_PORT_CLASSIC', 'E2E_PORT_V2', 'E2E_PORT_SERVER', 'E2E_PORT_API'], map(str, ports)))
    env['V3SOLO_E2E_GROUP'] = group
    command = ['pnpm', '--filter', '@taskbar-hero/web', 'exec', 'playwright', 'test',
               '--config', '../../scripts/v3feel/playwright.config.mts']
    if group in ['local', 'fallback']:
        command += ['--grep-invert' if group == 'local' else '--grep',
                    'guidance remains readable with fallback fonts']
    log = folder / (args.label + '-browser-' + group + '.log')
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with log.open('w') as output:
        child = subprocess.Popen(command, cwd=root, env=env, stdout=output, stderr=subprocess.STDOUT)
        print(json.dumps({'group': group, 'pid': child.pid, 'command': command, 'ports': ports}), flush=True)
        code = child.wait()
    raw = log.read_text()
    matches = re.findall(r'(\d+) passed', raw)
    passed = int(matches[-1]) if matches else 0
    expected = {'local': 375, 'server': 52, 'fallback': 8}[group]
    row = {'group': group, 'exitCode': code, 'passed': passed, 'minimumPassed': expected,
           'started': started, 'ended': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'log': str(log.relative_to(root)), 'sha256': hashlib.sha256(log.read_bytes()).hexdigest()}
    rows.append(row)
    result_path.write_text(json.dumps({'sourceCommit': head, 'groups': groups, 'rows': rows}, indent=2) + '\n')
    print(json.dumps(row), flush=True)
    if code or passed < expected:
        raise SystemExit('Browser group failed; inspect the retained log before retrying')
