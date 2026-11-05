from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import json,itertools,math
import sys
root=Path(__file__).resolve().parents[2];out=root/(sys.argv[1] if len(sys.argv)>1 else 'reports/cardrpg/art-corrected');family=sys.argv[2] if len(sys.argv)>2 else 'effects';files=sorted((out/('shots/'+family)).glob('1280-*-0.png'));ids=[f.stem[5:-2] for f in files];hashes={};columns=5
for id in ids:
 h=[]
 for beat in range(5):
  im=Image.open(out/f'shots/{family}/1280-{id}-{beat}.png').convert('RGB')
  if family=='signatures':
   # Normalize the actual non-background spell extent; no DOM/UI pixels are captured.
   bg=Image.new('RGB',im.size,im.getpixel((0,0)));difference=ImageChops.difference(im,bg).convert('L').point(lambda v:255 if v>12 else 0);bounds=difference.getbbox()
   if bounds:
    x0,y0,x1,y1=bounds;pad=12;im=im.crop((max(0,x0-pad),max(0,y0-pad),min(im.width,x1+pad),min(im.height,y1+pad)))
  im=im.convert('L').resize((17,16),Image.Resampling.LANCZOS);v=list(im.getdata());h.extend([v[y*17+x]>v[y*17+x+1] for y in range(16) for x in range(16)])
 hashes[id]=h
pairs=sorted([{'a':a,'b':b,'distance':sum(x!=y for x,y in zip(hashes[a],hashes[b]))} for a,b in itertools.combinations(ids,2)],key=lambda p:p['distance'])
threshold=64 if family=='signatures' else 40
(out/('distinctness-'+family+'.json')).write_text(json.dumps({'method':('Five-beat concatenated 16x16 dHash, 1280 bits. Direct canvas readback of isolated actual VFX, no DOM labels/text, each beat cropped to its non-background extent with 12px margin. Threshold fixed before corrected capture: 64 bits (5%). Visual proxy, not a human judgment.' if family=='signatures' else 'Five-beat concatenated 16x16 dHash of full stage captures; 1280 bits; UI overlays retained. Global scene similarity limits this proxy.'),'threshold':threshold,'pairsBelow':sum(p['distance']<threshold for p in pairs),'closest':pairs[:20],'allPairs':pairs},indent=2))
for page,start in enumerate(range(0,len(ids),8)):
 sheet=Image.new('RGB',(1400,8*190),(27,23,35));draw=ImageDraw.Draw(sheet)
 for row,id in enumerate(ids[start:start+8]):
  for beat in range(5):
   im=Image.open(out/f'shots/{family}/1280-{id}-{beat}.png');im.thumbnail((275,163));sheet.paste(im,(beat*280,row*190+24));draw.text((beat*280+5,row*190+5),id+' / '+['prepare','release','impact','resolve','settle'][beat],fill='#edc28e')
 sheet.save(out/f'{family}-sheet-{page+1}.jpg',quality=92)
print(json.dumps({'recipes':len(ids),'below':sum(p['distance']<threshold for p in pairs),'closest':pairs[:10]}))
