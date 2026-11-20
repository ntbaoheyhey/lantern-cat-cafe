"""Read-only quick diagnostics using the unchanged R/M1 frame-difference estimator."""
import sys,json
from pathlib import Path
import cv2,numpy as np

for arg in sys.argv[1:]:
 folder=Path(arg); video=folder/'battle.webm'
 cap=cv2.VideoCapture(str(video));fps=cap.get(cv2.CAP_PROP_FPS);previous=None;values=[];i=0
 if fps<=0:raise RuntimeError('Unreadable capture: '+str(video))
 while True:
  ok,frame=cap.read()
  if not ok:break
  if i%max(1,round(fps/10))==0:
   gray=cv2.resize(cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY),(320,180),interpolation=cv2.INTER_AREA).astype(np.float32)
   if previous is not None:values.append(float(np.abs(gray-previous).mean()))
   previous=gray
  i+=1
 cap.release()
 d=json.loads((folder/'capture.json').read_text());clipped=[]
 for f in d['frames']:
  if f['sequence'].get('plate') or f['sequence'].get('cutin'):continue
  for u in f['units']:
   if not f.get('fieldSize'):continue
   b=u['faceBox'];size=f['fieldSize']
   if b['x']<0 or b['x']+b['width']>size['width'] or b['y']<0 or b['y']+b['height']>size['height']:clipped.append((f['index'],u['id']))
 result=dict(capture=str(folder),motionEnergy=float(np.mean(values)),seconds=i/fps,parity=d['parity'],browserErrors=d['errors'],clippedFaceSamples=len(clipped) if all(f.get('fieldSize') for f in d['frames']) else None,perSecond=[round(float(np.mean(values[j:j+10])),3) for j in range(0,len(values),10)])
 print(json.dumps(result))
