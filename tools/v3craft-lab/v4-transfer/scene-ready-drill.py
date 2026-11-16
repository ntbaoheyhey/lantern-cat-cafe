"""Private delivery experiments; never overwrite or publish accepted source art."""
import datetime
import gc
import hashlib
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import numpy as np
from PIL import Image, ImageDraw
from skimage.color import rgb2lab
from skimage.metrics import structural_similarity

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A10/scene-ready-transfer'
ROUND = sys.argv[1] if len(sys.argv) > 1 else 'r1'
assert ROUND in ('r1', 'r2')
RAW = OUT / ('raw/drill-'+ROUND)
RAW.mkdir(parents=True, exist_ok=True)
SHA = lambda data: hashlib.sha256(data).hexdigest()
OWNERS = ['mochi', 'soot', 'clover', 'panko', 'binding-thread', 'yarn-giant']
METHODS = {
    'near60': ['-near_lossless', '60', '-exact', '-q', '100', '-m', '6'],
    'rgb85': ['-q', '85', '-alpha_q', '100', '-sharp_yuv', '-exact', '-m', '6'],
}
if ROUND == 'r2':
    METHODS = {f'rgb{quality}': ['-q', str(quality), '-alpha_q', '100', '-sharp_yuv', '-exact', '-m', '6'] for quality in (60, 40)}


def metrics(original, candidate):
    a, b = np.asarray(original), np.asarray(candidate)
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
    bbox = original.getchannel('A').getbbox()
    small = []
    for image in [original, candidate]:
        crop = image.crop(bbox)
        crop.thumbnail((512, 512), Image.Resampling.LANCZOS)
        background = Image.new('RGBA', crop.size, (36, 28, 43, 255))
        background.alpha_composite(crop)
        small.append(np.asarray(background.convert('RGB')))
    mean_lab = float(np.linalg.norm((sums[0]-sums[1])/len(ac)))
    alpha_exact = bool(np.array_equal(a[:, :, 3], b[:, :, 3]))
    return {
        'dimensionsExact': True, 'alphaExact': alpha_exact,
        'rgbaExact': bool(np.array_equal(a, b)), 'maskedPixels': int(mask.sum()),
        'maskedMeanLabDelta': mean_lab,
        'perPixelDeltaE76': {'mean': float(de.mean()), 'p95': float(np.percentile(de, 95)), 'max': float(de.max())},
        'ssimDiagnostic512': float(structural_similarity(small[0], small[1], channel_axis=2, data_range=255)),
        'numericalGate': alpha_exact and mean_lab <= 6,
        'humanReviewRequired': True,
    }


def comparison(row):
    """Identical native crop and identical display scale in all three columns."""
    original = Image.open(ROOT / row['source']).convert('RGBA')
    w, h = original.size
    alpha = np.asarray(original.getchannel('A'))
    # Choose a densely painted native crop so tiny empty atlas margins cannot hide damage.
    best = (-1, (0, 0, min(w, 320), min(h, 320)))
    for y in range(0, max(1, h-319), 160):
        for x in range(0, max(1, w-319), 160):
            score = int((alpha[y:y+320, x:x+320] >= 128).sum())
            if score > best[0]: best = (score, (x, y, min(x+320, w), min(y+320, h)))
    box = best[1]
    sheet = Image.new('RGB', (984, 370), '#241c2b')
    draw = ImageDraw.Draw(sheet)
    images = [('original', original)] + [(c['method'], Image.open(ROOT/c['path']).convert('RGBA')) for c in row['candidates']]
    for col, (label, im) in enumerate(images):
        x = col*328
        draw.text((x+4, 5), row['kind']+'/'+row['owner']+' / '+label, fill='white')
        tile = Image.new('RGBA', (320, 320), (63, 53, 48, 255))
        tile.alpha_composite(im.crop(box))
        sheet.paste(tile.convert('RGB'), (x+4, 28))
    draw.text((4, 352), 'Same native-pixel crop '+str(box)+'; diagnostic only, not battle composition acceptance', fill='white')
    path = RAW/(row['kind']+'-'+row['owner']+'-comparison.png')
    sheet.save(path)
    return {'path': str(path.relative_to(ROOT)), 'sha256': SHA(path.read_bytes()), 'crop': list(box), 'reviewed': False}


atlas_entries = json.loads((ROOT/'apps/web/src/game/cardrpg/spine/lossless-atlases.json').read_text())
manifest_path = ROOT/'assets/cardrpg-look/vfx-packed/manifest.json'
manifest = json.loads(manifest_path.read_text())
sources = []
for entry in atlas_entries:
    source = ROOT/entry['source']
    owner = next(owner for owner in OWNERS if '/'+owner+'/' in entry['source'])
    sources.append({'owner': owner, 'kind': 'actor', 'source': entry['source'], 'request': entry['request']})
