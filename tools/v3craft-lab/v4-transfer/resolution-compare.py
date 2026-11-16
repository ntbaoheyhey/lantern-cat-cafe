"""Compare fixed-state browser cases; retain explicit film and production limits."""
from pathlib import Path
import datetime
import hashlib
import json
import math
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A10/scene-ready-transfer'
RAW = OUT / 'raw/resolution-runtime-comparisons'
REPORT = OUT / 'resolution-runtime-comparison.json'
assert not REPORT.exists()
RAW.mkdir(parents=True, exist_ok=True)
paths = [OUT / ('browser-resolution-' + label + '.json') for label in ('baseline', 'candidate', 'fallback')]
reports = [json.loads(path.read_text()) for path in paths]
assert all(report['complete'] and report['pass'] for report in reports)
indexed = [{(r['fixture'], r['height']): r for r in report['results']} for report in reports]
rows = []
for key, before in indexed[0].items():
    after, fallback = indexed[1][key], indexed[2][key]
    actors = []
    for a in before['state']['actors']:
        b = next(b for b in after['state']['actors'] if b['id'] == a['id'])
        feet = math.hypot(b['feet']['x'] - a['feet']['x'], b['feet']['y'] - a['feet']['y'])
        head_ratios = [b['face'][dim] / a['face'][dim] for dim in ('width', 'height')]
        boxes = [next(u['coreBox'] for u in case['state']['sizeAudit']['units'] if u['id'] == a['id']) for case in (before, after)]
        actors.append({'id': a['id'], 'asset': a['asset'], 'sourceStable': a['source'] == b['source'],
                       'feetDeltaPx': feet, 'feetWithin3Px': feet <= 3,
                       'headFaceBoxRatios': head_ratios, 'headWithin5Percent': all(abs(r - 1) <= .05 for r in head_ratios),
                       'coreBoxDelta': {dim: boxes[1][dim] - boxes[0][dim] for dim in ('x', 'y', 'width', 'height')}})
    rows.append({'fixture': key[0], 'height': key[1], 'actors': actors,
                 'baselineImageBytes': before['imageBytes'], 'candidateImageBytes': after['imageBytes'],
                 'savedImageBytes': before['imageBytes'] - after['imageBytes'],
                 'fallbackSnapshotExact': before['snapshotSha256'] == fallback['snapshotSha256'],
                 'sampledTextures': sum('/sampled-delivery/' in t['src'] for a in after['state']['actors'] for t in a['textures']),
                 'sampledPaintEntries': sum('/sampled-delivery/' in p['url'] for p in after['state']['paint']),
                 'fallbackPaintUsesNativeCoordinates': all(p['sourceScaleX'] == 1 and p['sourceScaleY'] == 1 for p in fallback['state']['paint'])})


def native_crops(key, owners):
    cases = [index[key] for index in indexed]
    sheet = Image.new('RGB', (984, 700), '#241c2b')
    draw = ImageDraw.Draw(sheet)
    for row, owner in enumerate(owners):
        actor = next(a for a in cases[0]['state']['actors'] if a['asset'] == owner)
        face = actor['face']
        cx, cy = round(face['x'] + face['width'] / 2), round(face['y'] + face['height'] / 2 + 60)
        box = (cx - 160, cy - 160, cx + 160, cy + 160)
        for col, (label, case) in enumerate(zip(('baseline', 'candidate', 'fallback'), cases)):
            x, y = col * 328, row * 350
            draw.text((x + 4, y + 4), f'{owner} {key[0]} {key[1]}p / {label}', fill='white')
            im = Image.open(ROOT / case['snapshot']).convert('RGB')
            sheet.paste(im.crop(box), (x + 4, y + 24))
    path = RAW / f'{key[0]}-{key[1]}-native.png'
    sheet.save(path)
    return path


sheets = [native_crops(('wave1', 720), ('mochi', 'soot')),
          native_crops(('wave3', 720), ('panko', 'clover')),
          native_crops(('boss', 720), ('binding-thread', 'yarn-giant'))]
sheet = Image.new('RGB', (984, 1266), '#241c2b')
draw = ImageDraw.Draw(sheet)
for row, (label, index) in enumerate(zip(('baseline', 'candidate'), indexed[:2])):
    draw.text((4, row * 633 + 2), 'boss 900p / ' + label + ' / full viewport downscaled equally', fill='white')
    im = Image.open(ROOT / index[('boss', 900)]['snapshot']).convert('RGB').resize((984, 615), Image.Resampling.LANCZOS)
    sheet.paste(im, (0, row * 633 + 18))
path = RAW / 'boss-900-stage.png'
sheet.save(path)
sheets.append(path)
receipt = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
           'evidenceHashes': {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths},
           'scope': 'Same paused state only; head face-box and feet-socket comparisons are not all-pose/film acceptance. Byte totals are development image requests, not production totals. VFX is loaded but idle screenshots do not prove effect appearance.',
           'rows': rows, 'staticGeometryPass': all(a['sourceStable'] and a['feetWithin3Px'] and a['headWithin5Percent'] for r in rows for a in r['actors']),
           'fallbackCoordinatesPass': all(r['fallbackPaintUsesNativeCoordinates'] for r in rows),
           'comparisons': [{'path': str(p.relative_to(ROOT)), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'reviewed': False} for p in sheets],
           'filmAcceptance': False, 'productionTransferAcceptance': False}
REPORT.write_text(json.dumps(receipt, indent=2) + '\n')
print('staticGeometry', receipt['staticGeometryPass'], 'fallbackCoordinates', receipt['fallbackCoordinatesPass'])
for row in rows:
    print(row['fixture'], row['height'], 'savedImages', row['savedImageBytes'], 'fallbackPixelExact', row['fallbackSnapshotExact'])
