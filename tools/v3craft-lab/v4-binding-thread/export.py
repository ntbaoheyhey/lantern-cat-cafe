"""Binding lab export first; --publish only after own-art drills/comparison."""
from pathlib import Path
from PIL import Image
import numpy as np, json, hashlib, sys
lab=Path('tools/v3craft-lab/v4-binding-thread')
out=Path('apps/web/public/units/binding-thread/poses') if '--publish' in sys.argv else lab/'exported'
out.mkdir(parents=True,exist_ok=True)
sources={'K0':'K0','K1':'K1-A1','K2':'K2-A1','K4':'K4-A2'}
def bounds(a):
    y,x=np.where(a[:,:,3]>=128)
    return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def feet(a):
    b=bounds(a);y,x=np.where((a[:,:,3]>=128)&(np.indices(a.shape[:2])[0]>=b[3]-5))
    return [float(x.mean()),float(b[3])]
def foot_points(a):
    b=bounds(a);y,x=np.where((a[:,:,3]>=128)&(np.indices(a.shape[:2])[0]>=b[3]-8))
    xs=np.array(sorted(set(x)));groups=np.split(xs,np.flatnonzero(np.diff(xs)>5)+1)
    groups=sorted(sorted(groups,key=len,reverse=True)[:2],key=lambda g:g.mean())
    if len(groups)<2: groups=np.array_split(xs,2)
    return [[float(g.mean()),float(b[3])] for g in groups]
base=np.array(Image.open(lab/'raw/K0-normal.png'));bb=bounds(base);baseline=feet(base)
manifest={'version':1,'unit':'binding-thread','canvas':[896,896],'baseline':baseline,'opaqueHeight':bb[3]-bb[1],'poses':{}}
receipts=[]
for key,candidate in sources.items():
    source=lab/'raw'/(candidate+'-normal.png');im=Image.open(source).convert('RGBA');a=np.array(im);b=bounds(a)
    m=None if key=='K0' else json.loads((lab/(candidate+'-metrics.json')).read_text())
    top,chin=[344,452] if m is None else [v*m['scale']+m['offset'][1] for v in m['headLandmarksSource']]
    band=(a[int(top)+8:int(top)+18,:,3]>=128).any(axis=0);xs=np.flatnonzero(band)
    groups=np.split(xs,np.flatnonzero(np.diff(xs)>4)+1);cap=max(groups,key=len);cx=float(cap.mean())
    face=[cx-len(cap)*.40,top+(chin-top)*.48,len(cap)*.80,(chin-top)*.52]
    # Select the visible leading fingertip in the appropriate arm band.
    low,high=(chin,bb[3]-65) if key=='K0' else (top+35,chin+95)
    ys,xs=np.where((a[:,:,3]>=128)&(np.indices(a.shape[:2])[0]>=low)&(np.indices(a.shape[:2])[0]<=high))
    edge=xs.max() if key=='K1' else xs.min()
    near=np.abs(xs-edge)<=8
    hand=[float(edge),float(np.median(ys[near]))]
    head=[cx,face[1]+face[3]*.5];chest=[baseline[0],b[1]+(b[3]-b[1])*.53]
    im.save(out/(key+'.webp'),quality=96,method=6,exact=True)
    manifest['poses'][key]={'image':key+'.webp','face':face,'opaqueBounds':b,'feet':foot_points(a),
        'sockets':{'mainHand':hand,'offHand':chest,'weaponTip':hand,'vfxOrigin':hand,'head':head,'chest':chest,'feet':baseline,'hpAnchor':[cx,b[1]-28]},
        'overlap':[{'part':'loose cord','center':hand,'radius':[18,18],'travel':[1,-1],'phase':.3},{'part':'lower yarn','center':[baseline[0],baseline[1]-80],'radius':[42,30],'travel':[1.2,0],'phase':1.4}]}
    receipts.append({'key':key,'source':str(source),'path':str(out/(key+'.webp')),'bytes':(out/(key+'.webp')).stat().st_size,'sha256':hashlib.sha256((out/(key+'.webp')).read_bytes()).hexdigest()})
# Ordinary featured enemies need K1/K2/K4. Reuse their strike drawing for the
# generic adapter's cast slot; do not invent an unrequested extra key.
manifest['poses']['K5']={**manifest['poses']['K2'],'image':'K2.webp'}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(lab/'export.json').write_text(json.dumps({'baseline':baseline,'opaqueHeight':manifest['opaqueHeight'],'assets':receipts,'K5Alias':'K2','production':'--publish' in sys.argv},indent=2)+'\n')
print(json.dumps({'baseline':baseline,'opaqueHeight':manifest['opaqueHeight'],'assetBytes':sum(x['bytes'] for x in receipts),'production':'--publish' in sys.argv}))
