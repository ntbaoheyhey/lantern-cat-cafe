#!/usr/bin/env python3
"""Offline local tail seam hypotheses; retains all rejected data for review."""
import json,subprocess,sys
from pathlib import Path
import numpy as np
import cv2
root=Path(__file__).resolve().parents[2]
base=root/'work/v5/CXI/batch-m/experiments'
variant=sys.argv[1] if len(sys.argv)>1 else 'r1'
assert variant in ['r1','r2','r3']
def mae(a,b,roi=None):
    if roi is not None:a,b=a[roi],b[roi]
    return float(np.abs(a.astype(np.float32)-b.astype(np.float32)).mean())
for cat in ['mochi','clover']:
    folder=base/f'{cat}-384';m=json.loads((folder/'measurements.json').read_text());w,h=m['deliveryCanvas']
    rgba=np.memmap(folder/'estimated.rgba',dtype=np.uint8,mode='r',shape=(300,h,w,4))
    src=np.stack([np.dstack([f[:,:,:3]*(f[:,:,3:4].astype(np.float32)/255),f[:,:,3]]).astype(np.uint8) for f in rgba])
    out=src.copy();target=src[0];target_gray=cv2.cvtColor(target[:,:,:3],cv2.COLOR_RGB2GRAY)
    yy,xx=np.mgrid[0:h,0:w].astype(np.float32)
    # Explicit tail-left region, soft transition before torso and below forearm.
    # This is a hypothesis, not an automatic semantic mask.
    mask=(1-np.clip((xx/w-.30)/.12,0,1))*np.clip((yy/h-.43)/.12,0,1)*(1-np.clip((yy/h-.81)/.09,0,1))
    roi=(yy/h>.53)&(yy/h<.86)&(xx/w<.4)
    window=18
    endpoint_flow=cv2.calcOpticalFlowFarneback(target_gray,cv2.cvtColor(src[-1,:,:,:3],cv2.COLOR_RGB2GRAY),None,.5,4,31,5,7,1.5,0)
    endpoint_flow=cv2.GaussianBlur(endpoint_flow,(0,0),2)
    endpoint_flow=np.clip(endpoint_flow,-24,24)
    for i in range(300-window,300):
        progress=(i-(300-window))/(window-1);q=progress**3*(10-15*progress+6*progress**2)
        current=src[i];gray=cv2.cvtColor(current[:,:,:3],cv2.COLOR_RGB2GRAY)
        if variant=='r1':
            flow=cv2.calcOpticalFlowFarneback(target_gray,gray,None,.5,4,31,5,7,1.5,0)
            warped=cv2.remap(current,xx+flow[:,:,0]*q,yy+flow[:,:,1]*q,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
            aligned=warped*(1-q)+target*q
            out[i]=np.clip(current*(1-mask[...,None])+aligned*mask[...,None],0,255).astype(np.uint8)
        elif variant=='r2':
            # One smooth displacement field; never cross-fade two silhouettes.
            out[i]=cv2.remap(current,xx+endpoint_flow[:,:,0]*q*mask,yy+endpoint_flow[:,:,1]*q*mask,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
        else:
            # Bidirectional correspondence: both inputs move to the same intermediate
            # position before interpolation. R1 incorrectly mixed a moved A with fixed B.
            inverse=cv2.calcOpticalFlowFarneback(target_gray,gray,None,.5,5,41,7,7,1.5,0)
            forward=cv2.calcOpticalFlowFarneback(gray,target_gray,None,.5,5,41,7,7,1.5,0)
            phase=q*mask
            left=cv2.remap(current,xx+inverse[:,:,0]*phase,yy+inverse[:,:,1]*phase,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
            right=cv2.remap(target,xx+forward[:,:,0]*(1-phase),yy+forward[:,:,1]*(1-phase),cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
            out[i]=np.clip(left*(1-phase[...,None])+right*phase[...,None],0,255).astype(np.uint8)
    suffix='' if variant=='r1' else '-'+variant
    path=folder/f'tail-flow-premul{suffix}.rgba';out.tofile(path)
    adjacency=[mae(src[i,:,:,:3],src[i-1,:,:,:3],roi) for i in range(1,300)]
    repaired=[mae(out[i,:,:,:3],out[i-1,:,:,:3],roi) for i in range(1,300)]
    seam=mae(src[299,:,:,:3],src[0,:,:,:3],roi);new_seam=mae(out[299,:,:,:3],out[0,:,:,:3],roi)
    ratio=lambda seq: max(seq[-window:])/max(float(np.percentile(seq[:280],95)),.001)
    samples=[]
    for i in [282,288,294,299]:
        tiles=[]
        for candidate in [src[i],out[i]]:
            alpha=candidate[:,:,3:4].astype(np.float32)/255
            comp=np.clip(candidate[:,:,:3]+np.array([242,228,206])*(1-alpha),0,255).astype(np.uint8)
            cut=comp[int(h*.43):int(h*.90),:int(w*.44)]
            cut=cv2.resize(cut,(224,224));cv2.putText(cut,f'{cat} F{i}',(4,16),cv2.FONT_HERSHEY_SIMPLEX,.4,(50,50,50),1);tiles.append(cut)
        samples.append(np.concatenate(tiles,axis=1))
    sheet=np.concatenate([np.concatenate(samples[:2],axis=1),np.concatenate(samples[2:],axis=1)],axis=0)
    sheet_path=folder/f'tail-flow-comparison{suffix}.jpg';cv2.imwrite(str(sheet_path),cv2.cvtColor(sheet,cv2.COLOR_RGB2BGR))
    report={'cat':cat,'variant':variant,'hypothesis':'18-frame quintic local tail flow; r1 crossfade rejected; r2 single displacement; r3 bidirectional correspondence; 30fps/300frames retained',
      'tailROISourceSeamMAE':seam,'tailROIRepairedSeamMAE':new_seam,'adjacentP95':float(np.percentile(adjacency,95)),
      'endWindowSourceMaxToPriorP95':ratio(adjacency),'endWindowRepairedMaxToPriorP95':ratio(repaired),
      'changedFrames':list(range(283,300)),'outsideMaskUnchanged':bool(np.array_equal(out[:,mask==0],src[:,mask==0])),
      'sheet':{'path':str(sheet_path),'dimensions':[sheet.shape[1],sheet.shape[0]],'stdev':list(np.std(sheet.astype(float),axis=(0,1)))},
      'accepted':False,'note':'Must independently view; local ROI is not ground-truth segmentation. No shipped derivative.'}
    (folder/f'tail-flow-study{suffix}.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
