"""Apply the unchanged V0.1 protected-face metric to the two new V3 statuses."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

out = Path('reports/cardrpg-look/skills-v5/v3')
data = json.loads((out / 'after-browser.json').read_text())
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 19)
small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 14)
sheet = Image.new('RGB', (800, 360), '#102129')
draw = ImageDraw.Draw(sheet)
rows = []
for i, row in enumerate(data['marks']):
    full = Image.open(row['real']).convert('RGB')
    base = Image.open(row['without']).convert('RGB')
    delta = np.abs(np.asarray(full, dtype=float) - np.asarray(base, dtype=float)).max(axis=2)
    h, w = delta.shape
    yy, xx = np.ogrid[:h, :w]
    faces = []
    for index, (x, y, rx, ry) in enumerate(row['masks']):
        if rx <= 0 or ry <= 0:
            continue
        mask = ((xx / w - x) / rx) ** 2 + ((1 - yy / h - y) / ry) ** 2 < .64
        mask &= (1 - yy / h) <= row['headTops'][index]
        if np.any(mask):
            faces.append({'fractionAbove8': float(np.mean(delta[mask] > 8)), 'meanRgbDelta': float(delta[mask].mean())})
    x = i * 400
    draw.text((x + 10, 9), row['name'] + ' · ' + row['subtitle'], font=font, fill='#fff0d2')
    for j, asset in enumerate(['mochi', 'button-guard']):
        b = next(u for u in row['units'] if u['asset'] == asset)['box']
        crop = full.crop((max(0, int(b[0] * w) - 65), max(0, int(b[1] * h) - 165), min(w, int(b[2] * w) + 65), min(h, int(b[3] * h) + 35)))
        crop.thumbnail((192, 286))
        sheet.paste(crop, (x + 4 + j * 198 + (192 - crop.width) // 2, 38 + (286 - crop.height) // 2))
        draw.text((x + 12 + j * 198, 333), asset, font=small, fill='#e8d7b8')
    rows.append({'id': row['id'], 'faces': faces, 'calls': row['stats']['calls'], 'triangles': row['stats']['triangles']})
sheet.save(out / 'status-contact-sheet.webp', quality=85)
result = {'method': 'Bleed/Bitter on Mochi and Button Guard; all visible actor faces sampled. Identical DPR1 fixedTime3.2 frames with/without effects. Unchanged V0.1 core ellipse (.8 radius) clipped at full model head-top; offender if >1% pixels differ by RGB>8.', 'rows': rows, 'samples': sum(len(r['faces']) for r in rows), 'offenders': [{'id': r['id'], **f} for r in rows for f in r['faces'] if f['fractionAbove8'] > .01]}
(out / 'faces.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'samples': result['samples'], 'offenders': len(result['offenders'])}))
