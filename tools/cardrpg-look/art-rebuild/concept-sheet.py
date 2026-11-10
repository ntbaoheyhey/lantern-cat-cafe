"""Contact sheet of original concepts only, explicitly not runtime evidence."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw

p = argparse.ArgumentParser()
p.add_argument('--ids', required=True)
p.add_argument('--out', required=True)
a = p.parse_args()
root = Path(__file__).resolve().parents[3]
ids = a.ids.split(',')
width, height, columns = 240, 310, 6
sheet = Image.new('RGB', (width * columns, height * ((len(ids)+columns-1)//columns)), '#233E46')
draw = ImageDraw.Draw(sheet)
rows = []
for index, unit in enumerate(ids):
    source = root / 'assets/source/look-v3/concepts' / (unit+'.png')
    if not source.exists():
        source = Path.home() / 'art/look-v3/concepts' / (unit+'.png')
    im = Image.open(source).convert('RGBA')
    bounds = im.getchannel('A').getbbox()
    im = im.crop(bounds)
    im.thumbnail((220, 268), Image.Resampling.LANCZOS)
    x, y = index % columns * width, index // columns * height
    sheet.paste(im, (x+(width-im.width)//2, y+12+268-im.height), im)
    draw.text((x+12, y+286), unit+' / CONCEPT', fill='#FFF0D2')
    rows.append(dict(id=unit, source=str(source), bounds=bounds))
out = Path(a.out)
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out, 'WEBP', quality=88, method=6)
out.with_suffix('.json').write_text(json.dumps(dict(kind='CONCEPT ONLY; no runtime or motion acceptance', units=rows), indent=2)+'\n')
