#!/usr/bin/env python3
"""Rehash dual-media natural evidence and independently count lifecycle failures.

No browser, renderer, media mutation or subjective image review. Conservative
rectangle findings remain separate from paused paint attribution.
"""
import argparse
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('delivery', type=Path)
p.add_argument('output', type=Path)
a = p.parse_args()
assert not a.output.exists(), 'Preserve earlier audits'
root = Path(__file__).resolve().parents[2]
hashes = {}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def verify(item):
    path = Path(item['path'])
    digest = sha(path)
    assert digest == item['sha256'], str(path)
    assert 'bytes' not in item or path.stat().st_size == item['bytes']
    hashes[str(path)] = digest
    return path


def read(item):
    return json.loads(verify(item).read_text())


d = json.loads(a.delivery.read_text())
raw = read(d['raw'])
base = Path(d['raw']['path']).parent
artifact = read(d['artifactVerification'])
rules = read(d['rules'])
verify(d['hostLoad'])
for item in read(d['provenance']):
    verify(dict(path=base/item['name'], sha256=item['sha256']))
identity = raw['artifactIdentity']
build = read(dict(path=identity['buildPath'], sha256=identity['buildSha256']))
source = raw['servedSource']
index = raw['indexSha256']
assert d['sourceCommit'] == artifact['sourceCommit'] == build['sourceCommit'] == rules['sourceCommit'] == source
assert d['indexSha256'] == artifact['indexSha256'] == build['indexSha256'] == rules['indexSha256'] == index
assert raw['viewport'] == d['viewport'] == dict(width=1280, height=720)
assert raw['url'] == d['url'] == artifact['url']
assert raw['cpuRate'] == 1 and raw['deviceScaleFactor'] == 1
assert raw['pass'] and not raw['errors'] and len(raw['runs']) == 2
assert build['registryOverride'] == identity['registryOverride']
assert rules['pass'] and not rules['errors']
assert rules['harnessSha256'] == hashes[str(base/'verify-media-battle-rules.mjs')]
dist = Path(build['dist'])
verify(dict(path=dist/'index.html', sha256=index))
for item in artifact['artifacts']:
    verify(dict(item, path=dist/item['path']))
for item in build['files']:
    verify(item)
for item in artifact['sourceFiles']:
    data = subprocess.check_output(['git', 'show', source+':'+item['path']], cwd=root)
    digest = hashlib.sha256(data).hexdigest()
    assert digest == item['sha256']
    hashes['git:'+source+':'+item['path']] = digest
for item in d['captures'] + d['reviewImages']:
    verify(item)

