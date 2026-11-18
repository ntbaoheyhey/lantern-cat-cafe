#!/usr/bin/env python3
"""Audit layer support of the saved Clover maps; never renders or changes media."""
from pathlib import Path
from datetime import datetime, timezone
import ast
import hashlib
import json
import cv2
import numpy as np

cv2.setNumThreads(1)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
OUT = BASE / 'clover-layer-support-r1'
OUT.mkdir(exist_ok=False)
prior_path = BASE / 'clover-rigid-endpoint-r1/report.json'
prior = json.loads(prior_path.read_text())
source = Path(prior['source'])
mask_path = BASE / 'clover-dis-endpoint-r1/mask.npy'
saved_path = BASE / 'clover-rigid-endpoint-r1/mapping.npy'
tool = ROOT / 'tools/v5int/study-clover-rigid-endpoint.py'


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()


assert digest(source) == prior['sourceSha256']
mask = np.load(mask_path).astype(float)
h, w = mask.shape
assert (w, h) == (318, 390)
raw = np.memmap(source, np.uint8, 'r', shape=(300, h, w, 4))
yy, xx = np.mgrid[:h, :w].astype(float)
grid = np.stack((xx, yy), axis=-1)
extent = (yy >= 232) & (yy < 358) & (xx < 118)


def warm_component(frame, domain, rg=1.035, rb=1.15):
    """Heuristic color support only, not an anatomical or recovered Cubism layer."""
    f = raw[frame]
    red, green, blue = np.moveaxis(f[:, :, :3].astype(float), -1, 0)
    warm = ((red > green * rg) & (red > blue * rb) &
            (f[:, :, 3] > 48) & domain).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(warm, 8)
    assert count > 1
    return labels == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])


def source_labels(frame, warm):
    f = raw[frame]
    red, green, _ = np.moveaxis(f[:, :, :3].astype(float), -1, 0)
    empty = f[:, :, 3] <= 4
    green_evidence = (green >= red * .98) & (f[:, :, 3] > 64) & ~warm
    labels = np.full((h, w), 3, np.uint8)
    labels[empty] = 0
    labels[warm] = 1
    labels[green_evidence] = 2
    return labels


def support(mapping, labels):
    """Exact geometric bilinear weights, not OpenCV's quantized pixel interpolation."""
    floor = np.floor(mapping).astype(np.int64)
    fraction = mapping - floor
    weights = np.zeros((h, w, 5), float)
    for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1)):
        x, y = floor[..., 0] + dx, floor[..., 1] + dy
        valid = (x >= 0) & (x < w) & (y >= 0) & (y < h)
        category = np.where(valid, labels[np.clip(y, 0, h-1), np.clip(x, 0, w-1)], 4)
        weight = (fraction[..., 0] if dx else 1-fraction[..., 0]) * (fraction[..., 1] if dy else 1-fraction[..., 1])
        for label in range(5):
            weights[..., label] += weight * (category == label)
    assert np.allclose(weights.sum(axis=-1), 1, atol=1e-12)
    return weights


names = ['alphaEmpty', 'warmComponent', 'greenClothHeuristic', 'unclassifiedVisible', 'outsideRaster']
target = warm_component(0, mask > 0)
expanded_target = warm_component(0, extent)
last = warm_component(299, mask > 0)
expanded_last = warm_component(299, extent)
identity = support(grid, source_labels(0, expanded_target))
assert np.all(identity[expanded_target, 1] == 1)
assert np.all(identity[..., 4] == 0)
outside = support(grid - [w*2, h*2], source_labels(0, expanded_target))
assert np.all(outside[..., 4] == 1)

# Reuse the exact saved inverse-map formula, without executing its trial writes.
tree = ast.parse(tool.read_text())
definition = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'rigid_mls')
namespace = {'np': np}
exec(compile(ast.Module(body=[definition], type_ignores=[]), str(tool), 'exec'), namespace)
unmasked = namespace['rigid_mls'](grid, np.array(prior['controls']), np.array(prior['targets']))
saved = np.load(saved_path)
assert np.array_equal(grid + (unmasked-grid) * mask[..., None], saved)

