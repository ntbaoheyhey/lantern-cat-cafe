import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
rows=[]
for row in json.loads(Path(sys.argv[1]).read_text()):
 a=np.asarray(Image.open(row['real']).convert('RGB'),dtype=float);b=np.asarray(Image.open(row['without']).convert('RGB'),dtype=float)
 delta=np.abs(a-b).max(axis=2);h,w=delta.shape;yy,xx=np.ogrid[:h,:w];faces=[]
 for i,(x,y,rx,ry) in enumerate(row['masks']):
  if rx<=0 or ry<=0:continue
  mask=(((xx/w-x)/rx)**2+((1-yy/h-y)/ry)**2<.64)&((1-yy/h)<=row['headTops'][i])
  if np.any(mask):faces.append({'above8':float(np.mean(delta[mask]>8)),'mean':float(delta[mask].mean())})
 rows.append({'id':row['id'],'faces':faces,'stats':row['stats']})
result={'method':'Unchanged V0.1/V3 protected-face core ellipse .8 radius clipped at full head-top; offender >1% pixels RGB difference>8','samples':sum(len(r['faces']) for r in rows),'offenders':[{'id':r['id'],**f}for r in rows for f in r['faces'] if f['above8']>.01],'rows':rows}
Path(sys.argv[2]).write_text(json.dumps(result,indent=2));print(json.dumps({'samples':result['samples'],'offenders':len(result['offenders'])}))