for owner in OWNERS:
    page = next(p for p in manifest['pages'] if p['file'] == owner+'-0.webp')
    sources.append({'owner': owner, 'kind': 'vfx', 'source': 'assets/cardrpg-look/vfx-packed/'+page['file'], 'page': page['file']})

ship_path = Path('/Users/bao/taskbar-hero-chain/reports/v4-ship/S8/initial-transfer-2.json')
ship = json.loads(ship_path.read_text())
ship_row = ship['rows'][0]
images = [r for r in ship_row['transfer']['resources'] if r['type'] == 'Image']
old_packed = [r for r in images if any(re.fullmatch('/assets/'+re.escape(p['file'][:-5])+r'-[^/]+\.webp', urlparse(r['path']).path) for p in manifest['pages'])]
assert len(old_packed) == len(manifest['pages']) == 25
old_actor = []
for source in sources[:6]:
    owner = source['owner']
    matches = [r for r in images if urlparse(r['path']).path == '/units/'+owner+'/rig-depth.png' or re.fullmatch('/assets/'+re.escape(owner)+r'-[^/]+\.png', urlparse(r['path']).path)]
    assert len(matches) == 1, (owner, matches)
    old_actor.extend(matches)
    source['observedOriginalTransferBytes'] = matches[0]['totalBytes']
for source in sources[6:]:
    observed = next(r for r in old_packed if re.fullmatch('/assets/'+re.escape(source['owner'])+r'-0-[^/]+\.webp', urlparse(r['path']).path))
    source['observedOriginalTransferBytes'] = observed['totalBytes']

image_bytes = sum(r['totalBytes'] for r in images)
auxiliary = image_bytes-sum(r['totalBytes'] for r in old_actor+old_packed)
nonimage = ship_row['transfer']['conservativeTransferBytes']-image_bytes
receipt = {
    'started': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope': 'Private encodes and budget projection; not production traffic or visual acceptance.',
    'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
    'scriptSha256AtRun': SHA(Path(__file__).read_bytes()),
    'encoder': subprocess.check_output([shutil.which('cwebp'), '-version'], text=True).strip(),
    'shipEvidence': {'path': str(ship_path), 'sha256': SHA(ship_path.read_bytes()), 'sourceCommit': ship['sourceCommit']},
    'packedManifestSha256': SHA(manifest_path.read_bytes()),
    'baseline': {'imageBytes': image_bytes, 'nonImageBytes': nonimage, 'unchangedAuxiliaryImageBytes': auxiliary, 'imageAllowance': 8000000-nonimage, 'totalGate': 8000000},
    'methods': METHODS, 'assets': [], 'complete': False,
}

for source in sources:
    path = ROOT/source['source']
    original = Image.open(path).convert('RGBA')
    row = {**source, 'sourceSha256': SHA(path.read_bytes()), 'sourceBytes': path.stat().st_size, 'size': list(original.size), 'candidates': []}
    row['observedResponseOverhead'] = row['observedOriginalTransferBytes']-row['sourceBytes']
    assert row['observedResponseOverhead'] >= 0
    for method, options in METHODS.items():
        candidate = RAW/(source['kind']+'-'+source['owner']+'-'+method+'.webp')
        started = time.monotonic()
        subprocess.run([shutil.which('cwebp'), *options, '-quiet', str(path), '-o', str(candidate)], check=True)
        actual = Image.open(candidate).convert('RGBA')
        row['candidates'].append({'method': method, 'path': str(candidate.relative_to(ROOT)), 'bytes': candidate.stat().st_size, 'sha256': SHA(candidate.read_bytes()), 'seconds': time.monotonic()-started, **metrics(original, actual)})
        del actual
        gc.collect()
    if source['owner'] in ['panko', 'soot']:
        row['comparison'] = comparison(row)
    receipt['assets'].append(row)
    (OUT/('drill-'+ROUND+'.json')).write_text(json.dumps(receipt, indent=2)+'\n')
    print(source['kind'], source['owner'], [(c['method'], c['bytes'], c['alphaExact'], round(c['maskedMeanLabDelta'], 4)) for c in row['candidates']], flush=True)
    del original
    gc.collect()

receipt['projections'] = []
for method in METHODS:
    candidates = [next(c for c in r['candidates'] if c['method'] == method) for r in receipt['assets']]
    owned = sum(c['bytes']+r['observedResponseOverhead'] for r, c in zip(receipt['assets'], candidates))
    projected = nonimage+auxiliary+owned
    receipt['projections'].append({'method': method, 'ownedImageBytesWithObservedOverhead': owned, 'allImageBytes': auxiliary+owned, 'totalBytes': projected, 'withinBudgetProjection': projected <= 8000000, 'numericalGates': all(c['numericalGate'] for c in candidates), 'measuredProductionPass': False})
receipt.update(complete=True, finished=datetime.datetime.now(datetime.timezone.utc).isoformat())
(OUT/('drill-'+ROUND+'.json')).write_text(json.dumps(receipt, indent=2)+'\n')
print('complete', receipt['projections'], flush=True)
