#!/usr/bin/env python3
"""Bounded color-estimation diagnostic, never a production asset or true-alpha claim."""
from pathlib import Path
from datetime import datetime, timezone
import json, hashlib, sys
import cv2
import numpy as np
cv2.setNumThreads(2)
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'work/v5/CXI/batch-m'
all_frames='--all' in sys.argv
OUT=BASE/('local-color-matte-all-r1' if all_frames else 'local-color-matte-r1')
OUT.mkdir(exist_ok=False)
w,h=312,260
source=BASE/'packed-vp9-256-r1/source.rgba'
raw=np.memmap(source,np.uint8,'r',shape=(300,h,w,4))
report={'utc':datetime.now(timezone.utc).isoformat(),'status':'STUDY_ONLY','source':str(source),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'method':'Estimate boundary alpha from nearest confident foreground RGB on black. RGB unchanged. Alpha never increases. Opaque interior and lantern rectangle protected. This is a prior, not recovered true alpha.','rows':[],'images':[]}
tiles=[];previous=None;temporal=[]
target=(OUT/'source.rgba').open('wb') if all_frames else None
for frame in (range(300) if all_frames else [0,30,150,299]):
 f=raw[frame];rgb=f[:,:,:3].astype(np.float32);old=f[:,:,3].astype(np.float32)/255
 support=(old>24/255).astype(np.uint8)
 inside=cv2.distanceTransform(support,cv2.DIST_L2,5)
 seed=(inside>=4)&(old>=250/255)
 distance,labels=cv2.distanceTransformWithLabels((~seed).astype(np.uint8),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
 colors=np.zeros((int(labels.max())+1,3),np.float32)
 colors[labels[seed]]=rgb[seed]
 foreground=colors[labels]
 fit=np.sum(rgb*foreground,axis=2)/np.maximum(1,np.sum(foreground*foreground,axis=2))
 yy,xx=np.mgrid[:h,:w]
 lantern=(xx>=w*.81)&(yy>=h*.40)&(yy<=h*.86)
 band=(inside<4)&(distance<=8)&(old>0)&~lantern
 new=old.copy()
 new[band]=np.minimum(old[band],np.clip(fit[band],0,1))
 a=np.round(new*255).astype(np.uint8)
 assert np.array_equal(a[~band],f[:,:,3][~band])
 assert np.array_equal(a[lantern],f[:,:,3][lantern])
 rgba=np.dstack([f[:,:,:3],a])
 if target:target.write(rgba.tobytes())
 else:(OUT/f'frame-{frame}.rgba').write_bytes(rgba.tobytes())
 gray=cv2.cvtColor(f[:,:,:3],cv2.COLOR_RGB2GRAY)
 if all_frames and previous is not None:
  pg,pa,pn=previous
  flow=cv2.calcOpticalFlowFarneback(pg,gray,None,.5,3,15,3,5,1.2,0)
  mx=(xx+flow[:,:,0]).astype(np.float32);my=(yy+flow[:,:,1]).astype(np.float32)
  warped_old=cv2.remap(f[:,:,3],mx,my,cv2.INTER_LINEAR).astype(float)
  warped_new=cv2.remap(a,mx,my,cv2.INTER_LINEAR).astype(float)
  edge=(pa>4)&(pa<250)
  temporal.append({'frame':frame,'oldFlowResidual':float(np.abs(warped_old-pa)[edge].mean()),'newFlowResidual':float(np.abs(warped_new-pn)[edge].mean())})
 previous=(gray,f[:,:,3].astype(float),a.astype(float))
 before=np.uint8(np.clip(rgb+255-f[:,:,3:4],0,255))
 after=np.uint8(np.clip(rgb+255-a[:,:,None],0,255))
 alpha_delta=(f[:,:,3].astype(float)-a)
 changed=alpha_delta>0
 oy,ox=np.where(f[:,:,3]>24);ny,nx=np.where(a>24)
 row={'frame':frame,'bandPixels':int(band.sum()),'changedPixels':int(changed.sum()),'meanChangedAlphaReduction':float(alpha_delta[changed].mean()),'maximumAlphaReduction':float(alpha_delta.max()),'opaqueInteriorChanged':int((changed&(inside>=4)).sum()),'lanternChanged':int((changed&lantern).sum()),'blackRGBDelta':0,'heightBefore':int(oy.max()-oy.min()+1),'heightAfter':int(ny.max()-ny.min()+1)}
 report['rows'].append(row)
 if not all_frames:tiles.append(np.concatenate([before,after,f[:,:,:3]],axis=1))
if target:
 target.close();report['derivedSource']={'path':str(OUT/'source.rgba'),'sha256':hashlib.sha256((OUT/'source.rgba').read_bytes()).hexdigest(),'bytes':(OUT/'source.rgba').stat().st_size}
 report['temporal']={'method':'Farneback source RGB flow, previous source edge band; descriptive, not a motion approval','oldMean':float(np.mean([t['oldFlowResidual'] for t in temporal])),'newMean':float(np.mean([t['newFlowResidual'] for t in temporal])),'rows':temporal}
for part in ([] if all_frames else range(2)):
 sheet=np.concatenate(tiles[part*2:part*2+2],axis=0)
 path=OUT/f'comparison-{part}.png';cv2.imwrite(str(path),cv2.cvtColor(sheet,cv2.COLOR_RGB2BGR))
 report['images'].append({'path':str(path),'width':int(sheet.shape[1]),'height':int(sheet.shape[0]),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'columns':['old white','estimated white','unchanged black'],'frames':[0,30] if part==0 else [150,299],'reviewed':False})
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
(ROOT/'reports/v5/CXI/evidence'/('v8-m-local-color-matte-all-study.json' if all_frames else 'v8-m-local-color-matte-study.json')).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'report':str(OUT/'report.json'),'frames':len(report['rows']),'images':report['images'],'temporal':{k:v for k,v in report.get('temporal',{}).items() if k!='rows'}}))
