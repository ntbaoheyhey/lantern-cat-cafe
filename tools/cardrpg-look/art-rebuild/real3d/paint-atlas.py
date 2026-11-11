"""Original, seam-safe palette/iris atlas; no external art input."""
from pathlib import Path
import argparse, math, random
from PIL import Image,ImageDraw
p=argparse.ArgumentParser();p.add_argument('--out',required=True);a=p.parse_args()
rng=random.Random(11012026)
colors=['#f2d8af','#ffebca','#cf846d','#28494b','#945b39','#d5a34e','#8b4d27','#392923','#25857b','#fff2d4','#d27c64','#ffe6a0','#c99f64','#bc8350','#1b3233','#eee0c8']
im=Image.new('RGB',(1024,1024));d=ImageDraw.Draw(im)
for i,color in enumerate(colors):
 x=(i%4)*256;y=(i//4)*256
 d.rectangle((x,y,x+255,y+255),fill=color)
 if i in (0,1):
  for k in range(350):
   u=rng.randrange(x+12,x+242);v=rng.randrange(y+12,y+242)
   d.line((u,v,u+rng.randrange(-3,4),v+rng.randrange(2,8)),fill='#f8dfb9' if i==0 else '#f7e2c0',width=1)
 if i==3:
  for q in range(12,244,4):
   d.line((x+12,y+q,x+244,y+q),fill='#2b4c4e')
   d.line((x+q,y+12,x+q,y+244),fill='#29484a')
 if i in (4,6):
  for k in range(50):
   u=x+rng.randrange(10,246);v=y+rng.randrange(10,220)
   d.line((u,v,u+rng.randrange(-3,4),v+rng.randrange(10,32)),fill='#a36536' if i==6 else '#a16841',width=1)
 if i==8:
  for j in range(128,0,-1):
   t=j/128; col=(int(26+25*(1-t)),int(81+78*(1-t)),int(76+65*(1-t)))
   d.ellipse((x+128-j,y+128-j,x+128+j,y+128+j),fill=col)
  for k in range(150):
   th=k*math.tau/150;r0=rng.randrange(53,75);r1=rng.randrange(97,119)
   d.line((x+128+math.cos(th)*r0,y+128+math.sin(th)*r0,x+128+math.cos(th)*r1,y+128+math.sin(th)*r1),fill=rng.choice(['#397f72','#43998a','#26695f']),width=1)
  d.ellipse((x+91,y+51,x+165,y+205),fill='#132f30')
Path(a.out).parent.mkdir(parents=True,exist_ok=True);im.save(a.out)
print(a.out)
# Repack for a 512px face projection from our saved original turnaround.
# Remove painted facial features: eyes/nose/mouth are independent volume meshes.
import numpy as np,cv2
source=Path(a.out).parent/'turnaround-v1.png'
old=im.copy();new=Image.new('RGB',(1024,1024),'#f2d8af')
for i in range(16):
 patch=old.crop(((i%4)*256,(i//4)*256,(i%4+1)*256,(i//4+1)*256))
 if i==8:rect=(512,0,256)
 elif i==6:rect=(768,0,256)
 elif i==3:rect=(512,256,512)
 else:rect=((i%4)*128,512+(i//4)*128,128)
 x,y,size=rect;new.paste(patch.resize((size,size),Image.Resampling.LANCZOS),(x,y))
if source.exists():
 face=Image.open(source).convert('RGB').crop((110,115,500,348))
 arr=np.array(face);mask=np.zeros(arr.shape[:2],np.uint8)
 for cx,cy,rx,ry in [(137,115,68,67),(255,118,66,65),(210,161,45,26)]:cv2.ellipse(mask,(cx,cy),(rx,ry),0,0,360,255,-1)
 arr=cv2.inpaint(arr,mask,7,cv2.INPAINT_TELEA)
 # Feather perimeter to the body palette, giving a quiet seam behind the cheeks.
 yy,xx=np.mgrid[:arr.shape[0],:arr.shape[1]];edge=np.minimum(xx,arr.shape[1]-1-xx)/30
 fade=np.clip(edge,0,1)[...,None];arr=(arr*fade+np.array([242,216,175])*(1-fade)).astype(np.uint8)
 # Unwrap a continuous front-to-back fur field, with no seam across the face.
 yy,xx=np.mgrid[:512,:512];z=.50+(1-yy/511)*.35;theta=xx/511*math.tau
 radii=np.interp(z,[.495,.515,.56,.63,.71,.785,.83,.844],[.035,.16,.247,.271,.249,.196,.115,.016])
 px=np.clip(((radii*np.cos(theta)+.28)/.56*(arr.shape[1]-1)),0,arr.shape[1]-1).astype(np.float32)
 py=np.clip((1-(z-.50)/.35)*(arr.shape[0]-1),0,arr.shape[0]-1).astype(np.float32)
 sampled=cv2.remap(arr,px,py,cv2.INTER_LINEAR)
 w=np.clip(-np.sin(theta),0,1)**2
 w*=np.clip((.83-z)/.07,0,1)
 base=np.array([242,216,175]);unwrapped=(sampled*w[...,None]+base*(1-w[...,None])).astype(np.uint8)
 new.paste(Image.fromarray(unwrapped),(0,0))
new.save(a.out)
