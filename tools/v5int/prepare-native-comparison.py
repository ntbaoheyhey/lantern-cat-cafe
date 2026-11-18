#!/usr/bin/env python3
"""Measure own native captures and compare them with the commissioned source at 1x."""
import sys,json,subprocess,hashlib,datetime
from pathlib import Path
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
p=Path(sys.argv[1]).resolve();r=json.loads((p/'report.json').read_text());cat=r['cat']
mode=next(x for x in r['modes'] if x['mode']=='candidate');box=mode['box'];body=box['body'];target=round(body['height'])
source=ROOT/'work/v5/CXI/batch-m/sources/mochi-idle-original.mp4'
cap=cv2.VideoCapture(str(source));frames=[];bounds=[]
while True:
 ok,im=cap.read()
 if not ok:break
 im=cv2.resize(im,(600,480),interpolation=cv2.INTER_AREA);frames.append(im)
 ys,xs=np.where(im.max(axis=2)>20);bounds.append([xs.min(),ys.min(),xs.max()+1,ys.max()+1])
cap.release();assert len(frames)==300
b=np.array(bounds);x1,y1=b[:,:2].min(axis=0);x2,y2=b[:,2:].max(axis=0)
video=p/f'{cat}-vs-designer-10s.mp4'
proc=subprocess.Popen(['ffmpeg','-nostdin','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','30','-i','-','-an','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-y',str(video)],stdin=subprocess.PIPE)
images=[]
for i,sourceFrame in enumerate(frames):
 canvas=np.full((720,1280,3),24,np.uint8)
 ref=sourceFrame[y1:y2,x1:x2];ref=cv2.resize(ref,(round(ref.shape[1]*target/ref.shape[0]),target),interpolation=cv2.INTER_AREA)
 x=(640-ref.shape[1])//2;canvas[500-target:500,x:x+ref.shape[1]]=ref
 shot=cv2.imread(str(p/'candidate/frames'/f'{i:03d}.png'));assert shot.shape[:2]==(720,1280)
 crop=shot[box['y']:box['y']+box['height'],box['x']:box['x']+box['width']]
 x=640+(640-crop.shape[1])//2;y=round(500-(body['y']+body['height']-box['y']));canvas[y:y+crop.shape[0],x:x+crop.shape[1]]=crop
 for xx,title in [(45,'Mochi commissioned source'),(685,f'{cat.title()} current production capture')]:
  cv2.putText(canvas,title,(xx,100),cv2.FONT_HERSHEY_SIMPLEX,.72,(235,235,235),1,cv2.LINE_AA)
  cv2.putText(canvas,f'1x / {target}px height / {i/30:.2f}s',(xx,135),cv2.FONT_HERSHEY_SIMPLEX,.55,(200,200,200),1,cv2.LINE_AA)
 cv2.putText(canvas,'Source black is not the delivery matte. Right: deterministic 30Hz sampling, not a measured FPS claim.',(40,650),cv2.FONT_HERSHEY_SIMPLEX,.52,(190,190,190),1,cv2.LINE_AA)
 proc.stdin.write(canvas.tobytes())
 if i in [15,165]:
  out=p/f'comparison-{i}.jpg';cv2.imwrite(str(out),cv2.resize(canvas,(1024,576)),[cv2.IMWRITE_JPEG_QUALITY,92]);images.append(out)
proc.stdin.close();assert proc.wait()==0
images += [p/'candidate/blink-sheet.jpg',p/'cast/cast-sheet.jpg']
measure=[]
for mode in r['modes']:
 m=json.loads(Path(mode['measure']).read_text());ss=m['samples'];a=np.array([[[v['x'],v['y']] for v in s['points']] for s in ss[:300]])
 dt=ss[1]['t']-ss[0]['t'];channels=[]
 for k,name in enumerate(m['pointNames']):
  q=a[:,k,:];spec=abs(np.fft.rfft(q-q.mean(axis=0),axis=0));spec[0]=0;peak=spec.argmax(axis=0)
  channels.append({'name':name,'rangePx':np.ptp(q,axis=0).tolist(),'rangePercentH':(np.ptp(q,axis=0)/m['height']*100).tolist(),'dominantPeriodSeconds':[len(q)*dt/int(v) if v and np.ptp(q[:,axis])>1e-9 else None for axis,v in enumerate(peak)]})
 measure.append({'mode':mode['mode'],'channels':channels,'footWorldDrift':mode['maxFootWorldDelta'],'meshSeam':mode['seamMeshDelta'],'rootSeam':mode['seamRootDelta']})
review=[]
for im in images:
 a=cv2.imread(str(im));h,w=a.shape[:2];assert max(w,h)<=1024
 review.append({'path':str(im),'width':w,'height':h,'bytes':im.stat().st_size,'sha256':hashlib.sha256(im.read_bytes()).hexdigest(),'reviewed':False})
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=width,height,r_frame_rate,nb_frames:format=duration','-of','json',str(video)]))
out={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'cat':cat,'captureUTC':r['utc'],'captureCompletedUTC':r['completedUTC'],'sourceCommit':r.get('buildSource',r['sourceCommit']),'indexSha256':r['indexSha256'],'url':r['url'],'sameHeightPx':target,'sourceUnion600x480':[int(x1),int(y1),int(x2),int(y2)],'video':str(video),'videoSha256':hashlib.sha256(video.read_bytes()).hexdigest(),'probe':probe,'channels':measure,'images':review,'limits':'Deterministic scene samples and 1x encoded comparison; no continuously watched film or real-time FPS claim.'}
(p/'comparison.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k not in ['channels','probe']}))
