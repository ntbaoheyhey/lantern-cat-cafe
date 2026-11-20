"""D5 contrast proxy after Peli's local-mean distinction; not the full bandpass model.
Use retained identical rendered PNGs; do not silently substitute gradient energy for contrast.
"""
from pathlib import Path
from PIL import Image
import numpy as np,json
p=Path('tools/v3craft-lab/q3/raw/D5-study');receipt=json.loads(Path('tools/v3craft-lab/q3/blend-study.json').read_text())
linear=lambda v:np.where(v<=.04045,v/12.92,((v+.055)/1.055)**2.4)
def lum(path):return linear(np.asarray(Image.open(path).convert('RGB'),np.float64)/255)@np.array([.2126,.7152,.0722])
baseline=lum(p/'baseline.png');body=np.asarray(Image.open(p/'mask.png'))[:,:,3]>204
fx,fy,fw,fh=receipt['faceWorld'];yy,xx=np.indices(body.shape);face=body&(xx>=fx)&(xx<fx+fw)&(yy>=720-fy-fh)&(yy<720-fy)
for row in receipt['results']:
 y=lum(p/(row['method']+'-'+str(row['age'])+'.png'));normalized={}
 for name,mask in [('face',face),('body',body)]:
  scales=[]
  for step in [1,2,4]:
   aa=ab=0.;edges=0
   for axis in [0,1]:
    a=(slice(step,None),slice(None)) if axis==0 else (slice(None),slice(step,None));b=(slice(None,-step),slice(None)) if axis==0 else (slice(None),slice(None,-step))
    selected=mask[a]&mask[b]&(abs(baseline[a]-baseline[b])>.006)
    c0=((baseline[a]-baseline[b])/np.maximum(1e-4,baseline[a]+baseline[b]))[selected]
    c1=((y[a]-y[b])/np.maximum(1e-4,y[a]+y[b]))[selected]
    aa+=float(c0@c0);ab+=float(c0@c1);edges+=selected.sum()
   scales.append({'pixelSpacing':step,'retention':ab/aa,'edges':int(edges)})
  normalized[name]=scales
 row['normalizedLocalContrast']=normalized
receipt['contrastQualification']='Normalized signed pair-difference projection at 1/2/4px, using local pair mean and identical opaque source locations. Inspired by local-luminance dependence, not a replication of Peli bandpass perception. Gradient retention remains reported separately. Visual review remains required.'
Path('tools/v3craft-lab/q3/blend-study.json').write_text(json.dumps(receipt,indent=2)+'\n')
for method in ['front-additive','front-alpha','split-colour-core']:
 rows=[r for r in receipt['results'] if r['method']==method];print(method,{name:round(min(s['retention'] for r in rows for s in r['normalizedLocalContrast'][name]),6) for name in ['face','body']})
