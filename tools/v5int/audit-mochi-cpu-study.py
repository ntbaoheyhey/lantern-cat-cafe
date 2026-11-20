"""Audit pinned native battles and raw CPU samples without another browser run."""
from collections import Counter, defaultdict
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
assert run['pass_'] and run['finishedUTC'] and len(run['runs']) == 4
assert run['preregistration']['sha256'] == hashes[str(args.preregistration.resolve())]
assert [x['sampling'] for x in pre['trials']] == ['off', 'on', 'on', 'off']
build = load(pre['build']['path'], pre['build']['sha256'])
assert run['sourceCommit'] == build['sourceCommit'] == pre['sourceCommit']
assert run['indexSha256'] == build['indexSha256'] == pre['indexSha256']
assert hashlib.sha256(served(pre['url'])).hexdigest() == pre['indexSha256']
for ref in pre['helpers']:
    read(ref['path'], ref['sha256'])
assert hashlib.sha256(read(ROOT / 'tools/v5int/run-mochi-cpu-study.py')).hexdigest() == pre['runnerSha256']
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
rules_path = base / 'verify-one-battle-rules-r2.mjs'
assert not rules_path.exists()
rules_path.write_text(rules.replace(old, 'assert.equal(result.runs.length,1);').replace("'rules-verification.json'", "'rules-verification-r2.json'"))
read(rules_path)
read(ROOT / 'tools/cardrpg-big/a4-load.mjs')
playback = read(ROOT / 'tools/v5int/audit-dual-media-playback.py').decode()
playback = playback.replace('ROOT = Path(__file__).resolve().parents[2]', 'ROOT = Path(' + repr(str(ROOT)) + ')')
playback = playback.replace("assert OUTPUT.is_relative_to(ROOT/'reports/v5/CXI')", 'assert OUTPUT.is_relative_to(Path(' + repr(str(base)) + '))')
playback_path = base / 'audit-playback-r2.py'
assert not playback_path.exists()
playback_path.write_text(playback)
read(playback_path)
read(Path(__file__))
summary_helper = ROOT / 'tools/v5int/cpu-profile-summary.mjs'
read(summary_helper)
env = dict(os.environ)
env.pop('BIG_RULES_ROOT', None)
records, parity, identities = [], [], []

for planned, completed in zip(pre['trials'], run['runs']):
    assert planned['name'] == completed['name'] and planned['sampling'] == completed['sampling']
    assert completed['exitCode'] == 0
    folder = base / planned['name']
    raw = load(folder / 'report.json', completed['raw']['sha256'])
    assert raw['pass'] and not raw['errors'] and raw['cpuRate'] == pre['cpuRate'] == 4
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
    with (folder / 'rules-audit-r2.log').open('xb') as log:
        code = subprocess.run(['node', str(rules_path), '--verify', str(folder)], cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT).returncode
    replay = load(folder / 'rules-verification-r2.json')
    assert code == 0 and replay['pass'] and not replay['errors']
    read(folder / 'rules-audit-r2.log')
    for suffix in ['before', 'after']:
        read(base / (planned['name'] + '-host-' + suffix + '.txt'))
    before, after = captured['cpuWindowBefore'], captured['cpuWindowAfter']
    delta = {k: after[k] - before[k] for k in before}
    duration_keys = ['LayoutDuration', 'RecalcStyleDuration', 'DevToolsCommandDuration', 'ScriptDuration', 'V8CompileDuration', 'TaskDuration', 'TaskOtherDuration', 'ThreadTime', 'ProcessTime']
    assert all(delta[k] >= 0 for k in duration_keys)
    record = dict(**planned, actions=captured['actions'], ultimates=len(captured['ultimates']), ruleReplay=replay['runs'][0],
                  metricsWindowMs=delta['Timestamp'] * 1000, metricsMs={k: delta[k] * 1000 for k in duration_keys},
                  layoutCount=delta['LayoutCount'], recalcStyleCount=delta['RecalcStyleCount'])
    if planned['sampling'] == 'on':
        profile = load(captured['cpuProfile']['path'], captured['cpuProfile']['sha256'])
        nodes = {n['id']: n for n in profile['nodes']}
        assert len(nodes) == len(profile['nodes'])
        counts, weights = Counter(profile['samples']), defaultdict(int)
        assert len(profile['samples']) == len(profile['timeDeltas']) > 0
        for node, dt in zip(profile['samples'], profile['timeDeltas']):
            assert node in nodes and isinstance(dt, int)
            weights[node] += dt
        duration = profile['endTime'] - profile['startTime']
        assert duration > 0 and sum(profile['timeDeltas']) <= duration
        cumulative = 0
        for dt in profile['timeDeltas']:
            cumulative += dt
            assert 0 <= cumulative <= duration
        js = 'import {readFileSync} from "node:fs";import {summarizeCpuProfile} from ' + json.dumps(summary_helper.as_uri()) + ';console.log(JSON.stringify(summarizeCpuProfile(JSON.parse(readFileSync(process.argv[1])),{countOnly:true})));'
        summary = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js, captured['cpuProfile']['path']], cwd=ROOT))
        assert summary['samples'] == sum(counts.values())
        assert summary['deltaSumMs'] == sum(weights.values()) / 1000
        assert summary['durationMs'] == duration / 1000
        assert summary['maxDeltaMs'] == max(profile['timeDeltas']) / 1000
        assert summary['negativeTimeDeltas'] == [dict(index=i, nodeId=n, deltaUs=dt) for i, (n, dt) in enumerate(zip(profile['samples'], profile['timeDeltas'])) if dt < 0]
        assert summary['aggregation'] == 'raw-counts-only' and not summary['precedingDeltaEstimateEnabled']
        for row in summary['allSelf']:
            assert row['samples'] == counts[row['id']]
            assert row['rawSignedDeltaMs'] == weights[row['id']] / 1000
            assert row['precedingDeltaEstimateMs'] is None
        url_groups = defaultdict(lambda: dict(samples=0, uniformIntervalEstimateMs=0))
        for row in summary['allSelf']:
            group = url_groups[row['url'] or '(no URL; includes native/program/idle/GC)']
            group['samples'] += row['samples']
            group['uniformIntervalEstimateMs'] += row['uniformIntervalEstimateMs']
        summary_path = folder / 'cpu-summary-r2.json'
        assert not summary_path.exists()
        summary_path.write_text(json.dumps(summary, indent=2) + '\n')
        read(summary_path)
        record['cpuProfile'] = dict(raw=captured['cpuProfile'], summary=dict(path=str(summary_path), sha256=hashes[str(summary_path)]),
            **{k: v for k, v in summary.items() if k not in ['allSelf', 'topSelf', 'topInclusive']},
            topSelf=summary['topSelf'][:12], topInclusive=summary['topInclusive'][:12],
            specialNodes=[x for x in summary['allSelf'] if x['functionName'] in ['(idle)', '(program)', '(garbage collector)']],
            byUrl=dict(sorted(url_groups.items(), key=lambda x: -x[1]['samples'])))
    else:
        assert 'cpuProfile' not in captured and not (folder / 'normal/cpu.cpuprofile').exists()
    records.append(record)

