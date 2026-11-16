"""P1 own-art experiment. Run with tools/.venv/bin/python. No production writes."""
from pathlib import Path
import json,datetime
import numpy as np
from PIL import Image,ImageDraw
from scipy.cluster.vq import kmeans2
from scipy.optimize import linear_sum_assignment
from skimage.color import rgb2lab,deltaE_ciede2000

out=Path('tools/v3craft-lab/poses');raw=out/'raw'
review=Path('reports/v3-feel/REVIEW/P1');review.mkdir(parents=True,exist_ok=True)
def box(im):
 a=np.asarray(im)[:,:,3]>=128;y,x=np.where(a);return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def feet(im):
 a=np.asarray(im)[:,:,3]>=128;b=box(im);y,x=np.where(a & (np.indices(a.shape)[0]>=b[3]-5));return [float(x.mean()),float(b[3])]
def aligned(im,height=196,size=(640,256)):
 b=box(im);s=height/(b[3]-b[1]);f=feet(im)
 scaled=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS)
 dst=Image.new('RGBA',size);x=round(280-f[0]*s);y=round(230-f[1]*s);dst.alpha_composite(scaled,(x,y))
 return dst,{'scale':s,'x':x,'y':y,'footSource':f,'bbox':b}
def palette(im):
 a=np.asarray(im);pixels=a[:,:,:3][a[:,:,3]>=128][::5]/255
 lab=rgb2lab(pixels.reshape(-1,1,3)).reshape(-1,3)
 return kmeans2(lab,6,iter=60,minit='++',seed=42)[0]
def delta(a,b):
 cost=deltaE_ciede2000(a[:,None,:],b[None,:,:]);i,j=linear_sum_assignment(cost);return float(cost[i,j].mean())

k0=Image.open('apps/web/public/units/soot/runtime.webp').convert('RGBA')
images={'K0':k0}
for name in ['A1','A2']:images[name]=Image.open(raw/f'soot-K2-{name}.png').convert('RGBA')
# Assemble real K0 rig attachments, replacing only arm-r. Bone units are y-up.
rig=json.loads(Path('assets/cardrpg-look/spine/soot/placeholder/soot.json').read_text())
atlas=np.array(Image.open('assets/cardrpg-look/spine/soot/placeholder/soot.png').convert('RGBA'))
# The atlas is premultiplied; convert to straight RGBA for Pillow compositing.
a=atlas[:,:,3:4].astype(float)/255;atlas[:,:,:3]=np.round(np.minimum(255,atlas[:,:,:3]/np.maximum(a,1/255))).astype(np.uint8)
atlas=Image.fromarray(atlas)
regions={'body':[4,4,479,418],'feet':[155,798,318,119],'tail':[570,430,224,323],'arm-l':[4,798,143,168],'arm-r':[802,430,218,308],'head':[4,430,558,360]}
bones={}
for b in rig['bones']:
 parent=bones.get(b.get('parent'),[0,0]);bones[b['name']]=[parent[0]+b.get('x',0),parent[1]+b.get('y',0)]
for name in ['rigK0','B1','B2']:
 canvas=Image.new('RGBA',(900,640))
 for slot in rig['slots']:
  part=slot['name'];r=regions[part];p=rig['skins'][0]['attachments'][part][part];bone=bones[slot['bone']]
  if part=='arm-r' and name!='rigK0':
   layer=Image.open(raw/f'soot-K2-{name}-arm.png').convert('RGBA');layer=layer.crop(tuple(box(layer)))
   # Hold original body and feet; two alternative cuff-to-prop assemblies.
   width=265 if name=='B1' else 285;height=round(layer.height*width/layer.width)
   layer=layer.resize((width,height),Image.Resampling.LANCZOS);canvas.alpha_composite(layer,(390,285 if name=='B1' else 283));continue
  layer=atlas.crop((r[0],r[1],r[0]+r[2],r[1]+r[3])).resize((round(p['width']),round(p['height'])),Image.Resampling.LANCZOS)
  canvas.alpha_composite(layer,(round(300+bone[0]+p.get('x',0)-p['width']/2),round(570-bone[1]-p.get('y',0)-p['height']/2)))
 images[name]=canvas;canvas.save(raw/f'soot-K2-{name}.png')

