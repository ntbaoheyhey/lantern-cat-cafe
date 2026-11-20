"""Audit two unthrottled counter-only Mochi battles without another browser run."""
from datetime import datetime, timezone
from pathlib import Path
import argparse
import hashlib
import json
import os
import struct
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('preregistration', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
assert not args.output.exists()
hashes = {}


def read(path, expected=None):
    path = Path(path).resolve()
    data = path.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    assert expected is None or digest == expected, str(path)
    hashes[str(path)] = digest
    return data


def load(path, expected=None):
    return json.loads(read(path, expected))


def served(url):
    with urllib.request.urlopen(url, timeout=15) as response:
        return response.read()


pre = load(args.preregistration)
base = Path(pre['output'])
assert base.is_relative_to(ROOT / 'work/v5/CXI/batch-m')
run = load(base / 'run.json')
assert run['pass_'] and run['finishedUTC'] and len(run['runs']) == 2
assert run['preregistration']['sha256'] == hashes[str(args.preregistration.resolve())]
assert [x['sampling'] for x in pre['trials']] == ['off', 'off']
build = load(pre['build']['path'], pre['build']['sha256'])
assert run['sourceCommit'] == build['sourceCommit'] == pre['sourceCommit']
assert run['indexSha256'] == build['indexSha256'] == pre['indexSha256']
assert hashlib.sha256(served(pre['url'])).hexdigest() == pre['indexSha256']
for ref in pre['helpers']:
    read(ref['path'], ref['sha256'])
assert hashlib.sha256(read(ROOT / 'tools/v5int/run-mochi-normal-study.py')).hexdigest() == pre['runnerSha256']
for ref in run['verified']:
    if ref['kind'] == 'source':
        data = subprocess.check_output(['git', 'show', pre['sourceCommit'] + ':' + ref['path']], cwd=ROOT)
        assert read(ROOT / ref['path'], ref['sha256']) == data
    else:
        data = read(Path(build['dist']) / ref['path'], ref['sha256'])
        assert served('http://127.0.0.1:6301/' + ref['path']) == data
    assert hashlib.sha256(data).hexdigest() == ref['sha256']

rules = read(ROOT / 'work/v5/CXI/batch-m/mochi-performance-r1/verify-media-battle-rules.mjs').decode()
old = 'assert.equal(result.runs.length,2);assert.equal(result.runs[0].observedSha256,result.runs[1].observedSha256);'
assert rules.count(old) == 1
rules_path = base / 'verify-one-battle-rules-r1.mjs'
assert not rules_path.exists()
rules_path.write_text(rules.replace(old, 'assert.equal(result.runs.length,1);').replace("'rules-verification.json'", "'rules-verification-r1.json'"))
read(rules_path)
read(ROOT / 'tools/cardrpg-big/a4-load.mjs')
playback = read(ROOT / 'tools/v5int/audit-dual-media-playback.py').decode()
playback = playback.replace('ROOT = Path(__file__).resolve().parents[2]', 'ROOT = Path(' + repr(str(ROOT)) + ')')
playback = playback.replace("assert OUTPUT.is_relative_to(ROOT/'reports/v5/CXI')", 'assert OUTPUT.is_relative_to(Path(' + repr(str(base)) + '))')
playback_path = base / 'audit-playback-r1.py'
assert not playback_path.exists()
playback_path.write_text(playback)
read(playback_path)
read(Path(__file__))
env = dict(os.environ)
env.pop('BIG_RULES_ROOT', None)
records, parity, identities = [], [], []

for planned, completed in zip(pre['trials'], run['runs']):
    assert planned['name'] == completed['name'] and planned['sampling'] == completed['sampling']
    assert completed['exitCode'] == 0
    folder = base / planned['name']
    raw = load(folder / 'report.json', completed['raw']['sha256'])
    assert raw['pass'] and not raw['errors'] and raw['cpuRate'] == pre['cpuRate'] == 1
    assert raw['url'] == pre['url'] and raw['viewport'] == {'width': 1280, 'height': 720}
    assert raw['servedSource'] == pre['sourceCommit'] and raw['indexSha256'] == pre['indexSha256']
    assert raw['harnessSha256'] == pre['helpers'][1]['sha256']
    assert raw['productionFixtureSha256'] == pre['helpers'][0]['sha256']
    assert raw['cpuSampling'] == dict(mode=planned['sampling'], intervalUs=1000, timeDomain='timeTicks', screenshotsDuringWindow=False)
    assert [x['mode'] for x in raw['runs']] == ['normal']
    captured = raw['runs'][0]
    assert captured['identity'] == captured['identityAfter'] == raw['artifactIdentity']
    assert captured['identity']['observerMode'] == pre['observer'] == 'counters'
    assert captured['identity']['roster'] == pre['roster'] and captured['identity']['mediaCats'] == ['mochi']
    identities.append(captured['identity'])
    initial = load(folder / 'normal/initial.json')
    timeline = load(folder / 'normal/timeline.json')
    assert initial['speed'] == captured['speed'] == 1 and initial['reduced'] is False
    assert captured['reachedResult'] and captured['final']['result'] == 'party'
    assert not captured['errors'] and not captured['blockedRequests']
    assert set(timeline['mediaAudits']) == {'mochi'}
    assert all('hp' not in x for x in timeline['mediaAudits']['mochi']['samples'] if not x.get('missing'))
    plans = [{k: v for k, v in x.items() if k != 'wallMs'} for x in timeline['plans']]
    parity.append(dict(initial=initial['battle'], final=timeline['finalBattle'], log=timeline['log'], plans=plans))
    assert captured['actions'] == sum(any(e['type'] in ['action_start', 'charge'] for e in x['events']) for x in plans)
    assert [x['reason'] for x in captured['captures']] == ['opening', 'result-ready']
    assert captured['captures'][0]['utc'] < captured['cpuStartedUTC'] < captured['cpuFinishedUTC'] <= captured['captures'][1]['utc']
    for capture in captured['captures']:
        data = read(capture['path'])
        assert data[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('>II', data[16:24]) == (1280, 720)
    with (folder / 'rules-audit-r1.log').open('xb') as log:
        code = subprocess.run(['node', str(rules_path), '--verify', str(folder)], cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT).returncode
    replay = load(folder / 'rules-verification-r1.json')
    assert code == 0 and replay['pass'] and not replay['errors']
    read(folder / 'rules-audit-r1.log')
    for suffix in ['before', 'after']:
        read(base / (planned['name'] + '-host-' + suffix + '.txt'))
    before, after = captured['cpuWindowBefore'], captured['cpuWindowAfter']
    delta = {k: after[k] - before[k] for k in before}
    duration_keys = ['LayoutDuration', 'RecalcStyleDuration', 'DevToolsCommandDuration', 'ScriptDuration', 'V8CompileDuration', 'TaskDuration', 'TaskOtherDuration', 'ThreadTime', 'ProcessTime']
    assert all(delta[k] >= 0 for k in duration_keys)
    record = dict(**planned, actions=captured['actions'], ultimates=len(captured['ultimates']), ruleReplay=replay['runs'][0],
                  metricsWindowMs=delta['Timestamp'] * 1000, metricsMs={k: delta[k] * 1000 for k in duration_keys},
                  layoutCount=delta['LayoutCount'], recalcStyleCount=delta['RecalcStyleCount'])
    assert planned['sampling'] == 'off'
    assert 'cpuProfile' not in captured and not (folder / 'normal/cpu.cpuprofile').exists()
    records.append(record)

assert all(x == parity[0] for x in parity) and all(x == identities[0] for x in identities)
for url in build['registryOverride'].values():
    read(Path(build['dist']) / url.lstrip('/'))
identity_path = base / 'identity-rules-r1.json'
assert not identity_path.exists()
identity_path.write_text(json.dumps(dict(utc=datetime.now(timezone.utc).isoformat(), sourceCommit=pre['sourceCommit'],
    indexSha256=pre['indexSha256'], artifactHashes=hashes, twoWayParity=True), indent=2) + '\n')
read(identity_path)
for row in records:
    folder = base / row['name']
    output = folder / 'playback-audit-r1.json'
    result = subprocess.run([sys.executable, str(playback_path), '--base', str(folder), '--prior', str(identity_path), '--output', str(output)], cwd=ROOT, capture_output=True, text=True)
    (folder / 'playback-audit-r1.log').write_text(result.stdout + result.stderr)
    assert result.returncode == 0, result.stderr[-2000:]
    data = load(output)
    timing = data['runs'][0]
    media = timing['media']['mochi']
    row.update(frameMsWithoutCapture=timing['frameMsWithoutCapture'], renderCpuMsWithoutCapture=timing['renderCpuMsWithoutCapture'],
        wallMs=timing['naturalResultMs'], dropped=media['droppedFrameDelta'], total=media['totalFrameDelta'], dropFraction=media['dropFraction'],
        callbacks=media['callbacks'], missedCallbacks=media['unobservedPresentedCallbacks'], wraps=len(media['wraps']),
        waitingEvents=len(media['waitingEvents']), runtimeErrors=media['runtimeErrors'],
        playback=dict(path=str(output), sha256=hashes[str(output)]))
manifest_path = base / 'audit-r1-manifest.json'
assert not manifest_path.exists()
# Include every audit input and derived output before freezing the count.
for row in records:
    read(base / row['name'] / 'playback-audit-r1.log')
manifest = dict(utc=datetime.now(timezone.utc).isoformat(), artifactHashes=hashes.copy())
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
manifest_sha = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
receipt = dict(utc=datetime.now(timezone.utc).isoformat(), sourceCommit=pre['sourceCommit'], indexSha256=pre['indexSha256'], url=pre['url'],
    preregistration=dict(path=str(args.preregistration.resolve()), sha256=hashes[str(args.preregistration.resolve())]),
    identityRules=dict(path=str(identity_path), sha256=hashes[str(identity_path)]), twoWayParity=True,
    sourceAndServedItemsVerified=len(run['verified']), hashedArtifacts=len(manifest['artifactHashes']),
    artifactManifest=dict(path=str(manifest_path), sha256=manifest_sha), runs=records,
    imagesViewed=0, productionAcceptance=False,
    decision='ACCEPT identity, two natural battles, independent rule replay and descriptive CPU1 counters only',
    limits=pre['limits'] + ['Two arms are descriptive; no calibrated overhead estimate.',
        'CDP timeTicks duration metrics differ from ThreadTime and ProcessTime; do not sum TaskDuration with its parts.',
        'Dropped video frames are distinct from missed JavaScript callbacks; no causal attribution.'])
args.output.write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(dict(output=str(args.output), hashes=receipt['hashedArtifacts'], parity=True,
    runs=[dict(name=x['name'], p95=x['frameMsWithoutCapture']['p95'], dropped=x['dropped'], total=x['total'], actions=x['actions']) for x in records])))
