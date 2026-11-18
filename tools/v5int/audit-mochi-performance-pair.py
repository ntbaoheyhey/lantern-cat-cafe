"""Verify the frozen Mochi stress pair without recapturing or changing the app."""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import json
import os
import struct
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser()
p.add_argument('preregistration', type=Path)
p.add_argument('prefix', type=Path)
a = p.parse_args()
pre_path, prefix = a.preregistration.resolve(), a.prefix.resolve()
assert prefix.is_relative_to(ROOT / 'reports/v5/CXI/evidence')
sha = lambda data: hashlib.sha256(data).hexdigest()
stable = lambda value: json.dumps(value, sort_keys=True, separators=(',', ':'))
artifacts = {}


def record(path, expected=None):
    path = Path(path).resolve()
    data = path.read_bytes()
    digest = sha(data)
    assert expected is None or digest == expected, str(path)
    artifacts[str(path)] = digest
    return data


def load(path, expected=None):
    return json.loads(record(path, expected))


def output(suffix, value):
    path = Path(str(prefix) + suffix)
    assert not path.exists(), 'Preserve immutable evidence: ' + str(path)
    path.write_text(json.dumps(value, indent=2) + '\n')
    return path


def served(url):
    with urllib.request.urlopen(url, timeout=15) as response:
        return response.read()


for name in ['STOP-ALL', 'STOP-CXI']:
    assert not Path('/Users/bao/taskbar-hero-mailbox', name).exists(), name
pre = load(pre_path)
base = Path(pre['output'])
run = load(base / 'run.json')
assert run.get('finishedUTC') and [r['rate'] for r in run['runs']] == [1, 4]
assert all(r['exitCode'] == 0 for r in run['runs'])
assert run['preregistration']['sha256'] == artifacts[str(pre_path)]
build = load(pre['build']['path'], pre['build']['sha256'])
assert run['sourceCommit'] == pre['sourceCommit'] == build['sourceCommit']
assert run['indexSha256'] == pre['indexSha256'] == build['indexSha256']
dist = Path(build['dist'])
assert sha(served(pre['url'])) == sha(record(dist / 'index.html')) == pre['indexSha256']
assert len(run['verified']) == 216
post_verified = []
for item in run['verified']:
    if item['kind'] == 'source':
        data = subprocess.check_output(['git', 'show', run['sourceCommit'] + ':' + item['path']], cwd=ROOT)
    else:
        relative = item['path'].lstrip('/')
        data = record(dist / relative, item['sha256'])
        assert served('http://127.0.0.1:6301/' + relative) == data, relative
    assert sha(data) == item['sha256'], item['path']
    post_verified.append(item)
for helper in run['helpers']:
    data = record(helper['path'], helper['sha256'])
    original = record(helper['original']['path'], helper['original']['sha256']).decode()
    if Path(helper['path']).name == 'capture-full-battle-production.mjs':
        old = "const root=resolve(import.meta.dirname,'../..');"
        assert original.count(old) == 1
        original = original.replace(old, 'const root=' + json.dumps(str(ROOT)) + ';')
        original = original.replace('work/v5/CXV', 'work/v5/CXI')
    original = original.replace("'STOP-CXV'", "'STOP-CXI'")
    assert data == original.encode(), helper['path']

