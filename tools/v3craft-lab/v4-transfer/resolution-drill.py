"""Private whole-RGBA delivery trials; source/pose acceptance remains separate."""
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

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A10/scene-ready-transfer'
RAW = OUT / 'raw/resolution-r1'
REPORT = OUT / 'resolution-r1.json'
assert not REPORT.exists()
RAW.mkdir(parents=True, exist_ok=True)
BASE = json.loads((OUT / 'drill-r3.json').read_text())
SHA = lambda data: hashlib.sha256(data).hexdigest()
SETTINGS = dict(format='AVIF', quality=60, subsampling='4:4:4', speed=6,
                codec='aom', max_threads=2,
                advanced={'a:lossless': '1', 'a:cq-level': '0'})
METHODS = {'rgba-two-thirds': (2, 3), 'rgba-half': (1, 2)}


def bbox(mask):
    y, x = np.nonzero(mask)
    return [int(x.min()), int(y.min()), int(x.max()) + 1, int(y.max()) + 1] if len(x) else None


def measure(original, reduced, decoded):
    # Bilinear enlargement is a diagnostic, not a claim of browser equivalence.
    reconstructed = decoded.resize(original.size, Image.Resampling.BILINEAR)
    a, b = np.asarray(original), np.asarray(reconstructed)
    source_alpha, actual_alpha = a[:, :, 3], b[:, :, 3]
    delta = np.abs(source_alpha.astype(int) - actual_alpha.astype(int))
    mask = source_alpha >= 128
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
    mean_lab = float(np.linalg.norm((sums[0] - sums[1]) / len(ac)))
    thresholds = []
    for threshold in (1, 32, 128, 224):
        ma, mb = source_alpha >= threshold, actual_alpha >= threshold
        ba, bb = bbox(ma), bbox(mb)
        thresholds.append({'alphaThreshold': threshold,
                           'sourceBBox': ba, 'reconstructedBBox': bb,
                           'bboxEdgeDeltaSourcePixels': [v - u for u, v in zip(ba, bb)] if ba and bb else None,
                           'sourceDerivativeMaskIoU': float(np.count_nonzero(ma & mb) / max(1, np.count_nonzero(ma | mb))),
                           'changedClassPixels': int(np.count_nonzero(ma != mb))})
    return {'decodedSize': list(decoded.size), 'sourceSize': list(original.size),
            'sourceAlphaExact': bool(np.array_equal(source_alpha, actual_alpha)),
            'reducedAlphaExact': bool(np.array_equal(np.asarray(reduced.getchannel('A')), np.asarray(decoded.getchannel('A')))),
            'alphaMaxDeltaAfterDiagnosticReconstruction': int(delta.max()),
            'alphaMeanAbsoluteDeltaAfterDiagnosticReconstruction': float(delta.mean()),
            'alphaMassRelativeDelta': float((actual_alpha.astype(np.float64).sum() - source_alpha.astype(np.float64).sum()) / source_alpha.sum()),
            'thresholdGeometryDiagnostics': thresholds,
            'maskedMeanLabDelta': mean_lab, 'maskedMeanLabPass': mean_lab <= 6,
            'perPixelDeltaE76': {'mean': float(de.mean()), 'p95': float(np.percentile(de, 95)), 'max': float(de.max())},
            'diagnosticLimitations': 'Global atlas masks and bilinear reconstruction do not certify posed head/feet, UV edges, socket/area, browser rendering or films. Source-derivative IoU is not pose IoU.',
            'runtimeAndFilmAcceptance': False}


