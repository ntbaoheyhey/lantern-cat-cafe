"""Private measurement sheets; never imports reference pixels into shipped art.
Run with tools/.venv/bin/python. Start/end are source-video wall seconds.
"""
import argparse, json, math, subprocess, shutil
from pathlib import Path
from PIL import Image, ImageDraw

p=argparse.ArgumentParser();p.add_argument('source',choices=['v1','v2']);p.add_argument('start',type=float);p.add_argument('end',type=float);p.add_argument('--fps',type=float,default=10);p.add_argument('--label',required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[2]
video=next(Path('/Users/bao/Downloads').glob('*'+('kiXkwkoUuY' if a.source=='v1' else 'ua_e236yxNM')+'*mp4'))
out=root/'reports/v3-feel/ref/QR'/a.label;raw=out/'raw';raw.mkdir(parents=True,exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-ss',str(a.start),'-i',str(video),'-t',str(a.end-a.start),'-vf',f'fps={a.fps},scale=320:-1','-q:v','2',str(raw/'%05d.jpg')],check=True)
frames=sorted(raw.glob('*.jpg'));h=Image.open(frames[0]).height;per=24;sheets=[]
for offset in range(0,len(frames),per):
 group=frames[offset:offset+per];sheet=Image.new('RGB',(1280,math.ceil(len(group)/4)*(h+22)),'#191522');d=ImageDraw.Draw(sheet)
 for i,path in enumerate(group):
  x=i%4*320;y=i//4*(h+22);sheet.paste(Image.open(path),(x,y));t=a.start+(offset+i)/a.fps
  d.text((x+4,y+h+3),f'{a.source} {t:.3f}s | n={offset+i:03}',fill='white')
 target=out/f'sheet-{offset//per+1:02}.jpg';sheet.save(target,quality=89);sheets.append(str(target.relative_to(root)))
(out/'index.json').write_text(json.dumps({'source':str(video),'sourceId':a.source,'start':a.start,'end':a.end,'fps':a.fps,'frames':len(frames),'sheets':sheets},indent=2)+'\n')
shutil.rmtree(raw)
print(json.dumps({'label':a.label,'frames':len(frames),'sheets':sheets}))
