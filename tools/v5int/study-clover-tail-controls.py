#!/usr/bin/env python3
"""Offline tail structure diagnostic. No endpoint, sequence or runtime writes."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, heapq, math
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
OUT = BASE / 'clover-tail-controls-r1'
OUT.mkdir(exist_ok=False)
mask = np.load(BASE / 'clover-dis-endpoint-r1/mask.npy')
h, w = mask.shape
source = BASE / 'matte-r2/clover-premul.rgba'
raw = np.memmap(source, np.uint8, 'r', shape=(300, h, w, 4))

def thin(binary):
    a = np.pad(binary.astype(bool), 1)
    for iteration in range(200):
        before = a.copy()
        for stage in (0, 1):
            p = [a[:-2,1:-1], a[:-2,2:], a[1:-1,2:], a[2:,2:],
                 a[2:,1:-1], a[2:,:-2], a[1:-1,:-2], a[:-2,:-2]]
            count = sum(x.astype(np.uint8) for x in p)
            transitions = sum((~p[i] & p[(i+1)%8]).astype(np.uint8) for i in range(8))
            if stage == 0:
                blocked = (p[0]&p[2]&p[4]) | (p[2]&p[4]&p[6])
            else:
                blocked = (p[0]&p[2]&p[6]) | (p[0]&p[4]&p[6])
            remove = (count>=2)&(count<=6)&(transitions==1)&~blocked
            a[1:-1,1:-1] &= ~remove
        if np.array_equal(a, before):
            return a[1:-1,1:-1], iteration+1
    raise AssertionError('Thinning did not converge')

def neighbors(p, nodes):
    x, y = p
    for dy in (-1,0,1):
        for dx in (-1,0,1):
            q = (x+dx,y+dy)
            if (dx or dy) and q in nodes:
                yield q, math.hypot(dx,dy)

def distances(start, nodes):
    dist, prev, queue = {start:0.}, {}, [(0.,start)]
    while queue:
        at, p = heapq.heappop(queue)
        if at != dist[p]: continue
        for q, length in neighbors(p,nodes):
            candidate = at+length
            if candidate < dist.get(q, math.inf):
                dist[q], prev[q] = candidate, p
                heapq.heappush(queue,(candidate,q))
    return dist,prev

rows=[]; panels=[]
for frame in [0,299]:
    f=raw[frame];r,g,b=np.moveaxis(f[:,:,:3].astype(float),-1,0)
    warm=((r>g*1.035)&(r>b*1.15)&(f[:,:,3]>48)&(mask>0)).astype(np.uint8)
    count,labels,stats,_=cv2.connectedComponentsWithStats(warm,8)
    main=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]));component=(labels==main).astype(np.uint8)
    # A closed silhouette supplies geometric handles only; source pixels never change.
    contours,_=cv2.findContours(component,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    filled=np.zeros_like(component);cv2.drawContours(filled,contours,-1,1,cv2.FILLED)
    skeleton,iterations=thin(filled)
    nodes=set(zip(*np.where(skeleton)[::-1]));ends=[p for p in nodes if sum(1 for _ in neighbors(p,nodes))==1]
    assert len(ends)>=2, ('Need identifiable path endpoints',frame,len(ends))
    best=None
    for a in ends:
        dist,prev=distances(a,nodes)
        for b in ends:
            if b in dist and (best is None or dist[b]>best[0]):best=(dist[b],a,b,prev)
    length,a,b,prev=best;path=[b]
    while path[-1]!=a:path.append(prev[path[-1]])
    points=np.array(path,dtype=float)
    if points[0,0]>points[-1,0]:points=points[::-1] # tip-to-root hypothesis; visually verify
    arc=np.r_[0,np.cumsum(np.linalg.norm(np.diff(points,axis=0),axis=1))]
    fractions=np.linspace(0,1,9);controls=np.stack([np.interp(fractions*arc[-1],arc,points[:,axis])for axis in range(2)],axis=-1)
    np.save(OUT/f'tail-{frame:03}.npy',component);np.save(OUT/f'centerline-{frame:03}.npy',points)
    canvas=f[:,:,:3].copy();canvas[skeleton]=[255,70,180]
    for index,xy in enumerate(controls):
        at=tuple(np.rint(xy).astype(int));cv2.circle(canvas,at,2,(30,255,255),-1);cv2.putText(canvas,str(index),at,cv2.FONT_HERSHEY_SIMPLEX,.24,(255,255,255),1,cv2.LINE_AA)
    crop=canvas[232:362,:132];panel=cv2.resize(crop,(396,390),interpolation=cv2.INTER_NEAREST);panels.append(panel)
    rows.append({'frame':frame,'componentArea':int(component.sum()),'filledArea':int(filled.sum()),'bounds':stats[main].tolist(),'skeletonPixels':len(nodes),'endpoints':[list(map(int,p))for p in sorted(ends)],'thinningIterations':iterations,'centerlineLength':float(length),'controls':controls.tolist()})
sheet=np.zeros((420,812,3),np.uint8);sheet[30:,0:396]=panels[0];sheet[30:,416:812]=panels[1]
cv2.putText(sheet,'frame 0 / target controls',(4,20),cv2.FONT_HERSHEY_SIMPLEX,.55,(255,255,255),1)
cv2.putText(sheet,'frame 299 / source controls',(420,20),cv2.FONT_HERSHEY_SIMPLEX,.55,(255,255,255),1)
image=OUT/'control-diagnostic.png';assert cv2.imwrite(str(image),cv2.cvtColor(sheet,cv2.COLOR_RGB2BGR))
report={'utc':datetime.now(timezone.utc).isoformat(),'source':str(source),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'toolSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'rows':rows,'image':{'path':str(image),'dimensions':[812,420],'sha256':hashlib.sha256(image.read_bytes()).hexdigest(),'rgbMean':sheet.mean(axis=(0,1)).tolist(),'viewed':False},'limits':['Color component and longest skeleton path are geometric hypotheses, not designer parameter recovery.','Tip-to-root ordering must be visually checked; no warp applied.'],'sequenceChanged':False,'runtimeChanged':False}
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'out':str(OUT),'rows':rows,'image':report['image']}))
