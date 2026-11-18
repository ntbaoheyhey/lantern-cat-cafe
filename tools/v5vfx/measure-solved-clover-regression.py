"""Fixed target's solved positions: four conservative roundings, no search."""
from pathlib import Path
import datetime,hashlib,itertools,json,math,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(2)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
prepath=ROOT/'reports/v5/CXV/M-clover-solved-regression-R1-preregistration.json'
pre=json.loads(prepath.read_text())
for key in ('raw','solvedLayout'):assert sha(pre[key]['path'])==pre[key]['sha256']
raw=json.loads(Path(pre['raw']['path']).read_text());layout=json.loads(Path(pre['solvedLayout']['path']).read_text())
positions={r['key']:r['clover'] for r in layout['results']}
priorpath=ROOT/'work/v5/CXV/batch-m/clover-fixed-regression-r1/paint.json';prior=json.loads(priorpath.read_text());valid={r['key']:r for r in prior['results']}
results=[];hashes=0
def delta(a,b):return np.abs(a.astype(np.int16)-b.astype(np.int16)).max(axis=2)
for case in raw['cases']:
 key=case['key'];s=case['before'];old=next(l['rect'] for l in s['labels'] if l['id']=='clover');new=positions[key]
 images={}
 for cap in case['captures']:
  if cap['variant'] not in ('baseline','labels-hidden','without-mochi','without-clover','without-panko','without-mallow'):continue
  assert sha(cap['path'])==cap['sha256'];hashes+=1;images[cap['variant']]=cv2.imread(cap['path'])
 paint=delta(images['baseline'],images['labels-hidden']);body={cat:delta(images['labels-hidden'],images['without-'+cat]) for cat in ('mochi','clover','panko','mallow')}
 x0,y0,x1,y1=math.floor(old['x'])-10,math.floor(old['y'])-10,math.ceil(old['x']+old['width'])+10,math.ceil(old['y']+old['height'])+10
 yy,xx=np.nonzero(paint[y0:y1,x0:x1]>0);actual=[new['x']-old['x'],new['y']-old['y']];roundings=[]
 for rx,ry in itertools.product(('floor','ceil'),repeat=2):
  dx=getattr(math,rx)(actual[0]);dy=getattr(math,ry)(actual[1]);xs=xx+x0+dx;ys=yy+y0+dy;counts=[]
  for threshold in (0,1,2,4):
   active=paint[y0:y1,x0:x1][yy,xx]>threshold
   for margin in (0,1,2):
    for cat,b in body.items():
     mask=(b>threshold).astype(np.uint8)
     if margin:mask=cv2.dilate(mask,np.ones((margin*2+1,margin*2+1),np.uint8))
     counts.append(dict(threshold=threshold,margin=margin,body=cat,pixels=int(np.count_nonzero(active & (mask[ys,xs]>0)))))
  roundings.append(dict(rounding=[rx,ry],integerDelta=[dx,dy],counts=counts,clear=all(c['pixels']==0 for c in counts if c['threshold']==0 and c['margin']==2)))
 originalValid=all(v['count']==0 for k,v in valid[key]['controls'].items() if k!='preInitialRestored') and all(all(v.values()) for v in valid[key]['stateGates'])
 results.append(dict(key=key,originalFourControlsValid=originalValid,newFiveControlsValid=valid[key]['valid'],actualDelta=actual,roundings=roundings,clearAllRoundings=all(x['clear'] for x in roundings)))
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceCommit=raw['sourceCommit'],indexSha256=raw['indexSha256'],preregistration=dict(path=str(prepath),sha256=sha(prepath)),priorControls=dict(path=str(priorpath),sha256=sha(priorpath)),harness=dict(path=__file__,sha256=sha(__file__)),hashes=hashes,cases=len(results),results=results,productionAcceptance=False,imagesViewed=0,limits=pre['limits'])
out=ROOT/'work/v5/CXV/batch-m/clover-fixed-regression-r1/solved-paint.json';assert not out.exists();out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(cases=len(results),hashes=hashes,originalValidFailures=[r['key'] for r in results if r['originalFourControlsValid'] and not r['clearAllRoundings']],strictValidFailures=[r['key'] for r in results if r['newFiveControlsValid'] and not r['clearAllRoundings']])))
