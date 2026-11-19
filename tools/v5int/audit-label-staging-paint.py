"""Audit frozen staging paint without rendering, refitting, or changing evidence."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math
import sys
import cv2
import numpy as np

cv2.setNumThreads(2)
delivery, output = map(Path, sys.argv[1:])
assert not output.exists()
root = Path(__file__).resolve().parents[2]
evidence = root / 'reports/v5/CXI/evidence'
hashes = {}

def ref(path):
    path = Path(path).resolve()
    return dict(path=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest())

def verify(item):
    p = Path(item['path'])
    assert ref(p)['sha256'] == item['sha256'], str(p)
    hashes[str(p)] = item['sha256']
    return p

def load(item):
    return json.loads(verify(item).read_text())

d = json.loads(delivery.read_text())
g = load(d['geometry'])
rows = load(g['rows'])
claims = load(d['paint'])
verify(d['harness'])
geometry_ref = ref(evidence / 'v8-label-staging-r1-geometry-review.json')
geometry = load(geometry_ref)
assert geometry['delivery'] == d['geometry'] and geometry['geometryClear']
assert geometry['samples'] == len(rows) == 76
previous = ['v8-label-action-full-r2-paint-review.json',
            'v8-label-action-recovery-r3-paint-review.json',
            'v8-label-envelope-candidate-r1-review.json',
            'v8-label-envelope-expanded-status-r1-review.json']
inputs = []
inherited = []
for i, item in enumerate(g['inputs']):
    raw, analysis = load(item), load(item['analysis'])
    prior_ref = ref(evidence / previous[i])
    prior = load(prior_ref)
    assert prior['delivery'] == item['analysis'] and prior['numericalEvidenceAccepted']
    assert prior['sourceCommit'] == raw['sourceCommit'] == g['sourceCommit']
    assert prior['indexSha256'] == raw['indexSha256'] == g['indexSha256']
    if i < 2:
        accepted = {c['key'] for c in prior['cases'] if c['attributionValid']}
        assert accepted == {c['key'] for c in analysis['cases'] if c['valid']}
    else:
        assert prior['raw'] == {k:item[k] for k in ('path','sha256')}
        assert all(c['valid'] for c in analysis['cases'])
    inputs.append((raw, analysis))
    inherited.append(prior_ref)

selected = [r for r in rows if 'pixelCase' in r]
assert len(selected) == len(claims) == d['cases'] == 46
results = []
total = padded_total = 0
for row, claim in zip(selected, claims):
    raw, analysis = inputs[row['input']]
    case, analyzed = raw['cases'][row['pixelCase']], analysis['cases'][row['pixelCase']]
    assert analyzed['valid']
    assert all(row[k] == claim[k] for k in ('key','input','pixelCase'))
    assert analyzed['pixelDifferences'] == claim['masks']
    masks = np.load(verify(claim['masks']))
    old = next(l['rect'] for l in case['before']['labels'] if l['id'] == 'mochi')
    candidate = row['candidate']
    assert claim['old'] == old and claim['candidate'] == candidate
    shifts = sorted({(dx,dy) for dx in (math.floor(candidate['x']-old['x']),math.ceil(candidate['x']-old['x']))
                     for dy in (math.floor(candidate['y']-old['y']),math.ceil(candidate['y']-old['y']))})
    assert [list(s) for s in shifts] == claim['shifts']
    bodies = [cat+'Contribution' for cat in ('mochi','clover','panko','mallow')[:4 if row['input'] < 2 else 2]]
    assert set(bodies) == {k for k in masks.files if k.endswith('Contribution')}
    assert all(masks[k].shape == (720,1280) for k in ['labelPaint', *bodies])
    actual = []
    padded_hits = []
    paint_outside_exact = 0
    for padding in (0,4):
        x0,y0 = math.floor(old['x'])-padding,math.floor(old['y'])-padding
        x1,y1 = math.ceil(old['x']+old['width'])+padding,math.ceil(old['y']+old['height'])+padding
        assert 0 <= x0 < x1 <= 1280 and 0 <= y0 < y1 <= 720
        paint = masks['labelPaint'][y0:y1,x0:x1]
        if padding:
            paint_outside_exact = int(np.count_nonzero(paint)-np.count_nonzero(paint[4:-4,4:-4]))
        for threshold in (0,1,2,4):
            for margin in (0,1,2):
                for name in bodies:
                    body = (masks[name] > threshold).astype(np.uint8)
                    if margin:
                        body = cv2.dilate(body,np.ones((margin*2+1,margin*2+1),np.uint8))
                    for dx,dy in shifts:
                        assert 0 <= x0+dx < x1+dx <= 1280 and 0 <= y0+dy < y1+dy <= 720
                        count = int(np.count_nonzero((paint>threshold)&(body[y0+dy:y1+dy,x0+dx:x1+dx]>0)))
                        metric = dict(threshold=threshold,margin=margin,body=name,dx=dx,dy=dy,pixels=count)
                        if padding:
                            padded_total += 1
                            if count:
                                padded_hits.append(metric)
                        else:
                            actual.append(metric)
    assert actual == claim['counts']
    total += len(actual)
    clear = all(c['pixels']==0 for c in actual if c['threshold']==0 and c['margin']==2)
    assert clear == claim['passGate']
    results.append(dict(key=row['key'],input=row['input'],comparisons=len(actual),exactCropClear=clear,
                        fourPixelPaddingClear=not padded_hits,paddedNonzero=padded_hits,
                        paintedPixelsOutsideExactRectWithinPadding=paint_outside_exact))
assert total == d['countComparisons'] == 7296 and padded_total == total
assert all(r['exactCropClear'] for r in results) == d['allClear']
result = dict(utc=datetime.now(timezone.utc).isoformat(),delivery=ref(delivery),tool=ref(__file__),
              geometryAudit=geometry_ref,inheritedPixelAudits=inherited,sourceCommit=g['sourceCommit'],
              indexSha256=g['indexSha256'],url=g['url'],verifiedHashes=len(hashes),cases=len(results),
              independentCountComparisons=total,paddedCountComparisons=padded_total,
              deliveredCountsExact=True,exactCropClear=all(r['exactCropClear'] for r in results),
              fourPixelPaddingClear=all(r['fourPixelPaddingClear'] for r in results),results=results,
              productionAcceptance=False,imagesViewed=0,limits=[
                  'Frozen development inputs; translated masks do not prove actual CSS paint or perceived ownership.',
                  'Existing independently audited contribution masks are hash-pinned; full captures are not reopened.',
                  'Four-pixel padding is an added conservative check, not proof that all future label paint is contained.',
                  'Idle/status masks isolate only Mochi/Clover; native bodies have geometry guards only.',
                  'No all-frame, fringe/halo, seam, ordinary-laptop or runtime acceptance.'])
with output.open('x') as f:
    json.dump(result,f,indent=2)
    f.write('\n')
print(json.dumps({k:result[k] for k in ('verifiedHashes','cases','independentCountComparisons','paddedCountComparisons','exactCropClear','fourPixelPaddingClear')}))
