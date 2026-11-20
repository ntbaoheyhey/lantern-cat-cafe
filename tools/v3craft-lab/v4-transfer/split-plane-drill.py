"""Private split-color/coverage experiment; originals and runtime remain untouched."""
import datetime
import gc
import hashlib
import json
import subprocess
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, _avif
from skimage.color import rgb2lab
from skimage.metrics import structural_similarity

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A10/scene-ready-transfer'
RAW = OUT / 'raw/split-r1'
REPORT = OUT / 'split-r1.json'
assert not REPORT.exists(), 'Keep prior evidence immutable.'
RAW.mkdir(parents=True, exist_ok=True)
SHA = lambda b: hashlib.sha256(b).hexdigest()
BASE = json.loads((OUT / 'drill-r3.json').read_text())
SETTINGS = dict(format='AVIF', quality=60, subsampling='4:4:4', speed=6, codec='aom', max_threads=2)
MASK_SETTINGS = dict(SETTINGS, quality=100, advanced={'a:lossless': '1', 'a:cq-level': '0'})
SCALES = {'rgb67-mask100': 2/3, 'rgb50-mask100': .5}


def metrics(original, reconstructed):
    a, b = np.asarray(original), np.asarray(reconstructed)
    assert a.shape == b.shape
    mask = a[:, :, 3] >= 128
    ac, bc = a[:, :, :3][mask], b[:, :, :3][mask]
    sums = np.zeros((2, 3), dtype=np.float64)
    errors = []
    for start in range(0, len(ac), 65536):
        al = rgb2lab((ac[start:start+65536].astype(np.float32)/255).reshape(-1, 1, 3)).reshape(-1, 3)
        bl = rgb2lab((bc[start:start+65536].astype(np.float32)/255).reshape(-1, 1, 3)).reshape(-1, 3)
        sums[0] += al.sum(axis=0, dtype=np.float64)
        sums[1] += bl.sum(axis=0, dtype=np.float64)
        errors.append(np.linalg.norm(al-bl, axis=1))
    de = np.concatenate(errors)
    mean_lab = float(np.linalg.norm((sums[0]-sums[1])/len(ac)))
    alpha_exact = bool(np.array_equal(a[:, :, 3], b[:, :, 3]))
    bbox = original.getchannel('A').getbbox()
    samples = []
    for im in (original, reconstructed):
        crop = im.crop(bbox)
        crop.thumbnail((512, 512), Image.Resampling.LANCZOS)
        bg = Image.new('RGBA', crop.size, (36, 28, 43, 255))
        bg.alpha_composite(crop)
        samples.append(np.asarray(bg.convert('RGB')))
    return {'dimensionsExact': True, 'alphaExact': alpha_exact,
            'maskedMeanLabDelta': mean_lab, 'maskedPixels': int(mask.sum()),
            'perPixelDeltaE76': {'mean': float(de.mean()), 'p95': float(np.percentile(de, 95)), 'max': float(de.max())},
            'ssimDiagnostic512': float(structural_similarity(*samples, channel_axis=2, data_range=255)),
            'numericalGate': alpha_exact and mean_lab <= 6,
            'browserReconstructionVerified': False, 'humanReviewRequired': True}


def color_plane(original, scale):
    """Filter floating associated color, then divide by filtered coverage."""
    source = np.asarray(original).astype(np.float32)
    coverage = source[:, :, 3]/255
    size = tuple(max(1, round(n*scale)) for n in original.size)
    low_alpha = np.asarray(Image.fromarray(coverage).resize(size, Image.Resampling.LANCZOS))
    rgb = np.zeros((size[1], size[0], 3), dtype=np.float32)
    for channel in range(3):
        associated = source[:, :, channel]*coverage
        low = np.asarray(Image.fromarray(associated).resize(size, Image.Resampling.LANCZOS))
        np.divide(low, low_alpha, out=rgb[:, :, channel], where=low_alpha > 1e-6)
    return Image.fromarray(np.round(np.clip(rgb, 0, 255)).astype(np.uint8))


def reconstruct(color, mask, size):
    rgb = Image.open(color).convert('RGB').resize(size, Image.Resampling.LANCZOS).convert('RGBA')
    rgb.putalpha(Image.open(mask).convert('RGBA').getchannel('A'))
    return rgb


