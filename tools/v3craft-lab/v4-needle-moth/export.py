"""Export selected Needle art to the lab first; publish only after the two drills."""
from pathlib import Path
from PIL import Image
import hashlib, json, sys
import numpy as np
lab=Path('tools/v3craft-lab/v4-needle-moth');publish='--publish' in sys.argv
selection=json.loads((lab/'selection.json').read_text());landmarks=json.loads((lab/'landmarks.json').read_text())
assert all(key in selection for key in ['K1','K2','K4']), 'All three selected drawings required'
if publish:
    approval=json.loads((lab/'fx-selection.json').read_text())
    assert approval['numericalGatesPass'] and approval['privateComparisonReviewed']
out=Path('apps/web/public/units/needle-moth/poses') if publish else lab/'exported'
out.mkdir(parents=True,exist_ok=True)
def bounds(a):
    y,x=np.where(a[:,:,3]>=128)
    return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def feet(a):
    b=bounds(a);y,x=np.where((a[:,:,3]>=128)&(np.indices(a.shape[:2])[0]>=b[3]-5))
    return [float(x.mean()),float(b[3])]
def foot_points(a):
    b=bounds(a);_,x=np.where((a[:,:,3]>=128)&(np.indices(a.shape[:2])[0]>=b[3]-8))
    xs=np.array(sorted(set(x)));groups=np.split(xs,np.flatnonzero(np.diff(xs)>5)+1)
    groups=sorted(sorted(groups,key=len,reverse=True)[:2],key=lambda g:g.mean())
    if len(groups)<2:groups=np.array_split(xs,2)
    return [[float(g.mean()),float(b[3])] for g in groups]
base=np.array(Image.open(lab/'raw/K0-normal.png').convert('RGBA'));bb=bounds(base);baseline=feet(base)
manifest={'version':1,'unit':'needle-moth','canvas':[1152,1152],'baseline':baseline,'opaqueHeight':bb[3]-bb[1],'poses':{}}
receipts=[]
for key in ['K0','K1','K2','K4']:
    item=selection.get(key);candidate=item['candidate'] if item else 'K0'
    source=lab/(item['image'] if item else 'raw/K0-normal.png')
    im=Image.open(source).convert('RGBA');a=np.array(im);b=bounds(a)
    m=json.loads((lab/item['metrics']).read_text()) if item else None
    if m:assert m['accepted'], 'Selected metrics must name their acceptance scope'
    scale=m['scale'] if m else 1;offset=np.array(m['offset'] if m else [256,256])
    coords=landmarks[candidate+'Sockets']
    point=lambda value:(np.array(value)*scale+offset).tolist()
    face=point(coords['face'][:2])+[v*scale for v in coords['face'][2:]]
    sockets={name:point(coords[name]) for name in ['mainHand','offHand','weaponTip','vfxOrigin','head','chest']}
    sockets.update(feet=baseline,hpAnchor=[sockets['head'][0],b[1]-28])
    im.save(out/(key+'.webp'),quality=96,method=6,exact=True)
    manifest['poses'][key]={'image':key+'.webp','face':face,'opaqueBounds':b,'feet':foot_points(a),'sockets':sockets,'overlap':[]}
    path=out/(key+'.webp');receipts.append({'key':key,'source':str(source),'path':str(path),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
manifest['poses']['K5']={**manifest['poses']['K2'],'image':'K2.webp'}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(lab/'export.json').write_text(json.dumps({'baseline':baseline,'output':str(out),'files':receipts},indent=2)+'\n')
print(json.dumps({'output':str(out),'files':len(receipts),'bytes':sum(x['bytes'] for x in receipts)}))
