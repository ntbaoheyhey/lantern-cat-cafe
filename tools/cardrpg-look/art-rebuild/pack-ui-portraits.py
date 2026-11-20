"""Publish small, face-focused crops for 56–72px UI slots; no shell changes."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'assets/cardrpg-look/v3-portraits'
REPORT = ROOT / 'reports/cardrpg-look/art-rebuild/r3'
# Authored face centres and square heights in each original alpha bound.
# Small object enemies keep their identity-defining shell around their eyes.
CROPS = {
    'mochi': (.50, .22, .58), 'soot': (.53, .26, .48),
    'clover': (.50, .19, .58), 'panko': (.50, .22, .65),
    'mallow': (.53, .22, .62), 'cinnamon': (.50, .25, .62),
    'velvet': (.52, .22, .50), 'biscuit': (.47, .22, .66),
    'brioche': (.50, .20, .62), 'marigold': (.50, .25, .60),
    'sorrel': (.50, .25, .52), 'inkcap': (.51, .28, .52),
    'button-guard': (.50, .31, .62), 'sock-skipper': (.52, .38, .65),
    'spool-ram': (.26, .42, .72), 'needle-moth': (.50, .24, .40),
    'teacup-healer': (.47, .30, .64), 'binding-thread': (.48, .22, .40),
    'practice-cushion': (.50, .50, .90), 'pollen-scout': (.50, .32, .64),
    'crumb-sentinel': (.50, .45, .85), 'rain-spool': (.35, .43, .75),
    'yarn-giant': (.50, .27, .64), 'kettle-knight': (.50, .40, .76),
    'pantry-crown': (.50, .38, .75),
}
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
manifest_path = OUT / 'manifest.json'
manifest = json.loads(manifest_path.read_text())
sheet = Image.new('RGB', (900, 25 * 92), '#102129')
draw = ImageDraw.Draw(sheet)
rows = []
for row_index, (unit, (cx, cy, extent)) in enumerate(CROPS.items()):
    row = manifest['portraits'][unit]
    source = ROOT / row['provenance']['source']
    if sha(source) != row['provenance']['sourceSha256']:
        raise ValueError('Source identity changed: ' + unit)
    original = Image.open(source).convert('RGBA')
    left, top, right, bottom = original.getchannel('A').getbbox()
    w, h = right-left, bottom-top
    side = h * extent
    x, y = left + cx*w, top + cy*h
    box = [round(x-side/2), round(y-side/2), round(x+side/2), round(y+side/2)]
    crop = original.crop(box)
    background = '#251620' if row['side'] == 'enemy' else '#173039'
    portrait = Image.new('RGBA', crop.size, background)
    portrait.alpha_composite(crop)
    paths, hashes = {}, {}
    baseline = Image.open(ROOT / row['portrait']['1x'])
    draw.text((8, row_index*92+9), unit, fill='#fff0d2')
    for size_index, size in enumerate((56, 72, 144)):
        tile = portrait.resize((size, size), Image.Resampling.LANCZOS)
        path = OUT / f'{unit}-ui-{size}.webp'
        tile.save(path, 'WEBP', quality=92, method=6)
        paths[str(size)] = str(path.relative_to(ROOT))
        hashes[str(size)] = sha(path)
        # Before and after at the actual slot size (144 shown at72 for sheet).
        display = min(size, 72)
        old = baseline.copy(); old.thumbnail((display, display), Image.Resampling.LANCZOS)
        px = 165 + size_index*240
        sheet.paste(old.convert('RGB'), (px+(display-old.width)//2, row_index*92+14))
        sheet.paste(tile.resize((display, display)).convert('RGB'), (px+92, row_index*92+14))
        draw.text((px+2, row_index*92+1), f'{size}px old / face crop', fill='#d8b98a')
    row['uiPortrait'] = dict(compact=paths['56'], **{'1x': paths['72'], '2x': paths['144']},
        display=[72, 72], sizes=[[56, 56], [72, 72], [144, 144]],
        usage='Square face crop for formation/tower slots; object-fit:cover; original card portrait remains available',
        provenance=dict(source=str(source.relative_to(ROOT)), sourceSha256=sha(source), crop=box,
            method='Authored face ROI, original alpha composited on cafe colour, Lanczos, WebP92',
            author='tools/cardrpg-look/art-rebuild/pack-ui-portraits.py', deliveredSha256=hashes))
    rows.append(dict(id=unit, crop=box, sizes=[56, 72, 144]))
manifest_path.write_text(json.dumps(manifest, indent=2)+'\n')
sheet.save(REPORT / 'ui-portrait-comparison.webp', 'WEBP', quality=90, method=6)
(REPORT / 'ui-portrait-crops.json').write_text(json.dumps(dict(rows=rows, count=len(rows),
    defaultLoaded=False, runtimeIdentityReview='pending roster', existingCardPortraitsChanged=False), indent=2)+'\n')
print(json.dumps(dict(portraits=len(rows), variants=75, defaultLoaded=False)))
