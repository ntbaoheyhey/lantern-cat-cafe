"""Independent rules and compact playback receipt for the frozen observer trial."""
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
p.add_argument('output', type=Path)
a = p.parse_args()
assert not a.output.exists()
hashes = {}


def record(path, expected=None):
    path = Path(path).resolve()
    data = path.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    assert expected is None or digest == expected, str(path)
    hashes[str(path)] = digest
    return data


def load(path, expected=None):
    return json.loads(record(path, expected))


def served(url):
    with urllib.request.urlopen(url, timeout=15) as response:
        return response.read()


pre = load(a.preregistration)
base = Path(pre['output'])
run = load(base / 'run.json')
assert run.get('finishedUTC') and len(run['runs']) == len(pre['trials']) == 4
assert run['preregistration']['sha256'] == hashes[str(a.preregistration.resolve())]
build = load(pre['build']['path'], pre['build']['sha256'])
prior = load(pre['priorCapture']['path'], pre['priorCapture']['sha256'])
for item in pre['helpers']:
    record(item['path'], item['sha256'])
assert run['sourceCommit'] == build['sourceCommit'] == pre['sourceCommit']
assert run['indexSha256'] == build['indexSha256'] == pre['indexSha256']
assert hashlib.sha256(served(pre['url'])).hexdigest() == pre['indexSha256']
for item in prior['verified']:
    if item['kind'] == 'source':
        data = subprocess.check_output(['git', 'show', pre['sourceCommit'] + ':' + item['path']], cwd=ROOT)
    else:
        relative = item['path'].lstrip('/')
        data = record(Path(build['dist']) / relative, item['sha256'])
        assert served('http://127.0.0.1:6301/' + relative) == data
    assert hashlib.sha256(data).hexdigest() == item['sha256']
