"""Run the preregistered pair only after an explicit CXI 6301/timing lease."""
from pathlib import Path
import argparse
import datetime
import json
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--build', required=True)
parser.add_argument('--out', required=True)
parser.add_argument('--report', required=True)
args = parser.parse_args()
out, report = Path(args.out).resolve(), Path(args.report).resolve()
assert out.is_relative_to(ROOT / 'work/v5/CXV') and not out.exists()
assert report.is_relative_to(ROOT / 'reports/v5/CXV') and not report.exists()
out.mkdir(parents=True)


def stop_check():
    for name in ('STOP-ALL', 'STOP-CXV'):
        assert not Path('/Users/bao/taskbar-hero-mailbox', name).exists(), name


def run(name, command, env):
    stop_check()
    with (out / (name + '.log')).open('w') as log:
        result = subprocess.run(command, cwd=ROOT, env=env, stdin=subprocess.DEVNULL,
                                stdout=log, stderr=subprocess.STDOUT)
    print(json.dumps(dict(stage=name, exit=result.returncode,
                          utc=datetime.datetime.now(datetime.timezone.utc).isoformat())), flush=True)
    assert result.returncode == 0, name


analyses = []
for dy in (0, 5):
    env = os.environ.copy()
    env.update(CXV_LABEL_TARGET_DY=str(dy), CXV_LABEL_FRAMES='0,17,43,68,113,147,204,236,289')
    env.pop('CXV_LABEL_PILOT', None)
    folder = out / ('dy' + str(dy))
    run('capture-dy' + str(dy), [sys.executable, 'tools/v5vfx/run-media-natural.py', '--cat', 'both',
                               '--capture', 'labels', '--build', args.build, '--out', str(folder)], env)
    analysis = folder / 'analysis.json'
    run('measure-dy' + str(dy), [sys.executable, 'tools/v5vfx/measure-dual-media-labels.py', str(folder), str(analysis)], env)
    analyses.append(str(analysis))
run('compare', [sys.executable, 'tools/v5vfx/compare-label-target-pair.py', *analyses, str(report)], os.environ.copy())
print(json.dumps(dict(report=str(report), complete=True)), flush=True)
