"""A9 orchestration using existing recorders; no recorder changes."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parents[3]
out = root / 'reports/v4-art/REVIEW/A9'
validation = json.loads((out / 'validation.json').read_text())
assert validation['pass'], 'Full regression must pass'
for path, expected in validation['runtimeSourceHashes'].items():
    assert hashlib.sha256((root / path).read_bytes()).hexdigest() == expected, path
assert json.loads((out / 'front-face-probe-r3.json').read_text())['pass'], 'Retain face failure before filming'
python = str(root / 'tools/.venv/bin/python')
main = 'reports/v3-feel/REVIEW/V4-A9-CLARITY'
tail = 'reports/v3-feel/REVIEW/V4-A9-TAIL45'
assert not (root / main).exists() and not (root / tail).exists(), 'Use a new attempt name; never overwrite evidence'
steps = [
    ('capture-main', ['node', 'scripts/v3feel/capture.mjs', '--item', 'V4-A9-CLARITY', '--seconds', '30', '--video-seconds', '30', '--frame-marker']),
    ('markers-main', [python, 'tools/v3craft-lab/v4-yarn-giant/verify-markers.py', '--capture-root', main, '--out', str(out / 'encoded-markers.json')]),
    ('capture-tail-wave1', ['node', 'scripts/v3feel/capture.mjs', '--item', 'V4-A9-TAIL45', '--fixture', 'wave1', '--seconds', '45', '--video-seconds', '45', '--frame-marker']),
    ('capture-tail-boss', ['node', 'scripts/v3feel/capture.mjs', '--item', 'V4-A9-TAIL45', '--fixture', 'boss', '--seconds', '45', '--video-seconds', '45', '--frame-marker']),
    ('markers-tail', [python, 'tools/v3craft-lab/v4-yarn-giant/verify-markers.py', '--capture-root', tail, '--out', str(out / 'encoded-markers-tail.json'), '--fixtures', 'wave1', 'boss'])]
for fixture in ['wave1', 'wave3', 'boss']:
    steps.append(('layout900-' + fixture, ['node', 'scripts/v3a2/battle-capture.mjs', '--fixture', fixture, '--width', '1440', '--height', '900', '--seconds', '30', '--complete-actions', '--out', str(out / 'raw' / (fixture + '-900'))]))
report = {'started': datetime.now(timezone.utc).isoformat(), 'validatedSourceCommit': validation['sourceCommit'], 'runtimeSourceHashes': validation['runtimeSourceHashes'], 'steps': []}
for name, command in steps:
    log = root / 'reports/v4-art/jobs' / ('a9-' + name + '-r1.log')
    with log.open('wb') as stream:
        result = subprocess.run(command, cwd=root, stdout=stream, stderr=subprocess.STDOUT)
    report['steps'].append({'name': name, 'exitCode': result.returncode, 'log': str(log)})
    (out / 'capture-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
    print(name.upper() + '_EXIT=' + str(result.returncode), flush=True)
    if result.returncode:
        raise SystemExit(result.returncode)
report['finished'] = datetime.now(timezone.utc).isoformat()
(out / 'capture-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
