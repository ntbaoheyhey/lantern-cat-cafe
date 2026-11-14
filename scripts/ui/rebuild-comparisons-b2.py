"""Comparison artifacts contain only our application before/after screenshots."""
import json
from pathlib import Path
from PIL import Image,ImageDraw
B=Path('reports/v3-shell/b2');out=B/'shots/ui-before-after';out.mkdir(parents=True,exist_ok=True)
audit={r['id']:r for r in json.loads((B/'UI-AUDIT.json').read_text())['screens']}
for width in [1280,1440]:
 for name in [f'UI-REBUILD-RAW-{width}.json',f'UI-REBUILD-CHAIN-RAW-{width}.json']:
  for r in json.loads((B/name).read_text())['screens']:
   sheet=Image.new('RGB',(1280,474),'#171326');draw=ImageDraw.Draw(sheet)
   before=audit.get(r['id'],audit['bag-manage'])['screenshot']['path']
   for n,p in enumerate([before,r['screenshot']['path']]):
    im=Image.open(p).convert('RGB');im.thumbnail((640,440));sheet.paste(im,(n*640+(640-im.width)//2,30+(440-im.height)//2))
   draw.text((8,8),f"{r['id']} | BEFORE 1280x720",fill='white');draw.text((648,8),f"AFTER {width}x{720 if width==1280 else 900}",fill='white')
   sheet.save(out/f"{r['id']}-{width}.png")
print('Before/after comparisons complete.')
