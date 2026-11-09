"""Contact sheets from the original Z/guide captures. No browser or new samples."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
import hashlib
import json

base = Path('reports/cardrpg-big/skills-v5/s6')
z = json.loads((base / 'z/summary.json').read_text())
guide = json.loads((base / 'guide/checks.json').read_text())
assert z['complete'] and guide['complete']
out = base / 'visual-review'
out.mkdir(exist_ok=True)
manifest = {'artifactSha256': z['artifactSha256'], 'groups': [],
            'scope': 'Unchanged original captures, resized only for contact sheets. Full-size originals remain available; no new screenshot or human-recognition claim.'}


def sheet(name, captures):
    w, h = 480, 326
    canvas = Image.new('RGB', (w * 3, h * ((len(captures) + 2) // 3)), '#f5efdf')
    draw = ImageDraw.Draw(canvas)
    sources = []
    for i, row in enumerate(captures):
        path = Path(row['path'])
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if 'sha256' in row:
            assert digest == row['sha256'], path
        image = Image.open(path)
        thumb = ImageOps.contain(image, (w - 16, h - 40))
        x, y = (i % 3) * w + 8, (i // 3) * h + 8
        canvas.paste(thumb, (x, y))
        draw.text((x, y + h - 36), path.stem, fill='#203334')
        sources.append({'path': str(path), 'sha256': digest})
    target = out / (name + '.jpg')
    canvas.save(target, quality=90)
    manifest['groups'].append({'path': str(target), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'captures': sources})


for group in z['groups']:
    sheet(f"z-{group['width']}-look-{'on' if group['look'] else 'off'}", group['captures'])
for name, groups in [('v5-guide', guide['rows']), ('a5-guide', guide['a5Rows'])]:
    sheet(name, [{'path': p} for row in groups for p in row['captures']])
assert sum(len(g['captures']) for g in manifest['groups']) == 147
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'sheets': len(manifest['groups']), 'captures': 147, 'manifest': str(out / 'manifest.json')}))
