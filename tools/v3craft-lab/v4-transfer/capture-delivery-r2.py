"""Run existing film and layout recorders against the validated delivery runtime."""
from pathlib import Path
from datetime import datetime, timezone
from PIL import Image
import hashlib
import json
import os
import subprocess

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A11/delivery-r1'
PRIOR = ROOT / 'reports/v4-art/REVIEW/A10/scene-ready-transfer'
ITEM = 'V4-A11-DELIVERY-R1'
CAPTURE = ROOT / 'reports/v3-feel/REVIEW' / ITEM
REPORT = OUT / 'capture-jobs.json'
assert not CAPTURE.exists() and not REPORT.exists(), 'Never overwrite prior evidence'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
now = lambda: datetime.now(timezone.utc).isoformat()
gates = {name: json.loads((PRIOR / name).read_text()) for name in (
    'validation-pma-r2.json', 'validation-pma-r2-regression.json',
    'parity-pma-r2.json', 'lane-audit-pma-r2.json')}
assert all(gate['pass'] for gate in gates.values()), 'Pre-film gates remain open'
runtime = gates['validation-pma-r2.json']['runtimeHashes']
assert runtime == gates['validation-pma-r2-regression.json']['runtimeHashes']
assert runtime == gates['parity-pma-r2.json']['runtimeHashes']
assert all(sha(ROOT / path) == expected for path, expected in runtime.items())
paths = set(json.loads((ROOT / 'tools/v3craft-lab/v4-clarity/source-paths.json').read_text()))
paths.update(runtime)
paths.update('apps/web/src/game/cardrpg/battle-v3/' + name
             for name in ('BattleHud.tsx', 'battle.css', 'hud-details.css'))
for group in ('units', 'vfx'):
    paths.update(str(path.relative_to(ROOT)) for path in
                 (ROOT / 'apps/web/public' / group / 'sampled-delivery').glob('*.avif'))
hashes = {path: sha(ROOT / path) for path in sorted(paths)}
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'source-hashes.json').write_text(json.dumps(hashes, indent=2) + '\n')
report = {'started': now(), 'pid': os.getpid(), 'sourceCommit': subprocess.check_output(
    ['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), 'scriptSha256': sha(Path(__file__)),
    'runtimeSourceHashes': hashes, 'gateReceiptHashes': {name: sha(PRIOR / name) for name in gates},
    'scope': 'Development fixtures; not integrated production transfer acceptance.',
    'steps': [], 'complete': False, 'pass': False}
python = str(ROOT / 'tools/.venv/bin/python')
steps = [
    ('capture', ['node', 'scripts/v3feel/capture.mjs', '--item', ITEM,
                 '--seconds', '30', '--video-seconds', '30', '--frame-marker']),
    ('markers', [python, 'tools/v3craft-lab/v4-yarn-giant/verify-markers.py',
                 '--capture-root', str(CAPTURE), '--out', str(OUT / 'encoded-markers.json')]),
    ('layout900', ['node', 'scripts/v3a2/battle-capture.mjs', '--width', '1440', '--height', '900',
                   '--seconds', '30', '--complete-actions', '--out', str(OUT / 'raw/layout900')]),
    ('layout-review', [python, 'tools/v3craft-lab/v4-transfer/review-900.py',
                      '--root', str(OUT), '--subdir', 'layout900']),
    ('action-sheets', [python, 'scripts/v3feel/review-sheets.py', ITEM]),
]
for name, command in steps:
    assert all(sha(ROOT / path) == expected for path, expected in hashes.items()), 'Runtime changed'
    log = ROOT / 'reports/v4-art/jobs' / ('a11-delivery-r1-' + name + '.log')
    row = {'name': name, 'command': command, 'started': now(), 'log': str(log), 'exitCode': None}
    report['steps'].append(row)
    REPORT.write_text(json.dumps(report, indent=2) + '\n')
    with log.open('xb') as stream:
        result = subprocess.run(command, cwd=ROOT, stdin=subprocess.DEVNULL,
                                stdout=stream, stderr=subprocess.STDOUT)
    row.update(exitCode=result.returncode, finished=now())
    REPORT.write_text(json.dumps(report, indent=2) + '\n')
    print(name, 'exitCode', result.returncode, flush=True)
    if result.returncode:
        raise SystemExit(result.returncode)
reviews = []
for fixture in ('wave1', 'wave3', 'boss'):
    for action in json.loads((CAPTURE / fixture / 'actions.json').read_text()):
        original = ROOT / action['sheet']
        target = OUT / 'raw/review-1024' / fixture / original.name
        target.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(original) as image:
            image.resize((1024, round(image.height * 1024 / image.width)), Image.Resampling.LANCZOS).save(target, quality=90)
        reviews.append(dict(fixture=fixture, **action, originalSheet=action['sheet'],
                            reviewPath=str(target.relative_to(ROOT)), sha256=sha(target), reviewed=False))
(OUT / 'film-review.json').write_text(json.dumps({'created': now(), 'scope': 'All recorded action windows at 10fps plus impact samples; truncated windows remain explicit.',
                                                'sheets': reviews, 'reviewComplete': False}, indent=2) + '\n')
report.update(complete=True, finished=now(), runtimeUnchanged=all(
    sha(ROOT / path) == expected for path, expected in hashes.items()), reviewSheets=len(reviews))
report['pass'] = report['runtimeUnchanged'] and all(row['exitCode'] == 0 for row in report['steps'])
REPORT.write_text(json.dumps(report, indent=2) + '\n')
print('capture pipeline complete', report['pass'], 'unreviewed sheets', len(reviews), flush=True)
