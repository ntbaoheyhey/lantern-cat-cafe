"""Existing encoded-film markers give the actual elapsed time of each sampled image."""
from pathlib import Path
from PIL import Image,ImageDraw
import gzip,json,subprocess,statistics,sys
root=Path('reports/v4-art/REVIEW/A3');out=root/'raw'/'flight';out.mkdir(parents=True,exist_ok=True);rows=[]
selected=sys.argv[1] if len(sys.argv)>1 else None
suffix='-'+selected+'-r2' if selected else ''
for fixture in ['wave1','wave3','boss']:
 if selected and fixture!=selected:continue
 d=json.loads(gzip.decompress((root/fixture/'capture.json.gz').read_bytes()))
 for p in d['plans']:
  if p['actorId']!='soot' or p['ultimate']:continue
  candidates=[]
  for shot in d['resampled']:
   n=shot.get('renderFrame')
   if not isinstance(n,int) or not 0<n<=len(d['frames']):continue
   f=d['frames'][n-1];action=f.get('action')
   if action and action['key']==p['key'] and 200<action['elapsed']<350:candidates.append({'frame':shot['frame'],'ordinal':n-1,'ms':action['elapsed']})
  if not candidates:continue
  selected=[]
  for t in [233.333,266.667,333.333]:
   options=[c for c in candidates if c['frame'] not in [x['frame'] for x in selected]]
   if options:selected.append(min(options,key=lambda x:abs(x['ms']-t)))
  for i,r in enumerate(selected):
   path=out/f'{fixture}-{p["key"]}-{i}.jpg';subprocess.run(['ffmpeg','-v','error','-y','-i',str(root/(fixture+'.webm')),'-vf',f'select=eq(n\\,{r["frame"]}),scale=336:189','-frames:v','1',str(path)],check=True);r['image']=str(path)
  rows.append({'fixture':fixture,'key':p['key'],'encodedFlightFrames':len(candidates),'distinctRenderFrames':len({r['ordinal'] for r in candidates}),'selected':selected})
s=Image.new('RGB',(1024,len(rows)*216+24),'#24212e');draw=ImageDraw.Draw(s);draw.text((8,5),'Soot:3encoded pre-impact images per basic, actual marker elapsed below; label only after inspecting',fill='white')
for row,a in enumerate(rows):
 y=24+row*216;draw.text((8,y),f'{a["fixture"]} A{a["key"]} | {a["encodedFlightFrames"]} encoded frames inside200–350ms',fill='white')
 for col,r in enumerate(a['selected']):
  s.paste(Image.open(r['image']),(8+col*336,y+18));draw.text((8+col*336,y+199),f'f{r["frame"]} actual {r["ms"]:.1f}ms',fill='white')
s.save(root/('flight-film'+suffix+'.jpg'),quality=92);(root/('film-flight'+suffix+'.json')).write_text(json.dumps({'method':'Decode existing compositor frame markers; each marker is renderordinal+1. Images directly from encoded30fpsfilms, no simulated pixels. Visual projectile visibility must be inspected.','rows':rows},indent=2)+'\n');print([(r['fixture'],r['key'],r['encodedFlightFrames'],r['distinctRenderFrames']) for r in rows])