out, timelines = [], []
for run, delivered, replay in zip(raw['runs'], d['runs'], rules['runs']):
    assert run['mode'] == delivered['mode'] == replay['mode']
    assert run['identity'] == run['identityAfter'] == identity
    assert run['reachedResult'] and run['final']['result'] == 'party'
    assert not run['errors'] and not run['blockedRequests'] and run['speed'] == 1
    timeline = read(delivered['timeline'])
    timelines.append(timeline)
    actions = [x for x in timeline['plans'] if any(e['type'] in ('action_start', 'charge') for e in x['events'])]
    assert len(actions) == run['actions'] == delivered['actions'] == replay['observedActions'] == replay['actions']
    assert replay['fullBattleExact'] and all(replay['comparisons'].values()) and replay['replaySha256'] == replay['observedSha256']
    assert len(timeline['plans']) == run['presentations'] and len(timeline['log']) == run['logEvents']
    assert all(x['fixedTiming'] and x['leadIn'] == 0 and x['duration'] == (2200 if x['ultimate'] else 800) for x in actions)
    row = dict(mode=run['mode'], actions=len(actions), logEvents=len(timeline['log']), media={})
    for cat in ('mochi', 'clover'):
        audit, claimed = timeline['mediaAudits'][cat], delivered['media'][cat]
        samples = [s for s in audit['samples'] if s['fullAt'] is not None and 0 <= s['fullAt'] <= run['final']['wallMs']]
        valid = [s for s in samples if not s.get('missing')]
        failures = [s for s in samples if s.get('missing') or s['source'] != 'media' or not s['state']['ready'] or s['state'].get('failure') or s['state']['disposed'] or not s['videoTextureActive'] or not s['sameMedia'] or not s['sameVideo']]
        callbacks = [s for s in audit['decoded'] if s['fullAt'] is not None and 0 <= s['fullAt'] <= run['final']['wallMs']]
        hp = [s for s in valid if s.get('hp') and s['hp']['alive'] and s['hp']['visible']]
        keys = ('bodyOverlapArea', 'faceOverlapArea', 'allBodyOverlapArea', 'otherLabelOverlapArea')
        hp_fail = [s for s in hp if s['hp']['propInside'] or max(s['hp'][k] for k in keys) > 1e-6]
        phase = [s for s in valid if s.get('phaseFrame') and s['phaseFrame']['actorId'] and s['phaseFrame']['elapsed'] >= 200]
        phase_fail = [s for s in phase if s['bossPhase']['visible']]
        post = [s for s in audit['samples'] if s['fullAt'] is not None and s['screen'] == 'result']
        stable = [s for s in post if not s.get('missing') and s['fullAt'] >= post[0]['fullAt'] + 250]
        late = [s for s in audit['decoded'] if s['fullAt'] is not None and stable and s['fullAt'] >= stable[0]['fullAt']]
        assert len(samples) == claimed['samples'] and len(failures) == claimed['failureCount']
        assert len(callbacks) == claimed['callbacks'] and len(hp) == claimed['hpSamples'] and len(hp_fail) == claimed['hpFailureCount']
        assert len(phase) == claimed['bossActionSamples'] and len(phase_fail) == claimed['bossPhaseFailureCount']
        assert len(post) == claimed['postResult']['samples'] and len(stable) == claimed['postResult']['stableSamples'] and len(late) == claimed['postResult']['lateCallbacks']
        assert stable and not late and all(s['state']['paused'] and s['state']['suspended'] and not s['state']['disposed'] for s in post)
        assert len({s['state']['currentTime'] for s in stable}) == 1
        assert all(s['quality'] == stable[0]['quality'] for s in stable)
        max_overlap = {k:max((s['hp'][k] for s in hp), default=0) for k in keys}
        assert max_overlap == claimed['hpMaxOverlapArea']
        if run['mode'] == 'reduced':
            assert all(s['state']['paused'] and s['state']['currentTime'] <= 1/30 for s in valid)
        else:
            assert len(callbacks) > 300
        row['media'][cat] = dict(samples=len(samples), failures=len(failures), callbacks=len(callbacks), hpSamples=len(hp), conservativeRectangleFailures=len(hp_fail), maxOverlapArea=max_overlap, bossActionSamples=len(phase), bossPhaseFailures=len(phase_fail), postResultSamples=len(post), stableSamples=len(stable), lateCallbacks=len(late))
    out.append(row)

plans = lambda t: [{k:v for k,v in x.items() if k != 'wallMs'} for x in t['plans']]
parity = dict(initial=raw['runs'][0]['initialBattleSha256'] == raw['runs'][1]['initialBattleSha256'], result=raw['runs'][0]['final']['result'] == raw['runs'][1]['final']['result'], logs=timelines[0]['log'] == timelines[1]['log'], presentations=plans(timelines[0]) == plans(timelines[1]), independentRules=rules['pass'])
assert all(parity.values()) and parity == d['parity']
result = dict(utc=datetime.now(timezone.utc).isoformat(), receipt=dict(path=str(a.delivery), sha256=sha(a.delivery)), sourceCommit=source, indexSha256=index, url=raw['url'], viewport=raw['viewport'], verifiedArtifacts=len(hashes), artifactHashes=hashes, parity=parity, runs=out, reportedNumericPass=d['numericPass'], scopedNumericalEvidenceAccepted=True, productionAcceptance=False, imagesViewed=0, limits=['Lifecycle and rules counts independently recomputed from lane captures; replay harness and result hashes checked, not rerun.', 'Conservative rectangle failures remain failures; no silhouette, anatomy, pixel clearance or subjective image acceptance.', 'Local host timings are descriptive; no ordinary-laptop, all-frame, seam or matte acceptance.'])
a.output.write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(dict(verifiedArtifacts=len(hashes), parity=parity, runs=out, productionAcceptance=False)))
