"""Actual game subject crops at 120px high, plus three-value squint views."""
import argparse,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
p=argparse.ArgumentParser();p.add_argument('directory');a=p.parse_args();root=Path(a.directory)
data=json.loads((root/'captures.json').read_text());rows=[r for r in data['rows'] if r['kind']=='unit' and r['width']==1280]
sheet=Image.new('RGB',(720,190*len(rows)),'#172d36');draw=ImageDraw.Draw(sheet)
for y,row in enumerate(rows):
 subject=next(c for c in row['crops'] if c['asset']==row['owner']);dpr=data['dpr']
 im=Image.open(root/row['file']).convert('RGB');box=tuple(int(v*dpr) for v in subject['box']);im=im.crop(box)
 im=ImageOps.contain(im,(210,120),Image.Resampling.LANCZOS);gray=ImageOps.grayscale(im)
 squint=gray.point(lambda x:40 if x<85 else 128 if x<170 else 220)
 for x,(tile,label) in enumerate([(im,'Color'),(gray,'Gray'),(squint,'Three values')]):
  sheet.paste(tile,(x*240+(240-tile.width)//2,y*190+38));draw.text((x*240+12,y*190+10),row['owner']+' / '+label,fill='#fff0d2')
sheet.save(root/'readability-120px.png')
print(root/'readability-120px.png')
