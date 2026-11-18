"""Read-only L1 analysis of commissioned designer clips, never runtime art."""
from pathlib import Path
import sys,json,hashlib,datetime,subprocess
sys.path.insert(0,str(Path('work/v5/CXV/python').resolve()))
import cv2,numpy as np
cv2.setNumThreads(2)
out=Path('work/v5/CXV/ref/batch-m'); report={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Decoded 30fps, aspect-preserved long edge640; bbox RGB max>20. Overview F0/75/150/225; no alpha inference.','clips':{}}
for id,name in [('mochi','Scene1.mp4'),('clover','clover.mp4')]:
 src=out/name; cap=cv2.VideoCapture(str(src)); frames=[]; boxes=[]
 while True:
  ok,im=cap.read()
  if not ok:break
  h,w=im.shape[:2]; im=cv2.resize(im,(round(w*640/max(w,h)),round(h*640/max(w,h))),interpolation=cv2.INTER_AREA); frames.append(im)
  ys,xs=np.where(im.max(2)>20);boxes.append([int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)])
 cap.release(); a=np.array(frames);np.save(out/(id+'-frames.npy'),a)
 box=np.array(boxes);union=[int(box[:,0].min()),int(box[:,1].min()),int(box[:,2].max()),int(box[:,3].max())]
 tiles=[]
 for index in [0,75,150,225]:
  im=a[index];h,w=im.shape[:2];s=min(256/w,232/h);small=cv2.resize(im,(round(w*s),round(h*s)));tile=np.full((256,256,3),24,np.uint8);y=24+(232-small.shape[0])//2;x=(256-small.shape[1])//2;tile[y:y+small.shape[0],x:x+small.shape[1]]=small;cv2.putText(tile,f'{id} F{index} {index/30:.2f}s',(6,17),cv2.FONT_HERSHEY_SIMPLEX,.43,(230,230,230),1,cv2.LINE_AA);tiles.append(tile)
 sheet=np.concatenate(tiles,axis=1);path=out/(id+'-overview.jpg');cv2.imwrite(str(path),sheet,[cv2.IMWRITE_JPEG_QUALITY,90]);first=out/(id+'-frame0.png');cv2.imwrite(str(first),a[0])
 corner=np.concatenate([a[:,:10,:10].ravel(),a[:,:10,-10:].ravel(),a[:,-10:,:10].ravel(),a[:,-10:,-10:].ravel()]);gray=[cv2.cvtColor(x,cv2.COLOR_BGR2GRAY) for x in a]
 diff=[float(np.mean(cv2.absdiff(gray[0],x))) for x in gray]
 row={'file':str(src.resolve()),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'frames':len(a),'frameShape':list(a.shape[1:]),'bboxUnion':union,'bboxRanges':np.ptp(box,axis=0).tolist(),'cornerMax':int(corner.max()),'frame0MeanAbsDifference':diff,'review':[{'path':str(p.resolve()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'dimensions':[int(cv2.imread(str(p)).shape[1]),int(cv2.imread(str(p)).shape[0])]} for p in [path,first]]}
 report['clips'][id]=row;print(json.dumps({k:v for k,v in row.items() if k!='frame0MeanAbsDifference'}),flush=True)
(out/'measurements.json').write_text(json.dumps(report,indent=2)+'\n')
