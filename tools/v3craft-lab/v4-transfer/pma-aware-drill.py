"""Two straight-alpha delivery drills from correctly interpreted source atlases."""
from pathlib import Path
import datetime
import gc
import hashlib
import json
import subprocess
import time
import numpy as np
from PIL import Image, ImageDraw, _avif
from skimage.color import rgb2lab

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A10/scene-ready-transfer'
RAW = OUT / 'raw/pma-aware-r1'
REPORT = OUT / 'pma-aware-r1.json'
assert not REPORT.exists()
RAW.mkdir(parents=True, exist_ok=True)
BASE = json.loads((OUT / 'resolution-r1.json').read_text())
SHA = lambda b: hashlib.sha256(b).hexdigest()
METHODS = {'straight-two-thirds-q75': (2, 3, 75), 'straight-half-q85': (1, 2, 85)}
PMA = {'mochi', 'soot', 'clover'}
CROPS = {'mochi': (300, 0, 620, 320), 'soot': (0, 480, 320, 800), 'clover': (300, 160, 620, 480)}


def straight_source(source):
    image = Image.open(ROOT / source['source']).convert('RGBA')
    if source['owner'] in PMA:
        a = np.asarray(image).copy()
        alpha = a[:, :, 3:4].astype(np.float32)
        a[:, :, :3] = np.where(alpha > 0, np.clip(np.rint(a[:, :, :3].astype(np.float32) * 255 / np.maximum(alpha, 1)), 0, 255), 0).astype(np.uint8)
        image = Image.fromarray(a)
    return image


def measure(original, reduced, decoded):
    a = np.asarray(original)
    b = np.asarray(decoded.resize(original.size, Image.Resampling.BILINEAR))
    mask = a[:, :, 3] >= 128
    ac, bc = a[:, :, :3][mask], b[:, :, :3][mask]
    sums = np.zeros((2, 3), dtype=np.float64)
    errors = []
    for start in range(0, len(ac), 65536):
        al = rgb2lab((ac[start:start + 65536].astype(np.float32) / 255).reshape(-1, 1, 3)).reshape(-1, 3)
        bl = rgb2lab((bc[start:start + 65536].astype(np.float32) / 255).reshape(-1, 1, 3)).reshape(-1, 3)
        sums[0] += al.sum(axis=0, dtype=np.float64)
        sums[1] += bl.sum(axis=0, dtype=np.float64)
        errors.append(np.linalg.norm(al - bl, axis=1))
    de = np.concatenate(errors)
    mean = float(np.linalg.norm((sums[0] - sums[1]) / len(ac)))
    return {'decodedSize': list(decoded.size), 'alphaEncoding': 'straight',
            'reducedAlphaExact': bool(np.array_equal(np.asarray(reduced.getchannel('A')), np.asarray(decoded.getchannel('A')))),
            'sourceAlphaExactAfterReconstruction': bool(np.array_equal(a[:, :, 3], b[:, :, 3])),
            'maskedVisibleMeanLabDelta': mean, 'maskedMeanLabPass': mean <= 6,
            'visiblePerPixelDeltaE76': {'mean': float(de.mean()), 'p95': float(np.percentile(de, 95)), 'max': float(de.max())},
            'limitations': 'Visible straight color diagnostic, not shader/pose/head/feet/film acceptance.', 'runtimeAcceptance': False}


def comparison(row, original):
    box = row['crop']
    images = [('original-visible', original)] + [(c['method'], Image.open(ROOT / c['path']).convert('RGBA').resize(original.size, Image.Resampling.BILINEAR)) for c in row['candidates']]
    sheet = Image.new('RGB', (984, 710), '#241c2b')
    draw = ImageDraw.Draw(sheet)
    for col, (label, im) in enumerate(images):
        x = col * 328
        draw.text((x + 4, 5), row['owner'] + ' / ' + label, fill='white')
        for y, color in [(28, (36, 28, 43, 255)), (374, (214, 198, 165, 255))]:
            tile = Image.new('RGBA', (320, 320), color)
            tile.alpha_composite(im.crop(box))
            sheet.paste(tile.convert('RGB'), (x + 4, y))
    draw.text((4, 352), 'PMA source unassociated before resampling; delivery must bypass source-PMA shader division', fill='white')
    path = RAW / (row['owner'] + '-comparison.png')
    sheet.save(path)
    return {'path': str(path.relative_to(ROOT)), 'sha256': SHA(path.read_bytes()), 'reviewed': False}


