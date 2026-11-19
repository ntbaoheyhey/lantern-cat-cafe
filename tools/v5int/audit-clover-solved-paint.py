"""Recount fixed solved-label predictions; never treat translations as new paint."""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import itertools
import json
import math
import cv2
import numpy as np

cv2.setNumThreads(1)
p = argparse.ArgumentParser()
p.add_argument('delivery', type=Path)
p.add_argument('layout_audit', type=Path)
p.add_argument('output', type=Path)
a = p.parse_args()
assert not a.output.exists()
hashes = {}


def verify(ref):
    path = Path(ref['path'])
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest == ref['sha256'], str(path)
    hashes[str(path)] = digest
    return path


def load(ref):
    return json.loads(verify(ref).read_text())


def ref(path):
    return {'path': str(path.resolve()), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


delivery = load(ref(a.delivery))
items = {Path(x['path']).name: x for x in delivery['evidence']}
solved, trace, layout = (load(items[n]) for n in ['solved-paint.json', 'solver-trace.json', 'layout.json'])
prior = load(items['paint.json'])
pre = load(solved['preregistration'])
verify(solved['harness'])
raw = load(pre['raw'])
assert pre['solvedLayout'] == items['layout.json']
own_layout = load(ref(a.layout_audit))
assert own_layout['fixedCandidate']['claim'] == items['solver-trace.json']
assert own_layout['fixedCandidate']['numericalClaimReproduced']
assert own_layout['fixedCandidate']['solverCause']['tracesCompared'] == 3068
for key in ['sourceCommit', 'indexSha256']:
    assert all(x[key] == delivery[key] for x in [solved, trace, layout, prior, raw, own_layout])
for old, new in zip(layout['results'], trace['results']):
    assert all(new[k] == v for k, v in old.items())
assert len(layout['results']) == len(trace['results']) == 1534
positions = {r['key']: r['clover'] for r in layout['results']}
own_review_path = Path(__file__).resolve().parents[2] / 'reports/v5/CXI/evidence/v8-label-staging-full-own-r1-review.json'
own_review = load(ref(own_review_path))
verify(own_review['independentControls'])
assert own_review['raw'] == prior['raw']
invalid_original = set(own_review['summary']['attributionInvalidCases'])
assert len(raw['cases']) == len(solved['results']) == len(prior['results']) == 34
rows, comparisons = [], 0
cats = ['mochi', 'clover', 'panko', 'mallow']
for case, claimed, controls in zip(raw['cases'], solved['results'], prior['results']):
    key = case['key']
    assert key == claimed['key'] == controls['key']
    original_valid = key not in invalid_original
    assert claimed['originalFourControlsValid'] == original_valid
    assert all(v['count'] == 0 for k, v in controls['controls'].items() if k != 'preInitialRestored') == original_valid
    assert all(all(v.values()) for v in controls['stateGates'])
    pre_images = {}
    for capture in case['precondition']:
        if capture['variant'] in ['initial', 'restored']:
            pre_images[capture['variant']] = cv2.imread(str(verify(capture))).astype(np.int16)
    pre_delta = np.max(np.abs(pre_images['initial'] - pre_images['restored']), axis=2)
    assert int(np.count_nonzero(pre_delta)) == controls['controls']['preInitialRestored']['count']
    assert claimed['newFiveControlsValid'] == controls['valid'] == (original_valid and not np.any(pre_delta))
    images = {}
    for capture in case['captures']:
        if capture['variant'] in ['baseline', 'labels-hidden'] + ['without-' + cat for cat in cats]:
            image = cv2.imread(str(verify(capture))).astype(np.int16)
            assert image.shape == (720, 1280, 3)
            images[capture['variant']] = image
    paint = np.max(np.abs(images['baseline'] - images['labels-hidden']), axis=2)
    old = next(x['rect'] for x in case['before']['labels'] if x['id'] == 'clover')
    new = positions[key]
    actual_delta = [new['x'] - old['x'], new['y'] - old['y']]
    assert actual_delta == claimed['actualDelta']
    x0, y0 = math.floor(old['x']) - 10, math.floor(old['y']) - 10
    x1, y1 = math.ceil(old['x'] + old['width']) + 10, math.ceil(old['y'] + old['height']) + 10
    assert 0 <= x0 < x1 <= 1280 and 0 <= y0 < y1 <= 720
    mask_values = paint[y0:y1, x0:x1]
    coordinates = np.argwhere(mask_values > 0)
    values = mask_values[coordinates[:, 0], coordinates[:, 1]]
    bodies = {cat: np.max(np.abs(images['labels-hidden'] - images['without-' + cat]), axis=2) for cat in cats}
    maxima = {threshold: [0, 0, 0] for threshold in [0, 1, 2, 4]}
    roundings = list(itertools.product(['floor', 'ceil'], repeat=2))
    assert [r['rounding'] for r in claimed['roundings']] == [list(r) for r in roundings]
    for claim, rounding in zip(claimed['roundings'], roundings):
        dx, dy = [getattr(math, fn)(n) for fn, n in zip(rounding, actual_delta)]
        assert claim['integerDelta'] == [dx, dy]
        x = coordinates[:, 1] + x0 + dx
        y = coordinates[:, 0] + y0 + dy
        assert np.all((x >= 0) & (x < 1280) & (y >= 0) & (y < 720))
        recomputed = []
        for threshold in [0, 1, 2, 4]:
            for margin in [0, 1, 2]:
                for cat in cats:
                    body = (bodies[cat] > threshold).astype(np.uint8)
                    if margin:
                        body = cv2.dilate(body, np.ones((2 * margin + 1,) * 2, dtype=np.uint8))
                    count = int(np.count_nonzero((values > threshold) & (body[y, x] > 0)))
                    recomputed.append({'threshold': threshold, 'margin': margin, 'body': cat, 'pixels': count})
                    maxima[threshold][margin] = max(maxima[threshold][margin], count)
                    comparisons += 1
        assert recomputed == claim['counts'], key
        assert claim['clear'] == all(r['pixels'] == 0 for r in recomputed if r['threshold'] == 0 and r['margin'] == 2)
    assert claimed['clearAllRoundings'] == (maxima[0][2] == 0)
    rows.append({'key': key, 'originalFourControlsValid': original_valid,
                 'newFiveControlsValid': claimed['newFiveControlsValid'], 'maxPixelsByThresholdAndMargin': maxima})
summary = {}
for field in ['originalFourControlsValid', 'newFiveControlsValid']:
    selected = [r for r in rows if r[field]]
    summary[field] = {'cases': len(selected), 'thresholds': {str(t): {
        'directFailures': [r['key'] for r in selected if r['maxPixelsByThresholdAndMargin'][t][0]],
        'guard2Failures': [r['key'] for r in selected if r['maxPixelsByThresholdAndMargin'][t][2]]} for t in [0, 1, 2, 4]}}
assert summary['originalFourControlsValid']['cases'] == 33
assert len(summary['originalFourControlsValid']['thresholds']['0']['guard2Failures']) == 15
assert not summary['originalFourControlsValid']['thresholds']['0']['directFailures']
receipt = {'utc': datetime.now(timezone.utc).isoformat(), 'delivery': ref(a.delivery), 'layoutAudit': ref(a.layout_audit),
           'sourceCommit': delivery['sourceCommit'], 'indexSha256': delivery['indexSha256'], 'url': delivery['url'],
           'tool': ref(Path(__file__)), 'verifiedArtifacts': len(hashes), 'artifactHashes': hashes,
           'integerCountsCompared': comparisons, 'summary': summary, 'cases': rows, 'imagesViewed': 0,
           'productionAcceptance': False, 'disposition': 'Conservative solved-translation guard rejected. No actual native target paint or application defect established.',
           'limits': delivery['limits']}
a.output.write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'output': str(a.output), 'verified': len(hashes), 'counts': comparisons, 'summary': summary}))
