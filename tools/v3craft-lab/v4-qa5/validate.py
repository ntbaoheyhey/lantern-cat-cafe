"""Check ART presentation tests against immutable ART and pending SHIP rules."""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import json
import os
import re
import subprocess

ROOT = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('--attempt', required=True)
parser.add_argument('--rules-sha', required=True)
parser.add_argument('--full', action='store_true')
parser.add_argument('--reuse-passed', help='Prior attempt with unchanged test inputs and no runtime changes')
args = parser.parse_args()
assert re.fullmatch(r'r[1-9][0-9]*', args.attempt)
git = lambda *a: subprocess.check_output(['git', *a], cwd=ROOT, text=True).strip()
rules_sha = git('rev-parse', args.rules_sha + '^{commit}')
lab = Path(__file__).resolve().parent
raw = lab / 'raw' / args.attempt
raw.mkdir(parents=True, exist_ok=False)
report_path = ROOT / 'reports/v4-art/REVIEW/QA-5' / (args.attempt + '.json')
assert not report_path.exists()
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
now = lambda: datetime.now(timezone.utc).isoformat()
test_paths = ['apps/web/src/game/cardrpg/spine/' + n + '.test.ts' for n in ['cat-presentation', 'outcome-labels']]
report = {'started': now(), 'pid': os.getpid(), 'sourceCommit': git('rev-parse', 'HEAD'),
          'rulesCommit': rules_sha, 'testHashes': {p: sha(ROOT / p) for p in test_paths},
          'steps': [], 'complete': False, 'pass': False}
save = lambda: report_path.write_text(json.dumps(report, indent=2) + '\n')
prior = None
if args.reuse_passed:
    assert re.fullmatch(r'r[1-9][0-9]*', args.reuse_passed)
    prior_path = report_path.with_name(args.reuse_passed + '.json')
    prior = json.loads(prior_path.read_text())
    assert prior['complete'] and prior['testHashes'] == report['testHashes'] and prior['rulesCommit'] == rules_sha
    changed = git('diff', '--name-only', prior['sourceCommit']).splitlines()
    assert all(p in test_paths or p.startswith(('reports/', 'tools/v3craft-lab/')) for p in changed), 'Runtime changed since passing checks'
    report['reusedEvidence'] = {'path': str(prior_path.relative_to(ROOT)), 'sha256': sha(prior_path), 'changedPaths': changed}
save()

def step(name, command, cwd=ROOT):
    passed = next((s for s in prior['steps'] if s['name'] == name and s.get('exitCode') == 0), None) if prior else None
    if passed:
        report['steps'].append({**passed, 'reusedFrom': args.reuse_passed})
        save()
        print(name, 'reused PASS', flush=True)
        return
    log = ROOT / 'reports/v4-art/jobs' / ('qa5-' + args.attempt + '-' + name + '.log')
    row = {'name': name, 'command': command, 'log': str(log.relative_to(ROOT)), 'started': now()}
    report['steps'].append(row)
    save()
    with log.open('xb') as out:
        child = subprocess.Popen(command, cwd=cwd, stdin=subprocess.DEVNULL, stdout=out, stderr=subprocess.STDOUT)
        row['pid'] = child.pid
        save()
        row['exitCode'] = child.wait()
    row['finished'] = now()
    text = re.sub(r'\x1b\[[0-9;]*m', '', log.read_text(errors='replace'))
    row['summary'] = [line.strip() for line in text.splitlines() if re.match(r'\s*(Test Files|Tests|Duration|FAIL |AssertionError)', line)]
    save()
    print(name, row['exitCode'], '; '.join(row['summary'])[:500], flush=True)
    assert row['exitCode'] == 0, name + ' failed; retained log: ' + row['log']

try:
    archive = raw / 'rules.tar'
    with archive.open('wb') as out:
        subprocess.run(['git', 'archive', rules_sha, 'packages/game-rules', 'tsconfig.base.json'], cwd=ROOT, stdout=out, check=True)
    subprocess.run(['tar', '-xf', str(archive), '-C', str(raw)], check=True)
    snapshot = raw / 'packages/game-rules'
    (snapshot / 'node_modules').symlink_to(ROOT / 'packages/game-rules/node_modules', target_is_directory=True)
    config = raw / 'ship.config.mts'
    config.write_text('import base from ' + json.dumps(str(ROOT / 'apps/web/vite.config.ts')) + ';\n'
        'export default {...base, resolve: {...base.resolve, alias: ['
        '{find: /^@taskbar-hero\\/game-rules$/, replacement: ' + json.dumps(str(snapshot / 'src/index.ts')) + '},'
        '{find: "@taskbar-hero/game-rules/cardrpg", replacement: ' + json.dumps(str(snapshot / 'src/cardrpg/index.ts')) + '},'
        '{find: /^@taskbar-hero\\/game-rules\\/(.*)$/, replacement: ' + json.dumps(str(snapshot) + '/$1') + '}'
        ']}};\n')
    base = ['pnpm', 'exec', 'vitest', 'run', '--reporter=dot']
    focused = [p.removeprefix('apps/web/') for p in test_paths]
    step('art-focused', base + focused, ROOT / 'apps/web')
    step('ship-focused', base + ['--config', str(config)] + focused, ROOT / 'apps/web')
    if args.full:
        step('art-web', base, ROOT / 'apps/web')
        # SHIP's economy and shell must land together. A mixed ART-shell/SHIP-rules
        # full suite is not an integrated SHIP build; only the owned routing tests
        # are meaningful against the isolated pending rules snapshot.
        step('art-typecheck', ['pnpm', '--filter', '@taskbar-hero/web', 'typecheck'])
        baseline = ROOT / 'reports/v3-feel/parity-new.json'
        baseline_hash = sha(baseline)
        before = set((ROOT / 'reports/v3-feel').glob('parity-probe-*.json'))
        step('art-parity', ['node', 'scripts/v3feel/parity.mjs', 'probe'])
        added = set((ROOT / 'reports/v3-feel').glob('parity-probe-*.json')) - before
        assert len(added) == 1 and sha(baseline) == baseline_hash
        probe_path = added.pop()
        probe = json.loads(probe_path.read_text())
        report['parityEvidence'] = str(probe_path.relative_to(ROOT))
        report['parityBaselineUnchanged'] = True
        expected = {r['fixture']: r['hash'] for r in json.loads(baseline.read_text())['rows']}
        report['parityPass'] = len(probe['rows']) == 3 and all(r['parity'] and not r['errors'] and r['hash'] == expected[r['fixture']] for r in probe['rows'])
        assert report['parityPass']
    assert all(sha(ROOT / p) == h for p, h in report['testHashes'].items())
    report['pass'] = True
except Exception as error:
    report['error'] = str(error)
finally:
    report.update(complete=True, finished=now())
    save()
    print('QA5', 'PASS' if report['pass'] else 'FAIL', str(report_path.relative_to(ROOT)), flush=True)
raise SystemExit(0 if report['pass'] else 1)
