"""Export the approved common-canvas Teacup drawings to the lab first."""
from pathlib import Path
from PIL import Image
import hashlib
import json
import sys
import numpy as np

lab = Path('tools/v3craft-lab/v4-teacup-healer')
publish = '--publish' in sys.argv
out = Path('apps/web/public/units/teacup-healer/poses') if publish else lab / 'exported'
out.mkdir(parents=True, exist_ok=True)
selection = json.loads((lab / 'selection.json').read_text())

def bounds(a):
    y, x = np.where(a[:, :, 3] >= 128)
    return [int(x.min()), int(y.min()), int(x.max() + 1), int(y.max() + 1)]

def feet(a):
    b = bounds(a)
    y, x = np.where((a[:, :, 3] >= 128) & (np.indices(a.shape[:2])[0] >= b[3] - 5))
    return [float(x.mean()), float(b[3])]

def foot_points(a):
    b = bounds(a)
    _, x = np.where((a[:, :, 3] >= 128) & (np.indices(a.shape[:2])[0] >= b[3] - 8))
    xs = np.array(sorted(set(x)))
    groups = np.split(xs, np.flatnonzero(np.diff(xs) > 5) + 1)
    groups = sorted(sorted(groups, key=len, reverse=True)[:2], key=lambda g: g.mean())
    if len(groups) < 2:
        groups = np.array_split(xs, 2)
    return [[float(g.mean()), float(b[3])] for g in groups]

base = np.array(Image.open(lab / 'raw/K0-normal.png').convert('RGBA'))
bb = bounds(base)
baseline = feet(base)
manifest = {'version': 1, 'unit': 'teacup-healer', 'canvas': [1152, 1152],
            'baseline': baseline, 'opaqueHeight': bb[3] - bb[1], 'poses': {}}
receipts = []
for key in ['K0', 'K1', 'K2', 'K4']:
    item = selection.get(key)
    source = lab / (item['image'] if item else 'raw/K0-normal.png')
    im = Image.open(source).convert('RGBA')
    a = np.array(im)
    b = bounds(a)
    m = json.loads((lab / (item['candidate'] + '-metrics.json')).read_text()) if item else None
    top, chin = [478, 582] if m is None else [v * m['scale'] + m['offset'][1] for v in m['headLandmarksSource']]
    band = (a[int(top) + 8:int(top) + 18, :, 3] >= 128).any(axis=0)
    xs = np.flatnonzero(band)
    cap = max(np.split(xs, np.flatnonzero(np.diff(xs) > 4) + 1), key=len)
    cx = float(cap.mean())
    face = [cx - len(cap) * .40, top + (chin - top) * .48, len(cap) * .80, (chin - top) * .52]
    low, high = (top - 70, top + 65) if key in ['K0', 'K1'] else (top - 30, chin - 5)
    ys, xs = np.where((a[:, :, 3] >= 128) & (np.indices(a.shape[:2])[0] >= low) & (np.indices(a.shape[:2])[0] <= high))
    edge = xs.max() if key in ['K1', 'K4'] else xs.min()
    near = np.abs(xs - edge) <= 20
    # Emission attaches inside the visible spoon bowl, never an inferred body center.
    spoon = [float(edge + (-13 if key in ['K1', 'K4'] else 13)), float(np.median(ys[near]))]
    head = [cx, face[1] + face[3] * .5]
    chest = [baseline[0], b[1] + (b[3] - b[1]) * .53]
    im.save(out / (key + '.webp'), quality=96, method=6, exact=True)
    manifest['poses'][key] = {'image': key + '.webp', 'face': face, 'opaqueBounds': b,
        'feet': foot_points(a), 'sockets': {'mainHand': spoon, 'offHand': chest,
        'weaponTip': spoon, 'vfxOrigin': spoon, 'head': head, 'chest': chest,
        'feet': baseline, 'hpAnchor': [cx, b[1] - 28]}, 'overlap': []}
    path = out / (key + '.webp')
    receipts.append({'key': key, 'source': str(source), 'path': str(path),
        'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
manifest['poses']['K5'] = {**manifest['poses']['K2'], 'image': 'K2.webp'}
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
(lab / 'export.json').write_text(json.dumps({'baseline': baseline,
    'opaqueHeight': manifest['opaqueHeight'], 'assets': receipts, 'K5Alias': 'K2',
    'production': publish}, indent=2) + '\n')
print(json.dumps({'baseline': baseline, 'opaqueHeight': manifest['opaqueHeight'],
    'assetBytes': sum(x['bytes'] for x in receipts), 'production': publish}))
