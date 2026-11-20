"""A1 authoring drill, not a runtime/film acceptance claim. See LEARN/A1.md."""
from pathlib import Path
import json,datetime
import numpy as np
from PIL import Image,ImageDraw
from skimage.color import rgb2lab,lab2rgb,deltaE_ciede2000
from scipy.ndimage import binary_dilation,map_coordinates
P=Path('tools/v3craft-lab/v4-hybrid');O=Path('reports/v4-art/REVIEW/A1');raw=P/'raw';raw.mkdir(exist_ok=True)
B=Path('apps/web/public/units/soot/poses'); art={k:Image.open(B/(k+'.webp')).convert('RGBA') for k in ['K0','K1','K2']}
meta=json.loads(Path('tools/v3craft-lab/p2/pose-art.json').read_text());tr=meta['transforms']['K2-A4'];src=Path('tools/v3craft-lab/poses/raw/soot/K2-A4.png')
original=Image.open(src).convert('RGBA');a=np.array(original);keep=binary_dilation(a[:,:,3]>=160,iterations=2);a[:,:,3]=np.where(keep&(a[:,:,3]>=4),a[:,:,3],0);original=Image.fromarray(a)
ref=np.array(art['K0']);rm=ref[:,:,3]>=128;rl=rgb2lab(ref[:,:,:3]/255)
a=np.array(original);mask=a[:,:,3]>=128;lab=rgb2lab(a[:,:,:3]/255)
mean=lab+(rl[rm].mean(0)-lab[mask].mean(0))
hist=lab.copy()
for c in range(3):
 v,n=np.unique(lab[:,:,c][mask],return_counts=True);rv,rn=np.unique(rl[:,:,c][rm],return_counts=True)
 q=np.cumsum(n)/n.sum();rq=np.cumsum(rn)/rn.sum();hist[:,:,c]=np.interp(lab[:,:,c],v,np.interp(q,rq,rv))
def rgba(x):return Image.fromarray(np.dstack((np.rint(np.clip(lab2rgb(x),0,1)*255).astype('uint8'),a[:,:,3])))
def normalize(im):
 scaled=im.resize(tuple(round(n*tr['scale']) for n in im.size),Image.Resampling.LANCZOS);target=Image.new('RGBA',art['K0'].size);target.alpha_composite(scaled,tuple(tr['offset']));return target
def bbox(im):
 y,x=np.where(np.array(im)[:,:,3]>=128);return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
colours={'None':normalize(original),'Lab mean':normalize(rgba(mean)),'Lab histogram':normalize(rgba(hist)),'Existing RGB histogram':art['K2']}
metrics=[]
for name,im in colours.items():
 x=np.array(im);m=x[:,:,3]>=128;l=rgb2lab(x[:,:,:3]/255);delta=l[m].mean(0)-rl[rm].mean(0)
 metrics.append({'method':name,'meanLabDeltaE76':float(np.linalg.norm(delta)),'meanLabDeltaE00':float(deltaE_ciede2000(l[m].mean(0),rl[rm].mean(0))),'alphaIdenticalToNoMatch':bool(np.array_equal(x[:,:,3],np.array(colours['None'])[:,:,3])),'opaqueBounds':bbox(im),'source':str(src)})
 im.save(raw/(name.replace(' ','-')+'.png'))
# All panels preserve a common foot anchor and .30vh=216px opaque height.
scale=216/(meta['baseBounds'][3]-meta['baseBounds'][1]);baseline=meta['baseFoot']
def panel(im,label,shift=0,smear=False):
 canvas=Image.new('RGBA',(512,284),'#242335');draw=ImageDraw.Draw(canvas);draw.line((16,258,496,258),fill='#645961');draw.text((15,8),label,fill='white')
 view=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
 if smear:
  # One painting, directional stretch; preserve foot origin; no double face overlay.
  view=view.resize((round(view.width*1.12),view.height),Image.Resampling.BICUBIC)
 x=round(210-baseline[0]*scale*(1.12 if smear else 1)+shift);y=round(258-baseline[1]*scale)
 canvas.alpha_composite(view,(x,y));return canvas.convert('RGB')
