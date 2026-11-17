"""Review every scoped Clover window from encoded films, no recorder changes."""
from pathlib import Path
import gzip,json,math,statistics,subprocess,sys
from PIL import Image,ImageDraw
root=Path('reports/v4-art/REVIEW/A5');out=root/'raw'/'action-strips';out.mkdir(parents=True,exist_ok=True)
results=[]
selected=sys.argv[1] if len(sys.argv)>1 else None
if selected:out=root/'raw'/'action-strips-r2';out.mkdir(parents=True,exist_ok=True)
for fixture in ['wave1','wave3','boss']:
 if selected and fixture!=selected:continue
 cp=root/fixture/'capture.json.gz'
 if not cp.exists():continue
 d=json.loads(gzip.decompress(cp.read_bytes()));actions=[]
 for p in d['plans']:
  hurt=any(e['type']=='damage' and e.get('amount',0)>0 and 'clover' in e['targetIds'] for e in p['events'])
  if p['actorId']!='clover' and not hurt:continue
  impact=p.get('clockStart',p['at'])+p['impact']/1000
  times=[impact-.3+i*.1 for i in range(9)]
  actions.append({'key':p['key'],'actor':p['actorId'],'ultimate':p['ultimate'],'cloverHit':hurt,'impact':impact,'times':times,'boundary':min(times)<0 or max(times)>=30})
 frames=sorted({round(t*30) for a in actions for t in a['times'] if 0<=t<30})
 raw=out/fixture;raw.mkdir(exist_ok=True)
 exp='+'.join(f'eq(n\\,{n})' for n in frames)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(root/(fixture+'.webm')),'-vf','select='+exp,'-fps_mode','vfr','-q:v','2',str(raw/'%04d.jpg')],check=True)
 for page in range(math.ceil(len(actions)/4)):
  batch=actions[page*4:(page+1)*4];sheet=Image.new('RGB',(1024,len(batch)*165+26),'#221f29');draw=ImageDraw.Draw(sheet)
  draw.text((8,5),fixture+' | Clover every action/hit at10fps; actor crops above; full impact scene below in separate sheet',fill='white')
  for row,a in enumerate(batch):
   y=26+row*165;draw.text((8,y),f'A{a["key"]} {a["actor"]} {"ult" if a["ultimate"] else "basic"} hit={a["cloverHit"]} impact{a["impact"]:.3f}s',fill='white')
   for i,t in enumerate(a['times']):
    n=round(t*30)
    if not 0<=t<30 or n not in frames:continue
    shot=d['resampled'][min(n,len(d['resampled'])-1)];ordinal=shot.get('renderFrame');f=d['frames'][ordinal-1] if isinstance(ordinal,int) and 0<ordinal<=len(d['frames']) else min(d['frames'],key=lambda f:abs(f['t']-t))
    u=next((u for u in f['units'] if u['id']=='clover'),None)
    if not u:continue
    b=u['box'];im=Image.open(raw/f'{frames.index(n)+1:04d}.jpg');cx=b['x']+b['width']/2;cy=b['y']+b['height']/2
    crop=im.crop((round(cx-125),round(cy-140),round(cx+125),round(cy+140))).resize((112,125),Image.Resampling.LANCZOS)
    sheet.paste(crop,(8+i*112,y+19));draw.text((8+i*112,y+146),f'{t:.2f}',fill='white')
  sheet.save(out/f'{fixture}-poses-{page+1}.jpg',quality=91)
 # Three contiguous full-field frames per Clover action retain flight and aftermath.
 own=[a for a in actions if a['actor']=='clover'];sheet=Image.new('RGB',(1024,len(own)*211+26),'#221f29');draw=ImageDraw.Draw(sheet)
 draw.text((8,5),fixture+' | Clover field: impact-100ms, impact, impact+200ms',fill='white')
 for row,a in enumerate(own):
  y=26+row*211
  for col,offset in enumerate([-.1,0,.2]):
   n=round((a['impact']+offset)*30)
   if n not in frames:continue
   im=Image.open(raw/f'{frames.index(n)+1:04d}.jpg').resize((336,189),Image.Resampling.LANCZOS);sheet.paste(im,(8+col*336,y+18))
  draw.text((8,y),f'A{a["key"]} {"ULT" if a["ultimate"] else "BASIC"} {a["impact"]:.3f}s',fill='white')
 sheet.save(out/f'{fixture}-field.jpg',quality=91)
 actual=[f for f in d['frames'] if 0<=f['t']<30]
 gaps=[actual[i+1]['t']-actual[i]['t'] for i in range(len(actual)-1)]
 fps=1/statistics.median(gaps)
 results.append({'fixture':fixture,'videoSha256':d['videoSha256'],'actions':actions,'renderFrames':len(actual),'medianRenderFps':fps,'errors':d['errors'],'parity':d['parity'],'audio':d['audio'],'scope':'Encoded film crops and deterministic schedule; pixel mask numbers are separate live checks.'})
 for p in raw.glob('*.jpg'):p.unlink()
 raw.rmdir()
 print(fixture,len(actions),'scoped windows; fps',round(fps,2))
(root/('film-review-'+selected+'-r2.json' if selected else 'film-review.json')).write_text(json.dumps(results,indent=2)+'\n')
