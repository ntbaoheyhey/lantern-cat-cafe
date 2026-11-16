from pathlib import Path
from PIL import Image, ImageDraw
import json

lab = Path('tools/v3craft-lab/v4-clarity')
rows = json.loads((lab / 'drill-r1.json').read_text())['rows']
for variant in ['lift', 'pour']:
    path = lab / 'raw' / f'drill-r1-{variant}.jpg'
    assert not path.exists(), 'Never overwrite a reviewed sheet'
    sheet = Image.new('RGB', (1024, 640), '#242335')
    draw = ImageDraw.Draw(sheet)
    for slot, ms in enumerate([800, 1100, 1300, 1600]):
        with Image.open(lab / 'raw/drills-r1' / f'{variant}-{ms}.png') as im:
            tile = im.convert('RGB').resize((512, 288), Image.Resampling.LANCZOS)
        row = next(r for r in rows if r['variant'] == variant and r['ms'] == ms and not r['reduced'])
        x, y = slot % 2 * 512, slot // 2 * 320
        sheet.paste(tile, (x, y + 30))
        draw.text((x + 8, y + 8), f'{variant} {ms}ms | area {row["areaFraction"]:.2%} | body225px', fill='white')
    sheet.save(path, quality=92)
    print(path)