domains = {
    'originalWarmTarget': target,
    'expandedWarmTarget': expanded_target,
    'expandedWarmTargetFullMask': expanded_target & (mask >= .999999),
    'expandedWarmTargetTransition': expanded_target & (mask > 0) & (mask < .999999),
    'expandedWarmTargetProtected': expanded_target & (mask == 0),
}
rows = []
for source_name, component in [('originalWarmSource', last), ('expandedWarmSource', expanded_last)]:
    labels = source_labels(299, component)
    for map_name, mapping in [('identity', grid), ('protectedMLS', saved), ('unmaskedMLS', unmasked)]:
        weights = support(mapping, labels)
        for domain_name, domain in domains.items():
            selected = weights[domain]
            count = len(selected)
            row = {'sourceDomain': source_name, 'map': map_name, 'targetDomain': domain_name, 'pixels': count}
            if count:
                row.update({
                    'weightedSupportFraction': dict(zip(names, selected.mean(axis=0).tolist())),
                    'pixelsTouchingCategory': dict(zip(names, (selected > 1e-9).sum(axis=0).tolist())),
                    'fullyWarmSupportedPixels': int((selected[:, 1] >= 1-1e-9).sum()),
                })
            rows.append(row)

# Sensitivity is uncertainty evidence, never a proposal to relax the domain.
sensitivity = []
for frame in (0, 299):
    reference = expanded_target if frame == 0 else expanded_last
    for rg, rb in [(1.02, 1.10), (1.035, 1.15), (1.05, 1.20)]:
        candidate = warm_component(frame, extent, rg, rb)
        sensitivity.append({'frame': frame, 'redGreenRatio': rg, 'redBlueRatio': rb,
                            'pixels': int(candidate.sum()),
                            'symmetricDifferenceFromReference': int((candidate ^ reference).sum()),
                            'iouWithReference': float((candidate & reference).sum() / (candidate | reference).sum())})

report = {
    'utc': datetime.now(timezone.utc).isoformat(), 'status': 'DIAGNOSTIC_NOT_ACCEPTANCE',
    'question': 'Do saved inverse maps sample observed tail-colored pixels, green evidence, empty alpha or unknown visible pixels?',
    'inputs': [{'path': str(p), 'sha256': digest(p)} for p in (source, prior_path, mask_path, saved_path, tool, Path(__file__))],
    'dimensions': [w, h], 'frames': {'target': 0, 'source': 299},
    'exactProtectedMapReproduced': True,
    'classification': {'alphaEmpty': 'alpha<=4', 'warmComponent': 'largest connected warm-color component, alpha>48, constrained by named domain',
                       'greenClothHeuristic': 'green>=.98*red and alpha>64, excluding warm component; may include other neutral/green art',
                       'unclassifiedVisible': 'all remaining in-raster pixels', 'outsideRaster': 'bilinear tap outside source image'},
    'domains': {name: int(domain.sum()) for name, domain in domains.items()},
    'rows': rows, 'sensitivity': sensitivity,
    'limits': 'No anatomical ground truth or full matte recovered. Color support cannot establish material correspondences, missing-pixel recovery or acceptable strain. Bilinear support uses geometric weights; no remapped raster is generated.',
    'imagesCreated': 0, 'runtimeChanged': False, 'sequenceChanged': False,
}
path = OUT / 'report.json'
path.write_text(json.dumps(report, indent=2) + '\n')
summary = {'utc': report['utc'], 'raw': {'path': str(path), 'sha256': digest(path)},
           'inputs': report['inputs'], 'domains': report['domains'], 'sensitivity': sensitivity,
           'rows': [row for row in rows if row['sourceDomain'] == 'expandedWarmSource' and row['targetDomain'] in ['expandedWarmTarget', 'expandedWarmTargetTransition']],
           'limits': report['limits'], 'imagesCreated': 0, 'runtimeChanged': False, 'sequenceChanged': False}
(ROOT / 'reports/v5/CXI/evidence/v8-clover-layer-support-review.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary))
