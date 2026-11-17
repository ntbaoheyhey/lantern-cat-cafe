#!/usr/bin/env python3
"""Commit only QA-owned evidence; push only the explicitly authorized branch."""
from pathlib import Path
import datetime, subprocess, sys, time

ROOT = Path('/Users/bao/taskbar-hero-qa')
BRANCH = 'codex/v4-qa-2026-11-17'
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()

assert git('branch', '--show-current') == BRANCH, 'Wrong branch'
paths = git('diff', '--name-only', 'HEAD').splitlines()
paths += git('ls-files', '--others', '--exclude-standard').splitlines()
assert all(p.startswith(('reports/v4-qa/', 'tools/v4qa/')) for p in paths), 'Non-QA changes require investigation; never stage them'
total = sum(p.stat().st_size for p in (ROOT/'reports/v4-qa').rglob('*') if p.is_file())
assert total < 25_000_000, 'QA report budget exceeded'
subprocess.run(['git', 'add', '--', 'reports/v4-qa', 'tools/v4qa'], cwd=ROOT, check=True)
if git('diff', '--cached', '--name-only'):
    subprocess.run(['git', 'commit', '-m', ' '.join(sys.argv[1:]) or 'wip: QA checkpoint'], cwd=ROOT, check=True)
for attempt, delay in enumerate([0, 10, 20, 40, 80]):
    if delay: time.sleep(delay)
    result = subprocess.run(['git', 'push', 'origin', f'HEAD:refs/heads/{BRANCH}'], cwd=ROOT, capture_output=True, text=True)
    if result.returncode == 0: break
    print(f'push attempt {attempt+1} failed; exit={result.returncode}', flush=True)
else: raise SystemExit('Push retries exhausted; inspect transport safely')
sha = git('rev-parse', 'HEAD')
remote = git('ls-remote', '--heads', 'origin', f'refs/heads/{BRANCH}').split()[0]
assert sha == remote, 'Remote SHA mismatch'
stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
(ROOT/'work/v4qa/last-push.txt').write_text(f'{stamp} {sha}\n')
print(f'PUSHED {sha}; report bytes={total}', flush=True)
