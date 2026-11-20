"""Own-art layout study; no outside imagery or generation inputs."""
from pathlib import Path
from PIL import Image, ImageDraw
import json

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A10'
OUT.mkdir(parents=True, exist_ok=True)
names = ['mochi', 'soot', 'clover', 'panko']
art = {}
for name in names:
    im = Image.open(ROOT / f'apps/web/public/units/{name}/runtime.webp').convert('RGBA')
    art[name] = im.crop(im.getchannel('A').getbbox())

reference = Image.new('RGBA', (1024, 384), '#292635')
for i, name in enumerate(names):
    im = art[name].copy()
    im.thumbnail((240, 325), Image.Resampling.LANCZOS)
    reference.alpha_composite(im, (256*i+(256-im.width)//2, 350-im.height))
    ImageDraw.Draw(reference).text((256*i+12, 12), name.upper(), fill='white')
reference.convert('RGB').save(OUT/'approved-cats.jpg', quality=95)

layouts = {
    'lineup': [(0.20, .88, .64), (.40, .88, .64), (.60, .88, .64), (.80, .88, .64)],
    'group-right': [(.61, .94, .71), (.80, .76, .65), (.45, .74, .61), (.88, .97, .58)],
}
sheet = Image.new('RGB', (1024, 330), '#292635')
rows = []
for col, (label, layout) in enumerate(layouts.items()):
    canvas = Image.new('RGBA', (1024, 576), '#282536')
    mask = Image.new('L', canvas.size)
    boxes = []
    for name, (x, y, height) in zip(names, layout):
        im = art[name]
        h = round(height*576)
        im = im.resize((round(im.width*h/im.height), h), Image.Resampling.LANCZOS)
        xy = (round(x*1024-im.width/2), round(y*576-im.height))
        canvas.alpha_composite(im, xy)
        mask.paste(im.getchannel('A'), xy, im.getchannel('A'))
        boxes.append({'unit': name, 'bbox': [*xy, xy[0]+im.width, xy[1]+im.height], 'height': h})
    copy = mask.crop((30, 115, 350, 430))
    overlap = sum(v>10 for v in copy.getdata())/(copy.width*copy.height)
    rows.append({'variant': label, 'copyRegion': [30,115,350,430], 'copyOccupiedFraction': overlap, 'unitBoxes': boxes})
    sheet.paste(canvas.convert('RGB').resize((512,288)), (col*512,30))
    ImageDraw.Draw(sheet).text((col*512+8,8), f'{label} | copy occupied {overlap:.1%}', fill='white')
sheet.save(OUT/'composition-drill.jpg', quality=90)
(ROOT/'tools/v3craft-lab/v4-promo/results.json').write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps([{'variant':r['variant'],'copyOccupiedFraction':r['copyOccupiedFraction']} for r in rows]))
