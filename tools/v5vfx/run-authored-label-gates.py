"""Fresh source-label gates; launch only under an explicit CXI judge/timing lease."""
from pathlib import Path
import argparse
import datetime
import hashlib
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
build_path, out, report_path = map(lambda p: Path(p).resolve(), (args.build, args.out, args.report))
assert out.is_relative_to(ROOT / 'work/v5/CXV') and not out.exists()
assert report_path.is_relative_to(ROOT / 'reports/v5/CXV') and not report_path.exists()
prereg_path = ROOT / 'reports/v5/CXV/M-authored-media-label-native-R1-preregistration.json'
prereg = json.loads(prereg_path.read_text())
build = json.loads(build_path.read_text())
source = subprocess.check_output(['git', 'show', build['sourceCommit'] + ':apps/web/src/game/cardrpg/spine/scene.ts'],
                                 cwd='/Users/bao/taskbar-hero-chain', text=True)
assert prereg['sourceMustContain'] in source, 'This build must contain the reviewed source change'
out.mkdir(parents=True)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
receipt = dict(utc=now(), sourceCommit=build['sourceCommit'], indexSha256=build['indexSha256'],
               url=prereg['judgeUrl'], viewport=prereg['viewport'],
               build=dict(path=str(build_path), sha256=sha(build_path)),
               preregistration=dict(path=str(prereg_path), sha256=sha(prereg_path)),
               runnerSha256=sha(__file__), stages=[], labels=[], productionAcceptance=False, complete=False)


def save():
    report_path.write_text(json.dumps(receipt, indent=2) + '\n')


def run(name, command, env):
    for marker in ('STOP-ALL', 'STOP-CXV'):
        assert not Path('/Users/bao/taskbar-hero-mailbox', marker).exists(), marker
    log_path = out / (name + '.log')
    started = now()
    with log_path.open('w') as log:
        result = subprocess.run(command, cwd=ROOT, env=env, stdin=subprocess.DEVNULL,
                                stdout=log, stderr=subprocess.STDOUT)
    stage = dict(name=name, startedUTC=started, completedUTC=now(), exit=result.returncode,
                 log=dict(path=str(log_path), sha256=sha(log_path)))
    receipt['stages'].append(stage)
    save()
    print(json.dumps(stage), flush=True)
    assert result.returncode == 0, name


try:
    env = os.environ.copy()
    env.update(CXV_LABEL_TARGET_DY='0', CXV_LABEL_STATUS_FIXTURE='none')
    env.pop('CXV_LABEL_PILOT', None)
    for name, frames, status in (
        ('regression-heldouts', prereg['regressionCloverFrames'] + prereg['freshHeldoutCloverFrames'], 'none'),
        ('expanded-status', prereg['expandedStress']['frames'], 'expanded'),
    ):
        env.update(CXV_LABEL_FRAMES=','.join(map(str, frames)), CXV_LABEL_STATUS_FIXTURE=status)
        folder = out / name
        run(name + '-capture', [sys.executable, 'tools/v5vfx/run-media-natural.py', '--cat', 'both',
                               '--capture', 'labels', '--build', str(build_path), '--out', str(folder)], env)
        analysis_path = folder / 'analysis.json'
        run(name + '-measure', [sys.executable, 'tools/v5vfx/measure-dual-media-labels.py', str(folder), str(analysis_path)], env)
        analysis = json.loads(analysis_path.read_text())
        receipt['labels'].append(dict(name=name, syntheticStatusFixture=status != 'none',
            analysis=dict(path=str(analysis_path), sha256=sha(analysis_path)),
            attributionValid=analysis['attributionValid'], zeroPaintOverlap=analysis['zeroPaintOverlap'],
            cases=[dict(mode=c['mode'], sourceFrame=c['sourceFrame'], valid=c.get('valid', False),
                        paintedIntersections=c.get('threshold0Union')) for c in analysis['cases']]))
        save()
    natural = out / 'natural'
    natural_report = report_path.with_name(report_path.stem + '-natural.json')
    assert not natural_report.exists()
    run('natural-capture', [sys.executable, 'tools/v5vfx/run-media-natural.py', '--cat', 'both',
                           '--build', str(build_path), '--out', str(natural)], env)
    run('natural-rules', ['node', 'tools/v5vfx/verify-media-battle-rules.mjs', '--verify', str(natural)], env)
    run('natural-measure', [sys.executable, 'tools/v5vfx/measure-dual-media-battle.py', str(natural), str(natural_report)], env)
    analysis = json.loads(natural_report.read_text())
    receipt['natural'] = dict(path=str(natural_report), sha256=sha(natural_report),
                              numericPass=analysis['numericPass'], parity=analysis['parity'])
    receipt['sampledNumericPass'] = (all(r['attributionValid'] and r['zeroPaintOverlap'] for r in receipt['labels'])
                                     and analysis['numericPass'])
    receipt['limits'] = ['Paused attribution is post-conceal and preserves initial-raster deltas.',
                         'Expanded status is synthetic overflow stress, not a reachable rules state.',
                         'Natural rectangle failures remain failures; no all-frame/seam/matte/laptop acceptance.',
                         'All images unviewed; source and diagnostic scopes are recorded separately.']
    receipt['complete'] = True
except Exception as error:
    receipt['failure'] = repr(error)
    raise
finally:
    receipt['completedUTC'] = now()
    save()
