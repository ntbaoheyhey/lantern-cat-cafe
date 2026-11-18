#!/usr/bin/env python3
"""Independently measure seeded action label/body contributions from native pixels."""
import argparse
import hashlib
import importlib.util
import json
import math
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

helper_path = Path(__file__).with_name('audit-dual-media-labels.py')
spec = importlib.util.spec_from_file_location('pixel_helpers', helper_path)
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)
sha, difference, region_mask = helper.sha, helper.difference, helper.region_mask
cv2.setNumThreads(2)
CATS = ('mochi', 'clover', 'panko', 'mallow')
MEDIA = CATS[:2]
THRESHOLDS = (0, 1, 2, 4)


def stats(mask):
    metric = helper.pixels(mask)
    return {k: metric[k] for k in ('count', 'bbox')}


def overlap(a, b):
    return max(0, min(a['x']+a['width'], b['x']+b['width'])-max(a['x'], b['x'])) * max(0, min(a['y']+a['height'], b['y']+b['height'])-max(a['y'], b['y']))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('delivery', type=Path)
    parser.add_argument('rules_audit', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--pilot', help='Explicit mode-cat-skill, otherwise all16 required')
    parser.add_argument('--suite', choices=('full','recovery'), default='full')
    args = parser.parse_args()
    assert not args.output.exists()
    root = Path(__file__).resolve().parents[2]
    hashes = {}

    def verify(item):
        path = Path(item['path'])
        actual = sha(path)
        assert actual == item['sha256'], str(path)
        assert 'bytes' not in item or path.stat().st_size == item['bytes']
        hashes[str(path)] = actual
        return path

    def read(item):
        return json.loads(verify(item).read_text())

    def image(item):
        path = verify(item)
        result = cv2.imread(str(path), cv2.IMREAD_COLOR)
        assert result is not None and result.shape == (720,1280,3)
        return result

    d = json.loads(args.delivery.read_text())
    raw = read(d['raw'])
    artifact = read(d['artifactVerification'])
    base = Path(d['raw']['path']).parent
    for item in read(d['provenance']):
        verify(dict(path=base/item['name'], sha256=item['sha256']))
    build = read(raw['build'])
    prereg = read(raw['preregistration'])
    rules = json.loads(args.rules_audit.read_text())
    assert rules['raw'] == d['raw'] and rules['fullBattleExact']
    for key in ('sourceCommit', 'indexSha256', 'url'):
        assert raw[key] == d[key] == artifact[key] == rules[key] == prereg[key]
    assert raw['sourceCommit'] == build['sourceCommit'] and raw['indexSha256'] == build['indexSha256']
    assert raw['viewport'] == d['viewport'] == [1280,720]
    assert raw['pass'] and not raw['errors'] and not raw['blockedRequests']
    assert raw['runtimeSourceSubstitutions'] == []
    assert raw['runtimeDiagnostic'] == d['runtimeDiagnostic']
    assert (raw['runtimeDiagnostic']['labelTarget']['dx'], raw['runtimeDiagnostic']['labelTarget']['dy']) == (-12,19)
    assert raw['harnessSha256'] == hashes[str(base/'probe-action-labels.mjs')]
    assert raw['helperSha256'] == hashes[str(base/'action-label-observation.mjs')]
    assert raw['fixture']['registryOverride'] == build['registryOverride']
    dist = Path(build['dist'])
    verify(dict(path=dist/'index.html',sha256=raw['indexSha256']))
    for item in artifact['artifacts']:
        verify(dict(item,path=dist/item['path']))
    for item in artifact['mediaFiles']:
        verify(dict(item,path=dist/item['url'].lstrip('/')))
    for item in artifact['sourceFiles']:
        data = subprocess.check_output(['git','show',raw['sourceCommit']+':'+item['path']],cwd=root)
        assert hashlib.sha256(data).hexdigest() == item['sha256']
    expected = [(mode,cat,skill) for mode in ('normal','reduced') for cat in CATS for skill in (1,4)]
    if args.suite == 'recovery':
        expected = [a for a in expected if a[1:] in (('panko',1),('mallow',4))]
    if args.pilot:
        expected = [a for a in expected if '-'.join(map(str,a)) == args.pilot]
    assert len(expected) == (1 if args.pilot else 4 if args.suite == 'recovery' else 16)
    action_key = lambda a: (a['mode'],a['cat'],a['skill'])
    assert [action_key(a) for a in raw['actions']] == expected
    expected_pixels = [(*action,ms) for action in expected for ms in
                       ((0,175,250,350,600,799.9999,800) if args.suite=='recovery' and action[1]=='panko' else (1100 if action[2]==4 else 350,))]
    assert [(*action_key(a),a['ms']) for a in raw['cases']] == expected_pixels
    assert [c['key'] for c in raw['cases']] == [c['key'] for c in raw['plannedPixelCases']]
    assert rules['actions'] == len(expected) == d['actions'] and d['rulesEqual']
    start, finish = [datetime.fromisoformat(raw[k].replace('Z','+00:00')) for k in ('utc','finishedUTC')]
    geometries = []
    expected_rows = []
    for action in raw['actions']:
        duration = action['plan']['duration']
        times = sorted(set(x for x in (0,175,250,350,600,1100,duration-.0001,duration) if x <= duration))
        expected_rows.extend([(*action_key(action),ms) for ms in times])
    assert [(*action_key(row),row['ms']) for row in raw['rows']] == expected_rows
    assert len(expected_rows) == d['geometryRows']
    for row in raw['rows']:
        s = row['snapshot']
        assert s['paused'] and s['renderTime'] == row['fixedTime']
        for label in s['labels']:
            if label['id'] not in MEDIA:
                continue
            bodies = [dict(id=a['id'],area=overlap(label['rect'],a['body'])) for a in s['anchors'] if a['visible'] and a.get('body') and overlap(label['rect'],a['body']) > 0]
            if bodies:
                geometries.append(dict(**{k:row[k] for k in ('mode','cat','skill','ms')},labelId=label['id'],bodies=bodies))
    assert geometries == d['geometryFailures']
    assert len(d['cases']) == len(raw['cases'])
    rows = []
    state_checks = comparisons = 0
    for case, delivered in zip(raw['cases'], d['cases']):
        assert delivered['key'] == case['key']
        initial = case['before']
        expected_plan = case['cat']+'-'+str(case['skill']) if case['ms'] < (2200 if case['skill']==4 else 800) else None
        assert initial['paused'] and (initial['plan'] or {}).get('skillId') == expected_plan
        if 'expectedPlan' in case:
            assert case['expectedPlan'] == expected_plan
        total_lifecycle = case.get('totalLifecycle')
        if total_lifecycle is not None:
            assert 'totalBadge' in prereg and initial['totalBadge']['hidden']
            first, last = total_lifecycle['before'], total_lifecycle['after']
            assert math.isfinite(first['wallTime']) and math.isfinite(last['wallTime'])
            assert 0 <= last['wallTime'] - first['wallTime'] <= 3000
            assert last['hidden']
            assert {k:v for k,v in last.items() if k!='wallTime'} == initial['totalBadge']
        hud_pause = case.get('hudPortraitPause', [])
        for paused in hud_pause:
            assert paused['target'] in ('b3-portrait','b3-portrait-shine')
            assert paused['playState'] == 'paused' and math.isfinite(paused['pausedTime'])
            assert paused['rect']['y'] >= 600
        assert all(a['playState'] == 'paused' for a in initial['animations'])
        images = {cap['variant']:image(cap) for cap in case['captures']}
        pre = {cap['variant']:image(cap) for cap in case['precondition']}
        assert len(case['captures']) == len(images) == 9 and set(images) == {'baseline','baseline-repeat','labels-hidden','labels-hidden-repeat','restored',*('without-'+c for c in CATS)}
        assert len(case['precondition']) == len(pre) == 3
        for cap in case['captures'] + case['precondition']:
            assert start <= datetime.fromisoformat(cap['utc'].replace('Z','+00:00')) <= finish
        for cap in case['captures']:
            for when in ('before','after'):
                state = cap[when]
                assert state['paused'] and state['renderTime'] == case['fixedTime']
                for key in ('plan','battle','labels','labelPaintState','sceneTime','host','anchors','hud','animations'):
                    assert state[key] == initial[key], (case['key'],cap['variant'],when,key)
                if total_lifecycle is not None:
                    assert state['totalBadge'] == initial['totalBadge']
                for cat in MEDIA:
                    a,b = state['media'][cat],initial['media'][cat]
                    assert a['state']['ready'] and a['state']['paused'] and not any(a['state'].get(k) for k in ('failure','disposed','seeking'))
                    assert a['planeVisible'] and a['rootVisible'] and a['state']['currentTime'] == b['state']['currentTime']
                    assert a['decoded']['mediaTime'] == b['decoded']['mediaTime']
                    assert a['body'] == b['body'] and a['face'] == b['face']
                    assert abs(a['decoded']['mediaTime']-case['expectedFrames'][cat]/30) < 1e-5
                state_checks += 1
        controls = {}
        for name,left,right in [('baselineRepeat','baseline','baseline-repeat'),('hiddenRepeat','labels-hidden','labels-hidden-repeat'),('restored','baseline','restored')]:
            controls[name] = stats(difference(images[left],images[right]) > 0)
            assert controls[name] == delivered['controls'][name]
        valid = all(control['count'] == 0 for control in controls.values())
        assert valid == delivered['valid']
        pre_restored_delta = difference(pre['restored'],images['baseline']) > 0
        if valid:
            assert not pre_restored_delta.any()
        # The first conceal is the recorded precondition, not a controlled sample.
        # Its top-HUD raster may differ even when all later full-image controls
        # are exact. Preserve that difference separately, never erase or reuse it.
        pre_hidden_delta = difference(pre['hidden'],images['labels-hidden']) > 0
        paint = difference(images['baseline'],images['labels-hidden'])
        contributions = {cat:difference(images['labels-hidden'],images['without-'+cat]) for cat in CATS}
        saved = np.load(verify(delivered['pixelDifferences']))
        assert np.array_equal(saved['labelPaint'],paint)
        for cat in CATS:
            assert np.array_equal(saved[cat+'Contribution'],contributions[cat])
        union = np.zeros((720,1280),bool)
        hits = []
        assert len(delivered['labels']) == 2
        assert {x['id'] for x in delivered['labels']} == set(MEDIA)
        for label,claim in zip([x for x in initial['labels'] if x['id'] in MEDIA],delivered['labels']):
            assert label['id'] == claim['id'] and label['rect'] == claim['rect']
            box = region_mask(label['rect'])
            for threshold in THRESHOLDS:
                for cat in CATS:
                    pixels = box & (paint > threshold) & (contributions[cat] > threshold)
                    metric = stats(pixels)
                    assert metric == claim['thresholds'][str(threshold)][cat]
                    comparisons += 1
                    if metric['count']:
                        hits.append(dict(label=label['id'],body=cat,threshold=threshold,**metric))
                    if threshold == 0:
                        union |= pixels
        assert stats(union) == delivered['commissionedLabelsAgainstAllFourBodies']
        assert delivered['complete'] and delivered['decodedExact']
        initial_delta = difference(pre['initial'],pre['restored']) > 0
        pre_regions = {label['id']:{name:int((initial_delta & region_mask(rect)).sum()) for name,rect in label['regions'].items() if rect is not None} for label in initial['labels'] if label['id'] in MEDIA}
        rows.append(dict(key=case['key'],frames=case['expectedFrames'],controls=controls,paint=stats(union),nonzero=hits,
                         attributionValid=valid,paintCountsAcceptedAsAttribution=valid,
                         totalLifecycle=total_lifecycle,
                         hudPortraitPause=hud_pause,preconditionHiddenVsControlled=stats(pre_hidden_delta),
                         preconditionRestoredVsControlled=stats(pre_restored_delta),
                         preconditionChangedPixels=int(initial_delta.sum()),preconditionRegions=pre_regions))
    all_valid = all(row['attributionValid'] for row in rows)
    assert d['attributionValid'] == all_valid
    assert d['sampledPaintClear'] == (all_valid and all(row['paint']['count']==0 for row in rows))
    result = dict(utc=datetime.now(timezone.utc).isoformat(),delivery=dict(path=str(args.delivery),sha256=sha(args.delivery)),
                  rulesAudit=dict(path=str(args.rules_audit),sha256=sha(args.rules_audit)),toolSha256=sha(__file__),helperSha256=sha(helper_path),
                  sourceCommit=raw['sourceCommit'],indexSha256=raw['indexSha256'],url=raw['url'],viewport=raw['viewport'],
                  verifiedHashes=len(hashes),verifiedHashDigest=hashlib.sha256(json.dumps(hashes,sort_keys=True).encode()).hexdigest(),
                  suite=args.suite,pilot=args.pilot,actions=len(expected),pixelCases=len(expected_pixels),geometryRows=len(expected_rows),geometryFailures=geometries,
                  stateSnapshots=state_checks,independentCountComparisons=comparisons,cases=rows,
                  numericalEvidenceAccepted=True,attributionValidCases=sum(row['attributionValid'] for row in rows),
                  attributionInvalidCases=[row['key'] for row in rows if not row['attributionValid']],
                  completeAttributionValid=all_valid,sampledPaintClear=d['sampledPaintClear'],productionAcceptance=False,imagesViewed=0,
                  limits=['Seeded legal actions, not natural reachability or every action phase.',
                          'Contact-time M/C label paint versus four isolated body contributions; native shadows and separate VFX excluded.',
                          'Post-conceal raster controls; initial paint discontinuities retained separately.',
                          'Counts with failed full-image controls are reproduced only as arithmetic, never accepted as body attribution or clearance.',
                          'Unchanged R7 application with a temporary label offset; no actual source candidate acceptance.',
                          'No anatomy, fringe/halo, seam or ordinary-laptop acceptance.'])
    args.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ('verifiedHashes','actions','geometryRows','stateSnapshots','independentCountComparisons','numericalEvidenceAccepted','attributionValidCases','attributionInvalidCases','sampledPaintClear')}))


if __name__ == '__main__':
    main()