normalized={};transforms={};rows=[]
for name,im in images.items():normalized[name],transforms[name]=aligned(im)
base=np.asarray(normalized['K0'])[:,:,3]>=128
# Manual anatomical landmarks: ear tip to lowest chin fluff, excluding cloak.
heads={'K0':[191,355],'A1':[315,657],'A2':[394,724]}
for name,im in images.items():
 if name in ['K0','rigK0']:continue
 baseline='rigK0' if name.startswith('B') else 'K0';ref=images[baseline];mask0=np.asarray(normalized[baseline])[:,:,3]>=128;mask=np.asarray(normalized[name])[:,:,3]>=128
 b=box(im);rb=box(ref);mb=box(normalized[name]);m0=box(normalized[baseline]);ratio=None
 if name in heads:ratio=((heads[name][1]-heads[name][0])/(b[3]-b[1]))/((heads['K0'][1]-heads['K0'][0])/(rb[3]-rb[1]))
 else:ratio=1.0 # Head attachment and opaque height unchanged in Method B.
 iou=float((mask&mask0).sum()/(mask|mask0).sum());reach=(mb[2]-m0[2])/196;de=delta(palette(ref),palette(im))
 rows.append({'candidate':name,'baseline':baseline,'iou':iou,'frontReachBodyFraction':reach,'paletteDeltaE00':de,'headRatioRelative':ratio,'footDriftPx':abs(box(normalized[name])[3]-box(normalized[baseline])[3]),'heightPx':mb[3]-mb[1],'numericPass':iou<=.75 and reach>=.12 and de<=8 and .92<=ratio<=1.08,'accepted':False})

sheet=Image.new('RGB',(1280,600),'#292538');draw=ImageDraw.Draw(sheet)
for i,name in enumerate(['K0','A1','A2','rigK0','B1','B2']):
 frame=normalized[name];bounds=box(frame);crop=frame.crop((max(0,bounds[0]-20),0,min(640,bounds[2]+20),256));x=(i%3)*426+(426-crop.width)//2;y=(i//3)*300
 sheet.paste(crop,(x,y+20),crop);draw.text(((i%3)*426+10,y+5),name+' | opaque196px',fill='white')
sheet.save(review/'method-comparison.jpg',quality=92)
# Timing experiment: two drawings, no attempt to pass a complete five-pose kit.
sheet=Image.new('RGB',(1280,1680),'#292538');draw=ImageDraw.Draw(sheet)
idle=normalized['K0'];strike=normalized['A2'];ids=[]
for row,method in enumerate(['cross-fade','hard-swap','swap-with-smear']):
 for col,t in enumerate([0,.1,.2,.3,.4,.5,.6,.7]):
  if method=='cross-fade':frame=Image.blend(idle,strike,float(np.clip((t-.2)/.2,0,1))) if t<.5 else Image.blend(strike,idle,float(np.clip((t-.5)/.2,0,1)))
  else:frame=(strike if .3<=t<.6 else idle).copy()
  if method=='swap-with-smear' and t==.3:
   # Experiment-only velocity-stretched original lantern pixels, not a shipped effect.
   smear=k0.crop((447,380,500,451)).resize((120,25),Image.Resampling.BILINEAR);frame.alpha_composite(smear,(330,130))
  frame=frame.crop((145,0,465,256))
  x=(col%4)*320;y=row*560+(col//4)*280
  sheet.paste(frame,(x,y),frame);draw.text((x+3,y+258),f'{method} {t:.1f}s |196px',fill='white')
sheet.save(review/'swap-comparison.jpg',quality=92)
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'fieldHeight':196,'method':'alpha>=128, common bottom-contact centroid, six Lab kmeans++ palettes(seed42), optimal one-to-one DeltaE00 matching; anatomical head landmarks recorded','headLandmarks':heads,'transforms':transforms,'rows':rows,'sheets':['reports/v3-feel/REVIEW/P1/method-comparison.jpg','reports/v3-feel/REVIEW/P1/swap-comparison.jpg'],'productionAccepted':False}
(out/'results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(rows))
