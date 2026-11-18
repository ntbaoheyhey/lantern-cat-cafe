"""Independently reconstruct a frozen grid using integer mask indexing."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math
import sys
import cv2
import numpy as np

cv2.setNumThreads(2)
delivery_path, output = map(Path, sys.argv[1:])
assert not output.exists()
hashes = {}


def verify(item):
    path = Path(item['path'])
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    assert actual == item['sha256'], str(path)
    hashes[str(path)] = actual
    return path


def load(item):
    return json.loads(verify(item).read_text())


def image(item):
    result = cv2.imread(str(verify(item))).astype(np.int16)
    assert result.shape == (720, 1280, 3)
    return result


def box(rect, pad=0):
    return [max(0, math.floor(rect['x'])-pad), max(0, math.floor(rect['y'])-pad),
            min(1280, math.ceil(rect['x']+rect['width'])+pad),
            min(720, math.ceil(rect['y']+rect['height'])+pad)]


def overlap(a, b):
    return max(a[0], b[0]) < min(a[2], b[2]) and max(a[1], b[1]) < min(a[3], b[3])


delivery = json.loads(delivery_path.read_text())
pre = load(delivery['preregistration'])
verify(delivery['harness'])
observations = load(delivery['observations'])
grid = np.load(verify(delivery['grid']))
assert delivery['productionAcceptance'] is False and delivery['cases'] == 56
assert pre['grid']['additionalDx'] == pre['grid']['additionalDy'] == [-24, 24]
assert pre['grid']['candidates'] == 2401 and pre['grid']['totalOffsetLimitCSSpx'] == 32
dx, dy = np.meshgrid(np.arange(-24, 25), np.arange(-24, 25))
assert np.array_equal(grid['dx'], dx) and np.array_equal(grid['dy'], dy)
assert grid['counts'].shape == (56, 49, 49)
root = delivery_path.resolve().parents[3]
assert [str(root/rel) for rel in pre['inputs']] == [x['path'] for x in observations['inputs']]
inputs, expected = [], []
for i, item in enumerate(observations['inputs']):
    base = Path(item['path'])
    raw = load(dict(path=base/'report.json', sha256=item['reportSha256']))
    analysis = load(dict(path=base/'analysis.json', sha256=item['analysisSha256']))
    assert raw['sourceCommit'] == delivery['sourceCommit'] == pre['sourceCommit']
    assert raw['indexSha256'] == delivery['indexSha256'] == pre['indexSha256']
    assert len(raw['cases']) == len(analysis['cases'])
    inputs.append((raw, analysis))
    expected.extend((i, j) for j, case in enumerate(analysis['cases']) if case['valid'])
assert expected == [(x['input'], x['index']) for x in observations['rows']]
assert len(expected) == 56
passed = (dx-12)**2 + (dy+19)**2 <= 32**2
rows = []
for ordinal, meta in enumerate(observations['rows']):
    raw, analysis = inputs[meta['input']]
    case, claim = raw['cases'][meta['index']], analysis['cases'][meta['index']]
    assert claim['valid'] and claim['pixelDifferences'] == meta['mask']
    caps = {c['variant']: c for c in case['captures']}
    baseline, hidden = image(caps['baseline']), image(caps['labels-hidden'])
    for name, reference in [('baseline-repeat', baseline), ('restored', baseline), ('labels-hidden-repeat', hidden)]:
        assert np.array_equal(image(caps[name]), reference), (ordinal, name)
    pre_restored = next(c for c in case['precondition'] if c['variant'] == 'restored')
    assert np.array_equal(image(pre_restored), baseline), (ordinal, 'precondition-restored')
    data = dict(np.load(verify(meta['mask'])))
    assert np.array_equal(data['labelPaint'], np.abs(baseline-hidden).max(axis=2))
    contributions = []
    for name, value in data.items():
        if name.endswith('Contribution'):
            cat = name.removesuffix('Contribution')
            assert np.array_equal(value, np.abs(hidden-image(caps['without-'+cat])).max(axis=2))
            contributions.append(value > 0)
    assert len(contributions) in (2, 4)
    state = case['before']
    clover = next(label for label in state['labels'] if label['id'] == 'clover')
    bounds = box(clover['rect'], 10)
    escaped = []
    for padding in range(11):
        covered = np.zeros((720, 1280), bool)
        for label in state['labels']:
            left, top, right, bottom = box(label['rect'], padding)
            covered[top:bottom, left:right] = True
        escaped.append(int(np.count_nonzero((data['labelPaint'] > 0) & ~covered)))
    separate = all(not overlap(bounds, box(label['rect'], 10)) for label in state['labels'] if label['id'] != 'clover')
    assert escaped == meta['escapesByPadding'] and separate == meta['separate'] and separate and not escaped[10]
    left, top, right, bottom = bounds
    yy, xx = np.where(data['labelPaint'][top:bottom, left:right] > 0)
    xs, ys = xx+left, yy+top
    assert len(xs) and xs.min() >= 24 and xs.max() < 1256 and ys.min() >= 24 and ys.max() < 696
    body = cv2.dilate(np.logical_or.reduce(contributions).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    x_indices = xs[None, :] + np.arange(-24, 25)[:, None]
    counts = np.stack([body[ys[None, :]+shift, x_indices].sum(axis=1) for shift in range(-24, 25)])
    assert np.array_equal(counts, grid['counts'][ordinal]), (ordinal, 'integer grid mismatch')
    gx, gy = int(xs.min())+dx, int(ys.min())+dy
    width, height = int(xs.max()-xs.min()+1), int(ys.max()-ys.min()+1)
    geometry = (gx >= 4) & (gy >= 4) & (gx+width <= 1276) & (gy+height <= 716)
    blockers = [box(item['rect']) for item in state['hud']]
    for anchor in state['anchors']:
        if not anchor['visible']:
            continue
        for key, pad in [('face', 0), ('body', 6)]:
            if key == 'body' and anchor['id'] in ('mochi', 'clover'):
                continue
            if anchor.get(key):
                rect = {**anchor[key], 'x': anchor[key]['x']+state['host']['x'], 'y': anchor[key]['y']+state['host']['y']}
                blockers.append(box(rect, pad))
    for label in state['labels']:
        if label['id'] == 'clover':
            continue
        rect = dict(label['rect'])
        if label['id'] == 'mochi':
            anchor = next(a for a in state['anchors'] if a['id'] == 'mochi')
            rect['y'] = max(anchor['footY'], anchor['body']['y']+anchor['body']['height'])+state['host']['y']+6
        blockers.append(box(rect, 10))
    for left, top, right, bottom in blockers:
        geometry &= ~((gx < right) & (gx+width > left) & (gy < bottom) & (gy+height > top))
    passed &= (counts == 0) & geometry
    rows.append(dict(input=meta['input'], index=meta['index'], key=meta['key'], masks=len(data),
                     fullImageControlsExact=True, gridValues=int(counts.size), minBodyHits=int(counts.min())))
assert np.array_equal(passed, grid['passed'])
ranked = sorted(zip(dx[passed].tolist(), dy[passed].tolist()), key=lambda xy: (xy[0]**2+xy[1]**2, abs(xy[1]), xy[0], xy[1]))
assert int(passed.sum()) == delivery['passing'] == 1
assert [list(xy) for xy in ranked[:20]] == delivery['nearest']
assert list(ranked[0]) == delivery['chosen']['additional'] == [-16, -5]
assert delivery['chosen']['relativeR7'] == [-28, 14]
result = dict(utc=datetime.now(timezone.utc).isoformat(), delivery=dict(path=str(delivery_path.resolve()), sha256=hashlib.sha256(delivery_path.read_bytes()).hexdigest()),
              toolSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), sourceCommit=delivery['sourceCommit'], indexSha256=delivery['indexSha256'],
              verifiedHashes=len(hashes), verifiedHashDigest=hashlib.sha256(json.dumps(hashes, sort_keys=True).encode()).hexdigest(),
              cases=len(rows), integerGridComparisons=56*49*49, fullImageControlsExact=True, passing=1, chosen=delivery['chosen'],
              rows=rows, numericalEvidenceAccepted=True, productionAcceptance=False, imagesViewed=0,
              limits=['Development data only; full16 schedule overlaps these poses and is not wholly heldout.',
                      'Reproduced frozen masks and geometric guards, not changed compositing or layout solver behavior.',
                      'No source adoption, perceived association, idle/status/native, seam, fringe/halo or laptop acceptance.'])
output.parent.mkdir(parents=True, exist_ok=True)
with output.open('x') as handle:
    json.dump(result, handle, indent=2)
    handle.write('\n')
print(json.dumps({key: result[key] for key in ['verifiedHashes', 'cases', 'integerGridComparisons', 'passing', 'chosen']}))
