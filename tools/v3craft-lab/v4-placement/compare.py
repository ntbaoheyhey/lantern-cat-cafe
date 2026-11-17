"""Private same-pixel-scale comparisons; inspect each sheet once."""
from pathlib import Path
from datetime import datetime, timezone
from PIL import Image, ImageDraw, ImageFont
import hashlib
import json
import math

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A11/placement-r1'
source = OUT / 'drills.json'
data = json.loads(source.read_text())
assert data['complete'] and data['runtimeUnchanged']
report = OUT / 'comparisons.json'
assert not report.exists()
folder = OUT / 'raw/comparisons'
folder.mkdir(parents=True, exist_ok=True)
font_path = Path('/System/Library/Fonts/Supplemental/Arial.ttf')
font = ImageFont.truetype(str(font_path), 14) if font_path.exists() else ImageFont.load_default()
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
pages = []
for case in data['cases']:
    baseline = case['variants'][0]['geometry']
    target = (baseline['clipped'] or [row['id'] for row in baseline['hud']] or [baseline['labels'][0]['id']])[0]
    boxes = [next(label['rect'] for label in variant['geometry']['labels'] if label['id'] == target) for variant in case['variants']]
    left, right = min(box['x'] for box in boxes), max(box['x'] + box['width'] for box in boxes)
    top, bottom = min(box['y'] for box in boxes), max(box['y'] + box['height'] for box in boxes)
    assert right - left <= 464, 'Displacement requires a wider explicit comparison'
    crop_height = min(case['height'], max(300, math.ceil(bottom - top + 48)))
    x = max(0, min(case['width'] - 512, round((left + right) / 2 - 256)))
    y = max(0, min(case['height'] - crop_height, math.floor(top - 24)))
    sheet = Image.new('RGB', (1024, 36 + 2 * (crop_height + 28)), '#17151d')
    draw = ImageDraw.Draw(sheet)
    draw.text((8, 8), f"{case['fixture']} {case['height']}p | {target} | first three panels: native pixels, identical crop", font=font, fill='white')
    for index, variant in enumerate(case['variants']):
        path = ROOT / variant['path']
        assert sha(path) == variant['sha256']
        col, row = index % 2 * 512, 36 + index // 2 * (crop_height + 28)
        with Image.open(path) as image:
            sheet.paste(image.crop((x, y, x + 512, y + crop_height)), (col, row + 28))
        g = variant['geometry']
        draw.text((col + 8, row + 6), f"{variant['name']} | clipped {len(g['clipped'])} | HUD {len(g['hud'])} | face {len(g['faceHits'])}", font=font, fill='white')
    row = 36 + crop_height + 28
    with Image.open(ROOT / case['variants'][2]['path']) as image:
        image.thumbnail((512, crop_height))
        sheet.paste(image, (512, row + 28))
    draw.text((520, row + 6), 'HUD-aware placement: whole viewport overview (scaled)', font=font, fill='white')
    path = folder / f"{case['fixture']}-{case['height']}.png"
    sheet.save(path)
    pages.append({'fixture': case['fixture'], 'height': case['height'], 'target': target,
                  'path': str(path.relative_to(ROOT)), 'sha256': sha(path), 'crop': [x, y, 512, crop_height],
                  'width': 1024, 'reviewed': False})
report.write_text(json.dumps({'created': datetime.now(timezone.utc).isoformat(), 'drillSha256': sha(source),
                             'scriptSha256': sha(Path(__file__)), 'pages': pages, 'reviewComplete': False,
                             'productionInstalled': False}, indent=2) + '\n')
print('Prepared', len(pages), 'fresh 1024px comparisons; none reviewed yet.')
