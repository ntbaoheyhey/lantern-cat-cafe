"""Preregistered frozen paint-mask search; never rendered-candidate acceptance."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math
import sys
import cv2
import numpy as np

cv2.setNumThreads(2)
prereg_path, output = map(Path, sys.argv[1:])
assert not output.exists()
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
ref = lambda p: dict(path=str(Path(p).resolve()), sha256=sha(p))
prereg = json.loads(prereg_path.read_text())
prior_path = Path(prereg['input'])
prior = json.loads(prior_path.read_text())
assert prior['numericalEvidenceAccepted'] and prior['suite'] == 'staging'
raw_path = Path(prior['raw']['path'])
assert sha(raw_path) == prior['raw']['sha256']
raw = json.loads(raw_path.read_text())
assert len(raw['cases']) == prereg['cases'] == 34
assert [c['key'] for c in raw['cases']] == [c['key'] for c in prior['cases']]
assert sum(c['attributionValid'] for c in prior['cases']) == prereg['validControls']
assert prior['attributionInvalidCases'] == [prereg['invalidControl']]
assert prereg['labelSupportPadding'] == 5 and prereg['bodyThreshold'] == 0
assert prereg['bodyMarginPx'] == 2 and prereg['hudGuardPx'] == 6
assert prereg['candidates'] == [dict(dx=0, dy=dy) for dy in range(13)]
hashes = {}


def image(cap):
    path = Path(cap['path'])
    actual = sha(path)
    assert actual == cap['sha256']
    hashes[str(path)] = actual
    img = cv2.imread(str(path)).astype(np.int16)
    assert img.shape == (720, 1280, 3)
    return img


def padded(rect, padding):
    return dict(x=math.floor(rect['x'])-padding, y=math.floor(rect['y'])-padding,
                right=math.ceil(rect['x']+rect['width'])+padding,
                bottom=math.ceil(rect['y']+rect['height'])+padding)


def region(rect, padding):
    b = padded(rect, padding)
    mask = np.zeros((720, 1280), bool)
    mask[max(0, b['y']):min(720, b['bottom']), max(0, b['x']):min(1280, b['right'])] = True
    return mask


def intersects(a, b):
    return max(a['x'], b['x']) < min(a['right'], b['right']) and max(a['y'], b['y']) < min(a['bottom'], b['bottom'])


rows = []
for case, accepted in zip(raw['cases'], prior['cases']):
    caps = {c['variant']: c for c in case['captures']}
    baseline, hidden = image(caps['baseline']), image(caps['labels-hidden'])
    paint = np.abs(baseline-hidden).max(axis=2) > 0
    labels = case['before']['labels']
    clover = next(label for label in labels if label['id'] == 'clover')
    other_regions = np.logical_or.reduce([region(label['rect'], 5) for label in labels if label['id'] != 'clover'])
    own_region = region(clover['rect'], 5)
    outside = int(np.count_nonzero(paint & ~(other_regions | own_region)))
    ambiguous = int(np.count_nonzero(paint & other_regions & own_region))
    ys, xs = np.where(paint & own_region)
    assert len(xs) > 0
    other_paint = paint & other_regions
    bodies = {}
    for cat in ('mochi', 'clover', 'panko', 'mallow'):
        contribution = np.abs(hidden-image(caps['without-'+cat])).max(axis=2) > 0
        bodies[cat] = cv2.dilate(contribution.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    origin = padded(clover['rect'], 5)
    candidates = []
    for move in prereg['candidates']:
        dx, dy = move['dx'], move['dy']
        tx, ty = xs+dx, ys+dy
        inside = (tx >= 0) & (tx < 1280) & (ty >= 0) & (ty < 720)
        clipped = int(np.count_nonzero(~inside))
        hits = {cat: int(np.count_nonzero(body[ty[inside], tx[inside]])) for cat, body in bodies.items()}
        other_hits = int(np.count_nonzero(other_paint[ty[inside], tx[inside]]))
        box = dict(x=origin['x']+dx, y=origin['y']+dy, right=origin['right']+dx, bottom=origin['bottom']+dy)
        box_clipped = box['x'] < 0 or box['y'] < 0 or box['right'] > 1280 or box['bottom'] > 720
        hud_hits = [h['class'] for h in case['before']['hud'] if intersects(box, padded(h['rect'], 6))]
        clear = not (outside or ambiguous or clipped or box_clipped or other_hits or hud_hits or any(hits.values()))
        candidates.append(dict(**move, bodyHits=hits, otherLabelPaintHits=other_hits, clippedPaint=clipped,
                               paddedBoxClipped=box_clipped, hudIntersections=hud_hits, frozenGuardsClear=clear))
    rows.append(dict(key=case['key'], attributionValid=accepted['attributionValid'], labelPaintPixels=len(xs),
                     outsideMeasuredSupport=outside, originalAmbiguousPaint=ambiguous, candidates=candidates))

summary = []
for index, move in enumerate(prereg['candidates']):
    valid_failures = [r['key'] for r in rows if r['attributionValid'] and not r['candidates'][index]['frozenGuardsClear']]
    invalid_arithmetic_failures = [r['key'] for r in rows if not r['attributionValid'] and not r['candidates'][index]['frozenGuardsClear']]
    summary.append(dict(**move, validCaseFailures=valid_failures, invalidCaseArithmeticFailures=invalid_arithmetic_failures,
                        allControlValidCasesPassFrozenGuards=not valid_failures))
result = dict(utc=datetime.now(timezone.utc).isoformat(), preregistration=ref(prereg_path), priorAudit=ref(prior_path),
              raw=prior['raw'], toolSha256=sha(__file__), sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'],
              url=raw['url'], verifiedImageHashes=len(hashes), cases=len(rows), validControlCases=prereg['validControls'],
              invalidControlCases=prior['attributionInvalidCases'], comparisons=len(rows)*len(summary)*4,
              candidates=summary, rows=rows, productionAcceptance=False, imagesViewed=0,
              limits=prereg['limits']+['No shadow/VFX isolation beyond recorded actor body contributions.',
                                      'Full paint extent is measured RGB difference support, not recovered alpha.'])
output.parent.mkdir(parents=True, exist_ok=True)
with output.open('x') as handle:
    json.dump(result, handle, indent=2)
    handle.write('\n')
print(json.dumps(dict(cases=len(rows), validControlCases=prereg['validControls'], verifiedImageHashes=len(hashes),
                      candidates=[dict(dx=c['dx'], dy=c['dy'], validFailures=len(c['validCaseFailures']),
                                       invalidArithmeticFailures=len(c['invalidCaseArithmeticFailures'])) for c in summary])))