def sheet(panels,path):
 s=Image.new('RGB',(1024,568),'#242335')
 for i,p in enumerate(panels):s.paste(p,((i%2)*512,(i//2)*284))
 s.save(path,quality=92)
sheet([panel(im,f'{n} | mean Lab dE {metrics[i]["meanLabDeltaE76"]:.2f}') for i,(n,im) in enumerate(colours.items())],O/'colour-methods.jpg')
# First K0->K1 key change, then K1->smear->K2; contact motion is an explicit
# concept recoil envelope, not a readback of production DrawingLayer.
def frame(t,smear,stop):
 key='K0' if t<50 or t>=560 else 'K1' if t<330 else 'K2';is_smear=smear and 270<=t<330
 im=art['K2' if is_smear else key];age=max(0,t-350-stop);u=min(1,age/max(1,210-stop));shift= -7*(u*u*(3-2*u)) if 350<=t<560 else 0
 return im,shift,is_smear,key
timing=[]
for smear in [False,True]:
 for stop in [0,60,90]:
  samples=[];panels=[]
  for t in [250,300,350,420]:
   im,shift,sm,k=frame(t,smear,stop);panels.append(panel(im,f'{t}ms {k} | smear={smear} hold={stop}ms',shift,sm));samples.append({'ms':t,'key':k,'smear':sm,'conceptRecoilPx':shift})
  name=f'smear-{int(smear)}-hold-{stop}';sheet(panels,O/(name+'.jpg'))
  # Tiny playback preview retained local, no sprite/film acceptance from it.
  anim=[]
  for t in np.arange(0,800,1000/30):
   im,shift,sm,k=frame(t,smear,stop);anim.append(panel(im,f'{t:.0f}ms | {name}',shift,sm))
  if not (raw/(name+'.gif')).exists():anim[0].save(raw/(name+'.gif'),save_all=True,append_images=anim[1:],duration=33,loop=0)
  timing.append({'smear':smear,'holdMs':stop,'samples':samples,'contactHoldFrames30fps':int(sum(350<=t<350+stop for t in np.arange(0,800,1000/30))),'endMs':800,'sheet':str(O/(name+'.jpg'))})
# Review rejected the full-face stretch. Try a masked inverse warp of the same
# drawing that protects the face rectangle and the last40 source pixels of feet.
manifest=json.loads((B/'manifest.json').read_text());fx,fy,fw,fh=manifest['poses']['K2']['face'];yy,xx=np.indices((640,640),dtype=float)
dist=np.maximum(abs(xx-fx-fw/2)/(fw/2+8),abs(yy-fy-fh/2)/(fh/2+8))
guard=np.clip((dist-1)*3,0,1)*np.clip((baseline[1]-yy)/40,0,1)
dx=.12*(xx-baseline[0])*guard;pixels=np.array(art['K2']);warped=np.stack([map_coordinates(pixels[:,:,c],[yy,xx-dx],order=1,mode='constant') for c in range(4)],axis=-1).astype('uint8');guarded=Image.fromarray(warped)
sheet([panel(art['K1'],'250ms K1'),panel(guarded,'300ms guarded K2 smear'),panel(art['K2'],'350ms K2 contact'),panel(art['K2'],'420ms K2 held90ms')],O/'smear-guarded.jpg')
face=(xx>=fx)&(xx<fx+fw)&(yy>=fy)&(yy<fy+fh);feet=yy>=baseline[1]
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Offline authoring experiment on approved Soot art, no runtime/film claim','sources':[str(B/(k+'.webp')) for k in art]+[str(src)],'opaqueHeightPx':216,'colour':metrics,'timing':timing,'guardedSmear':{'faceMaxPixelDifference':int(np.abs(warped.astype(int)-pixels.astype(int))[face].max()),'footMaxDisplacementPx':float(abs(dx[feet]).max()),'sheet':str(O/'smear-guarded.jpg')}}
(P/'results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'colour':metrics,'variants':len(timing),'sheets':7}))
