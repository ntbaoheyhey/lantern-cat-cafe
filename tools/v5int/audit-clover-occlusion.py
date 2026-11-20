"""Audit the targeted cloth label against the already-rejected rigid mapping."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, '/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/python')
import cv2
import numpy as np
cv2.setNumThreads(1)
PATH = Path('/Users/bao/taskbar-hero-cardrpg-a6/reports/v5/CXV/M-clover-rigid-occlusion-R1.json')
verified = {}


def pin(path, expected=None):
    path = Path(path)
    if str(path) not in verified:
        digest = hashlib.sha256()
        with path.open('rb') as stream:
            for block in iter(lambda: stream.read(1024*1024), b''):
                digest.update(block)
        verified[str(path)] = digest.hexdigest()
    if expected:
        assert verified[str(path)] == expected, path
    return path


def read(ref):
    if isinstance(ref, dict):
        return json.loads(pin(ref['path'], ref['sha256']).read_text())
    return json.loads(pin(ref).read_text())


published = read(PATH)
for item in published.values():
    if isinstance(item, dict) and 'path' in item and 'sha256' in item:
        pin(item['path'], item['sha256'])
observation = read(published['observation'])
for key in ['source', 'image', 'labelImage']:
    pin(observation[key]['path'], observation[key]['sha256'])
rigid = read(published['rigidSource'])
labels = read(rigid['priorLabels'])
masks = [np.load(pin(row['output']['path'], row['output']['sha256']), allow_pickle=False)['consensus'].astype(bool) for row in labels['rows']]
target, source = masks
assert target.shape == source.shape == (390, 318)
raw = np.memmap(observation['source']['path'], np.uint8, 'r', shape=(300, 390, 318, 4))
cloth = np.zeros((390, 318), np.uint8)
cv2.fillPoly(cloth, [np.asarray(observation['newSparseObservation']['polygon'], np.int32)], 1)
cloth = cloth.astype(bool)
assert int(cloth.sum()) == published['newClothPixels'] == 28
assert not np.any(cloth & source) and np.all(raw[299, :, :, 3][cloth] == 255)
sparse = np.load(published['independentSparseLabels']['path'], allow_pickle=False)
core = cv2.erode(target.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
matrix = np.asarray(rigid['matrix'], float)
other = (raw[299, :, :, 3] > 4) & ~source


def sample(x, y, mask):
    x0, y0 = int(np.floor(x)), int(np.floor(y))
    value = 0.
    for sx in [x0, x0+1]:
        for sy in [y0, y0+1]:
            if 0 <= sx < 318 and 0 <= sy < 390 and mask[sy, sx]:
                value += (1-abs(x-sx))*(1-abs(y-sy))
    return value


assert sample(81, 318, cloth) == 1 and sample(1081, 1318, cloth) == 0
failed = np.zeros_like(core)
for y, x in np.argwhere(core):
    sx, sy = matrix @ [x, y, 1]
    failed[y, x] = sample(sx, sy, other) > 1e-8
assert int(failed.sum()) == 92 and int((failed & (sparse == 1)).sum()) == 40
rows = []
for name, domain in [('allSegmentedTargetTail', target), ('eroded3pxCore', core), ('rigidOtherVisibleFailures', failed), ('independentTailAmongFailures', failed & (sparse == 1))]:
    coords = np.argwhere(domain)[:, ::-1]
    values = np.array([sample(*(matrix @ [x, y, 1]), cloth) for x, y in coords])
    row = dict(domain=name, pixels=int(domain.sum()), pixelsTouchingNewCloth=int(np.count_nonzero(values > 1e-8)), meanNewClothWeight=float(values.mean()), totalNewClothWeight=float(values.sum()), destinationsTouchingNewCloth=coords[values > 1e-8].tolist())
    expected = next(item for item in published['rows'] if item['domain'] == name)
    for key, value in row.items():
        if isinstance(value, float):
            assert abs(value-expected[key]) < 1e-10, (name, key)
        else:
            assert value == expected[key], (name, key)
    rows.append({k: v for k, v in row.items() if k != 'destinationsTouchingNewCloth'})
result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), source=str(PATH), verifiedHashes=verified, independentlyReproduced=rows,
              targetedClothPixels=28, unsupportedCorePixels=92, independentTailFailures=40, imagesViewed=0, runtimeChanged=False, acceptedRepair=False,
              decision='ACCEPT targeted observation arithmetic; retain rigid and contour repair rejections',
              limits='These cloth labels were drawn after locating failures, not independent holdouts. 27/92 unsupported destinations and 7/40 independently labelled tail destinations touch the targeted cloth. All remaining unknowns remain unknown. No hidden material recovered or new warp authorized.')
(ROOT/'reports/v5/CXI/evidence/v8-clover-targeted-occlusion-review.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps({k: v for k, v in result.items() if k != 'verifiedHashes'}))
print('Verified hashes:', len(verified))
