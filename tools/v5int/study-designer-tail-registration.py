#!/usr/bin/env python3
"""Single-pose endpoint tail alignment; no optical-flow cross-fade and no runtime writes."""
import json,hashlib,sys
from pathlib import Path
from datetime import datetime,timezone
import cv2
import numpy as np
cv2.setNumThreads(2)
root=Path(__file__).resolve().parents[2];base=root/'work/v5/CXI/batch-m/matte-r2';w,h=318,390
variant=sys.argv[1] if len(sys.argv)>1 else 'r4';assert variant in ['r4','r5']
src=np.memmap(base/'clover-premul.rgba',dtype=np.uint8,mode='r',shape=(300,h,w,4));out=src.copy()
x0,y0,x1,y1=5,240,112,350
yy,xx=np.mgrid[:h,:w].astype(np.float32)
def warm_gray(f):
 r,g,b=np.moveaxis(f[:,:,:3].astype(np.float32),-1,0)
 mask=(r>g*1.035)&(r>b*1.15)&(f[:,:,3]>48)
 return cv2.GaussianBlur(cv2.cvtColor(f[:,:,:3],cv2.COLOR_RGB2GRAY)*mask.astype(np.uint8),(5,5),0)[y0:y1,x0:x1]
score,local=cv2.findTransformECC(warm_gray(src[0]),warm_gray(src[-1]),np.eye(2,3,dtype=np.float32),cv2.MOTION_EUCLIDEAN,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,200,1e-6),None,5)
matrix=local.copy();matrix[0,2]+=x0-local[0,0]*x0-local[0,1]*y0;matrix[1,2]+=y0-local[1,0]*x0-local[1,1]*y0
dx=matrix[0,0]*xx+matrix[0,1]*yy+matrix[0,2]-xx;dy=matrix[1,0]*xx+matrix[1,1]*yy+matrix[1,2]-yy
region=np.clip((yy-232)/15,0,1)*np.clip((358-yy)/16,0,1)*np.clip((118-xx)/28,0,1)
assert float(np.max(np.sqrt(dx[region>.5]**2+dy[region>.5]**2)))<40
all_masks=[]
for i in range(282,300):
 q=(i-282)/17;q=q**3*(10-15*q+6*q*q)
 f=src[i];r,g,b=np.moveaxis(f[:,:,:3].astype(np.float32),-1,0)
 cloth=((g>=r*.98)&(f[:,:,3]>64)).astype(np.uint8)
 if variant=='r4':
  protected=cv2.dilate(cloth,np.ones((5,5),np.uint8)).astype(np.float32);mask=region*(1-protected)
 else:
  # Semantic occluder: fill everything to the right of the dress silhouette,
  # extend its last green rows over the cream hem. Do not classify fur highlights.
  edge=np.full(h,w,dtype=np.int32)
  for y in range(220,336):
   xs=np.flatnonzero(cloth[y]);xs=xs[xs>65]
   if len(xs):edge[y]=int(xs.min())-3
  protected=np.zeros((h,w),np.uint8)
  for y in range(232,358):
   left=int(edge[max(220,y-22):min(336,y+2)].min(initial=w))
   if left<w:protected[y,max(0,left):]=1
  distance=cv2.distanceTransform(1-protected,cv2.DIST_L2,5)
  smooth=np.clip(distance/8,0,1);smooth=smooth*smooth*(3-2*smooth)
  mask=region*smooth
 out[i]=cv2.remap(f,xx+dx*q*mask,yy+dy*q*mask,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
 all_masks.append(mask)
output=base/f'clover-tail-ecc-{variant}-premul.rgba';out.tofile(output)
roi=(region>.5)&(xx<100)
def mae(a,b):return float(np.abs(a[roi,:3].astype(np.float32)-b[roi,:3]).mean())
adjacent=[mae(src[i],src[i-1]) for i in range(1,300)]
fixed_adjacent=[mae(out[i],out[i-1]) for i in range(1,300)]
def iou(a,b):
 a=(a[:,:,3]>100)&roi;b=(b[:,:,3]>100)&roi
 return float((a&b).sum()/max(1,(a|b).sum()))
sheet=np.full((572,1000,3),255,np.uint8)
for row,frames in enumerate([src,out]):
 for col,i in enumerate([282,292,299,0]):
  f=frames[i].astype(np.float32);a=f[:,:,3:4]/255;comp=np.clip(f[:,:,:3]+np.array([238,244,232])*(1-a),0,255).astype(np.uint8)
  crop=comp[220:350,0:125];crop=cv2.resize(crop,(250,260),interpolation=cv2.INTER_NEAREST)
  sheet[row*286+22:row*286+282,col*250:col*250+250]=crop
  cv2.putText(sheet,('original' if row==0 else 'ECC single warp')+f' F{i}',(col*250+5,row*286+16),cv2.FONT_HERSHEY_SIMPLEX,.44,(0,0,0),1,cv2.LINE_AA)
image=base/f'clover-tail-ecc-{variant}-diagnostic.png';cv2.imwrite(str(image),cv2.cvtColor(sheet,cv2.COLOR_RGB2BGR))
report={'utc':datetime.now(timezone.utc).isoformat(),'cat':'clover','method':'Endpoint Euclidean ECC on isolated warm tail; single inverse warp on final18 frames; green cloth protected','correlation':float(score),'matrix':matrix.tolist(),'sourceSeamMAE':mae(src[299],src[0]),'candidateSeamMAE':mae(out[299],out[0]),'sourceTailAlphaIoU':iou(src[299],src[0]),'candidateTailAlphaIoU':iou(out[299],out[0]),'adjacentMAEP95':float(np.percentile(adjacent,95)),'candidateAdjacentMAEP95':float(np.percentile(fixed_adjacent,95)),'outsideROIChangedPixels':int(np.any(out[:,region==0]!=src[:,region==0],axis=2).sum()),'first282FramesExact':bool(np.array_equal(src[:282],out[:282])),'accepted':False,'output':str(output),'diagnostic':{'path':str(image),'dimensions':[1000,572],'sha256':hashlib.sha256(image.read_bytes()).hexdigest()}}
(root/f'reports/v5/CXI/evidence/v8-m-tail-registration-{variant}.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
