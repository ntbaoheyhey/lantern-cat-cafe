#!/usr/bin/env python3
"""Offline constrained matte study, from preserved source clips. Not asset acceptance."""
import hashlib,json,subprocess
from pathlib import Path
from datetime import datetime,timezone
import cv2
import numpy as np
from importlib.util import spec_from_file_location,module_from_spec
cv2.setNumThreads(2)
ROOT=Path(__file__).resolve().parents[2]
spec=spec_from_file_location('delivery',Path(__file__).with_name('study-designer-delivery.py'))
delivery=module_from_spec(spec);spec.loader.exec_module(delivery)
base=ROOT/'work/v5/CXI/batch-m';out=base/'matte-r2';out.mkdir(exist_ok=True)
report={'utc':datetime.now(timezone.utc).isoformat(),'status':'STUDY ONLY: source alpha remains ambiguous; seam unmodified','cats':[]}
for cat in ['mochi','clover']:
 m=json.loads((base/f'experiments/{cat}-384/measurements.json').read_text());w,h=m['deliveryCanvas']
 source=base/f'sources/{cat}-idle-original.mp4';sw,sh=m['studyCanvas']
 original=delivery.decode(source,sw,sh)
 x0,y0,x1,y1=m['sourceBoundsAtStudy'];x0=max(0,x0-3);y0=max(0,y0-3);x1=min(sw,x1+3);y1=min(sh,y1+3)
 old=np.memmap(base/f'experiments/{cat}-384/estimated.rgba',dtype=np.uint8,mode='r',shape=(300,h,w,4))
 rows=[];boxes=[];tail_masks=[];samples=[];black_errors=[]
 raw=out/f'{cat}-premul.rgba'
 with raw.open('wb') as target:
  for frame,src in enumerate(original):
   rgb=cv2.resize(src[y0:y1,x0:x1],(w,h),interpolation=cv2.INTER_AREA)
   level=rgb.max(axis=2).astype(np.float32);solid=(level>24).astype(np.uint8)
   distance=cv2.distanceTransform(solid,cv2.DIST_L2,3)
   local=cv2.dilate(level,np.ones((5,5),np.uint8))
   support=cv2.dilate(solid,np.ones((5,5),np.uint8))>0
   alpha=np.clip((level-3)/np.maximum(local-3,48),0,1)
   alpha[distance>=1.9]=1;alpha[(level<=4)|~support]=0
   a=np.round(alpha*255).astype(np.uint8);premul=rgb.copy();premul[a==0]=0
   rgba=np.dstack([premul,a]);target.write(rgba.tobytes())
   yy,xx=np.where(a>24);boxes.append([int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)])
   weak=(level<24)&~support
   rows.append({'frame':frame,'weakOpaqueBefore':int(((old[frame,:,:,3]>50)&weak).sum()),'weakOpaqueAfter':int(((a>50)&weak).sum()),'changedSolidInterior':int(((distance>=1.9)&(a!=old[frame,:,:,3])).sum())})
   black_errors.append(float(np.abs(premul.astype(np.float32)-rgb).mean()))
   # Diagnostic tail label only. Warm fur on the left is separated from green cloth.
   yy,xx=np.mgrid[:h,:w];r,g,b=np.moveaxis(rgb.astype(np.float32),-1,0)
   region=(xx<w*.43)&(yy>h*.34)&(yy<h*.75)
   warm=(r>g*1.045)&(r>b*1.20)&(a>48)
   seed=(region&warm).astype(np.uint8)
   seed=cv2.morphologyEx(seed,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
   n,labels,stats,centers=cv2.connectedComponentsWithStats(seed,connectivity=8)
   if n>1:
    candidates=[k for k in range(1,n) if stats[k,cv2.CC_STAT_AREA]>30 and centers[k,0]<w*.30]
    selected=max(candidates,key=lambda k:stats[k,cv2.CC_STAT_AREA]) if candidates else 0
    mask=(labels==selected).astype(np.uint8) if selected else np.zeros_like(seed)
   else:mask=np.zeros_like(seed)
   tail_masks.append(mask)
   if frame in [0,75,150,299]:
    bg=np.full_like(rgb,[238,244,232]);straight=np.clip(premul.astype(np.float32)/np.maximum(alpha[:,:,None],1/255),0,255)
    comp=np.round(straight*alpha[:,:,None]+bg*(1-alpha[:,:,None])).astype(np.uint8)
    # A diagnostic overlay, not a plain re-export of a previously reviewed sheet.
    overlay=comp.copy();overlay[mask>0]=np.round(overlay[mask>0]*.5+np.array([240,40,180])*.5).astype(np.uint8)
    scale=min(230/w,276/h);tw,th=round(w*scale),round(h*scale);left=cv2.resize(overlay,(tw,th),interpolation=cv2.INTER_AREA);cell=np.full((320,240,3),255,np.uint8);cell[24:24+th,(240-tw)//2:(240-tw)//2+tw]=left
    cv2.putText(cell,f'{cat} F{frame} tail hypothesis',(5,15),cv2.FONT_HERSHEY_SIMPLEX,.38,(0,0,0),1,cv2.LINE_AA);cv2.putText(cell,f'weak noise {rows[-1]["weakOpaqueBefore"]} -> 0',(5,311),cv2.FONT_HERSHEY_SIMPLEX,.4,(0,0,0),1,cv2.LINE_AA);samples.append(cell)
 np.save(out/f'{cat}-tail-mask.npy',np.stack(tail_masks))
 sheet=np.concatenate(samples,axis=1);sheetpath=out/f'{cat}-matte-tail-diagnostic.png';cv2.imwrite(str(sheetpath),cv2.cvtColor(sheet,cv2.COLOR_RGB2BGR))
 union=[min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes)]
 row={'cat':cat,'canvas':[w,h],'opaqueUnionAlphaGT24':union,'footYRange':[min(b[3] for b in boxes),max(b[3] for b in boxes)],'weakOpaqueBeforeMax':max(r['weakOpaqueBefore'] for r in rows),'weakOpaqueAfterMax':max(r['weakOpaqueAfter'] for r in rows),'changedSolidInteriorMax':max(r['changedSolidInterior'] for r in rows),'blackReconstructionMAEMax':max(black_errors),'rawPremul':str(raw),'diagnostic':{'path':str(sheetpath),'dimensions':[sheet.shape[1],sheet.shape[0]],'sha256':hashlib.sha256(sheetpath.read_bytes()).hexdigest()},'seamRepaired':False}
 report['cats'].append(row);print(json.dumps(row),flush=True)
(ROOT/'reports/v5/CXI/evidence/v8-m-matte-study.json').write_text(json.dumps(report,indent=2)+'\n')
