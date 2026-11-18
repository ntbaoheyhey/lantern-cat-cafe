"""Audit a targeted visible-cloth observation against the frozen rigid tail map."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np

cv2.setNumThreads(1)
BASE = ROOT / 'work/v5/CXV/batch-m/clover-rigid-occlusion-R1'
CXI = Path('/Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m')
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
ref = lambda p: dict(path=str(p), sha256=sha(p))
obs_path = BASE / 'report.json'
obs = json.loads(obs_path.read_text())
assert obs['image']['views'] == obs['labelImage']['views'] == 1
for item in [obs['source'], obs['image'], obs['labelImage']]:
    assert sha(item['path']) == item['sha256']
raw = np.memmap(obs['source']['path'], np.uint8, 'r', shape=(300, 390, 318, 4))
rigid_path = CXI / 'clover-rigid-layer-r1/report.json'
rigid = json.loads(rigid_path.read_text())
assert rigid['source'] == obs['source']
labels_path = Path(rigid['priorLabels']['path'])
assert sha(labels_path) == rigid['priorLabels']['sha256']
labels = json.loads(labels_path.read_text())
masks = []
for item in labels['rows']:
    assert sha(item['output']['path']) == item['output']['sha256']
    masks.append(np.load(item['output']['path'], allow_pickle=False)['consensus'])
target, origin = masks
cloth = np.zeros(target.shape, np.uint8)
cv2.fillPoly(cloth, [np.array(obs['newSparseObservation']['polygon'], np.int32)], 1)
cloth = cloth.astype(bool)
assert cloth.sum() == 28 and np.all(raw[299, :, :, 3][cloth] == 255)
assert not np.any(cloth & origin), 'New cloth observation contradicts existing tail hypothesis'
yy, xx = np.mgrid[:390, :318].astype(float)
grid = np.stack((xx, yy), axis=-1)
matrix = np.array(rigid['matrix'], float)
mapping = grid @ matrix[:, :2].T + matrix[:, 2]
core = cv2.erode(target.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
sparse_path = ROOT / 'work/v5/CXV/batch-m/clover-boundary-study-R1/sparse-labels-F0.npy'
sparse = np.load(sparse_path, allow_pickle=False)


def weights(points, mask):
    floor = np.floor(points).astype(int)
    fraction = points-floor
    result = np.zeros(len(points))
    for dx, dy in [(0, 0), (1, 0), (0, 1), (1, 1)]:
        x, y = floor[:, 0]+dx, floor[:, 1]+dy
        w = (fraction[:, 0] if dx else 1-fraction[:, 0]) * (fraction[:, 1] if dy else 1-fraction[:, 1])
        valid = (x >= 0) & (x < 318) & (y >= 0) & (y < 390)
        result[valid] += w[valid] * mask[y[valid], x[valid]]
    return result


assert np.all(weights(grid[cloth], cloth) == 1)
assert np.all(weights(grid[cloth] + [1000, 1000], cloth) == 0)
other = (raw[299, :, :, 3] > 4) & ~origin
core_other_weights = weights(mapping[core], other)
assert np.count_nonzero(core_other_weights > 1e-8) == 92
assert abs(core_other_weights.mean()-rigid['support']['eroded3pxCore']['meanWeights']['otherVisible']) < 1e-10
failures = np.zeros(core.shape, bool)
failures[core] = core_other_weights > 1e-8
assert np.count_nonzero(failures & (sparse == 1)) == 40
rows = []
for name, domain in [('allSegmentedTargetTail', target), ('eroded3pxCore', core),
                     ('rigidOtherVisibleFailures', failures), ('independentTailAmongFailures', failures & (sparse == 1))]:
    weight = weights(mapping[domain], cloth)
    touches = weight > 1e-8
    xy = np.argwhere(domain)[:, ::-1]
    rows.append(dict(domain=name, pixels=int(domain.sum()),
        pixelsTouchingNewCloth=int(touches.sum()), meanNewClothWeight=float(weight.mean()),
        totalNewClothWeight=float(weight.sum()),
        destinationsTouchingNewCloth=xy[touches].tolist()))
result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    observation=ref(obs_path), rigidSource=ref(rigid_path), maskSource=ref(labels_path),
    independentSparseLabels=ref(sparse_path), harness=ref(__file__),
    newClothPixels=int(cloth.sum()), reproducedRigidCoreFailures=92,
    reproducedIndependentTailFailures=40, identityAndOutsideControlsPassed=True,
    rows=rows, imagesCreated=0, runtimeChanged=False, repairAccepted=False,
    decision='The frozen rigid tail map samples independently observed visible cloth within its previously unknown source region. Reject remains; no texture synthesis or correspondence is inferred.',
    limits='Targeted analyst label after the failure was known, not independent held-out segmentation ground truth. Only 28 visible source pixels are labelled; all remaining unknowns stay unknown. This does not recover hidden tail or establish material correspondences.')
out = BASE / 'comparison.json'
assert not out.exists()
out.write_text(json.dumps(result, indent=2)+'\n')
result['raw'] = ref(out)
(ROOT / 'reports/v5/CXV/M-clover-rigid-occlusion-R1.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps({k: v for k, v in result.items() if k != 'rows'}))
for r in rows:
    print(json.dumps({k: v for k, v in r.items() if k != 'destinationsTouchingNewCloth'}))