def comparison(row):
    original = Image.open(ROOT/row['source']).convert('RGBA')
    box = row['referenceCrop']
    sheet = Image.new('RGB', (984, 560), '#241c2b')
    draw = ImageDraw.Draw(sheet)
    images = [('original', original)] + [(c['method'], reconstruct(ROOT/c['colorPath'], ROOT/row['mask']['path'], original.size)) for c in row['candidates']]
    for col, (label, im) in enumerate(images):
        x = col*328
        draw.text((x+4, 5), row['kind']+'/'+row['owner']+' / '+label, fill='white')
        tile = Image.new('RGBA', (320, 320), (63, 53, 48, 255))
        tile.alpha_composite(im.crop(box))
        sheet.paste(tile.convert('RGB'), (x+4, 28))
        sheet.paste(tile.convert('RGB').resize((160, 160), Image.Resampling.LANCZOS), (x+84, 390))
    draw.text((4, 352), 'Same native crop '+str(box)+'; original dimensions/alpha reconstructed; Pillow diagnostic only', fill='white')
    draw.text((4, 372), 'Same crop at half display scale; browser and battle acceptance remain untested', fill='white')
    path = RAW/(row['kind']+'-'+row['owner']+'-comparison.png')
    sheet.save(path)
    return {'path': str(path.relative_to(ROOT)), 'sha256': SHA(path.read_bytes()), 'reviewed': False}


receipt = {'started': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'scope': 'Private split-plane numerical experiment, not browser or production acceptance',
           'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
           'scriptSha256AtRun': SHA(Path(__file__).read_bytes()),
           'boundDrillR3Sha256': SHA((OUT/'drill-r3.json').read_bytes()),
           'encoder': {'libavif': _avif.libavif_version, 'codecs': _avif.codec_versions()},
           'colorSettings': SETTINGS, 'maskSettings': MASK_SETTINGS, 'scales': SCALES,
           'baseline': BASE['baseline'], 'extraResponseAllowanceEach': 300,
           'newDecoderByteReserve': 16384, 'assets': [], 'complete': False}

for source in BASE['assets']:
    path = ROOT/source['source']
    assert SHA(path.read_bytes()) == source['sourceSha256']
    original = Image.open(path).convert('RGBA')
    row = {k: source[k] for k in ['owner', 'kind', 'source', 'sourceSha256', 'sourceBytes', 'size', 'observedOriginalTransferBytes', 'observedResponseOverhead']}
    mask_path = RAW/(row['kind']+'-'+row['owner']+'-mask.avif')
    assert not mask_path.exists()
    mask = Image.new('RGBA', original.size, (255, 255, 255, 255))
    mask.putalpha(original.getchannel('A'))
    mask.save(mask_path, **MASK_SETTINGS)
    alpha_exact = np.array_equal(np.asarray(original.getchannel('A')), np.asarray(Image.open(mask_path).convert('RGBA').getchannel('A')))
    assert alpha_exact, 'Lossless coverage failed; do not continue with this mask.'
    row['mask'] = {'path': str(mask_path.relative_to(ROOT)), 'bytes': mask_path.stat().st_size, 'sha256': SHA(mask_path.read_bytes()), 'alphaExact': bool(alpha_exact)}
    row['candidates'] = []
    for method, scale in SCALES.items():
        started = time.monotonic()
        color = RAW/(row['kind']+'-'+row['owner']+'-'+method+'.avif')
        assert not color.exists()
        low = color_plane(original, scale)
        low.save(color, **SETTINGS)
        rebuilt = reconstruct(color, mask_path, original.size)
        row['candidates'].append({'method': method, 'colorPath': str(color.relative_to(ROOT)),
            'colorSize': list(low.size), 'colorSha256': SHA(color.read_bytes()), 'colorBytes': color.stat().st_size,
            'combinedFileBytes': color.stat().st_size+row['mask']['bytes'], 'seconds': time.monotonic()-started,
            **metrics(original, rebuilt)})
        del rebuilt, low
        gc.collect()
    if source.get('comparison'):
        row['referenceCrop'] = source['comparison']['crop']
        row['comparison'] = comparison(row)
    receipt['assets'].append(row)
    REPORT.write_text(json.dumps(receipt, indent=2)+'\n')
    print(row['kind'], row['owner'], 'mask', row['mask']['bytes'], [(c['method'], c['combinedFileBytes'], round(c['maskedMeanLabDelta'], 4)) for c in row['candidates']], flush=True)
    del original, mask
    gc.collect()

receipt['projections'] = []
for method in SCALES:
    candidates = [next(c for c in a['candidates'] if c['method'] == method) for a in receipt['assets']]
    owned = sum(c['combinedFileBytes']+a['observedResponseOverhead']+receipt['extraResponseAllowanceEach'] for a, c in zip(receipt['assets'], candidates))
    total = BASE['baseline']['nonImageBytes']+BASE['baseline']['unchangedAuxiliaryImageBytes']+owned+receipt['newDecoderByteReserve']
    receipt['projections'].append({'method': method, 'ownedBytesIncludingResponseAllowance': owned,
        'totalBytesIncludingDecoderReserve': total, 'withinBudgetProjection': total <= 8000000,
        'numericalGates': all(c['numericalGate'] for c in candidates), 'measuredProductionPass': False})
receipt.update(complete=True, finished=datetime.datetime.now(datetime.timezone.utc).isoformat())
REPORT.write_text(json.dumps(receipt, indent=2)+'\n')
print('complete', receipt['projections'], flush=True)
