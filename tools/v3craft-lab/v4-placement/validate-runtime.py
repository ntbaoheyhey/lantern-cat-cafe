"""Validate the installed placement with existing test, parity and replay entry points."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import os
import re
import subprocess

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A11/placement-runtime-r1'
REPORT = OUT / 'validation.json'
assert not REPORT.exists(), 'Never overwrite a validation attempt'
now = lambda: datetime.now(timezone.utc).isoformat()
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_text())
runtime = read(OUT / 'source-hashes.json')
stable = lambda: all(sha(ROOT / p) == expected for p, expected in runtime.items())
assert stable()
source = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
preflight = read(OUT / 'validation-preflight.json')
assert preflight['runtimeHashes'] == runtime and preflight['typecheck']['exitCode'] == 0
report = {'started': now(), 'pid': os.getpid(), 'sourceCommit': source, 'runtimeHashes': runtime,
          'scriptSha256': sha(Path(__file__)), 'typecheckEvidence': 'validation-preflight.json',
          'preflightSha256': sha(OUT / 'validation-preflight.json'), 'steps': [], 'complete': False, 'pass': False}
save = lambda: REPORT.write_text(json.dumps(report, indent=2) + '\n')
save()


def step(name, command):
    assert stable(), 'Runtime changed during validation'
    log = ROOT / 'reports/v4-art/jobs' / ('a11-placement-runtime-r1-' + name + '.log')
    row = {'name': name, 'command': command, 'log': str(log), 'started': now()}
    report['steps'].append(row)
    with log.open('xb') as output:
        child = subprocess.Popen(command, cwd=ROOT, stdin=subprocess.DEVNULL, stdout=output, stderr=subprocess.STDOUT)
        row['pid'] = child.pid
        save()
        row['exitCode'] = child.wait()
    row['finished'] = now()
    save()
    print(name, 'exit', row['exitCode'], flush=True)
    assert row['exitCode'] == 0, name + ' failed; see retained log'
    return log


try:
    log = step('web-tests', ['pnpm', '--filter', '@taskbar-hero/web', 'test', '--reporter=dot'])
    text = re.sub(r'\x1b\[[0-9;]*m', '', log.read_text(errors='replace'))
    report['fullWebSummary'] = {key: int(re.search(pattern, text).group(1)) for key, pattern in
                               [('passedTests', r'\bTests\s+(\d+) passed'), ('passedFiles', r'Test Files\s+(\d+) passed')]}
    baseline = ROOT / 'reports/v3-feel/parity-new.json'
    latest = ROOT / 'reports/v3-feel/parity-latest.json'
    baseline_hash, latest_hash = sha(baseline), sha(latest)
    before = set((ROOT / 'reports/v3-feel').glob('parity-probe-*.json'))
    step('parity', ['node', 'scripts/v3feel/parity.mjs', 'probe'])
    new = set((ROOT / 'reports/v3-feel').glob('parity-probe-*.json')) - before
    assert len(new) == 1
    probe = next(iter(new))
    observed = read(probe)
    expected = {r['fixture']: r['hash'] for r in read(baseline)['rows']}
    rows = [dict(fixture=r['fixture'], hash=r['hash'], baselineHash=expected.get(r['fixture']),
                 baselineMatches=r['hash'] == expected.get(r['fixture']), parity=r['parity'], errors=r['errors'], result=r['result'])
            for r in observed['rows']]
    parity = {'at': now(), 'sourceCommit': observed['sourceCommit'], 'runtimeHashes': runtime,
              'probe': str(probe.relative_to(ROOT)), 'probeSha256': sha(probe), 'rows': rows,
              'baselineSha256': baseline_hash, 'baselineUnchanged': sha(baseline) == baseline_hash,
              'inheritedLatestUnchanged': sha(latest) == latest_hash, 'pass': False}
    parity['pass'] = (observed['sourceCommit'] == source and len(rows) == 3
                      and {r['fixture'] for r in rows} == {'wave1', 'wave3', 'boss'}
                      and parity['baselineUnchanged'] and parity['inheritedLatestUnchanged']
                      and all(r['baselineMatches'] and r['parity'] and not r['errors'] and r['result'] == 'party' for r in rows))
    (OUT / 'parity.json').write_text(json.dumps(parity, indent=2) + '\n')
    assert parity['pass'], 'Explicit F6 comparison failed'
    step('runtime-replay', ['node', 'tools/v3craft-lab/v4-placement/temporal.mjs', '--runtime-check', '--attempt=r1'])
    replay = read(OUT / 'runtime-check-r1.json')
    assert replay['complete'] and replay['pass']
    baseline_commit = '9205464cb4c0743fa87d5a00ce2caa5e346101a8'
    changes = [r.split('\t') for r in subprocess.check_output(['git', 'diff', '--name-status', baseline_commit, source], cwd=ROOT, text=True).splitlines()]
    allowed = ('apps/web/public/units/', 'apps/web/public/vfx/', 'apps/web/src/game/cardrpg/battle-v3/',
               'apps/web/src/game/cardrpg/spine/', 'apps/web/src/game/cardrpg/stage/', 'apps/web/src/game/cardrpg/vfx-craft/',
               'apps/web/src/game/cardrpg/vfx-layered/', 'apps/web/src/game/rig/', 'tools/v3craft-lab/', 'scripts/v3feel/',
               'reports/v4-art/', 'reports/v3-feel/')
    files = [r[-1] for r in changes]
    violations = [p for p in files if not p.startswith(allowed) or 'audio' in p.lower() or p.endswith(('.log', '.webm', '.mp4', '.DS_Store')) or '/raw/' in p or '/private/' in p]
    v3_changes = [r for r in changes if r[-1].startswith('reports/v3') and r[0] != 'A']
    originals = [p for p in files if p.startswith(('apps/web/public/units/', 'apps/web/public/vfx/')) and '/sampled-delivery/' not in p]
    audit = {'at': now(), 'baseline': baseline_commit, 'head': source, 'count': len(files), 'files': files,
             'violations': violations, 'v3NonAppendChanges': v3_changes, 'originalOrExactMapChanges': originals,
             'scope': 'Committed ART paths; inherited unstaged files excluded.', 'pass': not (violations or v3_changes or originals)}
    (OUT / 'lane-audit.json').write_text(json.dumps(audit, indent=2) + '\n')
    assert audit['pass']
    report.update(pass_=True, runtimeUnchanged=stable(), runtimeReplayPass=True, lanePass=True, parityPass=True)
    report['pass'] = report.pop('pass_') and report['runtimeUnchanged']
except Exception as error:
    report['error'] = str(error)
    raise
finally:
    report.update(complete=True, finished=now())
    save()
