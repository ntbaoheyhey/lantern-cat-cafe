"""Track specified anatomical points with local similarity fits; reject lost support."""
from pathlib import Path
import sys,json,hashlib,datetime
sys.path.insert(0,str(Path('work/v5/CXV/python').resolve()))
import cv2,numpy as np
cv2.setNumThreads(2);cv2.setRNGSeed(42)
root=Path('work/v5/CXV/ref/batch-m');frames=np.load(root/'mochi-frames.npy',mmap_mode='r');gray=[cv2.cvtColor(f,cv2.COLOR_BGR2GRAY) for f in frames]
radius=int(sys.argv[1]) if len(sys.argv)>1 else 24
full_affine=len(sys.argv)>2 and sys.argv[2]=='affine'
points={'head':[249,115],'hip':[248,268],'mainHand':[370,183],'offHand':[143,254],'vfxOrigin':[424,254]}
scale=np.array([468/525,390/437]);crop=np.array([40,31]);result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceSha256':hashlib.sha256((root/'Scene1.mp4').read_bytes()).hexdigest(),'fps':30,'frames':300,'cat':'mochi','method':'CXI provisional F0 socket pixel→source preview; local corners tracked by LK with forward/back<.75px; only full-cycle survivors; per-frame RANSAC similarity fit. No claim of recovered bone transforms.','sockets':{}}
for name,delivery in points.items():
 target=(np.array(delivery)+.5)/scale+crop-.5;x,y=np.round(target).astype(int);mask=np.zeros(gray[0].shape,np.uint8);mask[max(0,y-radius):y+radius,max(0,x-radius):x+radius]=255
 first=cv2.goodFeaturesToTrack(gray[0],maxCorners=32,qualityLevel=.02,minDistance=3,mask=mask)
 if first is None:result['sockets'][name]={'accepted':False,'reason':'No corner support'};continue
 at=first.copy();alive=np.ones(len(first),bool);hist=[at[:,0].copy()]
 for i in range(1,300):
  nxt,status,_=cv2.calcOpticalFlowPyrLK(gray[i-1],gray[i],at,None,winSize=(21,21),maxLevel=3,criteria=(3,30,.01))
  back,bs,_=cv2.calcOpticalFlowPyrLK(gray[i],gray[i-1],nxt,None,winSize=(21,21),maxLevel=3,criteria=(3,30,.01))
  alive&=(status[:,0]>0)&(bs[:,0]>0)&(np.linalg.norm(back[:,0]-at[:,0],axis=1)<.75);at=nxt;hist.append(at[:,0].copy())
 ids=np.flatnonzero(alive);entry={'initialDeliveryPoint':delivery,'sourcePoint':target.tolist(),'tracked':len(first),'survivors':len(ids),'accepted':False};result['sockets'][name]=entry
 if len(ids)<6:entry['reason']='Fewer than6 full-cycle supporting corners';continue
 source=first[ids,0];mapped=[];max_error=0;min_inlier=1;unsupported=0
 for frame,now in enumerate(hist):
  matrix,inliers=(cv2.estimateAffine2D if full_affine else cv2.estimateAffinePartial2D)(source,now[ids],method=cv2.RANSAC,ransacReprojThreshold=1.5,maxIters=2000,confidence=.99)
  if matrix is None:unsupported+=1;mapped.append(target);continue
  keep=inliers[:,0]>0;min_inlier=min(min_inlier,float(keep.mean()));fit=source@matrix[:,:2].T+matrix[:,2];max_error=max(max_error,float(np.max(np.linalg.norm(fit[keep]-now[ids][keep],axis=1))))
  q=matrix[:,:2]@target+matrix[:,2];mapped.append(q);xx,yy=np.round(q).astype(int)
  if xx<0 or yy<0 or xx>=frames.shape[2] or yy>=frames.shape[1] or frames[frame,yy,xx].max()<15:unsupported+=1
 mapped=np.array(mapped);delta=(mapped-mapped[0])*scale;world=delta*np.array([512/384,-512/384]);seam=float(np.linalg.norm(delta[-1]));entry.update(maxInlierErrorPx=max_error,minInlierFraction=min_inlier,unsupportedFrames=unsupported,seamResidualDeliveryPx=seam,deliveryRange=np.ptp(delta,axis=0).tolist(),worldOffsets=np.round(world,5).tolist())
 entry['accepted']=min_inlier>=.7 and max_error<=2 and unsupported<=3 and seam<=2
 if not entry['accepted']:entry['reason']='Quality gate: inliers>=.7,error<=2px,unsupported<=3frames,seam<=2deliverypx'
result['radius']=radius;result['fit']='affine' if full_affine else 'similarity'
out=Path(f'reports/v5/CXV/M-mochi-socket-point-study-r{radius}-{result["fit"]}.json');out.write_text(json.dumps(result,separators=(',',':'))+'\n')
print(json.dumps({k:{f:v for f,v in r.items() if f!='worldOffsets'} for k,r in result['sockets'].items()}))
