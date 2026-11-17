"""Measure lossy published drawing files at 225px K0 opaque height."""
from pathlib import Path
from PIL import Image
from skimage.color import rgb2lab
from datetime import datetime, timezone
import hashlib
import sys
import json
import numpy as np

out = Path('reports/v4-art/REVIEW/A7/yarn-giant')
out.mkdir(parents=True, exist_ok=True)
poses = Path('apps/web/public/units/yarn-giant/poses') if '--publish' in sys.argv else Path('tools/v3craft-lab/v4-yarn-giant/exported')
lab = Path('tools/v3craft-lab/v4-yarn-giant')
manifest = json.loads((poses / 'manifest.json').read_text())
selection = json.loads((lab / 'selection.json').read_text())
size = tuple(round(v * 225 / manifest['opaqueHeight']) for v in manifest['canvas'])

def read(key):
    return np.array(Image.open(poses / (key + '.webp')).convert('RGBA').resize(size, Image.Resampling.LANCZOS))

def bounds(mask):
    y, x = np.where(mask)
    return [int(x.min()), int(y.min()), int(x.max() + 1), int(y.max() + 1)]

base = read('K0')
bm = base[:, :, 3] >= 128
bb = bounds(bm)
reference = rgb2lab(base[:, :, :3] / 255)[bm].mean(0)
rows = []
for key in ['K1', 'K2', 'K4', 'K5']:
    a = read(key)
    mask = a[:, :, 3] >= 128
    box = bounds(mask)
    union = bounds(mask | bm)
    area = (union[2] - union[0]) * (union[3] - union[1])
    changed = (np.abs(a.astype(int) - base.astype(int)).max(2) > 24) & (mask | bm)
    metrics = json.loads((lab / selection[key]['metrics']).read_text())
    row = {'key': key, 'file': str(poses / (key + '.webp')),
        'iou': float((mask & bm).sum() / (mask | bm).sum()),
        'meanLabDeltaE76': float(np.linalg.norm(rgb2lab(a[:, :, :3] / 255)[mask].mean(0) - reference)),
        'changedUnionBboxFraction': float(changed.sum() / area),
        'headRatioFromFixedLandmarks': metrics['headRatio'],
        'feetVerticalDriftPx': abs(box[3] - bb[3]),
        'frontReachBodyWidth': (bb[0] - box[0]) / (bb[2] - bb[0]),
        'clippedBeforeExport': metrics['clipped']}
    row['numericalGatesPass'] = (row['iou'] <= (.8 if key == 'K4' else .65)
        and row['meanLabDeltaE76'] <= 6 and .95 <= row['headRatioFromFixedLandmarks'] <= 1.05
        and row['feetVerticalDriftPx'] <= 3 and not row['clippedBeforeExport']
        and (key != 'K2' or (row['frontReachBodyWidth'] >= .15 and row['changedUnionBboxFraction'] >= .18)))
    rows.append(row)
report = {'at': datetime.now(timezone.utc).isoformat(), 'K0OpaqueTargetHeight': 225,
    'resizedCanvas': size, 'alphaThreshold': 128, 'changedRgbaThreshold': 24,
    'differenceDenominator': 'union opaque bounding-box area',
    'headUncertaintySourcePx': 4, 'rows': rows, 'visualAndFilmGatesSeparate': True}
(out / ('published-pose-metrics.json' if '--publish' in sys.argv else 'lab-pose-metrics.json')).write_text(json.dumps(report, indent=2) + '\n')
files = [f for d in Path('apps/web/public/units').glob('*/poses') for f in d.rglob('*') if f.is_file()]
files += [f for f in Path('apps/web/public/vfx').rglob('*') if f.is_file()]
files += [Path('apps/web/public/units/binding-thread/portrait.webp')]
budget = {'scope': 'Conservative upper bound: every published pose-directory and public VFX file plus new Binding portrait; separate from SHIP total transfer',
    'bytes': sum(f.stat().st_size for f in files), 'limitBytes': 6000000,
    'files': [{'path': str(f), 'bytes': f.stat().st_size} for f in sorted(files)]}
(out / 'asset-budget.json').write_text(json.dumps(budget, indent=2) + '\n')
if '--publish' in sys.argv:
    sources = list(poses.iterdir()) + list(Path('apps/web/public/vfx/yarn-giant').iterdir())
    sources += [Path(p) for p in ['apps/web/src/game/cardrpg/spine/scene.ts',
        'apps/web/src/game/cardrpg/vfx-craft/yarn-surge.ts',
        'apps/web/src/game/cardrpg/vfx-craft/drawn-poses.ts',
        'apps/web/src/game/cardrpg/stage/layout-c2.ts']]
else:
    sources = list(poses.iterdir()) + list((lab/'textures').iterdir()) + [lab/'yarn-surge.ts', lab/'export.py']
hashes = {str(f): hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(sources)}
(out / ('source-hashes.json' if '--publish' in sys.argv else 'lab-source-hashes.json')).write_text(json.dumps(hashes, indent=2) + '\n')
print(json.dumps({'poseGates': [r['numericalGatesPass'] for r in rows],
    'K2ChangedFraction': rows[1]['changedUnionBboxFraction'], 'assetUpperBoundBytes': budget['bytes'], 'sourceHashes': len(hashes)}))

assert all(r['numericalGatesPass'] for r in rows), 'Published pose gates failed'
assert budget['bytes'] <= budget['limitBytes'], 'ART added-asset budget failed'
