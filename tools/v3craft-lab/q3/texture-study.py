"""Throwaway method comparison on approved original paint; no production changes.
Sources and acceptance limits: reports/v3-feel/LEARN/Q3.md.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib
from datetime import datetime,timezone
out=Path(__file__).parent;raw=out/'raw';raw.mkdir(exist_ok=True)
source=Path('/Users/bao/art/vfx-2026-11-12/soot-4/layers/core-shape.png')
paint=np.array(Image.open(source).convert('RGBA'),dtype=np.float32)/255
rng=np.random.default_rng(15112026)
noise=np.zeros((512,512),np.float32)
for n,weight in [(9,.58),(23,.28),(61,.14)]:
 grid=Image.fromarray(np.uint8(rng.random((n,n))*255),'L').resize((512,512),Image.Resampling.BICUBIC)
 noise+=np.asarray(grid,dtype=np.float32)/255*weight
noise=(noise-noise.min())/(noise.max()-noise.min())
x=np.linspace(0,1,512)[None,:]
# Directional breakup retains a legible leading contour before separating islands.
field=.62*noise+.38*x
field=(field-field.min())/(field.max()-field.min())
base=paint[:,:,3]>.08
records=[];images={}
for name in ['uniform-fade','noise-erosion']:
 values=[];supports=[]
 for i,p in enumerate(np.linspace(0,1,60)):
  coverage=(1-p) if name=='uniform-fade' else np.clip((field-p)/.08+.5,0,1)
  alpha=paint[:,:,3]*coverage;support=alpha>.08
  values.append(float(np.mean(support[base])));supports.append(support)
  if i in [0,15,30,45,59]:
   rgba=paint.copy();rgba[:,:,3]=alpha;images[(name,i)]=Image.fromarray(np.uint8(np.clip(rgba,0,1)*255))
 records.append({'method':name,'areaFractionsAtFrames':{str(i):round(values[i],6) for i in [0,15,30,45,59]},'maxFrameAreaLoss':round(max(values[i]-values[i+1] for i in range(59)),6),'contourChangeAtMid':round(1-np.sum(supports[30]&base)/np.sum(supports[30]|base),6)})
sheet=Image.new('RGB',(1280,552),'#242336');draw=ImageDraw.Draw(sheet)
for row,name in enumerate(['uniform-fade','noise-erosion']):
 for col,i in enumerate([0,15,30,45,59]):
  im=images[(name,i)].resize((256,256),Image.Resampling.LANCZOS);sheet.paste(im,(col*256,row*276+20),im);draw.text((col*256+6,row*276+4),f'{name} f{i}',fill='white')
sheet.save(raw/'erosion-comparison.jpg',quality=88)
# Controlled compositing stress study in linear light, over the exact same Soot pixels.
bodySource=Path('apps/web/public/units/soot/runtime.webp')
body=np.array(Image.open(bodySource).convert('RGBA'),np.float32)/255
fx=np.array(Image.open('/Users/bao/art/vfx-2026-11-12/soot-4/layers/charge-glow.png').convert('RGBA').resize((640,640)),np.float32)/255
linear=lambda v:np.where(v<=.04045,v/12.92,((v+.055)/1.055)**2.4)
srgb=lambda v:np.where(v<=.0031308,v*12.92,1.055*np.maximum(v,0)**(1/2.4)-.055)
col=linear(body[:,:,:3]);background=np.tile(linear(np.array([.14,.14,.20]))[None,None,:],(640,640,1));baseImage=col*body[:,:,3,None]+background*(1-body[:,:,3,None]);effect=linear(fx[:,:,:3])
alpha=fx[:,:,3,None]*.78
face=np.zeros((640,640),bool);face[248:345,247:391]=True
masks={'face':face&(body[:,:,3]>.8),'body':(body[:,:,3]>.8)}
variants={'baseline':baseImage,'broad-additive':np.clip(baseImage+effect*alpha,0,1),'normal-alpha':effect*alpha+baseImage*(1-alpha)}
# Same large painted body underneath the cat; the front core is restrained at opaque body pixels and absent at faces.
behind=effect*alpha+background*(1-alpha)
split=col*body[:,:,3,None]+behind*(1-body[:,:,3,None])
frontAlpha=alpha*(1-body[:,:,3,None]*.82);frontAlpha[face]=0
variants['split-body-local-core']=np.clip(split+effect*frontAlpha*.23,0,1)
weights=np.array([.2126,.7152,.0722]);y0=baseImage@weights
stats=[];sheet=Image.new('RGB',(1280,350),'#242336');draw=ImageDraw.Draw(sheet)
for j,(name,v) in enumerate(variants.items()):
 y=v@weights;metrics={}
 for label,mask in masks.items():
  a=[];b=[]
  for axis in [0,1]:
   g0=np.diff(y0,axis=axis);g1=np.diff(y,axis=axis)
   shared=(mask[1:]&mask[:-1]) if axis==0 else (mask[:,1:]&mask[:,:-1])
   selected=shared&(np.abs(g0)>.006);a.extend(g0[selected].tolist());b.extend(g1[selected].tolist())
  a=np.asarray(a);b=np.asarray(b)
  metrics[label]={'retainedOriginalGradient':round(float(np.dot(a,b)/np.dot(a,a)),6),'rmsGradientRatio':round(float(np.sqrt(np.mean(b*b)/np.mean(a*a))),6),'nearWhiteFraction':round(float(np.mean(np.min(v[mask],axis=1)>.98)),6),'pixels':int(mask.sum())}
 stats.append({'method':name,'metrics':metrics});im=Image.fromarray(np.uint8(np.clip(srgb(v),0,1)*255)).resize((320,320),Image.Resampling.LANCZOS);sheet.paste(im,(j*320,30));draw.text((j*320+6,7),name,fill='white')
sheet.save(raw/'blend-comparison.jpg',quality=89)
receipt={'at':datetime.now(timezone.utc).isoformat(),'sources':[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [source,bodySource]],'method':'60 lifetime samples; alpha support >.08. Linear Rec.709 same-pixel gradients on original alpha>.8; signed gradient retention is distinct from RMS texture contrast. Static CPU study, not browser/film acceptance.','erosion':records,'blend':stats,'faceRegionSourcePixels':[247,248,391,345],'decisionPendingVisualReview':True}
(out/'texture-study.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'erosion':records,'blend':stats},indent=2))
