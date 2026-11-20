#!/usr/bin/env python3
"""Diagnose saved Clover MLS domain strain; creates no images or media changes."""
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
OUT = BASE / 'clover-domain-r1'
OUT.mkdir(exist_ok=False)
prior_path = BASE / 'clover-rigid-endpoint-r1/report.json'
prior = json.loads(prior_path.read_text())
mask_path = BASE / 'clover-dis-endpoint-r1/mask.npy'
mask = np.load(mask_path).astype(float)
h, w = mask.shape
source = Path(prior['source'])
raw = np.memmap(source, np.uint8, 'r', shape=(300, h, w, 4))
yy, xx = np.mgrid[:h, :w].astype(float)
grid = np.stack((xx, yy), axis=-1)

# Reuse the exact prior formula without executing the trial's top-level writes.
tool = ROOT / 'tools/v5int/study-clover-rigid-endpoint.py'
tree = ast.parse(tool.read_text())
definition = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'rigid_mls')
namespace = {'np': np}
exec(compile(ast.Module(body=[definition], type_ignores=[]), str(tool), 'exec'), namespace)
rigid_mls = namespace['rigid_mls']
controls, targets = np.array(prior['controls']), np.array(prior['targets'])
unmasked = rigid_mls(grid, controls, targets)
masked = grid + (unmasked - grid) * mask[..., None]
saved_path = BASE / 'clover-rigid-endpoint-r1/mapping.npy'
saved = np.load(saved_path)
assert np.array_equal(masked, saved), 'Diagnostic must reproduce the exact rejected map'


def cell_corners(values):
    return np.stack((values[:-1, :-1], values[:-1, 1:], values[1:, :-1], values[1:, 1:]))


def jacobians(mapping):
    a, b, c, d = cell_corners(mapping)
    u0, u1, v0, v1 = b-a, d-c, c-a, d-b
    return np.stack(tuple(np.stack((u, v), axis=-1) for u, v in ((u0, v0), (u0, v1), (u1, v0), (u1, v1))))


def tail_component(frame):
    """Exact warm largest-component domain from the prior correspondence tool."""
    f = raw[frame]
    r, g, b = np.moveaxis(f[:, :, :3].astype(float), -1, 0)
    warm = ((r > g*1.035) & (r > b*1.15) & (f[:, :, 3] > 48) & (mask > 0)).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(warm, 8)
    assert count > 1
    return labels == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024*1024), b''):
            result.update(chunk)
    return result.hexdigest()


assert digest(source) == prior['sourceSha256']
identity_jac = jacobians(grid)
assert np.all(np.linalg.det(identity_jac) == 1)
reflected = grid.copy()
reflected[..., 0] *= -1
assert np.all(np.linalg.det(jacobians(reflected)) == -1)
rotated = grid @ np.array([[0., -1.], [1., 0.]]).T + [3., -4.]
assert np.allclose(np.linalg.svd(jacobians(rotated), compute_uv=False), 1)

visible = tail_component(0)
visible_corners = cell_corners(visible)
mask_corners = cell_corners(mask)
visible_any = visible_corners.any(axis=0)
visible_core = visible_corners.all(axis=0)
active = (mask_corners > .05).any(axis=0)
full = (mask_corners >= .999999).all(axis=0)
protected = (mask_corners == 0).all(axis=0)
transition = ~full & ~protected
domains = {
    'active': active,
    'visibleAnyCorner': visible_any,
    'visibleAllCorners': visible_core,
    'visibleFullMask': visible_any & full,
    'visibleTransition': visible_any & transition,
    'nonVisibleTransition': ~visible_any & transition,
    'protectedAllCorners': protected,
}


def audit(mapping):
    jac = jacobians(mapping)
    det = np.linalg.det(jac)
    stretches = np.linalg.svd(jac, compute_uv=False)
    rows = {}
    for name, domain in domains.items():
        n = int(domain.sum())
        row = {'cells': n}
        if n:
            lo, hi = stretches[:, domain, 1], stretches[:, domain, 0]
            row.update({
                'foldedCells': int((det[:, domain] <= 0).any(axis=0).sum()),
                'minimumCorner': float(det[:, domain].min()),
                'minimumStretch': float(lo.min()),
                'stretchP01': float(np.percentile(lo, 1)),
                'stretchMedian': float(np.median(lo)),
                'maximumStretch': float(hi.max()),
                'maximumAnisotropy': float((hi/np.maximum(lo, 1e-12)).max()),
            })
        rows[name] = row
    rows['protectedPixelsMoved'] = int((np.linalg.norm(mapping-grid, axis=-1)[mask == 0] > 1e-10).sum())
    rows['maximumDisplacement'] = float(np.linalg.norm(mapping-grid, axis=-1).max())
    return rows


measured = {'unmasked': audit(unmasked), 'masked': audit(masked)}
assert measured['masked']['active']['foldedCells'] == prior['metrics']['foldedActiveCells']
intrinsic = measured['unmasked']['visibleAnyCorner']['foldedCells']
introduced = measured['masked']['visibleAnyCorner']['foldedCells']
report = {
    'utc': datetime.now(timezone.utc).isoformat(),
    'question': 'Are visible tail folds intrinsic to the seven-control rigid MLS map or introduced by protection-mask blending?',
    'inputs': [{'path': str(p), 'sha256': digest(p)} for p in (source, prior_path, mask_path, saved_path, tool, Path(__file__))],
    'dimensions': [w, h],
    'exactMaskedReproduction': True,
    'domainDefinition': 'Same warm largest component at target frame0 as prior tool; visible-domain labels remain hypotheses, not verified physical correspondences. Four bilinear corner Jacobians and stretches per cell.',
    'controlResidualMaximum': float(np.linalg.norm(rigid_mls(controls, controls, targets)-targets, axis=-1).max()),
    'metrics': measured,
    'finding': f'Unmasked map has {intrinsic} folded visible cells; protected map has {introduced}. Neither map is adopted.',
    'runtimeChanged': False,
    'sequenceChanged': False,
    'imagesCreated': 0,
    'limits': 'Diagnostic only. Positive determinants cannot establish correct art correspondence or acceptable strain; removing protection may distort dress. No threshold was relaxed and no endpoint was rendered.',
}
(OUT/'report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({'path': str(OUT/'report.json'), 'finding': report['finding'], 'metrics': measured}, separators=(',', ':')))
