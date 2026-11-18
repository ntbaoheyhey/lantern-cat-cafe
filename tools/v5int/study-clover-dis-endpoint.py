#!/usr/bin/env python3
"""One endpoint diagnosis for Clover; no sequence rewrite or runtime registration."""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib
import cv2
import numpy as np
cv2.setNumThreads(2)
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'work/v5/CXI/batch-m';OUT=BASE/'clover-dis-endpoint-r1';OUT.mkdir(exist_ok=False)
w,h=318,390;source=BASE/'matte-r2/clover-premul.rgba';raw=np.memmap(source,np.uint8,'r',shape=(300,h,w,4))
first,last=raw[0],raw[299];yy,xx=np.mgrid[:h,:w].astype(np.float32)
region=np.clip((yy-232)/15,0,1)*np.clip((358-yy)/16,0,1)*np.clip((118-xx)/28,0,1)
r,g,b=np.moveaxis(last[:,:,:3].astype(np.float32),-1,0);cloth=((g>=r*.98)&(last[:,:,3]>64)).astype(np.uint8)
edge=np.full(h,w,np.int32)
for y in range(220,336):
 xs=np.flatnonzero(cloth[y]);xs=xs[xs>65]
 if len(xs):edge[y]=int(xs.min())-3
protected=np.zeros((h,w),np.uint8)
for y in range(232,358):
 left=int(edge[max(220,y-22):min(336,y+2)].min(initial=w))
 if left<w:protected[y,max(0,left):]=1
distance=cv2.distanceTransform(1-protected,cv2.DIST_L2,5);smooth=np.clip(distance/8,0,1);smooth=smooth*smooth*(3-2*smooth);mask=region*smooth
def tail_gray(f):
 r,g,b=np.moveaxis(f[:,:,:3].astype(np.float32),-1,0)
 warm=(r>g*1.035)&(r>b*1.15)&(f[:,:,3]>48)
 return np.ascontiguousarray((cv2.cvtColor(f[:,:,:3],cv2.COLOR_RGB2GRAY)*warm.astype(np.uint8)))
dis=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM);dis.setFinestScale(0);dis.setGradientDescentIterations(25);dis.setVariationalRefinementIterations(10)
flow=dis.calc(tail_gray(first),tail_gray(last),None)
dx=flow[:,:,0]*mask;dy=flow[:,:,1]*mask
out=cv2.remap(last,xx+dx,yy+dy,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
roi=(region>.5)&(xx<100)
def mae(a,b):return float(np.abs(a[roi,:3].astype(float)-b[roi,:3]).mean())
def iou(a,b):
 a=(a[:,:,3]>100)&roi;b=(b[:,:,3]>100)&roi
 return float((a&b).sum()/max(1,(a|b).sum()))
jac=(1+np.gradient(dx,axis=1))*(1+np.gradient(dy,axis=0))-np.gradient(dx,axis=0)*np.gradient(dy,axis=1)
report={'utc':datetime.now(timezone.utc).isoformat(),'status':'ENDPOINT_DIAGNOSTIC_ONLY','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'method':'Single DIS destination-first-to-source-last inverse warp, finestscale0, R5 contiguous cloth protection; no image crossfade.','sourceSeamMAE':mae(last,first),'candidateSeamMAE':mae(out,first),'sourceIoU':iou(last,first),'candidateIoU':iou(out,first),'maxDisplacement':float(np.hypot(dx,dy).max()),'minJacobianActive':float(jac[mask>.05].min()),'foldedPixels':int(((jac<=0)&(mask>.05)).sum()),'protectedPixelsChanged':int(np.any(out[protected>0]!=last[protected>0],axis=1).sum()),'outsideROIChanged':int(np.any(out[region==0]!=last[region==0],axis=1).sum()),'sequenceChanged':False}
report['numericPromising']=report['candidateSeamMAE']<14.3279247284 and report['candidateIoU']>.8804168952 and report['maxDisplacement']<40 and report['foldedPixels']==0 and report['protectedPixelsChanged']==report['outsideROIChanged']==0
np.save(OUT/'flow.npy',flow);np.save(OUT/'mask.npy',mask);(OUT/'endpoint.rgba').write_bytes(out.tobytes())
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');(ROOT/'reports/v5/CXI/evidence/v8-m-clover-dis-endpoint-study.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
