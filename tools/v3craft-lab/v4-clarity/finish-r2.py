"""Source-bound A9R2 observations and existing-recorder pipeline after regression."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import os
import subprocess
import time

root = Path(__file__).resolve().parents[3]
lab = root / 'tools/v3craft-lab/v4-clarity'
out = root / 'reports/v4-art/REVIEW/A9/r2'
env = dict(os.environ, ART_A9_REVIEW=str(out.relative_to(root)), ART_A9_ATTEMPT='r2')
validation_path = out / 'validation.json'
while True:
    if validation_path.exists():
        try:
            validation = json.loads(validation_path.read_text())
            if 'finished' in validation:
                break
        except json.JSONDecodeError:
            pass
    time.sleep(1)
assert validation['pass'], 'Keep failed regression; do not film'
for path, expected in validation['runtimeSourceHashes'].items():
    assert hashlib.sha256((root / path).read_bytes()).hexdigest() == expected, path
(out / 'source-hashes.json').write_text(json.dumps(validation['runtimeSourceHashes'], indent=2) + '\n')
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
paths = subprocess.check_output(['git', 'diff', '--name-only', '797a3cefe', head], cwd=root, text=True).splitlines()
allowed = ['reports/v4-art/', 'tools/v3craft-lab/', 'apps/web/src/game/cardrpg/battle-v3/', 'apps/web/src/game/cardrpg/stage/', 'apps/web/src/game/cardrpg/vfx-craft/']
unexpected = [p for p in paths if not any(p.startswith(a) for a in allowed) or '/audio/' in p]
(out / 'lane-audit.json').write_text(json.dumps({'base': '797a3cefe', 'through': head, 'paths': paths, 'unexpected': unexpected, 'pass': not unexpected}, indent=2) + '\n')
assert not unexpected, 'ART lane violation'
python = str(root / 'tools/.venv/bin/python')
steps = [
    ('needle-live', ['node', str(lab / 'live-probe.mjs'), 'r2'], dict(env, ART_A9_ASSETS='needle-moth')),
    ('front-face', ['node', str(lab / 'face-probe.mjs')], env),
    ('capture', [python, str(lab / 'capture-review.py')], env),
    ('film-review', [python, str(lab / 'review-ultimates.py')], env),
    ('layout-review', [python, str(lab / 'review-900.py')], env)]
report = {'started': datetime.now(timezone.utc).isoformat(), 'sourceCommit': head, 'validatedSourceCommit': validation['sourceCommit'], 'steps': []}
for name, command, step_env in steps:
    log = root / 'reports/v4-art/jobs' / ('a9-r2-' + name + '.log')
    with log.open('wb') as stream:
        process = subprocess.Popen(command, cwd=root, env=step_env, stdin=subprocess.DEVNULL, stdout=stream, stderr=subprocess.STDOUT)
        step = {'name': name, 'pid': process.pid, 'log': str(log), 'started': datetime.now(timezone.utc).isoformat()}
        report['steps'].append(step)
        (out / 'pipeline-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
        print(name.upper() + '_PID=' + str(process.pid), flush=True)
        step['exitCode'] = process.wait()
    step['finished'] = datetime.now(timezone.utc).isoformat()
    (out / 'pipeline-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
    print(name.upper() + '_EXIT=' + str(step['exitCode']), flush=True)
    if step['exitCode']:
        raise SystemExit(step['exitCode'])
report['finished'] = datetime.now(timezone.utc).isoformat()
(out / 'pipeline-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
