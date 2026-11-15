"""D8 X19 method experiment, on our own GPU paint only. No reference inputs."""
from pathlib import Path
from PIL import Image,ImageFilter,ImageDraw
import numpy as np,json,datetime
p=Path('tools/v3craft-lab/q3/raw/D8-study');W,H=1280,720
def decode(x):return np.where(x<=.04045,x/12.92,((x+.055)/1.055)**2.4)
def encode(x):return np.where(x<=.0031308,x*12.92,1.055*np.maximum(0,x)**(1/2.4)-.055)
def blur(x,r):return np.asarray(Image.fromarray(np.uint8(np.clip(x,0,1)*255)).filter(ImageFilter.GaussianBlur(r)),dtype=float)/255
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
yy,xx=np.mgrid[:H,:W];rows=[];sheet=Image.new('RGB',(1200,990),'#171526');label=ImageDraw.Draw(sheet)
face_fraction=json.loads(Path('tools/v3craft-lab/q2/faces.json').read_text())['units']['soot']
for ri,ms in enumerate([0,225,350]):
 actor=np.array(Image.open(p/f'actor-{ms}.png')).astype(float)/255;a=actor[:,:,3];mask=a>.8
 base=np.array(Image.open(p/f'baseline-{ms}.png'))[:,:,:3].astype(float)/255
 field=decode(np.array(Image.open(p/f'field-{ms}.png'))[:,:,:3].astype(float)/255)
 # Linear RGB was blended over transparent black before the sRGB target conversion.
 paint=decode(actor[:,:,:3])/np.maximum(.001,a[:,:,None]);paint=np.clip(paint,0,1)
 ys,xs=np.nonzero(mask);x0,x1,y0,y1=int(xs.min()),int(xs.max()+1),int(ys.min()),int(ys.max()+1)
 foot_profile=(a>0.5)[y1-8:y1].sum(axis=0);runs=[];run=[]
 for x in range(W):
  if foot_profile[x]>0:run.append(x)
  elif run:runs.append(run);run=[]
 if run:runs.append(run)
 feet=[float(np.average(run,weights=foot_profile[run])) for run in runs if len(run)>2]
 if len(feet)!=2:raise RuntimeError(f'Expected two painted foot patches: {feet}')
 ground=y1-1;cx=np.mean(feet);height=y1-y0
 fx,fy,fw,fh=face_fraction;face=mask&(xx>=x0+fx*(x1-x0))&(xx<x0+(fx+fw)*(x1-x0))&(yy>=y0+fy*height)&(yy<y0+(fy+fh)*height)
 edge=(a-blur(a,2.0)).clip(0,1)*2.8;gy,gx=np.gradient(blur(a,1.1));norm=np.maximum(.00001,np.hypot(gx,gy))
 # Light comes from upper right in screen coordinates, shadow goes lower left.
 facing=np.maximum(0,(-gx*.87+gy*.5)/norm);rim=(edge*facing).clip(0,1)
 face_cx=x0+(fx+fw/2)*(x1-x0);face_cy=y0+(fy+fh/2)*height
 protect=1-smooth(.65,1.2,np.hypot((xx-face_cx)/(fw*(x1-x0)*.65),(yy-face_cy)/(fh*height*.65)))
 projected=np.zeros((H,W));sy,sx=np.nonzero(a>.001);h=ground-sy
 tx=np.clip(np.rint(sx-h*.19).astype(int),0,W-1);ty=np.clip(np.rint(ground-h*.14).astype(int),0,H-1)
 np.maximum.at(projected,(ty,tx),a[sy,sx]);projected=blur(projected,2.3)*.28
 contacts=np.maximum.reduce([np.exp(-(((xx-f)/11)**2+((yy-ground)/3.2)**2))*0.48 for f in feet])
 for ci,method in enumerate(['unlit','ellipse-and-wash','contact-projection-and-rim']):
  shadow=np.zeros((H,W));lit=paint.copy()
  if method=='ellipse-and-wash':
   shadow=np.exp(-(((xx-cx)/57)**2+((yy-ground-4)/11)**2))*.35
   lit=paint+decode(np.array([.72,.35,.95]))*.26
  elif method=='contact-projection-and-rim':
   shadow=1-(1-projected)*(1-contacts)
   bounce=(1-smooth(ground-90,ground-5,yy))*.025+smooth(ground-90,ground-5,yy)*.08
   lit=paint*(1+bounce[:,:,None]*np.array([.9,.15,-.4]))
   strength=.08 if ms==0 else .22 if ms==225 else .65
   amount=rim*strength*(1-protect*.9)
   lit=lit*(1-amount[:,:,None]*.45)+decode(np.array([.81,.54,1.]))*amount[:,:,None]*.45
  shadow_colour=decode(np.array([.11,.08,.14]));ground_rgb=field*(1-shadow[:,:,None])+shadow_colour*shadow[:,:,None]
  comp=np.clip(lit,0,1)*a[:,:,None]+ground_rgb*(1-a[:,:,None]);rgb=np.uint8(np.clip(encode(comp),0,1)*255+.5)
  Image.fromarray(rgb).save(p/f'{method}-{ms}.png')
  im=Image.fromarray(rgb).crop((180,320,450,610)).resize((280,301),Image.Resampling.LANCZOS)
  sheet.paste(im,(ci*400,ri*330));label.text((ci*400+3,ri*330+304),f'{method} / {ms}ms',fill='white')
  original=decode(base);Y=lambda z:z@np.array([.2126,.7152,.0722]);ybase=Y(original);ynow=Y(comp)
  metrics={}
  for region,selection in [('face',face),('body',mask)]:
   aa=ab=nn=0.;count=0
   for axis in [0,1]:
    valid=selection&np.roll(selection,-1,axis);da=np.roll(ybase,-1,axis)-ybase;db=np.roll(ynow,-1,axis)-ynow
    valid&=np.abs(da)>.006;av=da[valid];bv=db[valid];aa+=np.sum(av*av);ab+=np.sum(av*bv);count+=len(av)
    na=da/np.maximum(.01,(np.roll(ybase,-1,axis)+ybase)*.5);nb=db/np.maximum(.01,(np.roll(ynow,-1,axis)+ynow)*.5)
    nn+=np.sum(na[valid]*nb[valid]);
   den=0
   for axis in [0,1]:
    da=np.roll(ybase,-1,axis)-ybase;valid=selection&np.roll(selection,-1,axis)&(np.abs(da)>.006)
    na=da/np.maximum(.01,(np.roll(ybase,-1,axis)+ybase)*.5);den+=np.sum(na[valid]**2)
   metrics[region]={'gradientRetention':float(ab/aa),'normalizedContrastRetention':float(nn/den),'pixels':int(selection.sum()),'edges':count}
  outside=(np.abs(rgb.astype(int)-np.uint8(base*255+.5)).max(axis=2)>2)&~((xx>=175)&(xx<=450)&(yy>=300)&(yy<=580))
  rows.append({'ms':ms,'method':method,'feetX':feet,'groundY':ground,'shadowAlphaAtFeet':[float(shadow[ground,round(f)]) for f in feet],'shadowPixels':int((shadow>.03).sum()),'rimPixels':int((rim>.1).sum()) if method=='contact-projection-and-rim' else 0,'outsideLocalChangedPixels':int(outside.sum()),'metrics':metrics})
sheet.save(p/'methods.jpg',quality=94)
receipt={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Original moving GPU paint, CPU linear-light compositing; actual two foot patches and alpha projection compared with one ellipse; signed adjacent-pixel gradients and local-mean normalized contrast. No physical light simulation or production timing claim.','rows':rows}
Path('tools/v3craft-lab/q3/ground-study.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))
