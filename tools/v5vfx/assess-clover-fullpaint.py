"""Observe full label paint, then fit the preregistered bounded translation."""
from pathlib import Path
import datetime,hashlib,json,math,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(2)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
pr=ROOT/'reports/v5/CXV/M-clover-fullpaint-R1-preregistration.json'
pre=json.loads(pr.read_text());out=ROOT/'work/v5/CXV/batch-m/clover-fullpaint-r1'
out.mkdir(exist_ok=False)
def box(b,pad=0):
 return [max(0,math.floor(b['x'])-pad),max(0,math.floor(b['y'])-pad),min(1280,math.ceil(b['x']+b['width'])+pad),min(720,math.ceil(b['y']+b['height'])+pad)]
def overlaps(a,b):return a[0]<b[2] and a[2]>b[0] and a[1]<b[3] and a[3]>b[1]
rows=[];inputs=[];observations=[]
for relative in pre['inputs']:
 base=ROOT/relative;raw=json.loads((base/'report.json').read_text());a=json.loads((base/'analysis.json').read_text())
 assert raw['sourceCommit']==pre['sourceCommit'] and raw['indexSha256']==pre['indexSha256']
 inputs.append(dict(path=str(base),reportSha256=sha(base/'report.json'),analysisSha256=sha(base/'analysis.json')))
 for i,(c,m) in enumerate(zip(raw['cases'],a['cases'])):
  if not m['valid']:continue
  p=m['pixelDifferences'];assert sha(p['path'])==p['sha256'];data=dict(np.load(p['path']));s=c['before'];b=next(x['rect'] for x in s['labels'] if x['id']=='clover');bounds=box(b,10)
  escapes=[]
  for pad in range(11):
   covered=np.zeros((720,1280),bool)
   for label in s['labels']:
    x0,y0,x1,y1=box(label['rect'],pad);covered[y0:y1,x0:x1]=True
   escapes.append(int(np.count_nonzero((data['labelPaint']>0)&~covered)))
  separate=all(not overlaps(bounds,box(l['rect'],10)) for l in s['labels'] if l['id']!='clover')
  meta=dict(input=len(inputs)-1,index=i,key=c.get('key',f"{c['mode']}-{c['frame']}"),mask=p,escapesByPadding=escapes,separate=separate)
  observations.append(meta);rows.append((meta,s,b,bounds,data))
assert len(rows)==56
ob=out/'observations.json';ob.write_text(json.dumps(dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),inputs=inputs,rows=observations),indent=2)+'\n')
assert all(r['escapesByPadding'][10]==0 and r['separate'] for r in observations),'Fullpaint containment/ownership failed; do not fit'
dx,dy=np.meshgrid(np.arange(-24,25),np.arange(-24,25))
passed=(dx-12)**2+(dy+19)**2<=32**2
matrices=[]
for meta,s,b,(x0,y0,x1,y1),data in rows:
 paint=(data['labelPaint'][y0:y1,x0:x1]>0).astype(np.float32)
 body=np.logical_or.reduce([v>0 for k,v in data.items() if k.endswith('Contribution')]).astype(np.uint8)
 body=cv2.dilate(body,np.ones((5,5),np.uint8))
 window=np.pad(body,24)[y0:y1+48,x0:x1+48].astype(np.float32)
 counts=np.rint(cv2.matchTemplate(window,paint,cv2.TM_CCORR)).astype(np.int32);assert counts.shape==(49,49)
 for ix,iy in [(0,0),(24,24),(48,48),(12,36),(36,12)]:assert counts[iy,ix]==np.count_nonzero(paint*window[iy:iy+paint.shape[0],ix:ix+paint.shape[1]])
 yy,xx=np.nonzero(paint);gx=x0+int(xx.min())+dx;gy=y0+int(yy.min())+dy;w=int(xx.max()-xx.min()+1);h=int(yy.max()-yy.min()+1)
 geometry=(gx>=4)&(gy>=4)&(gx+w<=1276)&(gy+h<=716)
 blocked=[box(z['rect']) for z in s['hud']]
 for z in s['anchors']:
  if not z['visible']:continue
  if z.get('face'):blocked.append(box(dict(z['face'],x=z['face']['x']+s['host']['x'],y=z['face']['y']+s['host']['y'])))
  if z.get('body') and z['id'] not in ('mochi','clover'):blocked.append(box(dict(z['body'],x=z['body']['x']+s['host']['x'],y=z['body']['y']+s['host']['y']),6))
 for z in s['labels']:
  if z['id']=='clover':continue
  rect=dict(z['rect'])
  if z['id']=='mochi':
   anchor=next(v for v in s['anchors'] if v['id']=='mochi');rect['y']=max(anchor['footY'],anchor['body']['y']+anchor['body']['height'])+s['host']['y']+6
  blocked.append(box(rect,10))
 for bx,by,br,bb in blocked:geometry &= ~((gx<br)&(gx+w>bx)&(gy<bb)&(gy+h>by))
 passed &= (counts==0)&geometry
 matrices.append(counts)
ranked=sorted([(int(x),int(y)) for x,y in zip(dx[passed],dy[passed])],key=lambda a:(a[0]**2+a[1]**2,abs(a[1]),a[0],a[1]))
grid=out/'grid.npz';np.savez_compressed(grid,dx=dx,dy=dy,passed=passed,counts=np.stack(matrices))
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceCommit=pre['sourceCommit'],indexSha256=pre['indexSha256'],preregistration=dict(path=str(pr),sha256=sha(pr)),harness=dict(path=__file__,sha256=sha(__file__)),observations=dict(path=str(ob),sha256=sha(ob)),grid=dict(path=str(grid),sha256=sha(grid)),cases=len(rows),passing=int(passed.sum()),nearest=ranked[:20],chosen=None if not ranked else dict(additional=ranked[0],relativeR7=[ranked[0][0]-12,ranked[0][1]+19],authoredYOffset=ranked[0][1]+24),decision='NO SOLUTION' if not ranked else 'Frozen fullpaint hypothesis only; no native or production acceptance',productionAcceptance=False)
(ROOT/'reports/v5/CXV/M-clover-fullpaint-R1.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ('cases','passing','chosen','decision')}))
