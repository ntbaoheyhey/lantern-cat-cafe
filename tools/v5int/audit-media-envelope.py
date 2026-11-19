#!/usr/bin/env python3
"""Independently rebuild frozen media occupancy and test the proposed label offset."""
import argparse
import gzip
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
cv2.setNumThreads(2)

p = argparse.ArgumentParser()
p.add_argument('delivery', type=Path)
p.add_argument('output', type=Path)
a = p.parse_args()
assert not a.output.exists()
d = json.loads(a.delivery.read_text())
verified = {}


def verify(item):
    path = Path(item['path'])
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest == item['sha256'], str(path)
    verified[str(path)] = digest
    return path


def load(item):
    return json.loads(verify(item).read_text())


def rect(box):
    return (max(0, math.floor(box['x'])), max(0, math.floor(box['y'])),
            min(1280, math.ceil(box['x']+box['width'])), min(720, math.ceil(box['y']+box['height'])))


def paint(mask, box):
    x0, y0, x1, y1 = rect(box)
    mask[y0:y1, x0:x1] = True


gpu, artifact = load(d['gpu']), load(d['artifact'])
for key in ('preregistration', 'harness'):
    verify(d[key])
files = {(x['cat'], x['frame']):x for x in load(d['files'])}
saved = np.load(verify(d['sourceSupport']))
projected = np.load(verify(d['projectedSupport']))
reported_rows = load(d['rows'])
manifests, unions = {}, {}
for item in gpu['manifests']:
    cat = item['cat']
    manifest = manifests[cat] = load(item)
    assert {item['sha256'], item['videoSha256']} <= {x['sha256'] for x in artifact['mediaFiles']}
    union = np.zeros((manifest['height'], manifest['width']), dtype=np.uint8)
    refs = sorted((x for x in gpu['references'] if x['cat'] == cat), key=lambda x:x['referenceFrame'])
    assert [x['referenceFrame'] for x in refs] == list(range(300))
    for ref in refs:
        f = files[(cat, ref['referenceFrame'])]
        assert f['path'] == ref['path'] and f['rgbaSha256'] == ref['sha256']
        path = verify(dict(path=f['path'], sha256=f['storedSha256']))
        data = gzip.decompress(path.read_bytes()) if ref.get('encoding') == 'gzip' else path.read_bytes()
        assert hashlib.sha256(data).hexdigest() == ref['sha256']
        w, h = ref['videoSize']
        assert (w, h) == (manifest['width']*2, manifest['height']*2)
        raster = np.frombuffer(data, dtype=np.uint8).reshape(h, w, 4)
        alpha = np.flip(raster, axis=0)[h//2:, w//2:, 0]
        union = np.maximum(union, alpha)
    assert np.array_equal(union, saved[cat])
    assert {str(t):int((union > t).sum()) for t in (0,1,2,4)} == d['sources'][cat]['supportPixels']
    unions[cat] = union

axis = np.arange(-160, 161, dtype=np.int32)
dx, dy = np.meshgrid(axis, axis)
dx, dy = dx.ravel(), dy.ravel()
feasible = {cat:np.ones(len(dx), dtype=bool) for cat in manifests}
cases, observed, escaped, projections = 0, 0, 0, 0
capture = Path(d['artifact']['path']).parent.parent
for suite in ('regression-heldouts', 'expanded-status'):
    raw_path, measured_path = capture/suite/'report.json', capture/suite/'analysis.json'
    raw, measured = (json.loads(path.read_text()) for path in (raw_path, measured_path))
    assert raw['indexSha256'] == artifact['indexSha256'] and raw['sourceCommit'] == artifact['sourceCommit']
    assert hashlib.sha256(raw_path.read_bytes()).hexdigest() == measured['raw']['sha256']
    verified[str(raw_path)] = measured['raw']['sha256']
    for case, analysis in zip(raw['cases'], measured['cases']):
        assert case['mode'] == analysis['mode'] and case['frame'] == analysis['sourceFrame'] and analysis['valid']
        state = case['captures'][0]['before']
        assert state['plan'] is None
        data = np.load(verify(analysis['pixelDifferences']))
        masks = {}
        for cat, manifest in manifests.items():
            box = next(x['body'] for x in state['anchors'] if x['id'] == cat)
            left, top, right, bottom = manifest['opaqueBounds']
            sx, sy = box['width']/(right-left), box['height']/(bottom-top)
            source = cv2.dilate((unions[cat] > 0).astype(np.uint8), np.ones((3,3), np.uint8))
            transform = np.array([[sx,0,box['x']-left*sx+(sx-1)/2],[0,sy,box['y']-top*sy+(sy-1)/2]])
            mask = cv2.dilate(cv2.warpAffine(source, transform, (1280,720), flags=cv2.INTER_NEAREST), np.ones((3,3),np.uint8)).astype(bool)
            key = suite+'-'+case['mode']+'-'+str(case['frame'])+'-'+cat
            assert np.array_equal(mask, projected[key])
            masks[cat] = mask
            contribution = data[cat+'Contribution'] > 0
            observed += int(contribution.sum())
            escaped += int((contribution & ~mask).sum())
            projections += 1
        blockers = masks['mochi'] | masks['clover']
        for actor in state['anchors']:
            if not actor['visible']:
                continue
            if actor['id'] not in manifests:
                paint(blockers, actor['body'])
            if actor.get('face'):
                paint(blockers, actor['face'])
        for hud in state['hud']:
            paint(blockers, hud['rect'])
        for cat in manifests:
            blocked = blockers.copy()
            for label in state['labels']:
                if label['id'] != cat:
                    paint(blocked, label['rect'])
            box = next(x['rect'] for x in state['labels'] if x['id'] == cat)
            x0,y0,x1,y1 = rect(box)
            xx0,yy0,xx1,yy1 = x0+dx,y0+dy,x1+dx,y1+dy
            inside = (xx0>=4)&(yy0>=4)&(xx1<=1276)&(yy1<=716)
            table = cv2.integral(blocked.astype(np.uint8), sdepth=cv2.CV_32S)
            xx0,xx1,yy0,yy1 = xx0.clip(0,1280),xx1.clip(0,1280),yy0.clip(0,720),yy1.clip(0,720)
            count = table[yy1,xx1]-table[yy0,xx1]-table[yy1,xx0]+table[yy0,xx0]
            feasible[cat] &= inside & (count == 0)
        cases += 1
assert cases == d['cases'] == len(reported_rows) == 18 and escaped == d['maxEscapedPixels'] == 0
order = np.lexsort((dy,dx,np.abs(dy),dx*dx+dy*dy))
offsets = {}
for cat, valid in feasible.items():
    i = order[valid[order]][0]
    offsets[cat] = dict(count=int(valid.sum()), dx=int(dx[i]), dy=int(dy[i]), distanceCSSpx=float(np.hypot(dx[i],dy[i])))
    claimed = d['stableOffsets'][cat]
    assert offsets[cat]['count'] == claimed['count']
    assert {k:offsets[cat][k] for k in ('dx','dy','distanceCSSpx')} == claimed['nearest'][0]
result = dict(utc=datetime.now(timezone.utc).isoformat(), delivery=dict(path=str(a.delivery),sha256=hashlib.sha256(a.delivery.read_bytes()).hexdigest()), sourceCommit=artifact['sourceCommit'],indexSha256=artifact['indexSha256'],verifiedHashes=len(verified),frames=600,sourceAlphaUnionExact=True,projectedMasksExact=projections,cases=cases,observedContributionPixels=observed,outsideEnvelopePixels=escaped,offsets=offsets,imagesViewed=0,productionAcceptance=False,decision='ACCEPT frozen numerical envelope/offset hypothesis only; native shifted label raster, action motion, camera and art gates remain separate.',limits=['Complete cycle masks projected onto18frozen idle layouts, not every scene/cast/camera configuration.','Masks include source and CSS dilation margins; no segmentation/anatomy or original-alpha recovery claim.','Native-body rectangle guards are conservative; actual label solver and raster must still be tested.'])
a.output.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
