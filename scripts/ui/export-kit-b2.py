"""Export original ImageGen artwork to 2x WebP and write reproducible provenance.

Only resize/crop/encode our own output. No reference-game pixels are read here.
Run tools/.venv/bin/python scripts/ui/export-kit-b2.py (partial exports are explicit).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/v3-shell/b2'
PUBLIC = ROOT / 'apps/web/public/art/v3-shell/b2'
REPORT = ROOT / 'reports/v3-shell/b2'
LICENSE = 'Original generated output; OpenAI Terms of Use. No third-party image input.'
plan = json.loads((SOURCE / 'prompts.json').read_text())
PUBLIC.mkdir(parents=True, exist_ok=True)
files, missing = [], []
previous_path = REPORT / 'UI-ART.json'
previous = {r['id']: r for r in json.loads(previous_path.read_text()).get('files', [])} if previous_path.exists() else {}
exporter_hash = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def relative(path):
    return str(path.relative_to(ROOT))

for asset in plan['assets']:
    source = SOURCE / 'sources' / (asset['id'] + '.png')
    if not source.exists():
        missing.append(asset['id'])
        continue
    source_hash = sha(source)
    exports = asset.get('exports', [asset])
    cached = [previous.get(export['id']) for export in exports]
    if all(row and row.get('exporterHash') == exporter_hash and row['provenance']['source']['sha256'] == source_hash and row['provenance']['prompt'] == asset['prompt'] and (ROOT/row['path']).exists() and sha(ROOT/row['path']) == row['sha256'] for row in cached):
        files.extend(cached)
        continue
    original = Image.open(source).convert('RGBA')
    original_size = original.size
    if asset['transparent']:
        if original.getchannel('A').getextrema()[0] != 0:
            raise ValueError(asset['id'] + ' requires genuine transparent pixels')
        bbox = original.getchannel('A').getbbox()
        if not bbox:
            raise ValueError(asset['id'] + ' is empty')
        artwork = original.crop(bbox)
    else:
        artwork = original.convert('RGB')
    for export in exports:
        width, height = export['width'], export['height']
        out = PUBLIC / (export['id'] + '.webp')
        if asset['transparent']:
            # Fit the whole painted object; preserve transparency and aspect ratio.
            resized = artwork.copy()
            resized.thumbnail((width, height), Image.Resampling.LANCZOS)
            rendered = Image.new('RGBA', (width, height))
            rendered.alpha_composite(resized, ((width - resized.width)//2, (height - resized.height)//2))
        else:
            # Backgrounds fill their viewport; record any source-size limitation below.
            ratio = max(width/artwork.width, height/artwork.height)
            resized = artwork.resize((round(artwork.width*ratio), round(artwork.height*ratio)), Image.Resampling.LANCZOS)
            left, top = (resized.width-width)//2, (resized.height-height)//2
            rendered = resized.crop((left, top, left+width, top+height))
        rendered.save(out, 'WEBP', quality=86, method=6, exact=True)
        provenance = {
            'tool': 'built-in image_gen; Pillow resize/crop/WebP export',
            'prompt': asset['prompt'], 'license': LICENSE, 'date': '2026-11-13',
            'inputs': [{'kind': 'text', 'text': asset['prompt']}] + ([{'kind': 'own-image', 'path': asset['referenceOwn'], 'sha256': sha(ROOT/asset['referenceOwn'])}] if asset.get('referenceOwn') else []),
            'source': {'path': relative(source), 'sha256': sha(source), 'width': original_size[0], 'height': original_size[1]},
            'processing': 'Alpha preserved; transparent bounding box cropped, aspect-fit, Lanczos resized and centered. Backgrounds aspect-fill. No redrawing, recoloring, or reference pixels.',
        }
        files.append({
            'id': export['id'], 'family': asset['family'], 'path': relative(out),
            'sha256': sha(out), 'bytes': out.stat().st_size, 'isNew': True, 'exporterHash': exporter_hash,
            'width': width, 'height': height, 'displayWidth': width/2, 'displayHeight': height/2,
            'pixelRatio': 2, 'transparent': asset['transparent'],
            'sourceUpscale': max(width/artwork.width, height/artwork.height) if not asset['transparent'] else 1,
            'slice': asset.get('slice'), 'provenance': provenance,
        })

evidence = {
    'version': 1, 'date': '2026-11-13', 'complete': not missing,
    'sourcePolicy': 'Written prompts and named project-original inputs only. Reference comparisons remain private and were never tool inputs.',
    'budgetScope': 'All newly shipped WebP assets, excluding archival generator source PNGs and report contact sheet.',
    'files': files, 'missing': missing, 'totalBytes': sum(row['bytes'] for row in files),
    'sourceLimitations': [{'id': row['id'], 'scale': row['sourceUpscale']} for row in files if row['sourceUpscale'] > 1.01],
}
(REPORT / 'UI-ART.json').write_text(json.dumps(evidence, indent=2)+'\n')
provenance_path = ROOT / 'assets/provenance.json'
provenance = json.loads(provenance_path.read_text())
provenance['assets'] = [row for row in provenance['assets'] if row.get('type') != 'v3b2-ui-art']
provenance['assets'] += [{'type': 'v3b2-ui-art', 'files': [row['path']], 'sha256': row['sha256'], **row['provenance']} for row in files]
provenance_path.write_text(json.dumps(provenance, indent=2)+'\n')

# Compact visual inventory; final acceptance still requires looking at the artwork.
cols, cell_w, cell_h = 8, 160, 122
rows = (len(files)+cols-1)//cols
sheet = Image.new('RGB', (1280, max(180, rows*cell_h+48)), '#1d182a')
draw = ImageDraw.Draw(sheet)
draw.text((16, 12), f'LANTERN CAT CAFE / ORIGINAL UI KIT  |  {len(files)} exports / {evidence["totalBytes"]:,} bytes', fill='#ffe4a6')
for index, row in enumerate(files):
    x, y = (index%cols)*cell_w, (index//cols)*cell_h+42
    draw.rounded_rectangle((x+4,y,x+cell_w-4,y+cell_h-5), 8, fill='#30283f', outline='#5b4860')
    thumb = Image.open(ROOT/row['path']).convert('RGBA')
    thumb.thumbnail((148, 94), Image.Resampling.LANCZOS)
    sheet.paste(thumb, (x+(cell_w-thumb.width)//2, y+(98-thumb.height)//2), thumb)
    draw.text((x+8,y+100), row['id'], fill='#f5dfaf')
sheet.save(REPORT/'shots/ui-kit.png', optimize=True)
print(json.dumps({'exports': len(files), 'bytes': evidence['totalBytes'], 'missing': len(missing), 'sourceLimitations': evidence['sourceLimitations']}))
