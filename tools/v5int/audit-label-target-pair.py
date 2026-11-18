#!/usr/bin/env python3
"""Recompute paired label displacement/pixel controls after both attribution audits."""
import argparse
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('delivery', type=Path)
    parser.add_argument('baseline_audit', type=Path)
    parser.add_argument('candidate_audit', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    assert not args.output.exists()
    hashes = {}

    def read(path, expected=None):
        path = Path(path)
        data = path.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        assert expected is None or digest == expected, str(path)
        hashes[str(path)] = digest
        return json.loads(data)

    def image(case, variant, pre=False):
        record = next(x for x in case['precondition' if pre else 'captures'] if x['variant'] == variant)
        path = Path(record['path'])
        assert hashlib.sha256(path.read_bytes()).hexdigest() == record['sha256']
        hashes[str(path)] = record['sha256']
        pixels = cv2.imread(str(path), cv2.IMREAD_COLOR)
        assert pixels.shape == (720, 1280, 3)
        return pixels

    def mask(rect, padding=0):
        result = np.zeros((720, 1280), dtype=bool)
        x, y, w, h = (rect[k] for k in ('x', 'y', 'width', 'height'))
        result[max(0, math.floor(y)-padding):min(720, math.ceil(y+h)+padding),
               max(0, math.floor(x)-padding):min(1280, math.ceil(x+w)+padding)] = True
        return result

    delivery = read(args.delivery)
    analyses = [read(x['path'], x['sha256']) for x in delivery['inputs']]
    audits = [read(args.baseline_audit), read(args.candidate_audit)]
    for declared, audit in zip(delivery['inputs'], audits):
        assert audit['delivery'] == declared and audit['numericalEvidenceAccepted']
        assert audit['captures'] == 70 and audit['stateSnapshots'] == 140
        assert audit['independentCountComparisons'] == 2080
    assert [a['runtimeDiagnostic']['labelTarget']['dy'] for a in analyses] == [0, 5]
    raws = [read(a['raw']['path'], a['raw']['sha256']) for a in analyses]
    assert len(raws[0]['cases']) == len(raws[1]['cases']) == 10
    rows = []
    for a, b, expected, numerical in zip(raws[0]['cases'], raws[1]['cases'], delivery['cases'], audits[1]['cases']):
        assert (a['mode'], a['frame'], a['expectedFrames']) == (b['mode'], b['frame'], b['expectedFrames'])
        left, right = a['before'], b['before']
        for key in ('battle', 'hud', 'sceneTime', 'renderTime', 'host'):
            assert left[key] == right[key], (b['frame'], key)
        for cat in ('mochi', 'clover'):
            m, n = left['media'][cat], right['media'][cat]
            for key in set(m) - {'decoded'}:
                assert m[key] == n[key], (b['frame'], cat, key)
            assert m['decoded']['mediaTime'] == n['decoded']['mediaTime']
        labels_a = {x['id']: x for x in left['labels']}
        labels_b = {x['id']: x for x in right['labels']}
        deltas = {}
        for name in labels_a:
            p, q = labels_a[name]['rect'], labels_b[name]['rect']
            delta = {k: q[k]-p[k] for k in ('x', 'y', 'width', 'height')}
            assert delta == dict(x=0, y=5 if name == 'clover' else 0, width=0, height=0)
            deltas[name] = delta
        assert deltas == expected['labelDeltas']
        assert np.array_equal(image(a, 'labels-hidden'), image(b, 'labels-hidden'))
        change = np.any(image(a, 'baseline') != image(b, 'baseline'), axis=2)
        allowed = mask(labels_a['clover']['rect']) | mask(labels_b['clover']['rect'])
        strict_outside = int((change & ~allowed).sum())
        # The delivered comparison defines its exclusion as DOM bounds +4px.
        # Preserve the stricter DOM-only result rather than silently widening it.
        padded = mask(labels_a['clover']['rect'], 4) | mask(labels_b['clover']['rect'], 4)
        assert not np.any(change & ~padded)
        assert expected['canvasChangedPixels'] == expected['outsideCloverChangedPixels'] == 0
        intersections = numerical['nonzero']
        assert not any(x['label'] == 'clover' for x in intersections)
        # Preserve the initial-to-post-conceal discontinuity for the affected bars.
        initial_delta = np.any(image(b, 'initial', pre=True) != image(b, 'restored', pre=True), axis=2)
        precondition = {region:int((initial_delta & mask(labels_b['mochi']['regions'][region])).sum()) for region in ('hp', 'rage')}
        rows.append(dict(mode=b['mode'], frames=b['expectedFrames'], cloverShift=5,
                         canvasExact=True, outsideCloverDOMChangedPixels=strict_outside,
                         outsideCloverFourPixelMarginExact=True,
                         counts={k:v['count'] for k,v in numerical['thresholdUnion'].items()},
                         nonzero=intersections, mochiBarPrecondition=precondition))
    result = dict(utc=datetime.now(timezone.utc).isoformat(), sourceCommit=delivery['sourceCommit'],
                  indexSha256=delivery['indexSha256'], url=delivery['url'], viewport=[1280,720],
                  inputs=[dict(path=str(p),sha256=hashes[str(p)]) for p in (args.delivery,args.baseline_audit,args.candidate_audit)],
                  verifiedHashes=len(hashes), combinedAttributionComparisons=4160,
                  pairs=10, cases=rows, cloverSampledClear=True,
                  overallClear=all(row['counts']['0']==0 for row in rows),
                  productionAcceptance=False, imagesViewed=0,
                  limits=['Paired post-conceal paused diagnostics; eight new idle poses, one fitted pose, reduced F0.',
                          '427 changed pixels per pair lie outside exact Clover DOM bounds; all are within the delivered 4px margin.',
                          'Per-page callback observation/display times and decoder durations differ; not timing equivalence.',
                          'No all-frame, cast, native-body paint, or ordinary-gameplay clearance.',
                          'Initial rage discontinuities, rectangle failures, source matte and seam gates retained.'])
    assert not result['overallClear']
    args.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ('verifiedHashes','combinedAttributionComparisons','pairs','cloverSampledClear','overallClear')}))


if __name__ == '__main__':
    main()
