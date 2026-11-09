"""Original analytic VFX: two 8x8 atlases; each named row is eight time samples.
Seed20261109;128px cell;1024px atlas;premultiplied neutral RGB. No external images.
"""
from pathlib import Path
import numpy as np
from PIL import Image
import json,hashlib,sys
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
N=128;yy,xx=np.mgrid[-1:1:complex(N),-1:1:complex(N)];rng=np.random.default_rng(20261109)
rows=[['smoke','steam','flame','ember','sparkle','crumb','ribbon','mist'],['yarn','leaf','ink','tea','frost','petal','shard','pollen']]
def field(kind,t):
 x=xx;y=-yy;r=np.hypot(x,y);a=np.zeros_like(x);light=np.ones_like(x)*.8
 if kind in ['smoke','steam','mist']:
  for i in range(7):
   theta=i*2.399963+t*1.8;cx=np.cos(theta)*(.12+t*.2);cy=np.sin(theta)*(.1+t*.1)+(t-.5)*.25
   if kind=='steam':cx=np.sin(i*1.8+t*4)*.13;cy=(i-3)*.16+(t-.5)*.15
   if kind=='mist':cx=np.cos(theta)*(.3+t*.2);cy=np.sin(theta)*.12
   q=((x-cx)**2+(y-cy)**2)/(.10+t*.12)
   a+=np.exp(-q*2)*(.17+.04*np.sin(i*2.1));light+=np.exp(-q*4)*.08
  a*=.5+.5*np.sin(np.pi*(.08+t*.84));a*=np.clip(1-r,0,1)**.5
 elif kind=='flame':
  bend=x+.15*np.sin(y*5-t*5)*(.4+y*.35);width=np.maximum(.06,.39*(1-y*.7));q=(bend/width)**2+((y+.12)/.78)**2
  a=np.clip(1-q,0,1)**1.3;light=.4+.6*np.clip(1-q*2,0,1)
 elif kind=='ember':
  q=(x/.22)**2+(y/.6)**2;a=np.exp(-q*3);light=np.exp(-q*2)*.8+.2
 elif kind in ['sparkle','pollen']:
  ray=np.exp(-np.abs(x)*35-np.abs(y)*3)+np.exp(-np.abs(y)*35-np.abs(x)*3)
  a=np.clip(ray+np.exp(-r*r*65),0,1)*(.65+.35*np.sin(np.pi*t));light=np.ones_like(x)
 elif kind=='crumb':
  for i in range(8):
   theta=i*2.399963;rad=.13+t*.62;cx=np.cos(theta)*rad;cy=np.sin(theta)*rad
   a=np.maximum(a,np.clip(1-np.maximum(np.abs(x-cx),np.abs(y-cy))/.085,0,1));
  a*=1-t*.65
 elif kind=='ribbon':
  curve=.25*np.sin(x*3+t*3);a=np.exp(-((y-curve)/.10)**2)*np.clip(1-x*x,0,1);light=.5+.5*np.exp(-((y-curve)/.035)**2)
 elif kind=='yarn':
  for i in [-1,0,1]:a=np.maximum(a,np.exp(-((y-.22*np.sin(x*5+t*4)-i*.1)/.018)**2)*np.clip(1-x*x,0,1))
 elif kind in ['leaf','petal']:
  angle=t*.7;u=x*np.cos(angle)+y*np.sin(angle);v=y*np.cos(angle)-x*np.sin(angle)
  a=np.clip(1-(u/.30)**2-(v/.72)**2,0,1)**.25;light=.5+.35*(u+.3)/.6+.15*np.exp(-u*u*700)
 elif kind=='ink':
  a=np.exp(-r*r*7)
  for i in range(9):
   theta=i*2.399963;d=.18+t*.5;cx=np.cos(theta)*d;cy=np.sin(theta)*d
   a=np.maximum(a,np.exp(-((x-cx)**2+(y-cy)**2)/(0.006+i*.001)))
  a*=np.clip(1-r,0,1)**.3
 elif kind=='tea':
  width=np.maximum(.08,.30*(1-y*.75));q=(x/width)**2+((y+.05)/.62)**2;a=np.clip(1-q,0,1)**.3;light=.4+.5*np.exp(-((x+.1)**2+(y-.1)**2)*35)
 elif kind in ['frost','shard']:
  q=np.abs(x)/.34+np.abs(y)/.78;a=np.clip((1-q)*8,0,1);light=.4+.5*(x>0)+.1*(y>0)
 edge=np.clip((1-np.maximum(np.abs(x),np.abs(y)))*14,0,1);a=np.clip(a*edge,0,1);light=np.clip(light,0,1)
 return np.uint8(np.dstack([light*a,light*a,light*a,a])*255)
meta=[]
for name,kinds in zip(['v5-soft','v5-motifs'],rows):
 atlas=Image.new('RGBA',(1024,1024))
 for row,kind in enumerate(kinds):
  for frame in range(8):atlas.paste(Image.fromarray(field(kind,frame/7)),(frame*N,row*N))
 p=out/(name+'.webp');atlas.save(p,format='WEBP',lossless=True,method=6,exact=True)
 meta.append({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'rows':kinds,'columns':8,'cell':128,'seed':20261109})
(out/'atlases.json').write_text(json.dumps(meta,indent=2));print(json.dumps(meta))
