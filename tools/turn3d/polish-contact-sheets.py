"""Contact sheets of actual browser captures; no generated or referenced game art."""
import json
from pathlib import Path
from PIL import Image,ImageDraw
out=Path('reports/turn3d-polish/shots/review');out.mkdir(exist_ok=True)
assets=json.load(open('docs/turn3d/ASSET-MANIFEST.json'))['assets']
for start in [0,6]:
 sheet=Image.new('RGB',(1200,1590),(28,26,38));d=ImageDraw.Draw(sheet)
 for row,a in enumerate(assets[start:start+6]):
  for col,angle in enumerate(['front','three-quarter','side','back']):
   im=Image.open(Path('reports/turn3d-polish/shots/models')/(a['id']+'-'+angle+'.png'));im.thumbnail((296,240));sheet.paste(im,(col*300,row*265+22));d.text((col*300+8,row*265+5),a['name']+' / '+angle,fill='#f5cb7b')
 sheet.save(out/('models-sheet-'+str(start//6+1)+'.jpg'),quality=91)
files=sorted(Path('reports/turn3d-polish/shots/effects').glob('1280-*-2.png'))
sheet=Image.new('RGB',(1440,((len(files)+4)//5)*180),(28,26,38));d=ImageDraw.Draw(sheet)
for i,p in enumerate(files):
 im=Image.open(p);im.thumbnail((284,154));x=i%5*288;y=i//5*180;sheet.paste(im,(x,y+22));d.text((x+4,y+5),p.stem[5:-2],fill='#f5cb7b')
sheet.save(out/'effects-sheet.jpg',quality=92)
# Every authored clip at three times, one sheet per model, in the same source order.
for a in assets:
 sheet=Image.new('RGB',(3*240,len(a['clips'])*204),(28,26,38));d=ImageDraw.Draw(sheet)
 for row,clip in enumerate(a['clips']):
  for col,t in enumerate([.15,.45,.8]):
   im=Image.open(f"reports/turn3d-polish/shots/models/{a['id']}-{clip}-{t}.png");im.thumbnail((236,180));sheet.paste(im,(col*240,row*204+22));d.text((col*240+5,row*204+5),f'{clip} / {t}',fill='#f5cb7b')
 sheet.save(out/(a['id']+'-clips.jpg'),quality=88)
print('Contact sheets: twelve models, all clips,',len(files),'effect impacts.')
