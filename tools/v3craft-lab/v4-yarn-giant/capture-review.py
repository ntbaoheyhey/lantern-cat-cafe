"""Run existing recorders sequentially after regression; retain failures."""
from pathlib import Path
from datetime import datetime, timezone
import json
import subprocess
import time

root = Path(__file__).resolve().parents[3]
lab = 'tools/v3craft-lab/v4-yarn-giant'
out = root / 'reports/v4-art/REVIEW/A7/yarn-giant'
validation = out / 'validation.json'
while not validation.exists() or 'finished' not in json.loads(validation.read_text()):
    time.sleep(1)
assert json.loads(validation.read_text())['pass'], 'Regression failed; retain evidence before filming'
assert json.loads(validation.read_text())['sourceCommit']==subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'Validate the current checkpoint before filming'
python = str(root / 'tools/.venv/bin/python')
steps = [
    ('capture', ['node', 'scripts/v3feel/capture.mjs', '--item', 'V4-A7-YARN', '--seconds', '30', '--video-seconds', '30', '--frame-marker']),
    ('markers', [python, lab + '/verify-markers.py']),
    ('film-review', [python, lab + '/review-films.py']),
    ('900-all', [python, lab + '/finish-layout.py']),
    ('900-review', [python, lab + '/review-900.py']),
    ('blind-prepare', [python, lab + '/blind-read.py', 'prepare'])]
report = {'started': datetime.now(timezone.utc).isoformat(), 'steps': []}
for name, command in steps:
    log = root / 'reports/v4-art/jobs' / ('a7-yarn-' + name + '.log')
    with log.open('wb') as stream:
        result = subprocess.run(command, cwd=root, stdout=stream, stderr=subprocess.STDOUT)
    report['steps'].append({'name': name, 'exitCode': result.returncode, 'log': str(log)})
    (out / 'capture-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
    print(name.upper() + '_EXIT=' + str(result.returncode), flush=True)
    if result.returncode:
        raise SystemExit(result.returncode)
report['finished'] = datetime.now(timezone.utc).isoformat()
(out / 'capture-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
