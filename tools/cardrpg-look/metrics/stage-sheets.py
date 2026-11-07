"""Actual rendered canvases, with receipt camera data retained beside each row."""
import json,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
root=Path(sys.argv[1]);data=json.loads((root/'captures.json').read_text());dpr=data['dpr']
for width in sorted(set(r['width'] for r in data['rows'])):
 rows=[r for r in data['rows'] if r['width']==width and r['kind']=='stage']
 sheet=Image.new('RGB',(1800,360*((len(rows)+2)//3)),'#172d36');draw=ImageDraw.Draw(sheet)
 for i,r in enumerate(rows):
  c=r['canvas'];box=tuple(round(v*dpr) for v in [c['x'],c['y'],c['x']+c['width'],c['y']+c['height']])
  im=Image.open(root/r['file']).convert('RGB').crop(box);im=ImageOps.contain(im,(594,324),Image.Resampling.LANCZOS)
  x=i%3*600;y=i//3*360;sheet.paste(im,(x+(600-im.width)//2,y+30))
  draw.text((x+8,y+8),f"{r['name']} | FOV {r['camera']['fov']:.2f} | {r['stats']['triangles']:,} tris",fill='#fff0d2')
 sheet.save(root/f'stage-{width}-sheet.png')
