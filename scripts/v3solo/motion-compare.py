"""Private before/after motion review, sampled at identical combat frames."""
import argparse,hashlib,json
from pathlib import Path
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser()
parser.add_argument('--after',default='reports/v3-battle/a2/M1/capture')
args=parser.parse_args()
OUT=ROOT/'reports/v3-solo/Q3'
rows=[]
for fixture in ['wave1','wave3','boss']:
 before=OUT/'baseline'/fixture
 after=ROOT/args.after/fixture
 if not (after/'capture.json').exists():continue
 d=json.loads((after/'capture.json').read_text())
 plans=d['plans']
 plan=next(p for p in plans if p['actorId'].startswith('foe-') and any(k in p['actorId'] for k in ['needle-moth','binding-thread']))
 end=next((p['frame'] for p in plans if p['frame']>plan['frame']),len(d['frames']))
 action_frames=d['frames'][plan['frame']:end]
 samples=[]
 for phase in ['anticipation','travel','strike','return']:
  frames=[f for f in action_frames if any(m['id']==plan['actorId'] and m['phase']==phase for m in f['motion'])]
  if not frames:raise ValueError(f'{fixture}: missing {phase}')
  samples.append(frames[len(frames)//2]['index'])
 sheet=np.full((416,1280,3),(30,25,25),dtype=np.uint8)
 for row,folder in enumerate([before,after]):
  cap=cv2.VideoCapture(str(folder/'battle.webm'))
  title=f'{"BEFORE" if row==0 else "AFTER"}: {fixture} / {plan["actorId"]} / same combat frames'
  cv2.putText(sheet,title,(10,row*208+20),cv2.FONT_HERSHEY_SIMPLEX,.55,(245,245,245),1)
  for col,index in enumerate(samples):
   cap.set(cv2.CAP_PROP_POS_FRAMES,index);ok,frame=cap.read()
   if not ok:raise ValueError(f'{folder}: missing video frame {index}')
   frame=cv2.resize(frame,(320,180),interpolation=cv2.INTER_AREA)
   sheet[row*208+28:row*208+208,col*320:(col+1)*320]=frame
  cap.release()
 path=OUT/f'compare-{fixture}.png';cv2.imwrite(str(path),sheet)
 rows.append(dict(fixture=fixture,actor=plan['actorId'],frames=samples,sheet=str(path.relative_to(ROOT)),sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
(OUT/'comparisons.json').write_text(json.dumps(rows,indent=2)+'\n')
print(f'{len(rows)} before/after enemy-action sheets saved at1280px')
