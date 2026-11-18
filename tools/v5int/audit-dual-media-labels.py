#!/usr/bin/env python3
"""Independently recompute a lane's paused label/media attribution receipt.

Reads original captures without displaying them. This accepts numerical evidence,
never production art, hidden anatomy, natural gameplay or all animation phases.
"""
import argparse
import hashlib
import json
import math
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def difference(a, b):
    return np.abs(a.astype(np.int16) - b.astype(np.int16)).max(axis=2)


def bounds(rect):
    x, y, w, h = (rect[k] for k in ('x', 'y', 'width', 'height'))
    assert all(math.isfinite(v) for v in (x, y, w, h)) and w > 0 and h > 0
    return [max(0, math.floor(x)), max(0, math.floor(y)),
            min(1280, math.ceil(x + w)), min(720, math.ceil(y + h))]


def region_mask(rect):
    x0, y0, x1, y1 = bounds(rect)
    mask = np.zeros((720, 1280), dtype=bool)
    mask[y0:y1, x0:x1] = True
    return mask


def pixels(mask):
    y, x = np.nonzero(mask)
    return {'count': int(len(x)), 'bbox': [int(x.min()), int(y.min()),
            int(x.max()) + 1, int(y.max()) + 1] if len(x) else None,
            'sampleXY': [[int(a), int(b)] for a, b in zip(x[:8], y[:8])]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('delivery', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    assert not args.output.exists(), 'Never replace an existing audit'
    root = Path(__file__).resolve().parents[2]
    verified = {}

    def verify(item):
        path = Path(item['path'])
        actual = sha(path)
        assert actual == item['sha256'], str(path)
        assert 'bytes' not in item or path.stat().st_size == item['bytes'], str(path)
        verified[str(path)] = actual
        return path

    def load_image(item):
        path = verify(item)
        image = cv2.imread(str(path), cv2.IMREAD_COLOR)
        assert image is not None and image.shape == (720, 1280, 3), str(path)
        return image

    d = json.loads(args.delivery.read_text())
    raw_path = verify(d['raw'])
    raw = json.loads(raw_path.read_text())
    provenance = json.loads(verify(d['provenance']).read_text())
    for item in provenance:
        verify(dict(path=raw_path.parent / item['name'], sha256=item['sha256']))
    artifact = json.loads(verify(d['artifactVerification']).read_text())
    build = json.loads(verify(raw['build']).read_text())
    dist = Path(build['dist'])
    assert d['sourceCommit'] == raw['sourceCommit'] == build['sourceCommit'] == artifact['sourceCommit']
    assert d['indexSha256'] == raw['indexSha256'] == build['indexSha256'] == artifact['indexSha256']
    assert d['viewport'] == raw['viewport'] == [1280, 720]
    assert d['url'] == raw['url'] == artifact['url']
    assert raw['runtimeSourceSubstitutions'] == []
    assert raw['pass'] and not raw['errors'] and not raw['blockedRequests']
    assert raw['fixture']['registryOverride'] == build['registryOverride']
    verify(dict(path=dist / 'index.html', sha256=raw['indexSha256']))
    for item in artifact['artifacts']:
        verify(dict(item, path=dist / item['path']))
    for item in artifact['mediaFiles']:
        verify(dict(item, path=dist / item['url'].lstrip('/')))
    for item in artifact['sourceFiles']:
        source = subprocess.check_output(['git', 'show', raw['sourceCommit'] + ':' + item['path']], cwd=root)
        assert hashlib.sha256(source).hexdigest() == item['sha256'], item['path']
    start, finish = (datetime.fromisoformat(raw[k].replace('Z', '+00:00')) for k in ('utc', 'finishedUTC'))
    expected = [('normal', n) for n in (0, 90, 180, 270)] + [('reduced', 0)]
    assert [(c['mode'], c['frame']) for c in raw['cases']] == expected
    assert len(d['cases']) == len(raw['cases']) == 5
    cases = []
    state_checks = count_checks = 0
    for case, delivered in zip(raw['cases'], d['cases']):
        assert (case['mode'], case['frame']) == (delivered['mode'], delivered['sourceFrame'])
        assert not case['errors'] and not case['blockedRequests']
        images = {c['variant']: load_image(c) for c in case['captures']}
        pre = {c['variant']: load_image(c) for c in case['precondition']}
        assert len(images) == 7 and len(pre) == 3
        initial = case['before']
        for capture in case['captures'] + case['precondition']:
            utc = datetime.fromisoformat(capture['utc'].replace('Z', '+00:00'))
            assert start <= utc <= finish
        for capture in case['captures']:
            for when in ('before', 'after'):
                state = capture[when]
                assert state['paused'] and not state['plan']
                assert state['renderTime'] == case['fixedTime']
                for key in ('battle', 'labels', 'sceneTime', 'host', 'labelPaintState'):
                    assert state[key] == initial[key], (case['mode'], case['frame'], key)
                for cat in ('mochi', 'clover'):
                    a, b = state['media'][cat], initial['media'][cat]
                    assert a['state']['ready'] and a['state']['paused']
                    assert not any(a['state'].get(k) for k in ('failure', 'disposed', 'seeking'))
                    assert a['state']['currentTime'] == b['state']['currentTime']
                    assert abs(a['decoded']['mediaTime'] - case['expectedFrames'][cat] / 30) < 1e-5
                    assert a['decoded']['mediaTime'] == b['decoded']['mediaTime']
                    assert a['planeVisible'] and a['rootVisible']
                    assert a['body'] == b['body'] and a['face'] == b['face']
                state_checks += 1
        controls = {}
        for name, left, right in [('baselineRepeat', 'baseline', 'baseline-repeat'),
                                  ('hiddenRepeat', 'labels-hidden', 'labels-hidden-repeat'),
                                  ('restored', 'baseline', 'restored')]:
            diff = difference(images[left], images[right])
            controls[name] = int(np.count_nonzero(diff))
            assert controls[name] == 0 and delivered['controls'][name]['exact']
        assert np.array_equal(pre['restored'], images['baseline'])
        assert np.array_equal(pre['hidden'], images['labels-hidden'])
        label_delta = difference(images['baseline'], images['labels-hidden'])
        contribution = {cat: difference(images['labels-hidden'], images['without-' + cat])
                        for cat in ('mochi', 'clover')}
        union = {str(t): np.zeros((720, 1280), dtype=bool) for t in (0, 1, 2, 4)}
        own = np.zeros((720, 1280), dtype=bool)
        cross = np.zeros_like(own)
        occupancy = np.zeros((720, 1280), dtype=np.uint8)
        reported = {(x['labelId'], x['region']): x for x in delivered['labels']}
        nonzero = []
        for label in initial['labels']:
            occupancy += region_mask(label['rect'])
            for region, rect in dict(whole=label['rect'], **label['regions']).items():
                if rect is None:
                    continue
                box = region_mask(rect)
                record = reported[(label['id'], region)]
                assert bounds(rect) == record['pixelBounds']
                for threshold in (0, 1, 2, 4):
                    paint = box & (label_delta > threshold)
                    ref = record['thresholds'][str(threshold)]
                    assert int(paint.sum()) == ref['labelPaintPixels']
                    for cat in ('mochi', 'clover'):
                        intersection = paint & (contribution[cat] > threshold)
                        metric = pixels(intersection)
                        relation = 'own' if cat == label['id'] else 'cross'
                        assert dict(metric, relation=relation) == ref['media'][cat]
                        count_checks += 1
                        if metric['count']:
                            nonzero.append(dict(label=label['id'], region=region, cat=cat,
                                                threshold=threshold, **metric))
                        if region == 'whole':
                            union[str(threshold)] |= intersection
                            if threshold == 0:
                                if relation == 'own':
                                    own |= intersection
                                else:
                                    cross |= intersection
        assert int((occupancy > 1).sum()) == delivered['overlappingLabelBoxPixels'] == 0
        assert delivered['threshold0Union'] == dict(all=pixels(union['0']), own=pixels(own), cross=pixels(cross))
        pre_delta = difference(pre['initial'], pre['restored'])
        status_mask = region_mask(next(x for x in initial['labels'] if x['id'] == 'clover')['regions']['status'])
        cases.append(dict(mode=case['mode'], sourceFrames=case['expectedFrames'], controls=controls,
                          preconditionInitialChangedPixels=int((pre_delta > 0).sum()),
                          cloverStatusInitialChangedPixels=int(((pre_delta > 0) & status_mask).sum()),
                          thresholdUnion={k: pixels(v) for k, v in union.items()}, nonzero=nonzero))
    result = dict(utc=datetime.now(timezone.utc).isoformat(), toolSha256=sha(__file__),
                  delivery=dict(path=str(args.delivery), sha256=sha(args.delivery)), raw=d['raw'],
                  sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'], url=raw['url'],
                  viewport=raw['viewport'], verifiedHashes=len(verified),
                  verifiedHashDigest=hashlib.sha256(json.dumps(verified, sort_keys=True).encode()).hexdigest(),
                  captures=35, preconditionCaptures=15, stateSnapshots=state_checks,
                  independentCountComparisons=count_checks, cases=cases,
                  numericalEvidenceAccepted=True, productionAcceptance=False, imagesViewed=0,
                  limits=['CXV captures independently measured; no CXI subjective image review claimed.',
                          'Post-conceal paused raster only; initial differences remain preserved.',
                          'Mochi contribution to Clover status label; semantic tail classification is CXV visual evidence.',
                          'Five phases do not certify every frame or action; native-body/other-label occlusion not isolated.',
                          'Original natural rectangle FAIL and source seam REJECT retained.'])
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ('verifiedHashes', 'captures', 'preconditionCaptures',
                                          'stateSnapshots', 'independentCountComparisons',
                                          'numericalEvidenceAccepted', 'productionAcceptance')}))
    print(json.dumps([dict(mode=c['mode'], frames=c['sourceFrames'],
                          union={k:v['count'] for k,v in c['thresholdUnion'].items()},
                          preconditionDelta=c['preconditionInitialChangedPixels'],
                          cloverStatusDelta=c['cloverStatusInitialChangedPixels']) for c in cases]))


if __name__ == '__main__':
    main()
