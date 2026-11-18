#!/usr/bin/env python3
"""Bounded shape-only registration; never renders or accepts a tail repair."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import cv2
import numpy as np

cv2.setNumThreads(1)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
OUT = BASE / 'clover-contour-map-r1'
OUT.mkdir(exist_ok=False)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
prior_path = BASE / 'clover-endpoint-labels-r1/report.json'
prior = json.loads(prior_path.read_text())
inputs = [dict(path=str(prior_path), sha256=sha(prior_path))]
masks = {}
for row in prior['rows']:
    p = Path(row['output']['path'])
    assert sha(p) == row['output']['sha256']
    inputs.append(row['output'])
    masks[row['endpointFrame']] = np.load(p)['trials'][1]
source = Path(prior['source']['path'])
assert sha(source) == prior['source']['sha256']
raw = np.memmap(source, np.uint8, 'r', shape=(300, 390, 318, 4))
h, w = raw.shape[1:3]
ys, xs = np.indices((h, w), dtype=float)
grid = np.stack((xs, ys), axis=-1)
rigid_path = BASE / 'clover-rigid-layer-r1/report.json'
rigid = json.loads(rigid_path.read_text())
inputs.append(dict(path=str(rigid_path), sha256=sha(rigid_path)))
matrix = np.array(rigid['matrix'])
mapping = grid @ matrix[:, :2].T + matrix[:, 2]
initial = mapping.copy()
target, origin = masks[0], masks[299]
core = cv2.erode(target.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
active_cells = target[:-1, :-1] | target[:-1, 1:] | target[1:, :-1] | target[1:, 1:]


def sample(values, coordinates):
    x, y = np.clip(coordinates[..., 0], 0, w-1), np.clip(coordinates[..., 1], 0, h-1)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    x1, y1 = np.minimum(x0+1, w-1), np.minimum(y0+1, h-1)
    fx, fy = x-x0, y-y0
    if values.ndim == 3:
        fx, fy = fx[..., None], fy[..., None]
    return (values[y0, x0]*(1-fx)+values[y0, x1]*fx)*(1-fy) + (values[y1, x0]*(1-fx)+values[y1, x1]*fx)*fy


def signed_distance(mask):
    return cv2.distanceTransform(mask.astype(np.uint8), cv2.DIST_L2, cv2.DIST_MASK_PRECISE).astype(float) - cv2.distanceTransform((~mask).astype(np.uint8), cv2.DIST_L2, cv2.DIST_MASK_PRECISE)


def geometry(points):
    a, b, c, d = points[:-1, :-1], points[:-1, 1:], points[1:, :-1], points[1:, 1:]
    u0, u1, v0, v1 = b-a, d-c, c-a, d-b
    matrices = np.stack([np.stack([u, v], axis=-1) for u, v in [(u0, v0), (u0, v1), (u1, v0), (u1, v1)]])
    determinants = matrices[..., 0, 0]*matrices[..., 1, 1] - matrices[..., 0, 1]*matrices[..., 1, 0]
    singular = np.linalg.svd(matrices[:, active_cells], compute_uv=False)
    return dict(foldedAllCells=int(np.any(determinants <= 0, axis=0).sum()),
                foldedTailCells=int(np.any(determinants[:, active_cells] <= 0, axis=0).sum()),
                minimumTailCornerDeterminant=float(determinants[:, active_cells].min()),
                tailStretchMin=float(singular.min()), tailStretchMax=float(singular.max()),
                tailStretchP01=float(np.quantile(singular, .01)), tailStretchP99=float(np.quantile(singular, .99)))


def support(points, domain):
    p = points[domain]
    floor = np.floor(p).astype(int)
    frac = p-floor
    weights = np.zeros((len(p), 4))
    for dx, dy in [(0, 0), (1, 0), (0, 1), (1, 1)]:
        q = floor+[dx, dy]
        inside = ((q >= 0) & (q < [w, h])).all(axis=1)
        label = np.full(len(p), 3)
        x, y = q[inside, 0], q[inside, 1]
        label[inside] = np.where(raw[299, y, x, 3] <= 4, 0, np.where(origin[y, x], 1, 2))
        weight = (frac[:, 0] if dx else 1-frac[:, 0]) * (frac[:, 1] if dy else 1-frac[:, 1])
        np.add.at(weights, (np.arange(len(p)), label), weight)
    assert np.max(np.abs(weights.sum(axis=1)-1)) < 1e-12
    return dict(pixels=len(p), tailSupport=float(weights[:, 1].mean()), otherVisibleSupport=float(weights[:, 2].mean()),
                emptySupport=float(weights[:, 0].mean()), outsideSupport=float(weights[:, 3].mean()),
                pixelsTouchingOther=int((weights[:, 2] > 1e-8).sum()), pixelsTouchingEmpty=int((weights[:, 0] > 1e-8).sum()))


assert geometry(grid)['tailStretchMin'] == 1
reflection = grid.copy()
reflection[..., 0] *= -1
assert geometry(reflection)['minimumTailCornerDeterminant'] == -1
assert np.array_equal(sample(grid, grid), grid)
fixed, moving = signed_distance(target), signed_distance(origin)
fy, fx = np.gradient(fixed)
fixed_gradient = np.stack((fx, fy), axis=-1)
band = np.clip((25-np.abs(fixed))/10, 0, 1)
rows = []


def record(iteration, points, maximum_step):
    warped = sample(origin.astype(float), points) >= .5
    row = dict(iteration=iteration, shapeIoU=float((warped & target).sum()/(warped | target).sum()),
               maxStep=maximum_step, maxResidualDisplacement=float(np.linalg.norm(points-initial, axis=-1)[target].max()),
               geometry=geometry(points), whole=support(points, target), core=support(points, core))
    rows.append(row)
    return row


record(0, mapping, 0)
stop = 'fixed 40-iteration bound'
for iteration in range(1, 41):
    warped = sample(moving, mapping)
    my, mx = np.gradient(warped)
    gradients = fixed_gradient + np.stack((mx, my), axis=-1)
    difference = fixed-warped
    velocity = 2*difference[..., None]*gradients / (np.sum(gradients*gradients, axis=-1)+difference*difference+1e-9)[..., None]
    velocity *= band[..., None]
    velocity = cv2.GaussianBlur(velocity, (0, 0), 2)
    length = np.linalg.norm(velocity, axis=-1)
    velocity *= np.minimum(1, .5/np.maximum(length, 1e-12))[..., None]
    candidate = sample(mapping, grid+velocity)
    row = record(iteration, candidate, float(np.linalg.norm(velocity, axis=-1).max()))
    if row['geometry']['foldedAllCells']:
        stop = 'first discrete fold; rejected update retained only in numeric row'
        break
    mapping = candidate
np.save(OUT / 'mapping.npy', mapping)
report = dict(utc=datetime.now(timezone.utc).isoformat(), source=prior['source'], inputs=inputs, harnessSha256=sha(__file__),
              method='Rigid initializer; 40 bounded symmetric signed-distance updates with Gaussian2/maxstep0.5 and float bilinear composition',
              rows=rows, stop=stop, mapping=dict(path=str(OUT/'mapping.npy'), sha256=sha(OUT/'mapping.npy')),
              imagesCreated=0, runtimeChanged=False, acceptedRepair=False,
              limits=['This is a shape-only numerical hypothesis, not a material correspondence solver.',
                      'Discrete corner positivity is measured, not inferred from a diffeomorphic algorithm name.',
                      'Binary segmentation is not a recovered alpha matte. No tail/cloth compositing or temporal transition performed.'])
(OUT / 'report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(dict(initial=rows[0], final=rows[-1], stop=stop)))
