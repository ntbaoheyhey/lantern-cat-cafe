"""Extract every recorded action contact window at 10 fps. Originals only in review output.
Reference decoding stays in the private gitignored ref directory."""
import argparse, gzip, json, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
p=argparse.ArgumentParser();p.add_argument('item');p.add_argument('--fixture',default='all');args=p.parse_args()
root=Path(__file__).resolve().parents[2];out=root/'reports/v3-feel/REVIEW'/args.item
for fixture in ['wave1','wave3','boss']:
 if args.fixture not in ['all',fixture]:continue
 source=out/fixture/'capture.json.gz'
 if not source.exists():continue
 data=json.loads(gzip.decompress(source.read_bytes()));video=out/(fixture+'.webm');folder=out/fixture/'sheets';folder.mkdir(exist_ok=True)
 actions=[]
 for index,plan in enumerate(data['plans']):
  if plan['at']>=30:continue
  impact=next((f['t'] for f in data['frames'] if f['t']>=plan['at']-.001 and f.get('action',{} ) and f['action']['id']==plan['id'] and f['action']['elapsed']>=plan['impact']),plan['at']+plan['impact']/1000)
  times=[plan['at'],plan['at']+.1,plan['at']+.25]+[impact-.3+i*.1 for i in range(9)]
  # The 30s artifact may end in an action. Keep an explicit boundary marker;
  # never pretend its later impact was watched.
  sheet=Image.new('RGB',(1280,4*258),'#17151d');draw=ImageDraw.Draw(sheet)
  for n,t in enumerate(times):
   x=(n%3)*426;y=(n//3)*258
   if not 0<=t<30:
    draw.text((x+10,y+70),f'OUTSIDE 30s CAPTURE: {t:.3f}s',fill='#ffb56b');continue
   frame=subprocess.check_output(['ffmpeg','-v','error','-ss',str(t),'-i',str(video),'-frames:v','1','-vf','scale=426:240','-f','image2pipe','-vcodec','png','-'])
   import io
   sheet.paste(Image.open(io.BytesIO(frame)),(x,y))
   draw.text((x+5,y+241),f'{fixture} A{index+1:02} | {t:.3f}s | frame {round(t*30):04}',fill='white')
  name=f'action-{index+1:02}-{plan["skillId"].replace(":","_")}.jpg';sheet.save(folder/name,quality=88)
  actions.append({'index':index+1,'actor':plan['actorId'],'skill':plan['skillId'],'tier':plan['tier'],'at':plan['at'],'impact':impact,'sheet':str((folder/name).relative_to(root)),'times':times,'boundaryTruncated':any(t>=30 for t in times)})
 (out/fixture/'actions.json').write_text(json.dumps(actions,indent=2)+'\n');print(f'{fixture}: {len(actions)} action sheets',flush=True)