def comparison(row):
    original = Image.open(ROOT / row['source']).convert('RGBA')
    images = [('original', original)] + [(c['method'], Image.open(ROOT / c['path']).convert('RGBA').resize(original.size, Image.Resampling.BILINEAR)) for c in row['candidates']]
    sheet = Image.new('RGB', (984, 710), '#241c2b')
    draw = ImageDraw.Draw(sheet)
    for col, (label, im) in enumerate(images):
        x = col * 328
        draw.text((x + 4, 5), row['kind'] + '/' + row['owner'] + ' / ' + label, fill='white')
        for y, color in [(28, (36, 28, 43, 255)), (374, (214, 198, 165, 255))]:
            tile = Image.new('RGBA', (320, 320), color)
            tile.alpha_composite(im.crop(row['crop']))
            sheet.paste(tile.convert('RGB'), (x + 4, y))
    draw.text((4, 352), 'Same source-pixel crop; bilinear reconstruction is diagnostic, not runtime acceptance', fill='white')
    path = RAW / (row['kind'] + '-' + row['owner'] + '-comparison.png')
    sheet.save(path)
    return {'path': str(path.relative_to(ROOT)), 'sha256': SHA(path.read_bytes()), 'reviewed': False}


receipt = {'started': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'scope': 'Private whole-RGBA resolution experiment; changed resolution/alpha explicitly non-lossless',
           'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
           'scriptSha256AtRun': SHA(Path(__file__).read_bytes()),
           'boundDrillR3Sha256': SHA((OUT / 'drill-r3.json').read_bytes()),
           'encoder': {'libavif': _avif.libavif_version, 'codecs': _avif.codec_versions()},
           'settings': SETTINGS,
           'resampling': 'Pillow11.3 RGBA LANCZOS uses premultiplied RGBa internally; BILINEAR reconstructed diagnostic',
           'baseline': BASE['baseline'], 'newMappingByteReserve': 16384,
           'assets': [], 'complete': False}
for source in BASE['assets']:
    path = ROOT / source['source']
    assert SHA(path.read_bytes()) == source['sourceSha256']
    original = Image.open(path).convert('RGBA')
    row = {k: source[k] for k in ['owner', 'kind', 'source', 'sourceSha256', 'sourceBytes', 'size', 'observedOriginalTransferBytes', 'observedResponseOverhead']}
    row['candidates'] = []
    for method, (num, den) in METHODS.items():
        size = tuple(max(1, round(v * num / den)) for v in original.size)
        reduced = original.resize(size, Image.Resampling.LANCZOS)
        output = RAW / (row['kind'] + '-' + row['owner'] + '-' + method + '.avif')
        assert not output.exists()
        started = time.monotonic()
        reduced.save(output, **SETTINGS)
        decoded = Image.open(output).convert('RGBA')
        checks = measure(original, reduced, decoded)
        assert checks['reducedAlphaExact']
        row['candidates'].append({'method': method, 'path': str(output.relative_to(ROOT)),
                                  'sha256': SHA(output.read_bytes()), 'bytes': output.stat().st_size,
                                  'nativeToSourceRatios': [size[i] / original.size[i] for i in range(2)],
                                  'seconds': time.monotonic() - started, **checks})
        del reduced, decoded
        gc.collect()
    if source.get('comparison'):
        row['crop'] = source['comparison']['crop']
        row['comparison'] = comparison(row)
    receipt['assets'].append(row)
    REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
    print(row['kind'], row['owner'], [(c['method'], c['bytes'], round(c['maskedMeanLabDelta'], 4)) for c in row['candidates']], flush=True)
    del original
    gc.collect()
receipt['projections'] = []
for method in METHODS:
    candidates = [next(c for c in a['candidates'] if c['method'] == method) for a in receipt['assets']]
    owned = sum(c['bytes'] + a['observedResponseOverhead'] for a, c in zip(receipt['assets'], candidates))
    total = BASE['baseline']['nonImageBytes'] + BASE['baseline']['unchangedAuxiliaryImageBytes'] + owned + receipt['newMappingByteReserve']
    receipt['projections'].append({'method': method, 'ownedBytesWithObservedOverhead': owned,
                                   'totalBytesIncludingMappingReserve': total, 'withinBudgetProjection': total <= 8000000,
                                   'maskedMeanLabPass': all(c['maskedMeanLabPass'] for c in candidates),
                                   'exactSourceAlpha': all(c['sourceAlphaExact'] for c in candidates),
                                   'measuredProductionPass': False})
receipt.update(complete=True, finished=datetime.datetime.now(datetime.timezone.utc).isoformat())
REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
print('complete', receipt['projections'], flush=True)
