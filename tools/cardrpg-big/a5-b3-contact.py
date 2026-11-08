# REFERENCE: A5 B3. Keep original captures, including the transient loading frame.
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
import json, hashlib

root = Path.cwd()
base = root / 'reports/cardrpg-big/a5/b3/closure'
shots = []
for folder in ['day7-x1'] + [f'opening/browser-{width}' for width in [1280, 1440, 1024]]:
    receipt = json.loads((base / folder / 'checks.json').read_text())
    assert receipt['complete']
    for capture in receipt['captures']:
        shots.append((folder + ' / ' + capture.get('label', capture.get('name')), root / capture['path']))
ready = json.loads((base / 'day7-x1/ready-prepare.json').read_text())
shots.append(('day7-x1 / supplemental ready Prepare', root / ready['path']))
w, h = 400, 268
sheet = Image.new('RGB', (w * 3, h * ((len(shots) + 2) // 3)), '#f5efdf')
draw = ImageDraw.Draw(sheet)
for i, (label, path) in enumerate(shots):
    image = Image.open(path)
    thumb = ImageOps.contain(image, (w - 16, 228))
    x, y = (i % 3) * w + 8, (i // 3) * h + 8
    sheet.paste(thumb, (x, y))
    draw.text((x, y + 232), label, fill='#203334')
path = base / 'contact.png'
sheet.save(path)
print(json.dumps({'path': str(path), 'captures': len(shots), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}))
