"""Check native label shadows/antialiasing and two-pixel body safety margins."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math
import sys
import cv2
import numpy as np

cv2.setNumThreads(2)
prior_path,output=map(Path,sys.argv[1:])
assert not output.exists()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
prior=json.loads(prior_path.read_text())
assert prior['suite']=='staging' and prior['completeAttributionValid']
raw_path=Path(prior['raw']['path'])
assert sha(raw_path)==prior['raw']['sha256']
raw=json.loads(raw_path.read_text())
assert [c['key'] for c in raw['cases']]==[c['key'] for c in prior['cases']]
hashes={}

def image(cap):
    p=Path(cap['path'])
    actual=sha(p)
    assert actual==cap['sha256']
    hashes[str(p)]=actual
    img=cv2.imread(str(p),cv2.IMREAD_COLOR)
    assert img.shape==(720,1280,3)
    return img

def delta(a,b):
    return np.abs(a.astype(np.int16)-b.astype(np.int16)).max(axis=2)

def region(rect,padding):
    x0=max(0,math.floor(rect['x'])-padding)
    y0=max(0,math.floor(rect['y'])-padding)
    x1=min(1280,math.ceil(rect['x']+rect['width'])+padding)
    y1=min(720,math.ceil(rect['y']+rect['height'])+padding)
    mask=np.zeros((720,1280),bool)
    mask[y0:y1,x0:x1]=True
    return mask

results=[]
comparisons=0
for case in raw['cases']:
    captures={c['variant']:c for c in case['captures']}
    baseline=image(captures['baseline'])
    hidden=image(captures['labels-hidden'])
    paint=delta(baseline,hidden)
    bodies={cat:delta(hidden,image(captures['without-'+cat])) for cat in ('mochi','clover','panko','mallow')}
    labels=case['before']['labels']
    all_support=np.logical_or.reduce([region(l['rect'],4) for l in labels])
    outside=int(np.count_nonzero((paint>0)&~all_support))
    rows=[]
    for label in [l for l in labels if l['id'] in ('mochi','clover')]:
        exact,padded=region(label['rect'],0),region(label['rect'],4)
        extra=int(np.count_nonzero((paint>0)&padded&~exact))
        other_support=np.logical_or.reduce([region(l['rect'],4) for l in labels if l['id']!=label['id']])
        ambiguous=int(np.count_nonzero((paint>0)&padded&other_support))
        hits=[]
        for threshold in (0,1,2,4):
            support=(paint>threshold)&padded
            for margin in (0,1,2):
                for cat,body in bodies.items():
                    occupied=(body>threshold).astype(np.uint8)
                    if margin:
                        occupied=cv2.dilate(occupied,np.ones((2*margin+1,2*margin+1),np.uint8))
                    count=int(np.count_nonzero(support&occupied.astype(bool)))
                    comparisons+=1
                    if count:
                        hits.append(dict(threshold=threshold,margin=margin,body=cat,pixels=count))
        rows.append(dict(label=label['id'],extraPixelsWithinPadding=extra,ambiguousPaintWithOtherLabel=ambiguous,hits=hits))
    results.append(dict(key=case['key'],outsideAllPaddedLabels=outside,labels=rows))
clear=all(not r['outsideAllPaddedLabels'] and all(not l['ambiguousPaintWithOtherLabel'] and not l['hits'] for l in r['labels']) for r in results)
result=dict(utc=datetime.now(timezone.utc).isoformat(),priorAudit=dict(path=str(prior_path.resolve()),sha256=sha(prior_path)),
            raw=prior['raw'],toolSha256=sha(__file__),sourceCommit=raw['sourceCommit'],indexSha256=raw['indexSha256'],url=raw['url'],
            verifiedImageHashes=len(hashes),cases=len(results),comparisons=comparisons,completeControlsInherited=True,
            fourPixelLabelSupportAndTwoPixelBodyMarginClear=clear,results=results,imagesViewed=0,productionAcceptance=False,
            limits=['Full-image controls and state checks are inherited from the pinned independent audit.',
                    'All label paint outside the union of padded DOM bounds is a failure; overlapping label support is not attributed.',
                    'Native shadows and separate VFX remain outside isolated body contributions.',
                    'No perceived association, ordinary-play, seam, fringe/halo or release acceptance.'])
with output.open('x') as f:
    json.dump(result,f,indent=2)
    f.write('\n')
print(json.dumps({k:result[k] for k in ('verifiedImageHashes','cases','comparisons','fourPixelLabelSupportAndTwoPixelBodyMarginClear')}))
