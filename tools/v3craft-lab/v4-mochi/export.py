"""A4 selected own art; uniform padded canvas and hand-authored semantic sockets."""
from pathlib import Path
from PIL import Image
import json,numpy as np,hashlib
P=Path('tools/v3craft-lab/v4-mochi');O=Path('apps/web/public/units/mochi/poses');O.mkdir(parents=True,exist_ok=True)
sources={'K0':'K0-normal.png','K1':'K1-A2-final.png','K2':'K2-A2-colour.png','K4':'K4-A1-normal.png','K5':'K5-A1-normal.png'}
# Coordinates authored after one 450px-opaque-height selection inspection.
landmarks={
'K0':([369,378,198,126],[526,524],[383,551],[591,552],[463,445],[450,535],[291,574],[458,648]),
'K1':([433,397,184,111],[394,509],[642,582],[336,515],[525,450],[492,548],[239,610],[500,625]),
'K2':([412,389,212,118],[662,505],[407,530],[801,526],[519,446],[480,557],[198,522],[520,618]),
'K4':([355,390,180,113],[435,543],[535,545],[526,575],[443,447],[423,543],[309,570],[400,640]),
'K5':([350,386,196,112],[287,518],[592,455],[592,455],[450,442],[455,538],[592,612],[440,622])}
def bbox(a):
 y,x=np.where(a[:,:,3]>=128);return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def feet(a):
 b=bbox(a);y,x=np.where((a[:,:,3]>=128)&(np.indices(a.shape[:2])[0]>=b[3]-8));xs=sorted(set(x));splits=np.flatnonzero(np.diff(xs)>5)+1;groups=np.split(xs,splits);groups=sorted(groups,key=len,reverse=True)[:2];groups=sorted(groups,key=lambda g:np.mean(g))
 if len(groups)<2:groups=[np.array(xs[:len(xs)//2]),np.array(xs[len(xs)//2:])]
 return [[float(np.mean(g)),float(b[3])] for g in groups]
base=np.array(Image.open(P/'raw/K0-normal.png'));bb=bbox(base);ys,xs=np.where((base[:,:,3]>=128)&(np.indices(base.shape[:2])[0]>=bb[3]-5));baseline=[float(xs.mean()),float(bb[3])]
m={'version':1,'unit':'mochi','canvas':[896,896],'baseline':baseline,'opaqueHeight':bb[3]-bb[1],'poses':{}};receipt=[]
for key,src in sources.items():
 im=Image.open(P/'raw'/src).convert('RGBA');a=np.array(im);face,hand,off,tip,head,chest,tail,hem=landmarks[key];ft=feet(a)
 im.save(O/f'{key}.webp',quality=96,method=6,exact=True)
 m['poses'][key]={'image':key+'.webp','face':face,'opaqueBounds':bbox(a),'feet':ft,'sockets':{'mainHand':hand,'offHand':off,'weaponTip':tip,'vfxOrigin':tip,'head':head,'chest':chest,'feet':baseline,'hpAnchor':[head[0],bbox(a)[1]-28]},'overlap':[{'part':'tail tip','center':tail,'radius':[48,62],'travel':[2.5,-3.5],'phase':.3},{'part':'apron hem','center':hem,'radius':[70,32],'travel':[2,2.5],'phase':1.4}]}
 receipt.append({'key':key,'source':str(P/'raw'/src),'path':str(O/f'{key}.webp'),'bytes':(O/f'{key}.webp').stat().st_size,'sha256':hashlib.sha256((O/f'{key}.webp').read_bytes()).hexdigest()})
(O/'manifest.json').write_text(json.dumps(m,indent=2)+'\n');(P/'export.json').write_text(json.dumps({'baseline':baseline,'opaqueHeight':m['opaqueHeight'],'assets':receipt,'inspection':'two normalized450pxopaqueheight sheets inspected once; all keys maintain costume,props,outline,palette; runtime sockets/feet pending'},indent=2)+'\n');print(json.dumps({'baseline':baseline,'assetBytes':sum(x['bytes'] for x in receipt),'feet':{k:v['feet'] for k,v in m['poses'].items()}}))
