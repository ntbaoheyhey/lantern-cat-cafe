"""Separate raw matte clamp arithmetic from codec, alpha truth and native rendering."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import numpy as np

BASE = Path('/Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m')
OUT = ROOT / 'work/v5/CXV/batch-m/media-composite-R1'
OUT.mkdir(exist_ok=False)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
ref = lambda p: dict(path=str(p), sha256=sha(p))
eotf = lambda x: np.where(x <= .04045, x / 12.92, ((x + .055) / 1.055) ** 2.4)
oetf = lambda x: np.where(x <= .0031308, x * 12.92, 1.055 * np.maximum(x, 0) ** (1 / 2.4) - .055)

def simulate(rgba):
    p = rgba[..., :3].astype(float) / 255
    a = rgba[..., 3:4].astype(float) / 255
    straight = p / np.maximum(a, .001)
    current_straight = np.clip(straight, 0, 1)
    # EOTF and OETF cancel before normal blending in an encoded RGBA8 buffer.
    encoded = oetf(eotf(current_straight)) * a
    unbounded = oetf(eotf(straight)) * a
    linear_control = oetf(eotf(current_straight) * a)
    raw_linear_reference = oetf(eotf(p))
    return p, a, encoded, unbounded, linear_control, raw_linear_reference

controls = np.array([[80, 40, 20, 255], [40, 20, 10, 128], [120, 60, 10, 32], [60, 20, 0, 0], [0, 0, 0, 0]], np.uint8)
p, a, encoded, unbounded, linear, reference = simulate(controls)
assert np.max(np.abs(encoded[0] - p[0])) < 1e-12
assert np.max(np.abs(encoded[1] - p[1])) < 1e-12
assert np.max(np.abs(encoded - np.minimum(p, a))) < 1e-12
assert np.max(np.abs(unbounded[:3] - p[:3])) < 1e-12
assert np.all(unbounded[3:] == 0)
assert np.max(np.abs(reference - p)) < 1e-12
assert float(np.max(np.abs(linear[1] - p[1]))) > .05

loader = Path('/Users/bao/taskbar-hero-chain/apps/web/src/game/cardrpg/spine/designer-idle-loader.ts')
loader_text = loader.read_text()
assert 'clamp(premul/max(a,0.001),0.0,1.0)' in loader_text
(OUT / 'designer-idle-loader.snapshot.ts').write_text(loader_text)
report = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), harness=ref(__file__), loader=ref(OUT / 'designer-idle-loader.snapshot.ts'),
    scope='CPU arithmetic on unchanged raw matte pixels. No codec/native/framebuffer/alpha-truth/halo acceptance, no implementation change.',
    controlRows=[dict(input=c.tolist(), encodedBlack=(encoded[i]*255).tolist(), unclampedEncodedBlack=(unbounded[i]*255).tolist(), linearBufferControlBlack=(linear[i]*255).tolist()) for i,c in enumerate(controls)], cats=[])
for cat, name, shape in [('mochi', 'four-plane-local-vslow-q22-r1', (300, 260, 312, 4)), ('clover', 'clover-four-plane-q21-r1', (300, 260, 212, 4))]:
    receipt = BASE / name / 'report.json'
    original = json.loads(receipt.read_text())
    source = Path(original['sourceRgba'])
    assert sha(source) == original['sourceRgbaSha256']
    assert source.stat().st_size == int(np.prod(shape))
    frames = np.memmap(source, np.uint8, 'r', shape=shape)
    rows = []
    for frame, rgba in enumerate(frames):
        p, a, encoded, unbounded, linear, reference = simulate(rgba)
        excess = np.maximum(p-a, 0) * 255
        masks = {'all': np.ones(a.shape[:2], bool), 'edge': (a[..., 0] > 0) & (a[..., 0] < 1), 'opaque': a[..., 0] == 1, 'zeroAlpha': a[..., 0] == 0}
        row = dict(frame=frame, affectedPixels=int(np.any(excess > 1e-8, axis=2).sum()), maxExcess=float(excess.max()),
            zeroAlphaColorPixels=int(((a[..., 0] == 0) & np.any(p > 0, axis=2)).sum()), strata={})
        assert np.max(np.abs(encoded - np.minimum(p, a))) < 1e-12
        for key, mask in masks.items():
            def mae(image):
                return float((np.abs(image-p)*255)[mask].mean()) if mask.any() else None
            row['strata'][key] = dict(pixels=int(mask.sum()), encodedBlackMAE=mae(encoded), unclampedEncodedBlackMAE=mae(unbounded), linearBufferControlBlackMAE=mae(linear), rawLinearReferenceBlackMAE=mae(reference))
        # Pre-output-clipping effect of clamp on a mid-gray encoded background.
        row['midGrayClampDeltaMAE'] = float(np.abs(np.clip(unbounded + (1-a)*.5, 0, 1)-np.clip(encoded + (1-a)*.5, 0, 1)).mean()*255)
        rows.append(row)
    path = OUT / (cat + '-rows.json')
    path.write_text(json.dumps(rows, separators=(',', ':'))+'\n')
    result = dict(cat=cat, source=ref(source), sourceReceipt=ref(receipt), shape=shape, raw=ref(path), affectedPixelsTotal=sum(r['affectedPixels'] for r in rows),
        affectedPixelsPerFrameRange=[min(r['affectedPixels'] for r in rows), max(r['affectedPixels'] for r in rows)], maxExcess=max(r['maxExcess'] for r in rows),
        zeroAlphaColorPixels=sum(r['zeroAlphaColorPixels'] for r in rows), strata={})
    for key in masks:
        total = sum(r['strata'][key]['pixels'] for r in rows)
        result['strata'][key] = dict(pixels=total)
        for metric in ['encodedBlackMAE','unclampedEncodedBlackMAE','linearBufferControlBlackMAE','rawLinearReferenceBlackMAE']:
            result['strata'][key][metric] = sum((r['strata'][key][metric] or 0)*r['strata'][key]['pixels'] for r in rows)/total if total else None
    result['midGrayClampDeltaMAE'] = float(np.mean([r['midGrayClampDeltaMAE'] for r in rows]))
    report['cats'].append(result)
report['controlsPass'] = True
report['imagesViewed'] = 0
report['limits'] = ['RGB>alpha does not prove emission;the alpha estimator may be wrong.', 'Dropping the clamp alone cannot preserve nonzero RGB at exactly zero alpha through straight blending.', 'The linear-buffer scenario is a control,not the production framebuffer claim.', 'Any runtime change needs CXI ownership,isolated actual shader/native controls and fresh judge evidence.']
output = ROOT / 'reports/v5/CXV/M-media-composite-R1.json'
assert not output.exists()
output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(report=str(output), controlsPass=True, cats=[{k:c[k] for k in ['cat','affectedPixelsTotal','affectedPixelsPerFrameRange','maxExcess','zeroAlphaColorPixels','midGrayClampDeltaMAE']} for c in report['cats']])))
