#!/usr/bin/env python3
"""Compare frozen observed tail masks as sources; no output raster or synthesis."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import cv2
import numpy as np

cv2.setNumThreads(1)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
OUT = BASE / 'clover-observed-support-r1'
OUT.mkdir(exist_ok=False)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
inputs = []
masks = {}
for name, frame_key in [('clover-seeded-boundary-r1', 'frame'), ('clover-endpoint-labels-r1', 'endpointFrame')]:
    report_path = BASE / name / 'report.json'
    prior = json.loads(report_path.read_text())
    inputs.append(dict(path=str(report_path), sha256=sha(report_path)))
    for row in prior['rows']:
        p = Path(row['output']['path'])
        assert sha(p) == row['output']['sha256']
        inputs.append(row['output'])
        masks[row[frame_key]] = np.load(p)['trials'][1]
source = Path(prior['source']['path'])
assert sha(source) == prior['source']['sha256']
raw = np.memmap(source, np.uint8, 'r', shape=(300, 390, 318, 4))
h, w = raw.shape[1:3]
ys, xs = np.indices((h, w), dtype=float)
grid = np.stack([xs, ys], axis=-1)
target = masks[0]
core = cv2.erode(target.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
target_center = np.argwhere(target)[:, ::-1].mean(axis=0)
prior_rigid = json.loads((BASE / 'clover-rigid-layer-r1/report.json').read_text())
rows = []
for frame in [0, 15, 285, 299]:
    origin = masks[frame]
    matrix = np.eye(2, 3, dtype=np.float32)
    matrix[:, 2] = np.argwhere(origin)[:, ::-1].mean(axis=0) - target_center
    score, matrix = cv2.findTransformECC(target.astype(np.float32), origin.astype(np.float32), matrix,
        cv2.MOTION_EUCLIDEAN, (cv2.TERM_CRITERIA_COUNT | cv2.TERM_CRITERIA_EPS, 100, 1e-6), None, 5)
    if frame == 299:
        assert np.array_equal(matrix, np.array(prior_rigid['matrix'], np.float32))
    determinant = float(np.linalg.det(matrix[:, :2].astype(float)))
    assert abs(determinant - 1) < 1e-6
    mapping = grid @ matrix[:, :2].astype(float).T + matrix[:, 2]
    supports = {}
    for name, domain in [('wholeVisibleTail', target), ('eroded3pxCore', core)]:
        points = mapping[domain]
        floor = np.floor(points).astype(np.int64)
        fraction = points - floor
        weights = np.zeros((len(points), 4), float)
        for dx, dy in [(0, 0), (1, 0), (0, 1), (1, 1)]:
            coords = floor + [dx, dy]
            valid = ((coords >= 0) & (coords < [w, h])).all(axis=1)
            lab = np.full(len(points), 3)
            x, y = coords[valid, 0], coords[valid, 1]
            lab[valid] = np.where(raw[frame, y, x, 3] <= 4, 0, np.where(origin[y, x], 1, 2))
            weight = (fraction[:, 0] if dx else 1-fraction[:, 0]) * (fraction[:, 1] if dy else 1-fraction[:, 1])
            np.add.at(weights, (np.arange(len(points)), lab), weight)
        assert np.max(np.abs(weights.sum(axis=1)-1)) < 1e-12
        supports[name] = dict(pixels=int(domain.sum()), meanWeights=dict(zip(['empty', 'segmentedTail', 'otherVisible', 'outside'], weights.mean(axis=0).tolist())),
                              fullyTailSupportedPixels=int((weights[:, 1] > 1-1e-8).sum()),
                              pixelsTouchingOtherVisible=int((weights[:, 2] > 1e-8).sum()), pixelsTouchingEmpty=int((weights[:, 0] > 1e-8).sum()))
    if frame == 0:
        assert supports['eroded3pxCore']['fullyTailSupportedPixels'] == int(core.sum())
    rows.append(dict(sourceFrame=frame, targetFrame=0, matrix=matrix.tolist(), eccScore=score, determinant=determinant, support=supports))
report = dict(utc=datetime.now(timezone.utc).isoformat(), source=prior['source'], inputs=inputs, harnessSha256=sha(__file__),
              rows=rows, imagesCreated=0, runtimeChanged=False, acceptedRepair=False,
              limits=['Diagnostic segmented-tail support is not anatomical ground truth or material correspondence.',
                      'No interpolation, temporal source switching, alpha compositing or loop velocity has been validated.',
                      'Frame0 identity is a numeric control, not a repair candidate.'])
(OUT / 'report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(rows))
