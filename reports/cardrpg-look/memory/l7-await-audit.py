"""Observe the original coordinator, then audit existing data. Never measure."""
import json
import os
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parents[3]
out = root / 'reports/cardrpg-look/validation/l7'
start = json.loads((out / 'final-measure-start.json').read_text())
last = None
while not (out / 'final-measure-complete.json').exists():
    try:
        os.kill(start['pid'], 0)
    except ProcessLookupError:
        raise SystemExit('Original coordinator exited without completion; inspect retained log. No retry launched.')
    summary = json.loads((out / 'matrix/summary.json').read_text())
    completed = summary['completed']
    if completed != last:
        print(json.dumps({'at': datetime.now(timezone.utc).isoformat(), 'matrix': completed, 'total': 860}), flush=True)
        last = completed
    time.sleep(5)

assert json.loads((out / 'final-measure-complete.json').read_text())['artifact'] == start['artifact']
for command in [
    ['node', 'tools/cardrpg-look/l7-audit.mjs'],
    ['python3', 'reports/cardrpg-look/memory/l7-interval-audit.py'],
]:
    print('Running existing-data audit: ' + ' '.join(command), flush=True)
    subprocess.run(command, cwd=root, check=True)

size_path = out / 'size-justification.json'
size = json.loads(size_path.read_text())
assert size['artifact'] == start['artifact']
size['limitations'] = [line for line in size['limitations'] if line != 'L7 performance measurements have not started.']
size['limitations'].append('L7 measurements completed once; measured misses remain in audit.json and matrix-interval-audit.json. Cross-lane timing isolation is unverified; see timing-context.json.')
size_path.write_text(json.dumps(size, indent=2) + '\n')
subprocess.run(['python3', 'reports/cardrpg-look/memory/l7-write-report.py'], cwd=root, check=True)
print('Audits and report generated. Inspect prose and publication manifest before publishing.', flush=True)