rules_path = base / 'verify-one-battle-rules.mjs'
source = Path(pre['priorCapture']['path']).parent / 'verify-media-battle-rules.mjs'
rules = record(source).decode()
old = 'assert.equal(result.runs.length,2);assert.equal(result.runs[0].observedSha256,result.runs[1].observedSha256);'
assert rules.count(old) == 1 and not rules_path.exists()
rules_path.write_text(rules.replace(old, 'assert.equal(result.runs.length,1);'))
record(rules_path)
record(ROOT / 'tools/cardrpg-big/a4-load.mjs')
playback_source = ROOT / 'tools/v5int/audit-dual-media-playback.py'
playback = record(playback_source).decode()
assert playback.count('ROOT = Path(__file__).resolve().parents[2]') == 1
assert playback.count("assert OUTPUT.is_relative_to(ROOT/'reports/v5/CXI')") == 1
playback = playback.replace('ROOT = Path(__file__).resolve().parents[2]', 'ROOT = Path(' + repr(str(ROOT)) + ')')
playback = playback.replace("assert OUTPUT.is_relative_to(ROOT/'reports/v5/CXI')", 'assert OUTPUT.is_relative_to(Path(' + repr(str(base)) + '))')
playback_path = base / 'audit-playback.py'
assert not playback_path.exists()
playback_path.write_text(playback)
record(playback_path)
record(Path(__file__))
records, parity, identities = [], [], []
env = dict(os.environ)
env.pop('BIG_RULES_ROOT', None)
for planned, completed in zip(pre['trials'], run['runs']):
    assert planned['name'] == completed['name'] and planned['observer'] == completed['observer']
    assert completed['exitCode'] == 0
    folder = base / planned['name']
    raw = load(folder / 'report.json', completed['raw']['sha256'])
    assert raw['pass'] and not raw['errors'] and raw['cpuRate'] == 4
    assert raw['url'] == pre['url'] and raw['viewport'] == {'width': 1280, 'height': 720}
    assert raw['servedSource'] == pre['sourceCommit'] and raw['indexSha256'] == pre['indexSha256']
    assert raw['harnessSha256'] == pre['helpers'][1]['sha256'] and raw['productionFixtureSha256'] == pre['helpers'][0]['sha256']
    assert [r['mode'] for r in raw['runs']] == ['normal']
    captured = raw['runs'][0]
    assert captured['identity'] == captured['identityAfter'] == raw['artifactIdentity']
    assert raw['artifactIdentity']['observerMode'] == planned['observer']
    assert raw['artifactIdentity']['roster'] == pre['roster'] and raw['artifactIdentity']['mediaCats'] == ['mochi']
    identities.append({k: v for k, v in raw['artifactIdentity'].items() if k != 'observerMode'})
    initial = load(folder / 'normal/initial.json')
    timeline = load(folder / 'normal/timeline.json')
    assert initial['speed'] == captured['speed'] == 1 and initial['reduced'] is False
    assert captured['reachedResult'] and captured['final']['result'] == 'party'
    assert not captured['errors'] and not captured['blockedRequests']
    assert set(timeline['mediaAudits']) == {'mochi'}
    samples = timeline['mediaAudits']['mochi']['samples']
    assert all(('hp' in x) == (planned['observer'] == 'full') for x in samples if not x.get('missing'))
    plans = [{k: v for k, v in item.items() if k != 'wallMs'} for item in timeline['plans']]
    parity.append({'initial': initial['battle'], 'final': timeline['finalBattle'], 'log': timeline['log'], 'plans': plans})
    assert captured['actions'] == sum(any(e['type'] in ['action_start', 'charge'] for e in x['events']) for x in plans)
    assert len(captured['captures']) == 8
    for capture in captured['captures']:
        data = record(capture['path'])
        assert data[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('>II', data[16:24]) == (1280, 720)
    with (folder / 'rules-audit.log').open('xb') as log:
        code = subprocess.run(['node', str(rules_path), '--verify', str(folder)], cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT).returncode
    rule_result = load(folder / 'rules-verification.json')
    assert code == 0 and rule_result['pass'] and not rule_result['errors']
    record(folder / 'rules-audit.log')
    for suffix in ['before', 'after']:
        record(base / (planned['name'] + '-host-' + suffix + '.txt'))
    records.append({**planned, 'actions': captured['actions'], 'ultimates': len(captured['ultimates']), 'ruleReplay': rule_result['runs'][0]})
assert all(x == parity[0] for x in parity) and all(x == identities[0] for x in identities)
for url in build['registryOverride'].values():
    record(Path(build['dist']) / url.lstrip('/'))
identity_path = base / 'identity-rules.json'
assert not identity_path.exists()
identity_path.write_text(json.dumps({'utc': datetime.now(timezone.utc).isoformat(), 'sourceCommit': pre['sourceCommit'],
    'indexSha256': pre['indexSha256'], 'artifactHashes': hashes, 'fourWayParity': True, 'runs': records}, indent=2) + '\n')
record(identity_path)
for row in records:
    folder = base / row['name']
    output = folder / 'playback-audit.json'
    result = subprocess.run([sys.executable, str(playback_path), '--base', str(folder), '--prior', str(identity_path), '--output', str(output)],
                            cwd=ROOT, capture_output=True, text=True)
    (folder / 'playback-audit.log').write_text(result.stdout + result.stderr)
    assert result.returncode == 0, result.stderr[-2000:]
    data = load(output)
    timing = data['runs'][0]
    media = timing['media']['mochi']
    row.update({'frameMsWithoutCapture': timing['frameMsWithoutCapture'], 'renderCpuMsWithoutCapture': timing['renderCpuMsWithoutCapture'],
                'wallMs': timing['naturalResultMs'], 'dropped': media['droppedFrameDelta'], 'total': media['totalFrameDelta'],
                'dropFraction': media['dropFraction'], 'callbacks': media['callbacks'], 'missedCallbacks': media['unobservedPresentedCallbacks'],
                'wraps': len(media['wraps']), 'waitingEvents': len(media['waitingEvents']), 'runtimeErrors': media['runtimeErrors'],
                'adapterErrorMs': media['adapterSourceFrameMinusLatestCallbackAbsMs'],
                'playback': {'path': str(output), 'sha256': hashes[str(output)]}})
receipt = {'utc': datetime.now(timezone.utc).isoformat(), 'sourceCommit': pre['sourceCommit'], 'indexSha256': pre['indexSha256'],
           'url': pre['url'], 'preregistration': {'path': str(a.preregistration.resolve()), 'sha256': hashes[str(a.preregistration.resolve())]},
           'identityRules': {'path': str(identity_path), 'sha256': hashes[str(identity_path)]},
           'fourWayParity': True, 'sourceAndServedItemsVerified': len(prior['verified']), 'runs': records,
           'imagesViewed': 0, 'productionAcceptance': False, 'limits': pre['limits'] + ['Report each repetition separately; small fixed-order sample and host background work limit attribution.']}
a.output.write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'output': str(a.output), 'verified': len(hashes), 'runs': [{k: x[k] for k in ['name', 'observer', 'frameMsWithoutCapture', 'renderCpuMsWithoutCapture', 'dropped', 'total']} for x in records]}))
