"""Independent pixel/state replay of fixed untouched, sham and conceal controls."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math
import sys
sys.path.insert(0, '/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/python')
import cv2
import numpy as np
cv2.setNumThreads(1)
claim_path, output = map(Path, sys.argv[1:])
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
claim = json.loads(claim_path.read_text())
for name in ('raw', 'preregistration', 'artifact', 'provenance', 'harness', 'measurement'):
    assert sha(claim[name]['path']) == claim[name]['sha256'], name
raw = json.loads(Path(claim['raw']['path']).read_text())
pre = json.loads(Path(claim['preregistration']['path']).read_text())
measured = json.loads(Path(claim['measurement']['path']).read_text())
assert raw['pass'] and not raw['errors'] and not raw['blockedRequests']
assert len(raw['actions']) == 3 and len(raw['cases']) == 5
assert all(a['rulesEqual'] and a['observedBattle'] == a['expectedBattle'] for a in raw['actions'])
for key in ('sourceCommit', 'indexSha256', 'url'):
    assert raw[key] == pre[key] == measured[key] == claim[key]
for item in json.loads(Path(claim['provenance']['path']).read_text()):
    assert sha(Path(claim['raw']['path']).parent / item['name']) == item['sha256']
expected = {c['key']: c for c in measured['cases']}
pairs = [('untouched-0','untouched-1'),('untouched-1','untouched-2'),
         ('untouched-2','sham-style'),('untouched-2','sham-restored'),
         ('untouched-2','restored-1'),('restored-1','restored-repeat-1'),
         ('untouched-2','restored-2'),('hidden-1','hidden-2')]
hashes, state_checks, comparison_checks = 0, 0, 0
rows = []
for case in raw['cases']:
    assert [c['variant'] for c in case['captures']] == pre['conditioningStudy']['shots']
    images = {}
    baseline = case['before']
    meters = case['captures'][0]['beforeMeters']['meters']
    expected_gates = {(g['variant'],g['when']):g['gates'] for g in expected[case['key']]['stateGates']}
    for capture in case['captures']:
        assert sha(capture['path']) == capture['sha256']
        a = cv2.imread(capture['path'], cv2.IMREAD_COLOR)
        assert a is not None and a.shape == (720,1280,3)
        images[capture['variant']] = a.astype(np.int16)
        hashes += 1
        for when in ('before','after'):
            s = capture[when]
            mapping = {'samePlan':'plan','rules':'battle','labels':'labels','paint':'labelPaintState',
                       'hudPaint':'hudPaintState','host':'host','anchors':'anchors','hud':'hud','animations':'animations'}
            gates = {label:s.get(field) == baseline.get(field) for label,field in mapping.items()}
            gates.update(paused=s['paused'],clock=s['sceneTime']==baseline['sceneTime'] and s['renderTime']==case['fixedTime'],
                         totalBadge=s.get('totalBadge')==baseline.get('totalBadge') and s['totalBadge']['hidden'],
                         meters=capture[when+'Meters']['meters']==meters,
                         fontReady=capture[when+'Meters']['fontStatus']=='loaded')
            frames = []
            for cat in ('mochi','clover'):
                media, prior = s['media'][cat], baseline['media'][cat]
                v = media['state']; frame = math.floor((v['currentTime']+0.000001)*30)
                ready = v['ready'] and not v.get('failure') and not v['disposed'] and not v['seeking']
                gates[cat] = bool(ready and media['planeVisible'] and media['rootVisible'] and
                                  v['currentTime']==prior['state']['currentTime'] and media['decoded']['mediaTime']==prior['decoded']['mediaTime'])
                frames.append(bool(ready and abs(v['currentTime']-v['desired'])<=1/60 and
                                   round(media['decoded']['mediaTime']*30)==frame and abs(v['sourceFrame']-frame)<0.00001 and
                                   (case['mode']!='reduced' or frame==0)))
            gates['displayedFrameExact'] = all(frames)
            assert gates == expected_gates[(capture['variant'],when)] and all(gates.values())
            state_checks += len(gates)
    comparisons = []
    for first, second in pairs:
        delta = np.max(np.abs(images[first]-images[second]),axis=2)
        counts = {}
        for threshold in (0,1,2,4):
            yy,xx = np.nonzero(delta>threshold)
            counts[str(threshold)] = dict(count=int(xx.size),bbox=None if xx.size==0 else
                                          [int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)])
            comparison_checks += 1
        comparisons.append(dict(a=first,b=second,thresholds=counts))
    assert comparisons == expected[case['key']]['comparisons']
    rows.append(dict(key=case['key'],firstConcealChanged=comparisons[4]['thresholds']['0']['count'],
                     untouchedAndShamExact=all(c['thresholds']['0']['count']==0 for c in comparisons[:4]),
                     postConcealRepeatsExact=all(comparisons[i]['thresholds']['0']['count']==0 for i in (5,7))))
assert hashes == 50 and state_checks == claim['stateChecks'] == 1700
receipt = dict(utc=datetime.now(timezone.utc).isoformat(),claim=dict(path=str(claim_path),sha256=sha(claim_path)),
               auditor=dict(path=__file__,sha256=sha(__file__)),raw=claim['raw'],measurement=claim['measurement'],
               sourceCommit=claim['sourceCommit'],indexSha256=claim['indexSha256'],url=claim['url'],
               imagesVerified=hashes,stateChecksVerified=state_checks,pixelStatsVerified=comparison_checks,
               cases=rows,numericalAudit='PASS',productionAcceptance=False,imagesViewed=0,
               limits=['Expected/observed rule states match; independent action replay remains separate.',
                       'First conceal is associated with persistent raster differences in four cases; causal browser mechanism is unresolved.',
                       'Exact-zero ordinary-paint validity remains rejected in those four cases; no source or acceptance change.'])
with output.open('x') as f: json.dump(receipt,f,indent=2); f.write('\n')
print(json.dumps({k:receipt[k] for k in ('imagesVerified','stateChecksVerified','pixelStatsVerified','cases','numericalAudit')}))
