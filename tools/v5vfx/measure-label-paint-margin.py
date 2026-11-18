"""Native painted clearance with fixed margins; preserve all thresholds and failures."""
from pathlib import Path
import datetime,hashlib,json,math,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(2)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
base=Path(sys.argv[1]).resolve();output=Path(sys.argv[2]).resolve()
assert base.is_relative_to(ROOT/'work/v5/CXV') and output.is_relative_to(ROOT/'work/v5/CXV')
raw_path=base/'report.json';a_path=base/'analysis.json';raw=json.loads(raw_path.read_text());analysis=json.loads(a_path.read_text());results=[]
assert len(raw['cases'])==len(analysis['cases'])
for case,a in zip(raw['cases'],analysis['cases']):
 assert a['valid'],'Invalid attribution is not a zero'
 path=a['pixelDifferences']['path'];assert sha(path)==a['pixelDifferences']['sha256'];m=np.load(path)
 bodies=[k for k in m.files if k.endswith('Contribution')];counts=[]
 for threshold in (0,1,2,4):
  for margin in (0,1,2):
   for body in bodies:
    mask=(m[body]>threshold).astype(np.uint8)
    if margin:mask=cv2.dilate(mask,np.ones((margin*2+1,margin*2+1),np.uint8))
    for cat in ('mochi','clover'):
     b=next(x for x in case['before']['labels'] if x['id']==cat)['rect'];x0,y0=math.floor(b['x']),math.floor(b['y']);x1,y1=math.ceil(b['x']+b['width']),math.ceil(b['y']+b['height'])
     count=int(np.count_nonzero((m['labelPaint'][y0:y1,x0:x1]>threshold)&(mask[y0:y1,x0:x1]>0)))
     counts.append(dict(label=cat,body=body,threshold=threshold,margin=margin,pixels=count))
 results.append(dict(key=case.get('key',f"{case['mode']}-{case['frame']}"),mask=a['pixelDifferences'],counts=counts))
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),input=dict(path=str(raw_path),sha256=sha(raw_path)),analysis=dict(path=str(a_path),sha256=sha(a_path)),harness=dict(path=__file__,sha256=sha(__file__)),cases=len(results),comparisons=sum(len(r['counts']) for r in results),clear=all(c['pixels']==0 for r in results for c in r['counts'] if c['threshold']==0 and c['margin']==2),results=results,productionAcceptance=False)
output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ('cases','comparisons','clear')}))
