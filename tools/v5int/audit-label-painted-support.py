"""Localize measured paint outside DOM extents; do not redefine an accepted gate."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math
import sys
import argparse
import cv2
import numpy as np

parser=argparse.ArgumentParser()
parser.add_argument('prior',type=Path)
parser.add_argument('output',type=Path)
parser.add_argument('--diagnostic-invalid-controls',action='store_true')
args=parser.parse_args()
prior_path,output=args.prior,args.output
assert not output.exists()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
prior=json.loads(prior_path.read_text())
assert prior['completeAttributionValid'] or args.diagnostic_invalid_controls, 'Invalid controls require explicit diagnostic mode'
raw_path=Path(prior['raw']['path'])
assert sha(raw_path)==prior['raw']['sha256']
raw=json.loads(raw_path.read_text())
assert [c['key'] for c in raw['cases']]==[c['key'] for c in prior['cases']]

def read(cap):
    assert sha(cap['path'])==cap['sha256']
    a=cv2.imread(cap['path']).astype(np.int16)
    assert a.shape==(720,1280,3)
    return a

def box(rect,pad):
    m=np.zeros((720,1280),bool)
    m[max(0,math.floor(rect['y'])-pad):min(720,math.ceil(rect['y']+rect['height'])+pad),
      max(0,math.floor(rect['x'])-pad):min(1280,math.ceil(rect['x']+rect['width'])+pad)]=True
    return m

def metric(mask,paint,body=None):
    pts=np.argwhere(mask)
    return dict(pixels=len(pts),bbox=None if not len(pts) else [int(pts[:,1].min()),int(pts[:,0].min()),int(pts[:,1].max()+1),int(pts[:,0].max()+1)],
                maxPaintDelta=int(paint[mask].max()) if len(pts) else 0,
                maxBodyDelta=int(body[mask].max()) if len(pts) and body is not None else None)

rows=[]
for case,prior_case in zip(raw['cases'],prior['cases']):
    caps={c['variant']:c for c in case['captures']}
    baseline,hidden,without=map(read,[caps['baseline'],caps['labels-hidden'],caps['without-clover']])
    paint=np.abs(baseline-hidden).max(2)
    body=np.abs(hidden-without).max(2)
    labels=case['before']['labels']
    clover=next(l for l in labels if l['id']=='clover')
    filters=sorted({n['filter'] for n in case['before']['labelPaintState'] if n['class']=='b3-world'})
    padding=[]
    for pad in (0,1,2,3,4,5,6,8,10):
        union=np.logical_or.reduce([box(l['rect'],pad) for l in labels])
        padding.append(dict(padding=pad,**metric((paint>0)&~union,paint)))
    clover_support=box(clover['rect'],10)
    intersections=[dict(threshold=t,**metric(clover_support&(paint>t)&(body>t),paint,body)) for t in (0,1,2,4,8,16)]
    rows.append(dict(key=case['key'],attributionValid=prior_case['attributionValid'],filters=filters,cloverRect=clover['rect'],outsideAllLabelsByPadding=padding,
                     cloverBodyIntersectionsWithinTenPixelSupport=intersections))
result=dict(utc=datetime.now(timezone.utc).isoformat(),priorAudit=dict(path=str(prior_path.resolve()),sha256=sha(prior_path)),
            raw=prior['raw'],sourceCommit=raw['sourceCommit'],indexSha256=raw['indexSha256'],url=raw['url'],toolSha256=sha(__file__),
            cases=len(rows),rows=rows,completeControlsInherited=prior['completeAttributionValid'],diagnosticInvalidControls=args.diagnostic_invalid_controls,
            invalidControlCases=[r['key'] for r in rows if not r['attributionValid']],productionAcceptance=False,imagesViewed=0,
            interpretation='Observed CSS drop-shadow extends beyond the prior four-pixel support assumption. Broader localization does not erase prior failure or accept overlaps.',
            limits=['Uses pinned RGB differences; invalid-control cases are arithmetic only, never attribution or clearance.',
                    'No new captures or subjective view.',
                    'A ten-pixel neighborhood localizes existing paint; it is not a new clearance tolerance.',
                    'No inferred alpha value from RGB change and no all-frame claim.'])
with output.open('x') as f:
    json.dump(result,f,indent=2)
    f.write('\n')
print(json.dumps(dict(cases=len(rows),outside4Range=[min(r['outsideAllLabelsByPadding'][4]['pixels'] for r in rows),max(r['outsideAllLabelsByPadding'][4]['pixels'] for r in rows)],
                     firstClearPaddingByCase=[next((p['padding'] for p in r['outsideAllLabelsByPadding'] if not p['pixels']),None) for r in rows],
                     cloverHighContrastCases=[r['key'] for r in rows if r['cloverBodyIntersectionsWithinTenPixelSupport'][3]['pixels']])))