probe = Image.fromarray(np.array([[[100, 50, 25, 255], [0, 0, 0, 0]]], dtype=np.uint8))
probe_bad = list(probe.resize((1, 1), Image.Resampling.BOX).getpixel((0, 0)))
probe_pma = list(Image.merge('RGBA', tuple(c.resize((1, 1), Image.Resampling.BOX) for c in probe.split())).getpixel((0, 0)))
receipt = {'started': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
           'scriptSha256AtRun': SHA(Path(__file__).read_bytes()), 'boundResolutionR1Sha256': SHA((OUT / 'resolution-r1.json').read_bytes()),
           'encoder': {'libavif': _avif.libavif_version, 'codecs': _avif.codec_versions()},
           'scope': 'Private PMA-aware straight-alpha delivery; prior visual failures retained',
           'probe': {'inputPma': [[[100, 50, 25, 255], [0, 0, 0, 0]]], 'incorrectRgbaResize': probe_bad, 'correctPmaChannelResize': probe_pma},
           'baseline': BASE['baseline'], 'mappingReserve': 16384, 'assets': [], 'complete': False}
for source in [a for a in BASE['assets'] if a['kind'] == 'actor']:
    assert SHA((ROOT / source['source']).read_bytes()) == source['sourceSha256']
    original = straight_source(source)
    row = {k: source[k] for k in ['owner', 'kind', 'source', 'sourceSha256', 'size', 'observedResponseOverhead']}
    row['sourcePma'] = row['owner'] in PMA
    row['candidates'] = []
    for method, (num, den, quality) in METHODS.items():
        size = tuple(round(v * num / den) for v in original.size)
        reduced = original.resize(size, Image.Resampling.LANCZOS)
        path = RAW / (row['owner'] + '-' + method + '.avif')
        settings = dict(format='AVIF', quality=quality, subsampling='4:4:4', speed=6, codec='aom', max_threads=2, advanced={'a:lossless': '1', 'a:cq-level': '0'})
        started = time.monotonic()
        reduced.save(path, **settings)
        decoded = Image.open(path).convert('RGBA')
        checks = measure(original, reduced, decoded)
        assert checks['reducedAlphaExact']
        row['candidates'].append({'method': method, 'path': str(path.relative_to(ROOT)), 'sha256': SHA(path.read_bytes()), 'bytes': path.stat().st_size, 'settings': settings, 'seconds': time.monotonic() - started, **checks})
        del reduced, decoded
        gc.collect()
    if row['owner'] in CROPS:
        row['crop'] = CROPS[row['owner']]
    elif row['owner'] == 'panko':
        rig = json.loads((ROOT / 'apps/web/public/units/panko/rig.json').read_text())
        part = next(p for p in rig['parts'] if p['name'] == 'head')
        u, v = part['uv'][::2], part['uv'][1::2]
        cx = round((min(u) + max(u)) * original.width / 2)
        cy = round((1 - (min(v) + max(v)) / 2) * original.height)
        row['crop'] = [cx - 160, cy - 160, cx + 160, cy + 160]
    if 'crop' in row:
        row['comparison'] = comparison(row, original)
    receipt['assets'].append(row)
    REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
    print(row['owner'], [(c['method'], c['bytes'], round(c['maskedVisibleMeanLabDelta'], 4)) for c in row['candidates']], flush=True)
    del original
    gc.collect()
vfx_bytes = sum(next(c['bytes'] for c in a['candidates'] if c['method'] == 'rgba-half') + a['observedResponseOverhead'] for a in BASE['assets'] if a['kind'] == 'vfx')
receipt['unchangedMeasuredVfxBytes'] = vfx_bytes
receipt['projections'] = []
for method in METHODS:
    actors = sum(next(c['bytes'] for c in a['candidates'] if c['method'] == method) + a['observedResponseOverhead'] for a in receipt['assets'])
    total = BASE['baseline']['nonImageBytes'] + BASE['baseline']['unchangedAuxiliaryImageBytes'] + vfx_bytes + actors + receipt['mappingReserve']
    receipt['projections'].append({'method': method, 'actorBytesWithOverhead': actors, 'totalBytesIncludingMappingReserve': total, 'withinBudgetProjection': total <= 8000000, 'measuredProductionPass': False})
receipt.update(complete=True, finished=datetime.datetime.now(datetime.timezone.utc).isoformat())
REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
print('complete', receipt['projections'], flush=True)
