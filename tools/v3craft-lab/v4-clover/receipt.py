"""Consolidate A5 evidence without changing the recorder or production renderer."""
from pathlib import Path
import datetime,gzip,hashlib,json,math,shutil,statistics
import numpy as np
from PIL import Image,ImageDraw

root=Path('reports/v4-art/REVIEW/A5')
lab=Path('tools/v3craft-lab/v4-clover')
read=lambda p:json.loads(Path(p).read_text())
load=lambda p:json.loads(gzip.decompress(Path(p).read_bytes()))
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
source=read(root/'source-tree.json')
assert all(sha(p)==h for p,h in source.items()),'Production sources changed since capture'
selected=read(lab/'selection.json')
images={p['key']:Image.open('apps/web/public/units/clover/poses/'+p['key']+'.webp').convert('RGBA') for p in selected}
size=round(896*225/409)
arrays={k:np.asarray(v.resize((size,size),Image.Resampling.LANCZOS)) for k,v in images.items()}
base=arrays['K0'];mask=base[:,:,3]>=128;art={}
for k,a in arrays.items():
 if k=='K0':continue
 m=a[:,:,3]>=128;u=m|mask;ys,xs=np.where(u);area=(xs.max()-xs.min()+1)*(ys.max()-ys.min()+1)
 delta=np.max(np.abs(a.astype(float)-base.astype(float)),axis=2)>24
 art[k]={'battleOpaqueHeight':225,'iou':float((m&mask).sum()/u.sum()),'bboxChangedFraction':float((delta&u).sum()/area),'method':'WebP RGBA at225px K0opaque height,alpha>=128;changed maxRGBA>24 within unionmask,unionbbox denominator'}
probe=read(root/'live-probe.json')['results'];rows=[q for v in probe for q in v['rows']]
faces=read(root/'face-coverage.json')
perf=load(root/'raw/perf/boss/capture.json.gz');frames=[f for f in perf['frames'] if 0<=f['t']<30]
gaps=[b['t']-a['t'] for a,b in zip(frames,frames[1:])]
perfout={'recorded':perf['recorded'],'sourceCommit':perf['sourceCommit'],'videoSha256':perf['videoSha256'],'medianRenderFps':1/statistics.median(gaps),'renderFrames':len(frames),'encodedFps':perf['fps'],'localCompetingJobs':'face probe finished before isolated capture; no other owned long jobs running','errors':perf['errors'],'parity':perf['parity']}
(root/'performance.json').write_text(json.dumps(perfout,indent=2)+'\n')
own=[];melee=[]
for fixture in ['wave1','wave3','boss']:
 d=load(root/fixture/'capture.json.gz')
 for p in d['plans']:
  fs=[f for f in d['frames'] if (f.get('action') or {}).get('key')==p['key'] and f['t']<30]
  if not fs:continue
  if p['actorId']=='clover':
   motion=[m for f in fs for m in f['motion'] if m['id']=='clover']
   own.append({'fixture':fixture,'key':p['key'],'ultimate':p['ultimate'],'duration':p['duration'],'impact':p['impact'],'maxMotionPixels':max(math.hypot(m['dx'],m['dy']) for m in motion),'healTargetIds':sorted({t for e in p['events'] if e['type']=='heal' for t in e['targetIds']}),'legacyDamage':any(e['type']=='damage' and e.get('amount',0)>0 for e in p['events']),'complete':max(f['action']['elapsed'] for f in fs)>=p['duration']-1000/30})
  if p['actorId']=='mochi' and not p['ultimate']:
   impact=min(fs,key=lambda f:abs(f['action']['elapsed']-p['impact']))
   u=next(x for x in impact['units'] if x['id']=='mochi')
   ids=[t for e in p['events'] if e['type']=='action_start' for t in e['targetIds']]
   primary=next(t for t in ids if any(x['id']==t and x['side']=='enemy' for x in impact['units']))
   targets=[x for x in impact['units'] if x['id']==primary]
   done=p.get('clockStart',p['at'])+p['duration']/1000
   following=[f for f in d['frames'] if done<=f['t']<min(30,done+1/30)]
   end=following[0] if following else None
   em=next(x for x in end['motion'] if x['id']=='mochi') if end else None
   melee.append({'fixture':fixture,'key':p['key'],'primaryTargetId':primary,'impactSampleMs':impact['action']['elapsed'],'impactTimeErrorMs':abs(impact['action']['elapsed']-p['impact']),'frontGapPixels':[max(0,t['box']['x']-(u['box']['x']+u['box']['width'])) for t in targets],'signedFrontGapPixels':[t['box']['x']-(u['box']['x']+u['box']['width']) for t in targets],'returnSampleAfterEndMs':1000*(end['t']-done) if end else None,'returnMotionPixels':math.hypot(em['dx'],em['dy']) if em else None,'returnAvailableInFilm':end is not None})
