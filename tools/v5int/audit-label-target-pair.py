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
    parser.add_argument('--frames', required=True, help='Ordered normal frames; reduced F0 is also required')
    parser.add_argument('--baseline-offset', type=float, nargs=2, required=True, metavar=('DX', 'DY'))
    parser.add_argument('--candidate-offset', type=float, nargs=2, required=True, metavar=('DX', 'DY'))
    parser.add_argument('--expected-clear', choices=('yes', 'no'), required=True)
    args = parser.parse_args()
    assert not args.output.exists()
    frames = [int(x) for x in args.frames.split(',')]
    assert frames and len(frames) == len(set(frames)) and all(0 <= n < 300 for n in frames)
    expected_cases = [('normal', n) for n in frames] + [('reduced', 0)]
    pair_count = len(expected_cases)
    assert all(math.isfinite(v) for v in args.baseline_offset + args.candidate_offset)
    shift = dict(x=args.candidate_offset[0] - args.baseline_offset[0],
                 y=args.candidate_offset[1] - args.baseline_offset[1], width=0, height=0)
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
    assert len(delivery['inputs']) == 2
    if 'harness' in delivery:
        item = delivery['harness']
        assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest() == item['sha256']
        hashes[item['path']] = item['sha256']
    analyses = [read(x['path'], x['sha256']) for x in delivery['inputs']]
    audits = [read(args.baseline_audit), read(args.candidate_audit)]
    for declared, audit in zip(delivery['inputs'], audits):
        assert audit['delivery'] == declared and audit['numericalEvidenceAccepted']
        assert audit['captures'] == 7 * pair_count and audit['stateSnapshots'] == 14 * pair_count
        assert len(audit['cases']) == pair_count
        for key in ('sourceCommit', 'indexSha256', 'url'):
            assert audit[key] == delivery[key]
    for analysis, offset in zip(analyses, (args.baseline_offset, args.candidate_offset)):
        target = analysis['runtimeDiagnostic']['labelTarget']
        assert [target.get('dx', 0), target['dy']] == offset
    assert analyses[0]['runtimeDiagnostic']['statusFixture'] == analyses[1]['runtimeDiagnostic']['statusFixture']
    raws = [read(a['raw']['path'], a['raw']['sha256']) for a in analyses]
    assert len(delivery['cases']) == pair_count
    for raw, analysis, audit in zip(raws, analyses, audits):
        assert [(c['mode'], c['frame']) for c in raw['cases']] == expected_cases
        assert audit['raw'] == analysis['raw']
        assert raw['runtimeDiagnostic'] == analysis['runtimeDiagnostic']
        expected_comparisons = sum(8 * (1 + sum(v is not None for v in label['regions'].values()))
                                   for c in raw['cases'] for label in c['before']['labels'])
        assert audit['independentCountComparisons'] == expected_comparisons
    rows = []
    for a, b, expected, baseline_numerical, numerical in zip(raws[0]['cases'], raws[1]['cases'], delivery['cases'], audits[0]['cases'], audits[1]['cases']):
        assert (a['mode'], a['frame'], a['expectedFrames']) == (b['mode'], b['frame'], b['expectedFrames'])
        assert (expected['mode'], expected['sourceFrame'], expected['expectedFrames']) == (b['mode'], b['frame'], b['expectedFrames'])
        assert numerical['sourceFrames'] == baseline_numerical['sourceFrames'] == b['expectedFrames']
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
        assert labels_a.keys() == labels_b.keys()
        deltas = {}
        for name in labels_a:
            p, q = labels_a[name]['rect'], labels_b[name]['rect']
            delta = {k: q[k]-p[k] for k in ('x', 'y', 'width', 'height')}
            wanted = shift if name == 'clover' else dict(x=0, y=0, width=0, height=0)
            assert delta == wanted
            assert labels_a[name]['text'] == labels_b[name]['text']
            assert labels_a[name]['regions'].keys() == labels_b[name]['regions'].keys()
            for region, first in labels_a[name]['regions'].items():
                second = labels_b[name]['regions'][region]
                assert (first is None) == (second is None)
                if first is not None:
                    assert {k: second[k] - first[k] for k in wanted} == wanted
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
        assert expected['baseline']['all'] == baseline_numerical['thresholdUnion']['0']
        assert expected['candidate']['all'] == numerical['thresholdUnion']['0']
        intersections = numerical['nonzero']
        # Preserve the initial-to-post-conceal discontinuity for the affected bars.
        initial_delta = np.any(image(b, 'initial', pre=True) != image(b, 'restored', pre=True), axis=2)
        precondition = {region:int((initial_delta & mask(labels_b['mochi']['regions'][region])).sum()) for region in ('hp', 'rage')}
        rows.append(dict(mode=b['mode'], frames=b['expectedFrames'], cloverShift=shift,
                         canvasExact=True, outsideCloverDOMChangedPixels=strict_outside,
                         outsideCloverFourPixelMarginExact=True,
                         counts={k:v['count'] for k,v in numerical['thresholdUnion'].items()},
                         nonzero=intersections, mochiBarPrecondition=precondition))
    result = dict(utc=datetime.now(timezone.utc).isoformat(), sourceCommit=delivery['sourceCommit'],
                  indexSha256=delivery['indexSha256'], url=delivery['url'], viewport=[1280,720],
                  inputs=[dict(path=str(p),sha256=hashes[str(p)]) for p in (args.delivery,args.baseline_audit,args.candidate_audit)],
                  toolSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  baselineOffset=args.baseline_offset, candidateOffset=args.candidate_offset,
                  verifiedHashes=len(hashes), combinedAttributionComparisons=sum(a['independentCountComparisons'] for a in audits),
                  pairs=pair_count, cases=rows,
                  cloverSampledClear=not any(x['label']=='clover' for row in rows for x in row['nonzero']),
                  overallClear=all(row['counts']['0']==0 for row in rows),
                  productionAcceptance=False, imagesViewed=0,
                  limits=['Paired post-conceal paused diagnostics at the explicit frame list and reduced F0 only.',
                          'Exact DOM exterior counts are recorded per pair; the delivered outside-Clover check uses a 4px padded union.',
                          'Per-page callback observation/display times and decoder durations differ; not timing equivalence.',
                          'No all-frame, cast, native-body paint, or ordinary-gameplay clearance.',
                          'Initial rage discontinuities, rectangle failures, source matte and seam gates retained.'])
    assert result['overallClear'] == (args.expected_clear == 'yes')
    args.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ('verifiedHashes','combinedAttributionComparisons','pairs','cloverSampledClear','overallClear')}))


if __name__ == '__main__':
    main()