assert all(x == parity[0] for x in parity) and all(x == identities[0] for x in identities)
for url in build['registryOverride'].values():
    read(Path(build['dist']) / url.lstrip('/'))
identity_path = base / 'identity-rules-r2.json'
assert not identity_path.exists()
identity_path.write_text(json.dumps(dict(utc=datetime.now(timezone.utc).isoformat(), sourceCommit=pre['sourceCommit'],
    indexSha256=pre['indexSha256'], artifactHashes=hashes, fourWayParity=True), indent=2) + '\n')
read(identity_path)
for row in records:
    folder = base / row['name']
    output = folder / 'playback-audit-r2.json'
    result = subprocess.run([sys.executable, str(playback_path), '--base', str(folder), '--prior', str(identity_path), '--output', str(output)], cwd=ROOT, capture_output=True, text=True)
    (folder / 'playback-audit-r2.log').write_text(result.stdout + result.stderr)
    assert result.returncode == 0, result.stderr[-2000:]
    data = load(output)
    timing = data['runs'][0]
    media = timing['media']['mochi']
    row.update(frameMsWithoutCapture=timing['frameMsWithoutCapture'], renderCpuMsWithoutCapture=timing['renderCpuMsWithoutCapture'],
        wallMs=timing['naturalResultMs'], dropped=media['droppedFrameDelta'], total=media['totalFrameDelta'], dropFraction=media['dropFraction'],
        callbacks=media['callbacks'], missedCallbacks=media['unobservedPresentedCallbacks'], wraps=len(media['wraps']),
        waitingEvents=len(media['waitingEvents']), runtimeErrors=media['runtimeErrors'],
        playback=dict(path=str(output), sha256=hashes[str(output)]))
failed_helper_sha = hashlib.sha256(read(base / 'audit-first-attempt.py')).hexdigest()
receipt = dict(utc=datetime.now(timezone.utc).isoformat(), sourceCommit=pre['sourceCommit'], indexSha256=pre['indexSha256'], url=pre['url'],
    preregistration=dict(path=str(args.preregistration.resolve()), sha256=hashes[str(args.preregistration.resolve())]),
    identityRules=dict(path=str(identity_path), sha256=hashes[str(identity_path)]), fourWayParity=True, sourceAndServedItemsVerified=len(run['verified']),
    hashedArtifacts=len(hashes), runs=records, imagesViewed=0, productionAcceptance=False,
    priorFailure=dict(path=str(ROOT / 'reports/v5/CXI/evidence/v8-mochi-cpu-r1-audit-failure.json'),
        failedHelperSha256=failed_helper_sha),
    decision='ACCEPT exact identity/rules and descriptive raw sample counts only; signed-delta time attribution withheld',
    limits=pre['limits'] + ['Four arms are descriptive; no calibrated overhead estimate.', 'Sampling durations are estimates; inclusive ancestors overlap.',
        'CDP timeTicks duration metrics differ from ThreadTime and ProcessTime; do not sum TaskDuration with its parts.',
        'Generated URL/line/column identify samples; original source attribution requires a separate verified mapping.'])
args.output.write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(dict(output=str(args.output), hashes=len(hashes), parity=True, runs=[dict(name=x['name'], p95=x['frameMsWithoutCapture']['p95'], samples=x.get('cpuProfile', {}).get('samples')) for x in records])))
