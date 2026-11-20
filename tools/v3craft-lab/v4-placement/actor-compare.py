"""Make six new, source-bound actor-relative comparisons without reopening prior sheets."""
from pathlib import Path
from datetime import datetime, timezone
from PIL import Image, ImageDraw, ImageFont
import gzip
import hashlib
import json
import math

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A11/placement-r1'
source = OUT / 'temporal-r4.json'
data = json.loads(source.read_text())
assert data['complete'] and data['runtimeUnchanged'] and data['candidateKind'] == 'actor'
report = OUT / 'actor-comparisons-r1.json'
assert not report.exists(), 'Never overwrite comparisons'
folder = OUT / 'raw/actor-comparisons-r1'
folder.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 14)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
pages = []
for case in data['cases']:
    if not case['snapshots']:
        continue
    raw = json.loads(gzip.decompress((ROOT / case['rawSamples']['path']).read_bytes()))
    for before in [x for x in case['snapshots'] if x['variant'] == 'baseline']:
        after = next(x for x in case['snapshots'] if x['variant'] == 'hud' and x['encodedFrame'] == before['encodedFrame'])
        sample = next(s for s in case['samples'] if s['encodedFrame'] == before['encodedFrame'])
        geometry = next(s for s in raw if s['encodedFrame'] == before['encodedFrame'])
        target = sample['retainedDefects'][0]['actor']
        boxes = [next(x['rect'] for x in geometry[k]['labels'] if x['id'] == target) for k in ['baseline', 'candidate']]
        boxes += [x for x in geometry['baseline']['faces'] if x['id'] == target]
        left, right = min(x['x'] for x in boxes), max(x['x'] + x['width'] for x in boxes)
        top, bottom = min(x['y'] for x in boxes), max(x['y'] + x['height'] for x in boxes)
        assert right - left <= 512
        crop_height = min(case['height'], max(300, math.ceil(bottom - top + 48)))
        x = max(0, min(case['width'] - 512, math.floor((left + right) / 2 - 256)))
        y = max(0, min(case['height'] - crop_height, math.floor(top - 24)))
        context_height = round(case['height'] * 512 / case['width'])
        sheet = Image.new('RGB', (1024, 88 + crop_height + context_height), '#17151d')
        draw = ImageDraw.Draw(sheet)
        draw.text((8, 8), f"{case['fixture']} {case['height']}p f{before['encodedFrame']} | {target} | original / actor-relative", font=font, fill='white')
        for i, item in enumerate([before, after]):
            path = ROOT / item['path']
            assert sha(path) == item['sha256']
            im = Image.open(path).convert('RGB')
            sheet.paste(im.crop((x, y, x + 512, y + crop_height)), (512 * i, 36))
            sheet.paste(im.resize((512, context_height), Image.Resampling.LANCZOS), (512 * i, 76 + crop_height))
        draw.text((8, 44 + crop_height), 'Upper: identical native-pixel crop. Lower: complete frames reduced equally for composition.', font=font, fill='white')
        path = folder / f"{case['fixture']}-{case['height']}-f{before['encodedFrame']}.png"
        sheet.save(path)
        pages.append({'fixture': case['fixture'], 'height': case['height'], 'encodedFrame': before['encodedFrame'],
                      'target': target, 'path': str(path.relative_to(ROOT)), 'sha256': sha(path),
                      'dimensions': list(sheet.size), 'sourcePaths': [before['path'], after['path']],
                      'crop': [x, y, 512, crop_height], 'reviewed': False})
assert len(pages) == 6
report.write_text(json.dumps({'at': datetime.now(timezone.utc).isoformat(), 'sourceSha256': sha(source),
                              'scope': 'New private actor-relative method; six static pairs do not prove full-film temporal stability.',
                              'pages': pages, 'reviewComplete': False}, indent=2) + '\n')
print('Created6 fresh comparison sheets; widths1024; no image opened.')
