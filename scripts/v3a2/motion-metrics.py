"""Same 10 Hz 320x180 grayscale estimator as R; projected root tracks are separate."""
import json,sys,subprocess,datetime
from pathlib import Path
import cv2
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'reports/v3-battle/a2/M1'
fixtures={}
def video_energy(path):
 cap=cv2.VideoCapture(str(path));fps=cap.get(cv2.CAP_PROP_FPS);previous=None;differences=[];i=0
 while True:
  ok,frame=cap.read()
  if not ok:break
  if i%max(1,round(fps/10))==0:
   gray=cv2.resize(cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY),(320,180),interpolation=cv2.INTER_AREA).astype(np.float32)
   if previous is not None:differences.append(float(np.abs(gray-previous).mean()))
   previous=gray
  i+=1
 cap.release();return float(np.mean(differences)),[float(np.mean(differences[i:i+10])) for i in range(0,len(differences),10)]
for fixture in ['wave1','wave3','boss']:
 path=OUT/'capture'/fixture/'capture.json'
 if not path.exists():continue
 d=json.loads(path.read_text());frames=d['frames'];actions=[];hits=[];types={};displacements=[];cooldown={}
 for i,f in enumerate(frames):
  if i<9:continue
  previous={r['id']:r for r in frames[i-9]['motion']}
  for row in f['motion']:
   old=previous.get(row['id'])
   if not old:continue
   travel=np.hypot(row['x']-old['x'],row['y']-old['y'])/d['width']
   if travel>.08 and f['t']-cooldown.get(row['id'],-1)>.3:
    displacements.append(dict(t=f['t'],id=row['id'],fraction=float(travel)));cooldown[row['id']]=f['t']
 for i,p in enumerate(d['plans']):
  rows=frames[p['frame']:d['plans'][i+1]['frame'] if i+1<len(d['plans']) else len(frames)]
  is_action=any(e['type'] in ['action_start','charge'] for e in p['events'])
  if is_action:
   traveled=[np.hypot(r['dx'],r['dy'])/d['width'] for f in rows for r in f['motion'] if r['id']==p['actorId']]
   peak=float(max(traveled,default=0));key=p.get('presentationId') or p['skillId'];types[key]=min(types.get(key,1),peak)
   actions.append(dict(skill=key,actor=p['actorId'],frame=p['frame'],peak=peak))
  for e in p['events']:
   if e['type']!='damage':continue
   for target in e['targetIds']:
    visible=[r for f in rows for r in f['motion'] if r['id']==target and r['hitOffset']>=1]
    hits.append(dict(skill=p.get('presentationId') or p['skillId'],actor=e['actorId'],target=target,reacted=bool(visible),maxKnockback=max([r['hitOffset'] for r in visible],default=0)))
 energy,per_second=video_energy(path.parent/'battle.webm')
 fixtures[fixture]=dict(seconds=d['seconds'],displacementPer10s=len(displacements)/d['seconds']*10,motionEnergy=energy,motionEnergyPerSecond=per_second,minActionDisplacementFraction=min(types.values(),default=0),hitKnockbackFraction=sum(h['reacted'] for h in hits)/max(1,len(hits)),actions=actions,actionTypes=types,hits=hits,displacements=displacements,parity=d['parity'],browserErrors=d['errors'])
 print(f"{fixture}: energy={energy:.3f}, travel/10s={fixtures[fixture]['displacementPer10s']:.2f}, min action={fixtures[fixture]['minActionDisplacementFraction']:.4f}, hits={sum(h['reacted'] for h in hits)}/{len(hits)}")
review=json.loads((OUT/'browser-review.json').read_text()) if (OUT/'browser-review.json').exists() else {}
for id,f in fixtures.items():f['fpsHigh']=review.get('performance',{}).get(id,{}).get('fps')
suite=json.loads((OUT/'suite.json').read_text()) if (OUT/'suite.json').exists() else None
meta=dict(generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip())
(OUT/'metrics.json').write_text(json.dumps(dict(_meta=meta,fixtures=fixtures,performanceUnits=review.get('performance',{}).get('wave3',{}).get('units'),suite=suite),indent=2)+'\n')
