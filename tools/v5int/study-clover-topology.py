#!/usr/bin/env python3
"""Audit the saved DIS field; optionally try one stationary-velocity endpoint.

Offline research only. Never rewrites a sequence, source, or runtime asset.
"""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import json
import math
import cv2
import numpy as np

cv2.setNumThreads(2)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
parser = argparse.ArgumentParser()
parser.add_argument('--endpoint', action='store_true')
parser.add_argument('--refine-once', action='store_true')
args = parser.parse_args()
assert not args.refine_once or args.endpoint
saved = BASE / 'clover-dis-endpoint-r1'
flow = np.load(saved / 'flow.npy').astype(np.float64)
mask = np.load(saved / 'mask.npy').astype(np.float64)
h, w = mask.shape
yy, xx = np.mgrid[:h, :w].astype(np.float64)
identity = np.stack((xx, yy), axis=-1)


def corners(field):
    """All four corner determinants of every bilinear grid cell."""
    points = identity + field
    a, b, c, d = points[:-1, :-1], points[:-1, 1:], points[1:, :-1], points[1:, 1:]
    def cross(x, y):
        return x[..., 0] * y[..., 1] - x[..., 1] * y[..., 0]
    return np.stack([cross(b-a, c-a), cross(b-a, d-b), cross(d-c, c-a), cross(d-c, d-b)])


def audit(field):
    dx, dy = field[..., 0], field[..., 1]
    gx, gy = np.gradient(dx, axis=1), np.gradient(dx, axis=0)
    hx, hy = np.gradient(dy, axis=1), np.gradient(dy, axis=0)
    det = (1+gx)*(1+hy)-gy*hx
    folds = (det <= 0) & (mask > .05)
    ys, xs = np.where(folds)
    cells = corners(field)
    active = (mask[:-1, :-1] > .05) | (mask[:-1, 1:] > .05) | (mask[1:, :-1] > .05) | (mask[1:, 1:] > .05)
    return {
        'centralMinActive': float(det[mask > .05].min()),
        'centralFolds': int(folds.sum()),
        'coreFolds': int((folds & (mask > .95)).sum()),
        'transitionFolds': int((folds & (mask <= .95)).sum()),
        'foldBounds': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None,
        'gradientFrobeniusMaxActive': float(np.sqrt(gx*gx+gy*gy+hx*hx+hy*hy)[mask > .05].max()),
        'cellCornerMinActive': float(cells[:, active].min()),
        'foldedActiveCells': int(np.any(cells[:, active] <= 0, axis=0).sum()),
        'maxDisplacement': float(np.linalg.norm(field, axis=-1)[mask > .05].max()),
    }


def bilinear(field, coordinates):
    x = np.clip(coordinates[..., 0], 0, w-1)
    y = np.clip(coordinates[..., 1], 0, h-1)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    x1, y1 = np.minimum(x0+1, w-1), np.minimum(y0+1, h-1)
    fx, fy = (x-x0)[..., None], (y-y0)[..., None]
    return (field[y0, x0]*(1-fx)+field[y0, x1]*fx)*(1-fy)+(field[y1, x0]*(1-fx)+field[y1, x1]*fx)*fy


