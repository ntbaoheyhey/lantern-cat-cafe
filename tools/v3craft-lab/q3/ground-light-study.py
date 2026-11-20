"""X21: source-relative versus fixed-direction edge, on original D7 GPU paint."""
from pathlib import Path
from PIL import Image,ImageFilter,ImageDraw
import numpy as np,json,datetime
p=Path('tools/v3craft-lab/q3/raw/D8-study');out=Path('tools/v3craft-lab/q3/raw/D8-light');out.mkdir(exist_ok=True)
def decode(x):return np.where(x<=.04045,x/12.92,((x+.055)/1.055)**2.4)
def encode(x):return np.where(x<=.0031308,x*12.92,1.055*np.maximum(0,x)**(1/2.4)-.055)
def blur(x,r):return np.asarray(Image.fromarray(np.uint8(np.clip(x,0,1)*255)).filter(ImageFilter.GaussianBlur(r)),dtype=float)/255
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
yy,xx=np.mgrid[:720,:1280];rows=[];sheet=Image.new('RGB',(1200,960),'#171526');d=ImageDraw.Draw(sheet)
for ri,ms in enumerate([0,225,350]):
 actor=np.asarray(Image.open(p/f'actor-{ms}.png'),dtype=float)/255;a=actor[:,:,3];paint=decode(actor[:,:,:3])/np.maximum(.001,a[:,:,None]);field=decode(np.asarray(Image.open(p/f'field-{ms}.png'),dtype=float)[:,:,:3]/255)
 ys,xs=np.nonzero(a>.8);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1;bw=x1-x0;bh=y1-y0
 face=(a>.8)&(xx>=x0+.27*bw)&(xx<x0+.71*bw)&(yy>=y0+.16*bh)&(yy<y0+.43*bh)
 protect=1-smooth(.65,1.2,np.hypot((xx-(x0+.49*bw))/(.44*bw*.65),(yy-(y0+.295*bh))/(.27*bh*.65)))
 edge=np.clip((a-blur(a,2))*2.8,0,1);gy,gx=np.gradient(blur(a,1.1));norm=np.maximum(.00001,np.hypot(gx,gy));nx=-gx/norm;ny=-gy/norm
 for ci,method in enumerate(['fixed-upper-right','point-at-ground-streak']):
  if ci==0:dx,dy=.87,-.5
  else:
   vx=400-xx;vy=558-yy;distance=np.maximum(.001,np.hypot(vx,vy));dx=vx/distance;dy=vy/distance
  rim=edge*np.maximum(0,nx*dx+ny*dy)*.8*(1-protect*.9)
  lit=paint*(1-rim[:,:,None]*.45)+decode(np.array([.737,.447,.929]))*rim[:,:,None]*.45
  comp=np.clip(lit,0,1)*a[:,:,None]+field*(1-a[:,:,None]);rgb=np.uint8(np.clip(encode(comp),0,1)*255+.5)
  Image.fromarray(rgb).save(out/f'{method}-{ms}.png');im=Image.fromarray(rgb).crop((180,315,455,605)).resize((280,295));sheet.paste(im,(ci*600,ri*320));d.text((ci*600+3,ri*320+299),f'{method} {ms}ms',fill='white')
  by=paint@np.array([.2126,.7152,.0722]);ly=lit@np.array([.2126,.7152,.0722]);metrics={}
  for name,mask in [('face',face),('body',a>.8)]:
   aa=ab=0
   for axis in [0,1]:
    da=np.roll(by,-1,axis)-by;db=np.roll(ly,-1,axis)-ly;sel=mask&np.roll(mask,-1,axis)&(np.abs(da)>.006)
    ca=da/np.maximum(.0001,np.roll(by,-1,axis)+by);cb=db/np.maximum(.0001,np.roll(ly,-1,axis)+ly);aa+=np.sum(ca[sel]**2);ab+=np.sum(ca[sel]*cb[sel])
   metrics[name]=float(ab/aa)
  rows.append({'ms':ms,'method':method,'rimPixelsAbove005':int((rim>.05).sum()),'rimWeightAboveFaceFraction':float(rim[yy<y0+.16*bh].sum()/rim.sum()),'rimWeightLowerBodyFraction':float(rim[yy>y0+.5*bh].sum()/rim.sum()),'normalizedContrast':metrics})
sheet.save(out/'methods.jpg',quality=94)
receipt={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Same composed alpha, protected face and0.8 edge strength; only direction changes. CPU linear-light method comparison on original moving GPU paint, no physical normal map or reference inputs.','rows':rows}
Path('tools/v3craft-lab/q3/ground-light-study.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
