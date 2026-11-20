"""A5 own selected drawings. Lab export first; --publish after drill/comparison."""
from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib,sys
P=Path('tools/v3craft-lab/v4-clover')
O=Path('apps/web/public/units/clover/poses') if '--publish' in sys.argv else P/'exported'
O.mkdir(parents=True,exist_ok=True)
sources={'K0':'K0-normal.png','K1':'K1-A2-normal.png','K2':'K2-A2-soft.png','K4':'K4-A1-colour.png','K5':'K5-A2-colour.png'}
# Semantic points authored from the two450px opaque-height selection sheets.
# face, main hand, off hand, teapot spout, effect origin, head, chest, tail, hem.
landmarks={
 'K0':([378,361,176,96],[556,474],[359,550],[622,450],[622,450],[466,410],[466,508],[321,605],[474,659]),
 'K1':([379,365,171,92],[278,502],[322,552],[369,501],[369,501],[465,411],[442,507],[173,614],[461,680]),
 'K2':([453,371,171,89],[710,436],[724,494],[831,404],[831,404],[539,414],[515,520],[188,638],[478,677]),
 'K4':([345,378,161,81],[470,456],[517,491],[510,440],[510,440],[425,415],[453,518],[282,652],[510,658]),
 'K5':([348,373,185,91],[210,452],[615,430],[291,428],[615,430],[446,417],[448,509],[210,612],[478,680])}
def bbox(a):
 y,x=np.where(a[:,:,3]>=128);return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def feet(a):
 b=bbox(a);y,x=np.where((a[:,:,3]>=128)&(np.indices(a.shape[:2])[0]>=b[3]-8));xs=sorted(set(x));groups=np.split(xs,np.flatnonzero(np.diff(xs)>5)+1);groups=sorted(sorted(groups,key=len,reverse=True)[:2],key=lambda g:np.mean(g))
 if len(groups)<2:groups=[np.array(xs[:len(xs)//2]),np.array(xs[len(xs)//2:])]
 return [[float(np.mean(g)),float(b[3])] for g in groups]
base=np.array(Image.open(P/'raw/K0-normal.png'));bb=bbox(base);y,x=np.where((base[:,:,3]>=128)&(np.indices(base.shape[:2])[0]>=bb[3]-5));baseline=[float(x.mean()),float(bb[3])]
manifest={'version':1,'unit':'clover','canvas':[896,896],'baseline':baseline,'opaqueHeight':bb[3]-bb[1],'poses':{}}
receipts=[]
for key,source in sources.items():
 im=Image.open(P/'raw'/source).convert('RGBA');a=np.array(im);face,hand,off,tip,origin,head,chest,tail,hem=landmarks[key]
 im.save(O/(key+'.webp'),quality=96,method=6,exact=True)
 manifest['poses'][key]={'image':key+'.webp','face':face,'opaqueBounds':bbox(a),'feet':feet(a),'sockets':{'mainHand':hand,'offHand':off,'weaponTip':tip,'vfxOrigin':origin,'head':head,'chest':chest,'feet':baseline,'hpAnchor':[head[0],bbox(a)[1]-28]},'overlap':[{'part':'tail tip','center':tail,'radius':[42,45],'travel':[2.5,-2.5],'phase':.3},{'part':'dress hem','center':hem,'radius':[75,31],'travel':[2,2],'phase':1.4}]}
 receipts.append({'key':key,'source':str(P/'raw'/source),'path':str(O/(key+'.webp')),'bytes':(O/(key+'.webp')).stat().st_size,'sha256':hashlib.sha256((O/(key+'.webp')).read_bytes()).hexdigest()})
(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(P/'export.json').write_text(json.dumps({'baseline':baseline,'opaqueHeight':manifest['opaqueHeight'],'assets':receipts,'production':'--publish' in sys.argv},indent=2)+'\n')
print(json.dumps({'baseline':baseline,'opaqueHeight':manifest['opaqueHeight'],'assetBytes':sum(r['bytes'] for r in receipts),'production':'--publish' in sys.argv}))
