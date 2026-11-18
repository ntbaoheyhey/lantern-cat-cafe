"""One frozen translation on reserved regressions; no optimization or rendering."""
from pathlib import Path
import datetime, hashlib, importlib.util, json, math, sys

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(2)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
spec=importlib.util.spec_from_file_location('measure',ROOT/'tools/v5vfx/measure-action-labels.py')
measure=importlib.util.module_from_spec(spec);spec.loader.exec_module(measure)
prepath=ROOT/'reports/v5/CXV/M-clover-fixed-regression-R1-preregistration.json'
pre=json.loads(prepath.read_text());rawpath=Path(pre['raw']['path']);assert sha(rawpath)==pre['raw']['sha256']
raw=json.loads(rawpath.read_text());assert raw['sourceCommit']==pre['sourceCommit'] and raw['indexSha256']==pre['indexSha256']
out=ROOT/'work/v5/CXV/batch-m/clover-fixed-regression-r1';out.mkdir(exist_ok=False)
assert pre['deltaFromCapturedCandidate']==[-16,-5]
dx,dy=pre['deltaFromCapturedCandidate'];results=[];hashes=0
def box(b,p=0):return [max(0,math.floor(b['x'])-p),max(0,math.floor(b['y'])-p),min(1280,math.ceil(b['x']+b['width'])+p),min(720,math.ceil(b['y']+b['height'])+p)]
def overlap(a,b):return a[0]<b[2] and a[2]>b[0] and a[1]<b[3] and a[3]>b[1]
for case in raw['cases']:
 images={};controls={};states=[]
 for cap in case['captures']:
  assert sha(cap['path'])==cap['sha256'];hashes+=1
  images[cap['variant']]=cv2.imread(cap['path']);assert images[cap['variant']].shape==(720,1280,3)
  for t in ('before','after'):
   states.append(measure.stable(cap[t],case['before'],case['fixedTime'],case['mode']=='reduced'))
 for cap in case['precondition']:
  assert sha(cap['path'])==cap['sha256'];hashes+=1
  images['pre-'+cap['variant']]=cv2.imread(cap['path'])
 for name,a,b in [('baselineRepeat','baseline','baseline-repeat'),('hiddenRepeat','labels-hidden','labels-hidden-repeat'),('restored','baseline','restored'),('preRestoredBaseline','pre-restored','baseline'),('preInitialRestored','pre-initial','pre-restored')]:
  controls[name]=measure.stats(measure.delta(images[a],images[b])>0)
 valid=all(c['count']==0 for c in controls.values()) and all(all(s.values()) for s in states)
 paint=measure.delta(images['baseline'],images['labels-hidden']);s=case['before'];covered=np.zeros((720,1280),bool)
 for label in s['labels']:
  x0,y0,x1,y1=box(label['rect'],10);covered[y0:y1,x0:x1]=True
 escapes=int(np.count_nonzero((paint>0)&~covered));rows=[]
 contributions={cat:measure.delta(images['labels-hidden'],images['without-'+cat]) for cat in measure.CATS}
 for cat in ('mochi','clover'):
  rect=next(l['rect'] for l in s['labels'] if l['id']==cat);bounds=box(rect,10);x0,y0,x1,y1=bounds
  ownership=all(not overlap(bounds,box(l['rect'],10)) for l in s['labels'] if l['id']!=cat)
  y,x=np.nonzero(paint[y0:y1,x0:x1]>0);xs=x+x0+(dx if cat=='clover' else 0);ys=y+y0+(dy if cat=='clover' else 0)
  extent=[int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1]
  viewport=extent[0]>=4 and extent[1]>=4 and extent[2]<=1276 and extent[3]<=716
  counts=[]
  for threshold in (0,1,2,4):
   local=paint[y0:y1,x0:x1][y,x]>threshold
   for margin in (0,1,2):
    for body,v in contributions.items():
     mask=(v>threshold).astype(np.uint8)
     if margin:mask=cv2.dilate(mask,np.ones((margin*2+1,margin*2+1),np.uint8))
     counts.append(dict(body=body,threshold=threshold,margin=margin,pixels=int(np.count_nonzero(local & (mask[ys,xs]>0)))))
  project=lambda b:dict(b,x=b['x']+s['host']['x'],y=b['y']+s['host']['y'])
  guards=[('hud:'+str(i),box(z['rect'])) for i,z in enumerate(s['hud'])]
  for z in s['anchors']:
   if not z['visible']:continue
   if z.get('face'):guards.append(('face:'+z['id'],box(project(z['face']))))
   if z.get('body') and z['id'] not in ('mochi','clover'):guards.append(('native:'+z['id'],box(project(z['body']),6)))
  for label in s['labels']:
   if label['id']==cat:continue
   b=dict(label['rect'])
   if label['id']=='clover':b['x']+=dx;b['y']+=dy
   guards.append(('label:'+label['id'],box(b,10)))
  hits=[name for name,b in guards if overlap(extent,b)]
  clear=all(c['pixels']==0 for c in counts if c['threshold']==0 and c['margin']==2)
  rows.append(dict(id=cat,ownership=ownership,extent=extent,viewport=viewport,guardHits=hits,counts=counts,clear=ownership and viewport and not hits and clear))
 results.append(dict(key=case['key'],valid=valid,controls=controls,stateGates=states,escapesAt10=escapes,labels=rows,modelClear=escapes==0 and all(r['clear'] for r in rows)))
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceCommit=raw['sourceCommit'],indexSha256=raw['indexSha256'],url=raw['url'],preregistration=dict(path=str(prepath),sha256=sha(prepath)),raw=pre['raw'],harness=dict(path=__file__,sha256=sha(__file__)),stateVerifier=dict(path=str(measure.__file__),sha256=sha(measure.__file__)),hashes=hashes,cases=len(results),validControls=sum(r['valid'] for r in results),validModelFailures=[r['key'] for r in results if r['valid'] and not r['modelClear']],invalidCases=[r['key'] for r in results if not r['valid']],results=results,productionAcceptance=False,imagesViewed=0,scope=pre['scope'],limits=pre['limits'])
(out/'paint.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ('hashes','cases','validControls','validModelFailures','invalidCases')}))
