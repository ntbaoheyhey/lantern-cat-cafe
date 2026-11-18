"""Frozen painted support test for a predefined below-body candidate; no image edits."""
from pathlib import Path
import datetime,hashlib,json,math,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(2)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
report_path=ROOT/'reports/v5/CXV/M-label-staging-R1.json'
report=json.loads(report_path.read_text())
rows_path=Path(report['rows']['path']);assert sha(rows_path)==report['rows']['sha256']
rows=json.loads(rows_path.read_text());inputs=[];results=[]
for inp in report['inputs']:
 assert sha(inp['path'])==inp['sha256']
 assert sha(inp['analysis']['path'])==inp['analysis']['sha256']
 inputs.append((json.loads(Path(inp['path']).read_text()),json.loads(Path(inp['analysis']['path']).read_text())))
for row in rows:
 if 'pixelCase' not in row:continue
 raw,analysis=inputs[row['input']];case=raw['cases'][row['pixelCase']];a=analysis['cases'][row['pixelCase']];assert a['valid']
 p=a['pixelDifferences'];assert sha(p['path'])==p['sha256'];m=np.load(p['path'])
 old=next(x for x in case['before']['labels'] if x['id']=='mochi')['rect'];new=row['candidate']
 x0,y0=math.floor(old['x']),math.floor(old['y']);x1,y1=math.ceil(old['x']+old['width']),math.ceil(old['y']+old['height'])
 label=m['labelPaint'][y0:y1,x0:x1]
 shifts=sorted(set((dx,dy) for dx in [math.floor(new['x']-old['x']),math.ceil(new['x']-old['x'])] for dy in [math.floor(new['y']-old['y']),math.ceil(new['y']-old['y'])]))
 body_names=[k for k in m.files if k.endswith('Contribution')]
 assert 'mochiContribution' in body_names and 'cloverContribution' in body_names
 counts=[]
 for threshold in (0,1,2,4):
  for margin in (0,1,2):
   for body_name in body_names:
    body=(m[body_name]>threshold).astype(np.uint8)
    if margin:body=cv2.dilate(body,np.ones((margin*2+1,margin*2+1),np.uint8))
    for dx,dy in shifts:
     nx,ny=x0+dx,y0+dy;assert 0<=nx and 0<=ny and nx+label.shape[1]<=1280 and ny+label.shape[0]<=720
     count=int(np.count_nonzero((label>threshold)&(body[ny:ny+label.shape[0],nx:nx+label.shape[1]]>0)))
     counts.append(dict(threshold=threshold,margin=margin,body=body_name,dx=dx,dy=dy,pixels=count))
 results.append(dict(key=row['key'],input=row['input'],pixelCase=row['pixelCase'],masks=p,old=old,candidate=new,shifts=shifts,counts=counts,passGate=all(c['pixels']==0 for c in counts if c['threshold']==0 and c['margin']==2)))
out=rows_path.parent/'paint.json';out.write_text(json.dumps(results,indent=2)+'\n')
receipt=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),geometry=dict(path=str(report_path),sha256=sha(report_path)),harness=dict(path=__file__,sha256=sha(__file__)),paint=dict(path=str(out),sha256=sha(out)),cases=len(results),countComparisons=sum(len(r['counts']) for r in results),allClear=all(r['passGate'] for r in results),failures=[dict(key=r['key'],input=r['input'],hits=[c for c in r['counts'] if c['pixels']]) for r in results if not r['passGate']],limits=['Frozen diagnostic only; no newly rendered label.','Both floor and ceil translations checked; fresh actual subpixel raster controls still required.','Contributions are visible RGB differences, not alpha reconstruction.','Idle cases isolate commissioned bodies only; native bodies guarded geometrically.','These inputs are development data, not held-out evidence.'],productionAcceptance=False)
(ROOT/'reports/v5/CXV/M-label-staging-R1-paint.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({k:receipt[k] for k in ('cases','countComparisons','allClear')}));print('Failures',len(receipt['failures']))
