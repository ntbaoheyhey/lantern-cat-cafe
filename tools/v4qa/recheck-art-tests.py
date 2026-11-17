#!/usr/bin/env python3
"""Independently run the two repaired repository tests on a pinned ART checkout."""
from pathlib import Path
import datetime, json, os, re, subprocess, sys, time

qa = Path('/Users/bao/taskbar-hero-qa')
source = Path('/Users/bao/taskbar-hero-qa-clone')
target = sys.argv[1]
assert re.fullmatch(r'[0-9a-f]{40}', target)
out = qa / 'reports/v4-qa/Q2' / f'art-test-recheck-{target[:8]}.json'
log = qa / 'work/v4qa/jobs' / f'art-test-recheck-{target[:8]}.log'
assert not out.exists() and not log.exists(), 'Preserve completed evidence'
def sha():
    return subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source, text=True).strip()
def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()
assert sha() == target, 'Scratch clone must be explicitly pinned before this job'
while os.getloadavg()[0] > 9:
    print(f'DEFER ART test recheck load1={os.getloadavg()[0]:.2f}', flush=True)
    time.sleep(300)
assert not (qa / 'STOP-V4QA').exists(), 'STOP-V4QA'
package = json.loads((source / 'apps/web/package.json').read_text())['name']
tests = ['src/game/cardrpg/spine/cat-presentation.test.ts', 'src/game/cardrpg/spine/outcome-labels.test.ts']
cmd = ['pnpm', '--filter', package, 'exec', 'vitest', 'run', *tests, '--reporter=dot']
evidence = {'started': now(), 'targetSha': target, 'command': cmd, 'log': str(log),
    'scope': 'Independent execution of the exact repaired repository test files; not an ART harness or a full SHIP root-suite pass.'}
out.write_text(json.dumps(evidence, indent=2) + '\n')
env = {k: v for k, v in os.environ.items() if k in ['PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'TMPDIR', 'LANG', 'LC_ALL', 'PNPM_HOME']}
with log.open('x') as stream:
    run = subprocess.run(cmd, cwd=source, env=env, stdout=stream, stderr=subprocess.STDOUT)
text = re.sub(r'\x1b\[[0-9;]*m', '', log.read_text(errors='replace'))
evidence.update({'ended': now(), 'exitCode': run.returncode, 'endingSha': sha(),
    'summary': [line.strip() for line in text.splitlines() if re.search(r'Test Files|Tests\s|Duration|FAIL', line)][:12]})
evidence['status'] = 'PASS' if run.returncode == 0 and evidence['endingSha'] == target else 'FAIL'
out.write_text(json.dumps(evidence, indent=2) + '\n')
print(json.dumps(evidence), flush=True)