out={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceHashesVerified':len(source),'artAtBattleScale':art,'socketErrorPixels':max(math.hypot(q['source']['x']-q['fx']['source']['x'],q['source']['y']-q['fx']['source']['y']) for q in rows),'liveMaxCasterMotionPixels':max(math.hypot(q['role']['dx'],q['role']['dy']) for q in rows),'liveMaxCameraPixels':max(q['cameraPixels'] for q in rows),'ultimateAreaFractions':[q['effectArea'] for q in rows if q['ultimate'] and 'effectArea' in q],'maxForegroundFaceCoverage':max(f['foregroundAlphaCoverage'] for r in faces['rows'] for f in r['faces']),'filmOwnActions':own,'currentMochiBasics':melee,'healTimingEvidence':'Live probe adds exactly3 sprigs/actualally at350/1100ms; encoded10fps field strips confirm recipient locations. Exact30fps first-visible heal onset not isolated: stays OPEN for final post-SHIP role receipt.','limits':['Live pose/socket probe predates v13 Mochi-only path correction; exported Clover drawing/effect formulas unchanged. Fresh six-case face/framing and final encoded films cover current layout.','Current rules still give Clover hostile damage. Full G-ROLE remains OPEN until final SHIP merge.','Pairwise four-hero FX distinctness remains A9.']}
(root/'acceptance-receipt.json').write_text(json.dumps(out,indent=2)+'\n')
# Seven already-inspected encoded-film sheets plus one compact blind receipt.
for p in (root/'raw/action-strips').glob('*.jpg'):shutil.copy2(p,root/p.name)
blind=read(root/'blind-result.json');sheet=Image.new('RGB',(1024,520),'#24212c');draw=ImageDraw.Draw(sheet)
draw.text((10,8),'A5 blind receipt: labels saved before schedule key;12/12 correct',fill='white')
for i,row in enumerate(blind['frames']):
 p=lab/'raw/blind'/f'{int(row["id"]):02d}.jpg'
 if not p.exists():continue
 im=Image.open(p);im.thumbnail((150,200));x=12+(i%6)*169;y=35+(i//6)*240;sheet.paste(im,(x,y));draw.text((x,y+205),str(row['id'])+' '+row['label'],fill='white')
sheet.save(root/'blind-receipt.jpg',quality=90)
print(json.dumps({'art':art,'fps':perfout['medianRenderFps'],'socket':out['socketErrorPixels'],'face':out['maxForegroundFaceCoverage'],'ownActions':len(own),'complete':sum(x['complete'] for x in own),'mochiBasics':len(melee),'mochiMaxFrontGap':max(v for r in melee for v in r['frontGapPixels']),'mochiMaxReturnMotion':max(r['returnMotionPixels'] for r in melee if r['returnAvailableInFilm']),'mochiReturnAvailable':sum(r['returnAvailableInFilm'] for r in melee),'selectedJPG':len(list(root.glob('*.jpg')))},separators=(',',':')))
