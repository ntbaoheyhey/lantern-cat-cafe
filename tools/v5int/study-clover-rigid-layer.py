#!/usr/bin/env python3
"""One rigid pose fit on diagnostic tail labels; numbers only, no raster output."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import cv2
import numpy as np

cv2.setNumThreads(1)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
OUT = BASE / 'clover-rigid-layer-r1'
OUT.mkdir(exist_ok=False)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
prior_path = BASE / 'clover-endpoint-labels-r1/report.json'
prior = json.loads(prior_path.read_text())
assert prior['image']['views'] == 1
source = Path(prior['source']['path'])
assert sha(source) == prior['source']['sha256']
raw = np.memmap(source, np.uint8, 'r', shape=(300, 390, 318, 4))
masks = []
for row in prior['rows']:
    p = Path(row['output']['path'])
    assert sha(p) == row['output']['sha256']
    masks.append(np.load(p)['trials'][1])
target, origin = masks
centers = [np.argwhere(m)[:, ::-1].mean(axis=0) for m in masks]
matrix = np.eye(2, 3, dtype=np.float32)
matrix[:, 2] = centers[1] - centers[0]
initial = matrix.copy()
score, matrix = cv2.findTransformECC(target.astype(np.float32), origin.astype(np.float32), matrix,
                                    cv2.MOTION_EUCLIDEAN,
                                    (cv2.TERM_CRITERIA_COUNT | cv2.TERM_CRITERIA_EPS, 100, 1e-6), None, 5)
linear = matrix[:, :2].astype(float)
determinant = float(np.linalg.det(linear))
stretches = np.linalg.svd(linear, compute_uv=False)
assert abs(determinant - 1) < 1e-6 and np.max(np.abs(stretches-1)) < 1e-6
yy, xx = np.mgrid[:390, :318].astype(float)
grid = np.stack((xx, yy), axis=-1)
mapping = grid @ linear.T + matrix[:, 2]
disp = np.linalg.norm(mapping-grid, axis=-1)
warped = cv2.warpAffine(origin.astype(np.float32), matrix, (318, 390),
                        flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT)
core = cv2.erode(target.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)


def support(domain):
    q = mapping[domain]
    floor = np.floor(q).astype(int)
    fraction = q-floor
    weights = np.zeros((len(q), 4))
    colors = np.zeros((len(q), 3))
    for dx, dy in [(0, 0), (1, 0), (0, 1), (1, 1)]:
        x, y = floor[:, 0]+dx, floor[:, 1]+dy
        weight = (fraction[:, 0] if dx else 1-fraction[:, 0]) * (fraction[:, 1] if dy else 1-fraction[:, 1])
        inside = (x >= 0) & (x < 318) & (y >= 0) & (y < 390)
        labels = np.full(len(q), 3)
        xi, yi = x[inside], y[inside]
        labels[inside] = np.where(raw[299, yi, xi, 3] <= 4, 0, np.where(origin[yi, xi], 1, 2))
        for category in range(4):
            weights[:, category] += weight * (labels == category)
        colors[inside] += weight[inside, None] * raw[299, yi, xi, :3]
    assert np.max(np.abs(weights.sum(axis=1)-1)) < 1e-10
    fully_supported = weights[:, 1] > 1-1e-8
    return dict(pixels=int(len(q)), meanWeights=dict(zip(['emptyAlpha', 'segmentedTail', 'otherVisible', 'outside'], weights.mean(axis=0).tolist())),
                fullyTailSupportedPixels=int(fully_supported.sum()), pixelsTouchingOtherVisible=int(np.count_nonzero(weights[:, 2] > 1e-8)),
                pixelsTouchingEmpty=int(np.count_nonzero(weights[:, 0] > 1e-8)),
                premulRgbMAEOnFullySupported=float(np.abs(colors[fully_supported] - raw[0, :, :, :3][domain][fully_supported]).mean()))


iou = lambda a, b: float((a & b).sum()/(a | b).sum())
result = dict(utc=datetime.now(timezone.utc).isoformat(), source=prior['source'],
              priorLabels=dict(path=str(prior_path), sha256=sha(prior_path)), toolSha256=sha(__file__),
              method='One centroid-initialized Euclidean ECC of binary tail labels; 100 iterations, epsilon1e-6, Gaussian5',
              initialMatrix=initial.tolist(), matrix=matrix.tolist(), eccScore=float(score),
              determinant=determinant, singularValues=stretches.tolist(),
              maxTailDomainDisplacement=float(disp[target].max()),
              shape=dict(rawIoU=iou(target, origin), rigidIoU=iou(target, warped > .5),
                         targetPixels=int(target.sum()), sourcePixels=int(origin.sum()), warpedPixels=int((warped > .5).sum())),
              support=dict(visibleTail=support(target), eroded3pxCore=support(core)),
              imagesCreated=0, runtimeChanged=False,
              limits=['Rigid fitting label silhouettes does not prove material correspondence or texture alignment.',
                      'Masks are diagnostic; uncertain occlusion/alpha ownership remains.',
                      'No endpoint RGB raster, sequence, hidden texture or runtime asset generated.'])
(OUT / 'report.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(result, separators=(',', ':')))