# This post-capture verifier replays production rules independently of the browser.
rule_source = Path('/Users/bao/taskbar-hero-cardrpg-a6/tools/v5vfx/verify-media-battle-rules.mjs')
rule_text = record(rule_source).decode()
old = "out.startsWith('/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/')"
assert rule_text.count(old) == 1
rule_tool = base / 'verify-media-battle-rules.mjs'
assert not rule_tool.exists()
rule_tool.write_text(rule_text.replace(old, "out.startsWith('/Users/bao/taskbar-hero-chain/work/v5/CXI/')"))
record(rule_tool)
record(ROOT / 'tools/cardrpg-big/a4-load.mjs')
record(ROOT / 'tools/v5int/audit-dual-media-playback.py')
record(Path(__file__))
assert subprocess.check_output(['git', 'diff', run['sourceCommit'], '--', 'packages/game-rules/src'], cwd=ROOT) == b''
assert not subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard', 'packages/game-rules/src'], cwd=ROOT)
rows, identities = [], []
for rate in [1, 4]:
    folder = base / ('cpu' + str(rate))
    claim = next(r for r in run['runs'] if r['rate'] == rate)
    raw = load(folder / 'report.json', claim['raw']['sha256'])
    assert raw['pass'] and not raw['errors'] and raw['cpuRate'] == rate
    assert raw['servedSource'] == pre['sourceCommit'] and raw['indexSha256'] == pre['indexSha256']
    assert raw['url'] == pre['url'] and raw['viewport'] == {'width': 1280, 'height': 720}
    assert raw['deviceScaleFactor'] == 1
    assert raw['harnessSha256'] == run['helpers'][1]['sha256']
    assert raw['productionFixtureSha256'] == run['helpers'][0]['sha256']
    assert [r['mode'] for r in raw['runs']] == ['normal', 'reduced']
    identity = raw['artifactIdentity']
    assert identity['roster'] == pre['roster'] and identity['mediaCats'] == ['mochi']
    assert identity['buildSha256'] == pre['build']['sha256']
    assert identity['registryOverride'] == build['registryOverride']
    env = dict(os.environ)
    env.pop('BIG_RULES_ROOT', None)
    with (folder / 'independent-rules.log').open('xb') as log:
        result = subprocess.run(['node', str(rule_tool), '--verify', str(folder)], cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
    record(folder / 'independent-rules.log')
    rules = load(folder / 'rules-verification.json')
    assert result.returncode == 0 and rules['pass'] and not rules['errors']
    assert rules['harnessSha256'] == artifacts[str(rule_tool)]
    assert rules['sourceCommit'] == pre['sourceCommit'] and rules['indexSha256'] == pre['indexSha256']
    for captured, replay in zip(raw['runs'], rules['runs']):
        mode = captured['mode']
        initial = load(folder / mode / 'initial.json')
        timeline = load(folder / mode / 'timeline.json')
        assert initial['speed'] == captured['speed'] == 1
        assert initial['reduced'] == (mode == 'reduced')
        assert captured['identity'] == captured['identityAfter'] == identity
        assert captured['reachedResult'] and captured['final']['result'] == 'party'
        assert not captured['errors'] and not captured['blockedRequests']
        assert set(timeline['mediaAudits']) == {'mochi'}
        plans = [{k: v for k, v in item.items() if k != 'wallMs'} for item in timeline['plans']]
        actions = [item for item in plans if any(e['type'] in ['action_start', 'charge'] for e in item['events'])]
        assert len(actions) == captured['actions'] == replay['actions']
        assert len(plans) == captured['presentations'] and len(timeline['log']) == captured['logEvents']
        assert sum(bool(item['ultimate']) for item in plans) == len(captured['ultimates'])
        assert timeline['finalBattle']['result'] == 'party' and replay['fullBattleExact']
        assert len(captured['captures']) == 8
        windows = []
        for capture in captured['captures']:
            png = record(capture['path'])
            assert png[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('>II', png[16:24]) == (1280, 720)
            start, end = capture['before']['wallMs'], capture['after']['wallMs']
            assert end >= start
            windows.append({'reason': capture['reason'], 'utc': capture['utc'], 'startMs': start, 'endMs': end})
        identities.append({'initial': initial['battle'], 'final': timeline['finalBattle'], 'log': timeline['log'], 'plans': plans})
        rows.append({'rate': rate, 'mode': mode, 'actions': len(actions), 'ultimates': len(captured['ultimates']),
                     'presentations': len(plans), 'logEvents': len(timeline['log']), 'result': captured['final']['result'],
                     'wallMs': captured['final']['wallMs'], 'captureWindows': windows, 'independentRuleReplay': replay})
assert all(item == identities[0] for item in identities), 'Initial/final battles, logs, and untimed plans must match across all four runs'
for url in build['registryOverride'].values():
    record(dist / url.lstrip('/'))
identity_receipt = output('-identity-rules.json', {
    'utc': datetime.now(timezone.utc).isoformat(), 'sourceCommit': pre['sourceCommit'], 'indexSha256': pre['indexSha256'],
    'url': pre['url'], 'captureStartedUTC': run['utc'], 'captureFinishedUTC': run['finishedUTC'],
    'postVerifiedItems': len(post_verified), 'artifactHashes': artifacts, 'runs': rows,
    'fourWayParity': {'initialBattle': True, 'finalBattle': True, 'logs': True, 'plansIgnoringOnlyWallMs': True},
    'independentRuleReplay': True, 'imagesViewed': 0, 'productionAcceptance': False, 'limits': pre['limits']})
playbacks = []
for rate in [1, 4]:
    receipt = Path(str(prefix) + '-cpu' + str(rate) + '-playback.json')
    assert not receipt.exists()
    result = subprocess.run([sys.executable, str(ROOT / 'tools/v5int/audit-dual-media-playback.py'),
                             '--base', str(base / ('cpu' + str(rate))), '--prior', str(identity_receipt), '--output', str(receipt)],
                            cwd=ROOT, capture_output=True, text=True)
    (base / ('playback-cpu' + str(rate) + '.log')).write_text(result.stdout + result.stderr)
    assert result.returncode == 0, result.stderr[-2000:]
    data = load(receipt)
    playbacks.append({'rate': rate, 'path': str(receipt), 'sha256': artifacts[str(receipt)], 'runs': data['runs']})
review = output('-review.json', {'utc': datetime.now(timezone.utc).isoformat(), 'sourceCommit': pre['sourceCommit'],
    'indexSha256': pre['indexSha256'], 'identityRules': {'path': str(identity_receipt), 'sha256': sha(identity_receipt.read_bytes())},
    'fourWayParity': True, 'independentRuleReplay': True, 'playback': playbacks,
    'decision': 'Four completed seeded outcomes and rules verified; timing is descriptive stress evidence only.',
    'productionAcceptance': False, 'imagesViewed': 0, 'limits': pre['limits']})
print(json.dumps({'review': str(review), 'verifiedArtifacts': len(artifacts), 'runs': len(rows), 'fourWayParity': True}))
