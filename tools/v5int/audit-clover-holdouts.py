#!/usr/bin/env python3
"""Reproduce sparse controls and score frozen masks/maps without image viewing."""
import ast
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import cv2
import numpy as np

cv2.setNumThreads(1)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
CXV = Path('/Users/bao/taskbar-hero-cardrpg-a6')
parser = argparse.ArgumentParser()
parser.add_argument('--output-name', default='clover-holdout-audit-r1')
args = parser.parse_args()
assert Path(args.output_name).name == args.output_name
OUT = BASE / args.output_name
OUT.mkdir(exist_ok=False)
verified = []


def pin(path, expected=None):
    path = Path(path)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if expected is not None:
        assert digest == expected, f'Hash mismatch: {path}'
    verified.append(dict(path=str(path), sha256=digest, bytes=path.stat().st_size))
    return path


def read(path, expected=None):
    return json.loads(pin(path, expected).read_text())


delivery = read(CXV / 'reports/v5/CXV/M-clover-boundary-observations-R1.json')
ann = read(delivery['annotations']['path'], delivery['annotations']['sha256'])
assert ann == delivery['annotationPayload']
raw_report = read(delivery['raw']['path'], delivery['raw']['sha256'])
assert raw_report['rows'] == delivery['rows']
pin(CXV / 'tools/v5vfx/audit-clover-boundary-study.py', delivery['harnessSha256'])
for receipt in delivery['reviewImages'] + [delivery['sourcePlotReceipt']]:
    pin(receipt['path'], receipt['sha256'])
source = pin(ann['source']['path'], ann['source']['sha256'])
raw = np.memmap(source, np.uint8, 'r', shape=(300, 390, 318, 4))
h, w = raw.shape[1:3]
ys, xs = np.indices((h, w), dtype=float)
grid = np.stack([xs, ys], axis=-1)
labels = {}
region_checks = []
for frame in ann['frames']:
    index = frame['frame']
    lab = np.zeros((h, w), np.uint8)
    for group, value in [('certainTail', 1), ('certainCloth', 2)]:
        for region in frame[group]:
            poly = np.asarray(region['polygon'], np.int32)
            assert (poly >= 0).all() and (poly < [w, h]).all()
            domain = np.zeros((h, w), np.uint8)
            cv2.fillPoly(domain, [poly], 1)
            domain = domain.astype(bool)
            assert not lab[domain].any()
            assert raw[index, :, :, 3][domain].min() >= 250
            lab[domain] = value
            published = next(r for r in delivery['regions'] if r['frame'] == index and r['name'] == region['name'])
            assert int(domain.sum()) == published['pixels']
            region_checks.append(dict(frame=index, name=region['name'], pixels=int(domain.sum())))
    lab[(lab == 0) & (raw[index, :, :, 3] <= 4)] = 3
    saved = pin(CXV / f'work/v5/CXV/batch-m/clover-boundary-study-R1/sparse-labels-F{index}.npy')
    assert np.array_equal(lab, np.load(saved))
    labels[index] = lab


def taps(mapping, lab, domain):
    points = mapping[domain]
    floor = np.floor(points).astype(np.int64)
    frac = points - floor
    weights = np.zeros((len(points), 5), float)
    for dx, dy in [(0, 0), (1, 0), (0, 1), (1, 1)]:
        coords = floor + [dx, dy]
        valid = ((coords >= 0) & (coords < [w, h])).all(axis=1)
        category = np.full(len(points), 4, int)
        inside = coords[valid]
        category[valid] = lab[inside[:, 1], inside[:, 0]]
        weight = np.where(dx, frac[:, 0], 1-frac[:, 0]) * np.where(dy, frac[:, 1], 1-frac[:, 1])
        np.add.at(weights, (np.arange(len(points)), category), weight)
    assert np.max(np.abs(weights.sum(axis=1)-1)) < 1e-12
    return weights


