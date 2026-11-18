"""Independent local translation experiment; reject weak anatomical support."""
from pathlib import Path
import datetime, hashlib, json, sys
sys.path.insert(0, str(Path('work/v5/CXV/python').resolve()))
import cv2
import numpy as np

cv2.setNumThreads(2)
root = Path('work/v5/CXV/ref/batch-m')
frames = np.load(root/'mochi-frames.npy', mmap_mode='r')
gray = [cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) for frame in frames]
scale = np.array([468/525, 390/437])
specs = {'head': {'roi': [285,106,58,29], 'delivery': [249,115]},
         'offHand': {'roi': [184,282,34,34], 'delivery': [143,254]}}
result = {'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'cat': 'mochi',
          'sourceSha256': hashlib.sha256((root/'Scene1.mp4').read_bytes()).hexdigest(),
          'fps': 30, 'frames': 300, 'method': 'Local full-cycle LK median translation; independently fixed-template normalized correlation; projected proxy only, no recovered bone transform.',
          'gates': {'survivors': 6, 'forwardBackPx': .75, 'inlierThresholdPx': 1.5, 'minInlierFraction': .7,
                    'maxInlierErrorPx': 2, 'seamDeliveryPx': 2, 'minTemplateCorrelation': .8,
                    'maxTemplateDisagreementDeliveryPx': 2}, 'sockets': {}}
for name, spec in specs.items():
    x,y,w,h = spec['roi']
    mask = np.zeros(gray[0].shape, np.uint8); mask[y:y+h,x:x+w] = 255
    first = cv2.goodFeaturesToTrack(gray[0], maxCorners=32, qualityLevel=.02, minDistance=3, mask=mask)
    if first is None:
        result['sockets'][name] = {**spec, 'accepted': False, 'reason': 'No corners'}
        continue
    alive = np.ones(len(first), bool); at = first.copy(); history = [at[:,0].copy()]
    for i in range(1,300):
        nxt,status,_ = cv2.calcOpticalFlowPyrLK(gray[i-1],gray[i],at,None,winSize=(21,21),maxLevel=3,criteria=(3,30,.01))
        back,bs,_ = cv2.calcOpticalFlowPyrLK(gray[i],gray[i-1],nxt,None,winSize=(21,21),maxLevel=3,criteria=(3,30,.01))
        alive &= (status[:,0]>0)&(bs[:,0]>0)&(np.linalg.norm(back[:,0]-at[:,0],axis=1)<.75)
        at=nxt;history.append(at[:,0].copy())
    ids=np.flatnonzero(alive)
    entry={**spec,'tracked':len(first),'survivors':len(ids),'accepted':False};result['sockets'][name]=entry
    if len(ids)<6:
        entry['reason']='Fewer than6 full-cycle corners';continue
    deltas=np.array(history)[:,ids]-first[ids,0]
    translations=np.median(deltas,axis=1)
    errors=np.linalg.norm(deltas-translations[:,None],axis=2)
    inliers=errors<=1.5
    fractions=inliers.mean(axis=1)
    template=gray[0][y:y+h,x:x+w];template_offsets=[];correlations=[]
    pad=40;xx=max(0,x-pad);yy=max(0,y-pad);rr=min(gray[0].shape[1],x+w+pad);bb=min(gray[0].shape[0],y+h+pad)
    for frame in gray:
        scores=cv2.matchTemplate(frame[yy:bb,xx:rr],template,cv2.TM_CCOEFF_NORMED)
        _,maximum,_,location=cv2.minMaxLoc(scores);px,py=location
        delta=np.zeros(2)
        for axis,(a,b) in enumerate([(px,py),(py,px)]):
            line=scores[b,:] if axis==0 else scores[:,b]
            if 0<a<len(line)-1:
                denominator=line[a-1]-2*line[a]+line[a+1]
                if abs(denominator)>1e-9:delta[axis]=np.clip(.5*(line[a-1]-line[a+1])/denominator,-.5,.5)
        template_offsets.append(np.array([px+xx-x,py+yy-y])+delta);correlations.append(maximum)
    template_offsets=np.array(template_offsets);template_offsets-=template_offsets[0]
    agreement=np.linalg.norm((template_offsets-translations)*scale,axis=1)
    delivery=translations*scale
    seam=float(np.linalg.norm(delivery[-1]));min_fraction=float(fractions.min());min_corr=float(min(correlations));max_disagreement=float(agreement.max())
    entry.update(minInlierFraction=min_fraction,maxInlierErrorPx=float(errors[inliers].max()),
                 worstInlierFrame=int(fractions.argmin()),seamResidualDeliveryPx=seam,
                 minTemplateCorrelation=min_corr,worstTemplateFrame=int(np.argmin(correlations)),
                 maxTemplateDisagreementDeliveryPx=max_disagreement,worstDisagreementFrame=int(agreement.argmax()),
                 deliveryRange=np.ptp(delivery,axis=0).tolist(),maxStepDeliveryPx=float(np.linalg.norm(np.diff(delivery,axis=0),axis=1).max()),
                 worldOffsets=np.round(delivery*np.array([512/384,-512/384]),5).tolist())
    entry['accepted']=min_fraction>=.7 and seam<=2 and min_corr>=.8 and max_disagreement<=2
    if not entry['accepted']:entry['reason']='Retained geometry gates and independent template support not all met'
out=Path('reports/v5/CXV/M-mochi-socket-translation-R1.json');out.write_text(json.dumps(result,separators=(',',':'))+'\n')
print(json.dumps({key:{k:v for k,v in value.items() if k!='worldOffsets'} for key,value in result['sockets'].items()}))