assert np.all(corners(np.zeros_like(flow)) == 1)
assert np.all(corners(np.full_like(flow, 2)) == 1)
reflection = np.zeros_like(flow)
reflection[..., 0] = -2*xx
assert np.all(corners(reflection) == -1)
report = {
    'utc': datetime.now(timezone.utc).isoformat(),
    'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'inputHashes': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in [saved/'flow.npy', saved/'mask.npy']},
    'raw': audit(flow), 'masked': audit(flow*mask[..., None]),
    'analyticChecks': 'identity +1, translation +1, reflection -1 at all four corners',
    'sequenceChanged': False, 'runtimeRegistered': False,
}
if args.endpoint:
    out = BASE / ('clover-exp-residual-endpoint-r1' if args.refine_once else 'clover-exp-endpoint-r1')
    out.mkdir(exist_ok=False)
    source = BASE/'matte-r2/clover-premul.rgba'
    raw = np.memmap(source, np.uint8, 'r', shape=(300, h, w, 4))
    first, last = raw[0], raw[299]
    update = flow
    if args.refine_once:
        prior = BASE/'clover-exp-endpoint-r1'
        previous = np.load(prior/'displacement.npy')
        aligned = np.frombuffer((prior/'endpoint.rgba').read_bytes(), np.uint8).reshape(h, w, 4)
        def tail_gray(frame):
            r, g, b = np.moveaxis(frame[:, :, :3].astype(np.float32), -1, 0)
            warm = (r > g*1.035) & (r > b*1.15) & (frame[:, :, 3] > 48)
            return np.ascontiguousarray(cv2.cvtColor(frame[:, :, :3], cv2.COLOR_RGB2GRAY)*warm.astype(np.uint8))
        dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
        dis.setFinestScale(0)
        dis.setGradientDescentIterations(25)
        dis.setVariationalRefinementIterations(10)
        update = dis.calc(tail_gray(first), tail_gray(aligned), None).astype(np.float64)
        np.save(out/'residual-flow.npy', update)
        report['priorDisplacementSha256'] = hashlib.sha256((prior/'displacement.npy').read_bytes()).hexdigest()
    velocity = cv2.GaussianBlur(update, (0, 0), 1.0)*mask[..., None]
    n = max(0, math.ceil(math.log2(max(np.linalg.norm(velocity, axis=-1).max()/.5, 1))))
    displacement = velocity / (2**n)
    stages = [audit(displacement)]
    for _ in range(n):
        displacement = displacement + bilinear(displacement, identity+displacement)
        stages.append(audit(displacement))
    if args.refine_once:
        displacement = displacement + bilinear(previous, identity+displacement)
        stages.append(audit(displacement))
    endpoint = cv2.remap(last, (xx+displacement[..., 0]).astype(np.float32), (yy+displacement[..., 1]).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    region = np.clip((yy-232)/15, 0, 1)*np.clip((358-yy)/16, 0, 1)*np.clip((118-xx)/28, 0, 1)
    roi = (region > .5) & (xx < 100)
    a, b = (endpoint[..., 3] > 100) & roi, (first[..., 3] > 100) & roi
    trial = {
        'method': 'One smoothed DIS-as-velocity hypothesis; sigma1 before the unchanged cloth mask; scaling/squaring with initial maximum step<=0.5px; no field refit or frame blend.',
        'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'scalingSquaringSteps': n, 'stages': stages,
        'seamMAE': float(np.abs(endpoint[roi, :3].astype(float)-first[roi, :3]).mean()),
        'iou': float((a & b).sum()/max(1, (a | b).sum())),
        'zeroMaskPixelsChanged': int(np.any(endpoint[mask == 0] != last[mask == 0], axis=1).sum()),
        'outsideRegionPixelsChanged': int(np.any(endpoint[region == 0] != last[region == 0], axis=1).sum()),
        'allCellCornerMin': float(corners(displacement).min()),
        'foldedCellsAnywhere': int(np.any(corners(displacement) <= 0, axis=0).sum()),
    }
    trial['numericPromising'] = (trial['seamMAE'] < 14.3279247284 and trial['iou'] > .8804168952 and stages[-1]['maxDisplacement'] < 40 and trial['foldedCellsAnywhere'] == trial['zeroMaskPixelsChanged'] == trial['outsideRegionPixelsChanged'] == 0)
    if args.refine_once:
        trial['method'] = 'One residual DIS correspondence update; sigma1/unchanged mask; bounded exponentiation followed by oldMap(updateMap(p)). No additional iterations, sequence rewrite or runtime enrollment.'
        trial['numericPromising'] = trial['numericPromising'] and trial['seamMAE'] < 11.882933795156928 and trial['iou'] > .9047009328699469
    np.save(out/'displacement.npy', displacement)
    (out/'endpoint.rgba').write_bytes(endpoint.tobytes())
    report['endpoint'] = trial
    (out/'report.json').write_text(json.dumps(report, indent=2)+'\n')
name = 'v8-m-clover-exp-residual-endpoint-r1.json' if args.refine_once else 'v8-m-clover-exp-endpoint-r1.json' if args.endpoint else 'v8-m-clover-dis-topology-audit.json'
(ROOT/'reports/v5/CXI/evidence'/name).write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report))