names = ['unknown', 'annotatedTail', 'annotatedCloth', 'alphaEmpty', 'outsideRaster']
domain = labels[0] == 1
assert (taps(grid, labels[0], domain)[:, 1] == 1).all()
assert (taps(grid - [2*w, 2*h], labels[0], domain)[:, 4] == 1).all()
old = read(BASE / 'clover-rigid-endpoint-r1/report.json')
tool = pin(ROOT / 'tools/v5int/study-clover-rigid-endpoint.py', delivery['sourceFunctionSha256'])
assert old['toolSha256'] == delivery['sourceFunctionSha256']
node = next(n for n in ast.parse(tool.read_text()).body if isinstance(n, ast.FunctionDef) and n.name == 'rigid_mls')
scope = {'np': np}
exec(compile(ast.Module(body=[node], type_ignores=[]), str(tool), 'exec'), scope)
unmasked = scope['rigid_mls'](grid, np.array(old['controls']), np.array(old['targets']))
saved_map = np.load(pin(BASE / 'clover-rigid-endpoint-r1/mapping.npy'))
mask = np.load(pin(BASE / 'clover-dis-endpoint-r1/mask.npy'))
assert np.array_equal(grid + (unmasked-grid)*mask[..., None], saved_map)
rigid = read(BASE / 'clover-rigid-layer-r1/report.json')
matrix = np.array(rigid['matrix'])
rigid_map = grid @ matrix[:, :2].T + matrix[:, 2]
rows = []
for name, mapping in [('identity', grid), ('protectedMLS', saved_map), ('unmaskedMLS', unmasked), ('rigidLayer', rigid_map)]:
    weights = taps(mapping, labels[299], domain)
    fractions = dict(zip(names, weights.mean(axis=0).tolist()))
    counts = dict(zip(names, (weights > 1e-9).sum(axis=0).tolist()))
    if name != 'rigidLayer':
        published = next(r for r in delivery['rows'] if r['mapping'] == name and r['targetDomain'] == 'annotatedTailTarget')
        assert counts == published['pixelsTouchingCategory']
        assert max(abs(fractions[k]-published['weightedSupportFraction'][k]) for k in names) < 1e-12
    rows.append(dict(mapping=name, pixels=int(domain.sum()), weightedSupportFraction=fractions, pixelsTouchingCategory=counts))

endpoint = read(BASE / 'clover-endpoint-labels-r1/report.json')
agreement = []
frozen_masks = {}
for row in endpoint['rows']:
    frame = row['endpointFrame']
    trials = np.load(pin(row['output']['path'], row['output']['sha256']))['trials']
    frozen_masks[frame] = trials[1]
    tail = labels[frame] == 1
    cloth = labels[frame] == 2
    agreement.append(dict(frame=frame, sparseTailPixels=int(tail.sum()), sparseClothPixels=int(cloth.sum()),
                          trials=[dict(selectedPixels=int(m.sum()), annotatedTailSelected=int((m & tail).sum()),
                                       annotatedClothSelected=int((m & cloth).sum()), annotatedTailMissed=int((~m & tail).sum())) for m in trials]))

# Localize full-domain failures without promoting unknown pixels to tail.
segmented_source = np.where(raw[299, :, :, 3] <= 4, 3, np.where(frozen_masks[299], 1, 2)).astype(np.uint8)
full_domain = frozen_masks[0]
full_weights = taps(rigid_map, segmented_source, full_domain)
other_map = np.zeros((h, w), float)
other_map[full_domain] = full_weights[:, 2]
core = cv2.erode(full_domain.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
bad_core = core & (other_map > 1e-8)
assert int(bad_core.sum()) == rigid['support']['eroded3pxCore']['pixelsTouchingOtherVisible']
count, components, stats, centers = cv2.connectedComponentsWithStats(bad_core.astype(np.uint8), 8)
boundary_rows = []
distance = cv2.distanceTransform((~frozen_masks[299]).astype(np.uint8), cv2.DIST_L2, cv2.DIST_MASK_PRECISE)
for component in range(1, count):
    selected = components == component
    sparse_weights = taps(rigid_map, labels[299], selected)
    coords = rigid_map[selected]
    rounded = np.rint(coords).astype(int)
    assert ((rounded >= 0) & (rounded < [w, h])).all()
    nearest_distance = distance[rounded[:, 1], rounded[:, 0]]
    boundary_rows.append(dict(pixels=int(selected.sum()), bbox=stats[component, :4].tolist(),
                              sourceCoordinateBounds=[coords.min(axis=0).tolist(), coords.max(axis=0).tolist()],
                              targetInsideSparseTail=int((selected & (labels[0] == 1)).sum()),
                              sparseSourceMean=dict(zip(names, sparse_weights.mean(axis=0).tolist())),
                              sourceNearestDistanceOutsideSegmentedTail=dict(max=float(nearest_distance.max()), mean=float(nearest_distance.mean()))))

report = dict(utc=datetime.now(timezone.utc).isoformat(), source=ann['source'], verified=verified,
              harnessSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), regions=region_checks,
              originalRowsReproduced=True, controls=['identity exact', 'outside exact', 'bilinear weight sum', 'published rows exact within 1e-12'],
              segmentationAgreement=agreement, sparseTargetSampling=rows, imagesViewed=0, runtimeChanged=False,
              unresolvedRigidBoundary=dict(corePixels=int(core.sum()), unsupportedCorePixels=int(bad_core.sum()), components=boundary_rows),
              acceptedRepair=False, limits=['Frozen sparse analyst controls, not full boundaries, material correspondence or hidden anatomy.',
                                           'Agreement against these controls cannot prove all tail pixels or boundary alpha.',
                                           'Unknown source taps remain unknown, including those selected by the diagnostic segmentation.'])
(OUT / 'report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(dict(verified=len(verified), segmentationAgreement=agreement, sparseTargetSampling=rows)))
