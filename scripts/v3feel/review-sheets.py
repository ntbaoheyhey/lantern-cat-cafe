"""Extract every recorded action contact window at 10 fps. Originals only in review output.
Reference decoding stays in the private gitignored ref directory."""
import argparse, gzip, json, subprocess, math, shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
p=argparse.ArgumentParser();p.add_argument('item');p.add_argument('--fixture',default='all');args=p.parse_args()
root=Path(__file__).resolve().parents[2];out=root/'reports/v3-feel/REVIEW'/args.item
for fixture in ['wave1','wave3','boss']:
 if args.fixture not in ['all',fixture]:continue
 source=out/fixture/'capture.json.gz'
 if not source.exists():continue
 data=json.loads(gzip.decompress(source.read_bytes()));video=out/(fixture+'.webm');folder=out/fixture/'sheets';folder.mkdir(exist_ok=True)
 decoded=out/fixture/'review-frames';decoded.mkdir(exist_ok=True)
 # Decode once at the recorded 30 Hz. The review selects 10 Hz action windows
 # from these actual frames and captions their exact frame indices.
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(video),'-vf','fps=30,scale=320:180','-q:v','2',str(decoded/'%04d.jpg')],check=True)
 for old in folder.glob('*.jpg'):old.unlink()
 actions=[]
 for index,plan in enumerate(data['plans']):
  if plan['at']>=30:continue
  start=plan.get('clockStart',plan['at'])
  impact=next((f['t'] for f in data['frames'] if f['t']>=plan['at']-.001 and f.get('action',{} ) and (f['action'].get('key')==plan['key'] if 'key' in plan else f['action']['id']==plan['id']) and f['action']['elapsed']>=plan['impact']),start+plan['impact']/1000)
  # Include complete focus, wind-up and recovery in addition to every required
  # contact window. A periodic status tick is retained and labelled explicitly.
  times=sorted({round(t,6) for t in [start+i*.1 for i in range(math.ceil(plan['duration']/100)+1)]+[impact-.3+i*.1 for i in range(9)]+[impact+i/30 for i in range(-3,5)]})
  indices=sorted({round(t*30) for t in times});times=[n/30 for n in indices]
  # The 30s artifact may end in an action. Keep an explicit boundary marker;
  # never pretend its later impact was watched.
  sheet=Image.new('RGB',(1280,math.ceil(len(times)/4)*200+28),'#17151d');draw=ImageDraw.Draw(sheet)
  draw.text((6,7),f'{fixture} A{index+1:02} | {plan["actorId"] or "ROUND STATUS"} | {plan["tier"]} | {plan["skillId"]}',fill='white')
  for n,t in enumerate(times):
   x=(n%4)*320;y=28+(n//4)*200
   if not 0<=t<30:
    draw.text((x+10,y+70),f'OUTSIDE 30s CAPTURE: {t:.3f}s',fill='#ffb56b');continue
   frame=decoded/f'{round(t*30)+1:04d}.jpg'
   if not frame.exists():continue
   sheet.paste(Image.open(frame),(x,y))
   draw.text((x+5,y+182),f'{t:.3f}s | f{round(t*30):04} | +{(t-start)*1000:.0f}ms',fill='white')
  name=f'action-{index+1:02}-{plan["skillId"].replace(":","_")}.jpg';sheet.save(folder/name,quality=88)
  actions.append({'index':index+1,'actor':plan['actorId'],'skill':plan['skillId'],'tier':plan['tier'],'at':plan['at'],'clockStart':start,'impact':impact,'sheet':str((folder/name).relative_to(root)),'times':times,'boundaryTruncated':any(t>=30 for t in times)})
 (out/fixture/'actions.json').write_text(json.dumps(actions,indent=2)+'\n');print(f'{fixture}: {len(actions)} action sheets',flush=True)
 shutil.rmtree(decoded)
