"""Contact sheets from actual captures/renders; no generated artwork."""
import argparse,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
p=argparse.ArgumentParser();p.add_argument('kind',choices=['rounds','poses','comparison']);p.add_argument('directory');p.add_argument('--before');a=p.parse_args();root=Path(a.directory)
def tile(path,w,h):
 im=Image.open(path).convert('RGBA'); bg=Image.new('RGBA',im.size,'#172d36');bg.alpha_composite(im)
 return ImageOps.contain(bg.convert('RGB'),(w,h),Image.Resampling.LANCZOS)
if a.kind=='rounds':
 for cat in ['mochi','soot','clover']:
  directory=root/cat;files=sorted(directory.glob('round-*-portrait.png'));w,h=320,420
  sheet=Image.new('RGB',(w*len(files),h),'#172d36');draw=ImageDraw.Draw(sheet)
  for i,f in enumerate(files):
   t=tile(f,w,h-24);sheet.paste(t,(i*w+(w-t.width)//2,24));draw.text((i*w+12,6),f'{cat}: {f.stem}',fill='#fff0d2')
  for i in range(len(files)):
   # Every round has an evidence sheet, including its preceding actual render.
   first=max(0,i-1);sheet.crop((first*w,0,(i+1)*w,h)).save(directory/f'round-{files[i].stem.split("-")[1]}.png')
  sheet.save(directory/'rounds.png')
elif a.kind=='poses':
 data=json.loads((root/'poses.json').read_text())
 for id in dict.fromkeys(r['id'] for r in data['rows']):
  rows=[r for r in data['rows'] if r['id']==id];sheet=Image.new('RGB',(320*len(rows),420),'#172d36');draw=ImageDraw.Draw(sheet)
  for i,r in enumerate(rows):
   im=Image.open(root/r['file']).convert('RGB');w,h=im.size
   # Unit is centered by the actual model-view camera; crop only horizontal margins.
   im=im.crop((max(0,w/2-h*.55),0,min(w,w/2+h*.55),h));im=ImageOps.contain(im,(320,390),Image.Resampling.LANCZOS)
   sheet.paste(im,(i*320+(320-im.width)//2,24));draw.text((i*320+8,7),f'{id} / {r["progress"]:.2f}',fill='#fff0d2')
  sheet.save(root/f'{id}-sheet.png')
else:
 data=json.loads((root/'captures.json').read_text());prev=json.loads((Path(a.before)/'captures.json').read_text());before={r['file']:r for r in prev['rows']}
 for r in data['rows']:
  if r['file'] not in before or r['kind']!='unit':continue
  old=before[r['file']];boxes=[s['box'] for row in [old,r] for s in row.get('crops',[]) if s['asset']==r['owner']]
  if not boxes:continue
  dpr=data.get('dpr',2);canvas=r['canvas'];box=(max(canvas['x'],min(b[0] for b in boxes)-8)*dpr,max(canvas['y'],min(b[1] for b in boxes)-8)*dpr,min(canvas['x']+canvas['width'],max(b[2] for b in boxes)+8)*dpr,min(canvas['y']+canvas['height'],max(b[3] for b in boxes)+8)*dpr)
  sheet=Image.new('RGB',(960,560),'#172d36');draw=ImageDraw.Draw(sheet)
  for i,(folder,label) in enumerate([(Path(a.before),'Classic'),(root,'Atelier')]):
   im=Image.open(folder/r['file']).convert('RGB').crop(tuple(map(int,box)));im=ImageOps.contain(im,(470,520),Image.Resampling.LANCZOS);sheet.paste(im,(i*480+(480-im.width)//2,34));draw.text((i*480+14,12),f'{r["owner"]} / {label} / matched camera',fill='#fff0d2')
  (root/'comparisons').mkdir(exist_ok=True);sheet.save(root/'comparisons'/r['file'])
