#!/usr/bin/env python3
"""Verify a lane's natural-media receipt without rendering or opening images."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('delivery', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
assert not args.output.exists(), 'Preserve existing reviews'
verified = []


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def verify(item):
    path = Path(item['path'])
    actual = sha(path)
    assert actual == item['sha256'], f'Hash mismatch: {path}'
    if 'bytes' in item:
        assert path.stat().st_size == item['bytes'], f'Size mismatch: {path}'
    verified.append(dict(path=str(path), sha256=actual))
    return path


delivery = json.loads(args.delivery.read_text())
verified.append(dict(path=str(args.delivery), sha256=sha(args.delivery)))
raw_path = verify(delivery['raw'])
raw = json.loads(raw_path.read_text())
base = raw_path.parent
provenance = json.loads(verify(delivery['provenance']).read_text())
for item in provenance:
    verify(dict(path=base / item['name'], sha256=item['sha256']))
verify(delivery['hostLoad'])
identity = raw['artifactIdentity']
build_path = verify(dict(path=identity['buildPath'], sha256=identity['buildSha256']))
build = json.loads(build_path.read_text())
assert build['sourceCommit'] == raw['servedSource'] == delivery['sourceCommit']
assert build['indexSha256'] == raw['indexSha256'] == delivery['indexSha256']
verify(dict(path=Path(build['dist']) / 'index.html', sha256=build['indexSha256']))
assert build['registryOverride'] == identity['registryOverride']
for item in build['files']:
    verify(item)
assert raw['viewport'] == delivery['viewport'] == dict(width=1280, height=720)
assert raw['url'] == delivery['url']
assert raw['cpuRate'] == 1 and raw['deviceScaleFactor'] == 1
assert not raw['errors'] and len(raw['runs']) == 2
assert raw['harnessSha256'] == delivery['harnessSha256']
assert raw['productionFixtureSha256'] == delivery['fixtureSha256']
for item in delivery['captures'] + delivery['reviewImages']:
    verify(item)

timelines, rows = [], []
for run, reported in zip(raw['runs'], delivery['runs']):
    assert run['mode'] == reported['mode']
    timeline = json.loads(verify(reported['timeline']).read_text())
    timelines.append(timeline)
    assert run['reachedResult'] and run['final']['result'] == 'party'
    assert not run['errors'] and not run['blockedRequests'] and run['speed'] == 1
    assert run['identity']['indexSha256'] == run['identityAfter']['indexSha256'] == build['indexSha256']
    plans = timeline['plans']
    actions = [p for p in plans if any(e['type'] in ('action_start', 'charge') for e in p['events'])]
    assert len(actions) == run['actions'] == 47
    assert len(plans) == run['presentations'] == 54
    assert len(timeline['log']) == run['logEvents'] == 464
    ultimates = [p for p in plans if p['ultimate']]
    assert len(ultimates) == len(run['ultimates']) == 19
    assert all(p['fixedTiming'] and p['leadIn'] == 0 and p['duration'] == (2200 if p['ultimate'] else 800) for p in actions)
    audit = timeline['mediaAudit']
    battle = [s for s in audit['samples'] if s['fullAt'] is not None and 0 <= s['fullAt'] <= run['final']['wallMs']]
    assert len(battle) == reported['media']['samples']
    assert all(s['source'] == 'media' and s['state']['ready'] and not s['state'].get('failure') and not s['state']['disposed'] and s['videoTextureActive'] for s in battle)
    assert battle[-1]['fullAt'] >= run['final']['wallMs'] - 250
    action_rows = [s for s in battle if s.get('phaseFrame') and s['phaseFrame']['actorId'] and s['phaseFrame']['elapsed'] >= 200]
    assert len(action_rows) == reported['bossPhase']['actionSamplesAfter200ms']
    assert all(not s['bossPhase']['visible'] and s['bossPhase']['opacity'] == 0 for s in action_rows)
    assert any(s['bossPhase']['phase'] > 1 and s['bossPhase']['aura'] for s in battle)
    assert any(s['bossPhase']['visible'] for s in battle)
    post = [s for s in audit['samples'] if s['screen'] == 'result' and s['fullAt'] is not None]
    settled = [s for s in post if s['fullAt'] >= post[0]['fullAt'] + 250]
    assert len(post) == reported['postResultMedia']['samples'] == 14
    assert len(settled) == reported['postResultMedia']['stableSamples'] == 11
    assert all(s['state']['paused'] and s['state']['suspended'] and not s['state']['disposed'] for s in post)
    assert len({s['state']['currentTime'] for s in settled}) == 1
    assert all(s['quality'] == settled[0]['quality'] for s in settled)
    late = [d for d in audit['decoded'] if d['fullAt'] is not None and d['fullAt'] >= settled[0]['fullAt']]
    assert not late
    callbacks = [d for d in audit['decoded'] if d['fullAt'] is not None and 0 <= d['fullAt'] <= run['final']['wallMs']]
    if run['mode'] == 'reduced':
        assert all(s['state']['paused'] for s in battle)
        assert max(s['state']['currentTime'] for s in battle) <= 1/30
    else:
        assert len(callbacks) > 300 and max(d['mediaTime'] for d in callbacks) > 9.9
    rows.append(dict(mode=run['mode'], result='party', actions=len(actions), ultimates=len(ultimates),
                     presentations=len(plans), logEvents=len(timeline['log']), mediaSamples=len(battle),
                     actionRowsAfter200ms=len(action_rows), portraitOverlaps=0,
                     postResultSamples=len(post), settledSamples=len(settled), lateCallbacks=0,
                     settledQuality=settled[0]['quality'], battleQualityFirst=battle[0]['quality'],
                     battleQualityLast=battle[-1]['quality']))

parity = dict(initial=raw['runs'][0]['initialBattleSha256'] == raw['runs'][1]['initialBattleSha256'],
              result=raw['runs'][0]['final']['result'] == raw['runs'][1]['final']['result'],
              finalActors=raw['runs'][0]['final']['actors'] == raw['runs'][1]['final']['actors'],
              log=timelines[0]['log'] == timelines[1]['log'],
              presentations=[{k:v for k,v in p.items() if k != 'wallMs'} for p in timelines[0]['plans']] ==
                            [{k:v for k,v in p.items() if k != 'wallMs'} for p in timelines[1]['plans']])
assert all(parity.values())
assert sum(row['actionRowsAfter200ms'] for row in rows) == 1059
result = dict(utc=datetime.now(timezone.utc).isoformat(), reviewer='CXI', sourceCommit=build['sourceCommit'],
              indexSha256=build['indexSha256'], url=raw['url'], viewport=raw['viewport'],
              verified=verified, auditTool=dict(path=str(Path(__file__).resolve()), sha256=sha(__file__)),
              parity=parity, runs=rows, disposition='ACCEPT scoped numeric natural-battle parity, phase yield and retained post-result decoder stop',
              imageViews=0, limits=['No CXI visual acceptance from lane captures; images hashed only.',
              'Local M3 Pro timing remains descriptive; no general FPS or normal-laptop claim.',
              'Normal battle accumulated six dropped frames; zero late callbacks does not mean zero lifetime drops.',
              'No native document visibility, source enrollment, Clover, cold-budget, journey or release acceptance.'])
args.output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(dict(verifiedHashes=len(verified), parity=parity, runs=rows, imageViews=0)))
