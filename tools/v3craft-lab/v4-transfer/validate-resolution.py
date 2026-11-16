"""Detached sequential validation; logs stay local and failures remain receipts."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import subprocess

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A10/scene-ready-transfer'
REPORT = OUT / 'validation-resolution-r1.json'
assert not REPORT.exists()
steps = [
    ('web-tests', ['pnpm', '--filter', '@taskbar-hero/web', 'test', '--reporter=dot']),
    ('typecheck', ['pnpm', '--filter', '@taskbar-hero/web', 'typecheck']),
    ('candidate-browser', ['node', 'tools/v3craft-lab/v4-transfer/resolution-browser.mjs', 'resolution-candidate']),
    ('fallback-browser', ['node', 'tools/v3craft-lab/v4-transfer/resolution-browser.mjs', 'resolution-fallback', '--block-sampled']),
]
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
receipt = {'started': now(), 'pid': os.getpid(),
           'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
           'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
           'runtimeHashes': json.loads((OUT / 'sampled-focused-tests.json').read_text())['sourceHashes'],
           'steps': [], 'complete': False, 'pass': False}
for name, command in steps:
    log = ROOT / 'reports/v4-art/jobs' / ('a10-resolution-' + name + '-r1.log')
    assert not log.exists()
    row = {'name': name, 'command': command, 'log': str(log), 'started': now()}
    receipt['steps'].append(row)
    with log.open('w') as output:
        worker = subprocess.Popen(command, cwd=ROOT, stdin=subprocess.DEVNULL, stdout=output, stderr=subprocess.STDOUT)
        row['pid'] = worker.pid
        REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
        code = worker.wait()
    row.update(exitCode=code, finished=now())
    REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
    print(name, 'exitCode=' + str(code), flush=True)
    if code:
        break
receipt.update(complete=len(receipt['steps']) == len(steps),
               passedSteps=sum(row['exitCode'] == 0 for row in receipt['steps']),
               finished=now())
receipt['pass'] = receipt['complete'] and all(row['exitCode'] == 0 for row in receipt['steps'])
REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
print('complete', receipt['complete'], 'pass', receipt['pass'], flush=True)
