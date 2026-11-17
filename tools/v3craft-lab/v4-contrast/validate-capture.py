"""Sequential regression and existing film/layout tools; no recorder changes."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, subprocess
root = Path(__file__).resolve().parents[3]
out = root / 'reports/v4-art/REVIEW/A10/contrast'
out.mkdir(parents=True, exist_ok=True)
paths = json.loads((root / 'tools/v3craft-lab/v4-clarity/source-paths.json').read_text())
paths += ['apps/web/src/game/cardrpg/battle-v3/' + p for p in ['battle.css', 'hud-details.css', 'BattleHud.tsx']]
hashes = {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in sorted(set(paths))}
source = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
report = {'started': datetime.now(timezone.utc).isoformat(), 'sourceCommit': source, 'runtimeSourceHashes': hashes, 'steps': []}
(out / 'source-hashes.json').write_text(json.dumps(hashes, indent=2) + '\n')
python = str(root / 'tools/.venv/bin/python')
main = 'reports/v3-feel/REVIEW/V4-A10-CONTRAST-R1'
assert not (root / main).exists(), 'Never overwrite prior film attempts'
steps = [
    ('web', ['pnpm', '--dir', 'apps/web', 'test']),
    ('typecheck', ['pnpm', '--dir', 'apps/web', 'typecheck']),
    ('parity', ['node', 'scripts/v3feel/parity.mjs', 'check']),
    ('capture', ['node', 'scripts/v3feel/capture.mjs', '--item', Path(main).name, '--seconds', '30', '--video-seconds', '30', '--frame-marker']),
    ('markers', [python, 'tools/v3craft-lab/v4-yarn-giant/verify-markers.py', '--capture-root', main, '--out', str(out / 'encoded-markers.json')]),
]
for fixture in ['wave1', 'wave3', 'boss']:
    steps.append(('layout900-' + fixture, ['node', 'scripts/v3a2/battle-capture.mjs', '--fixture', fixture, '--width', '1440', '--height', '900', '--seconds', '30', '--complete-actions', '--out', str(out / 'raw' / (fixture + '-900'))]))
for name, command in steps:
    assert all(hashlib.sha256((root / p).read_bytes()).hexdigest() == h for p, h in hashes.items()), 'Runtime changed during validation'
    log = root / 'reports/v4-art/jobs' / ('a10-contrast-' + name + '-r1.log')
    with log.open('wb') as stream:
        child = subprocess.Popen(command, cwd=root, stdin=subprocess.DEVNULL, stdout=stream, stderr=subprocess.STDOUT)
        step = {'name': name, 'pid': child.pid, 'log': str(log), 'started': datetime.now(timezone.utc).isoformat()}
        report['steps'].append(step)
        (out / 'pipeline-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
        step['exitCode'] = child.wait()
    step['finished'] = datetime.now(timezone.utc).isoformat()
    (out / 'pipeline-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
    print(name + '_exit=' + str(step['exitCode']), flush=True)
    if name == 'parity':
        (out / 'parity.json').write_bytes((root / 'reports/v3-feel/parity-latest.json').read_bytes())
        regression = {**report, 'steps': list(report['steps']), 'pass': all(s['exitCode'] == 0 for s in report['steps'])}
        (out / 'validation.json').write_text(json.dumps(regression, indent=2) + '\n')
    if step['exitCode']:
        raise SystemExit(step['exitCode'])
report['finished'] = datetime.now(timezone.utc).isoformat()
report['pass'] = True
(out / 'pipeline-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
