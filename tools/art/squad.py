#!/usr/bin/env python3
"""Original squad pixel art. No input images, models or network; exact geometry below.
Run --guardian first for the real-size art study; run without it for the full roster.
Palette: Evening Atelier. Seed: 0. Light: upper left. Binary alpha. Native integer pixels.
"""
import sys, math, json, hashlib
from pathlib import Path
from pipeline import Image, encode_png

ROOT = Path(__file__).resolve().parents[2]
P = json.loads((ROOT/'tools/art/visual-palette.json').read_text())
RGBA = {k: bytes.fromhex(v[1:])+b'\xff' for k,v in P.items()}
CHECK = '--check' in sys.argv
ONLY = '--guardian' in sys.argv
OUT = ROOT/'apps/web/public/art/squad'
OUT.mkdir(parents=True, exist_ok=True)
FILES = []

class Canvas:
 def __init__(self,w,h): self.w=w; self.h=h; self.p=[None]*(w*h)
 def dot(self,x,y,c):
  x,y=int(x),int(y)
  if 0<=x<self.w and 0<=y<self.h: self.p[y*self.w+x]=c
 def rect(self,x,y,w,h,c):
  for yy in range(int(y),int(y+h)):
   for xx in range(int(x),int(x+w)): self.dot(xx,yy,c)
 def line(self,x,y,a,b,c,width=1):
  n=max(abs(a-x),abs(b-y),1)
  for i in range(n+1): self.rect(round(x+(a-x)*i/n),round(y+(b-y)*i/n),width,width,c)
 def oval(self,x,y,rx,ry,c):
  for yy in range(y-ry,y+ry+1):
   for xx in range(x-rx,x+rx+1):
    if ((xx-x)/max(1,rx))**2+((yy-y)/max(1,ry))**2<=1: self.dot(xx,yy,c)
 def poly(self,pts,c):
  for y in range(min(p[1] for p in pts),max(p[1] for p in pts)+1):
   for x in range(min(p[0] for p in pts),max(p[0] for p in pts)+1):
    inside=False
    for i,(a,b) in enumerate(pts):
     d,e=pts[i-1]
     if (b>y)!=(e>y) and x<(d-a)*(y-b)/(e-b)+a: inside=not inside
    if inside: self.dot(x,y,c)
 def edge(self):
  old=self.p[:]
  for y in range(self.h):
   for x in range(self.w):
    if old[y*self.w+x] is None and any(0<=a<self.w and 0<=b<self.h and old[b*self.w+a] for a,b in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]): self.dot(x,y,'ink')
 def blit(self,src,x,y,scale=1):
  for yy in range(src.h):
   for xx in range(src.w):
    c=src.p[yy*src.w+xx]
    if c: self.rect(x+xx*scale,y+yy*scale,scale,scale,c)
 def png(self): return encode_png(Image(self.w,self.h,b''.join(RGBA[c] if c else b'\0'*4 for c in self.p)))

def save(path,c,params):
 data=c.png(); p=ROOT/path
 if CHECK: assert p.read_bytes()==data, 'Art drift: '+path
 else: p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
 FILES.append({'file':path,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'params':params})

POSES=['idle','move','basic','cast1','cast2','ultimate','hit','defeat','victory']
def paw(c,x,y,col='cream'):
 c.oval(x,y,4,3,col); c.line(x-2,y+2,x-2,y+3,'copper');c.line(x+1,y+2,x+1,y+3,'copper')
def eyes(c,x,y,pose,f):
 if pose in ['hit','defeat']:
  c.line(x,y,x+3,y+3,'ink');c.line(x+3,y,x,y+3,'ink');c.line(x+10,y,x+13,y+3,'ink')
 elif (pose=='idle' and f==4) or pose=='victory':
  c.line(x,y+2,x+3,y,'ink');c.line(x+10,y+2,x+13,y,'ink')
 else:
  c.rect(x,y,4,5,'ink');c.rect(x+10,y,4,5,'ink');c.dot(x,y,'paper');c.dot(x+10,y,'paper')
 c.rect(x+6,y+5,3,2,'rose');c.line(x+7,y+7,x+4,y+8,'rust');c.line(x+7,y+7,x+10,y+8,'rust')
 c.line(x-6,y+5,x-1,y+6,'cream');c.line(x+14,y+5,x+19,y+4,'cream')
def hero(kind,pose,f):
 c=Canvas(80,80)
 wave=[0,-1,-2,-1,0,1][f]; stride=[-3,-1,2,3,1,-2][f] if pose=='move' else 0
 thrust=[-3,-5,-1,8,5,0][f] if pose in ['basic','cast1'] else 0
 recoil=[-3,-5,-3,-1,0,0][f] if pose=='hit' else 0
 x=35+thrust//2+recoil; y=40+(wave if pose in ['idle','move'] else 0)
 low,fur,hi=('rust','fur','cream') if kind=='guardian' else ('night','slate','mist') if kind=='witch' else ('copper','cream','paper')
 cloth,trim=('teal','gold') if kind=='guardian' else ('plum','epic') if kind=='witch' else ('moss','sage')
 # Tail is articulated behind the body, with a bright upper edge and dark tip.
 c.line(x-12,y+20,x-24,y+15,low,5);c.line(x-24,y+15,x-24,y+6,fur,4);c.rect(x-24,y+5,4,3,hi)
 # Cape, apron, shoulder and seams; the split hem changes in motion.
 flare=5 if pose=='ultimate' else abs(stride)
 c.poly([(x-11,y-2),(x+12,y-2),(x+16+flare,y+26),(x+4,y+23),(x-15-flare,y+28)],cloth)
 c.poly([(x-11,y-2),(x-5,y+2),(x-8,y+23),(x-15-flare,y+28)],'blue' if kind=='guardian' else 'wine' if kind=='witch' else 'leaf')
 c.line(x-10,y+2,x-11,y+23,trim);c.line(x-10,y+24,x-17-flare,y+27,trim)
 c.oval(x+1,y+11,12,15,cloth);c.rect(x-5,y+5,15,17,'slate' if kind=='guardian' else cloth)
 c.line(x-4,y+6,x+8,y+6,trim);c.line(x+9,y+6,x+9,y+18,trim)
 c.rect(x-7,y+19,22,4,'wood');c.rect(x+1,y+19,5,4,trim);c.rect(x+2,y+20,3,2,'ink')
 if kind=='guardian':
  c.rect(x-4,y+8,12,2,'mist');c.rect(x-4,y+12,12,2,'blue');c.line(x-3,y+14,x+3,y+17,'gold')
 elif kind=='witch':
  c.poly([(x-4,y+5),(x+8,y+5),(x+5,y+17)],'epic');c.dot(x+3,y+10,'paper');c.rect(x+10,y+17,5,8,'gold')
 else:
  c.rect(x-4,y+8,14,13,'sage');c.rect(x-1,y+13,8,7,'leaf');c.line(x+3,y+14,x+3,y+19,'paper');c.line(x,y+16,x+6,y+16,'paper')
  for dx,col in [(-9,'aqua'),(12,'gold')]: c.rect(x+dx,y+19,5,8,col);c.rect(x+dx+1,y+16,3,4,'wood')
 # Two boots and knees; feet share the exported y=72 contact anchor.
 for dx,dy in [(-6,stride),(8,-stride)]:
  c.rect(x+dx-4,y+24,8,7+dy,'wood');c.rect(x+dx-5,y+28+dy,10,4,cloth);c.rect(x+dx-3,y+29+dy,9,2,trim)
 # Broad cat face, triangular ears, muzzle and individual fur tufts.
 c.poly([(x-15,y-14),(x-14,y-32),(x-4,y-25),(x+9,y-26),(x+16,y-32),(x+18,y-13)],low)
 c.poly([(x-13,y-17),(x-12,y-29),(x-5,y-24),(x+9,y-24),(x+14,y-29),(x+16,y-15)],fur)
 c.poly([(x-11,y-26),(x-10,y-19),(x-6,y-23)],'rose');c.poly([(x+11,y-23),(x+14,y-27),(x+14,y-19)],'rose')
 c.oval(x+1,y-13,17,13,fur);c.oval(x+6,y-8,10,7,hi);c.oval(x-7,y-15,7,7,hi)
 c.poly([(x-15,y-10),(x-20,y-6),(x-13,y-5),(x-15,y),(x-8,y-2)],fur)
 c.line(x-13,y-16,x-8,y-20,hi);c.line(x-4,y-24,x-2,y-19,low);c.line(x+1,y-25,x+1,y-20,low)
 eyes(c,x-4,y-15,pose,f)
 c.rect(x-9,y-1,23,4,cloth);c.rect(x+1,y,5,4,trim);c.dot(x+3,y+1,'paper')
 if kind=='guardian':
  # Copper ear guards and a tiny crest leave the cat silhouette readable.
  c.rect(x-16,y-17,3,12,'teal');c.line(x-15,y-18,x-15,y-8,'gold')
  c.poly([(x-10,y-23),(x-5,y-29),(x+6,y-29),(x+13,y-23)],'teal');c.line(x-7,y-25,x+10,y-25,'gold')
  raise_arm=pose in ['ultimate','cast2','victory']
  sx=x-8+(thrust if pose=='cast1' else 0); sy=y+10-(12 if raise_arm else 0)
  c.poly([(sx-13,sy-10),(sx+7,sy-10),(sx+9,sy+5),(sx-2,sy+18),(sx-14,sy+5)],'gold')
  c.poly([(sx-11,sy-8),(sx+5,sy-8),(sx+6,sy+4),(sx-2,sy+14),(sx-11,sy+4)],'teal')
  c.line(sx-10,sy-7,sx+4,sy-7,'cream');c.line(sx-9,sy-5,sx-9,sy+3,'aqua')
  c.oval(sx-2,sy+3,4,3,'gold');c.dot(sx-6,sy-2,'gold');c.dot(sx-2,sy-4,'gold');c.dot(sx+2,sy-2,'gold')
  hx=min(56,x+20+thrust);hy=y+10-(14 if raise_arm else 0);paw(c,hx,hy,fur)
  if pose=='basic' and f in [2,3,4]:
   c.line(hx,hy,hx+19,hy-4,'mist',3);c.line(hx+2,hy,hx+19,hy-5,'paper');c.line(hx+1,hy-4,hx+3,hy+4,'gold',2)
  else:
   c.line(hx,hy+3,hx+5,hy-22,'mist',3);c.line(hx+1,hy-2,hx+6,hy-24,'paper');c.line(hx-4,hy-1,hx+8,hy-1,'gold',2);c.rect(hx,hy+2,3,7,'wood')
 elif kind=='witch':
  # Bent felt cap and hanging lantern have asymmetric silhouettes.
  c.poly([(x-19,y-22),(x-8,y-30),(x-2,y-35),(x+9,y-36),(x+6,y-30),(x+19,y-22)],'plum')
  c.poly([(x-15,y-23),(x-6,y-30),(x-1,y-33),(x+3,y-35),(x,y-28)],'epic');c.rect(x-17,y-23,34,3,'wine')
  c.rect(x-5,y-27,14,3,'gold');c.rect(x+2,y-28,4,5,'cream')
  hx=min(56,x+22+thrust);hy=y+10-(13 if pose in ['cast2','ultimate','victory'] else 0)
  c.line(hx,hy+20,hx+3,hy-31,'woodLight',3);c.line(hx+1,hy+18,hx+4,hy-29,'gold')
  c.line(hx+3,hy-31,hx+11,hy-31,'gold',2);c.line(hx+11,hy-31,hx+11,hy-24,'gold')
  c.rect(hx+6,hy-24,11,14,'wine');c.rect(hx+7,hy-23,9,11,'gold');c.rect(hx+9,hy-22,4,9,'cream');c.rect(hx+5,hy-25,13,2,'copper');c.rect(hx+5,hy-11,13,2,'copper')
  paw(c,hx,hy,fur);paw(c,x-17-thrust//2,y+9-wave,fur)
 else:
  # Leaf hood, stitched apron and two distinctly colored glass bottles.
  c.line(x-16,y-20,x-11,y-29,'moss',3);c.line(x-10,y-29,x+10,y-29,'sage',3)
  c.poly([(x+4,y-28),(x+10,y-36),(x+17,y-35),(x+11,y-28)],'sage');c.line(x+7,y-30,x+14,y-34,'paper')
  hx=x+21+thrust;hy=y+7-(14 if pose in ['cast1','cast2','ultimate','victory'] and f<3 else 0)
  paw(c,hx,hy,fur);c.rect(hx-1,hy-7,4,7,'mist');c.oval(hx+1,hy-10,6,6,'aqua' if pose=='basic' else 'paper' if pose=='cast1' else 'sage')
  c.rect(hx-1,hy-18,4,4,'copper');c.line(hx-2,hy-12,hx-2,hy-8,'paper')
  paw(c,x-15,y+12,fur)
 c.edge()
 if pose=='defeat' and f>=3:
  fallen=Canvas(80,80)
  for yy in range(c.h):
   for xx in range(c.w):
    col=c.p[yy*c.w+xx]
    if col: fallen.dot(78-yy,42+xx//3,col)
  c=fallen
 return c

def validate_frame(c,name):
 assert not any(c.p[x] or c.p[(c.h-1)*c.w+x] for x in range(c.w)), 'Vertical frame clipping: '+name
 assert not any(c.p[y*c.w] or c.p[y*c.w+c.w-1] for y in range(c.h)), 'Horizontal frame clipping: '+name
 assert all(p is None or p in P for p in c.p), 'Palette drift: '+name

def hero_sheet(kind):
 sheet=Canvas(80*6,80*len(POSES)); strip=Canvas(80*9,160)
 for r,pose in enumerate(POSES):
  for f in range(6):
   frame=hero(kind,pose,f);validate_frame(frame,f'{kind}/{pose}/{f}');sheet.blit(frame,f*80,r*80)
  strip.blit(hero(kind,pose,3),r*80,0)
  strip.blit(hero(kind,pose,0),r*80,80)
 save(f'apps/web/public/art/squad/{kind}.png',sheet,{'frame':[80,80],'frames':6,'poses':POSES,'foot':[40,72],'light':'upper-left'})
 save(f'reports/squad/art/{kind}-real-size.png',strip,{'scale':1,'columns':POSES,'rows':['contact','anticipation']})
 portrait=Canvas(64,64);portrait.blit(hero(kind,'idle',0),-8,-4)
 save(f'apps/web/public/art/squad/portrait-{kind}.png',portrait,{'source':'same original rig','frame':0,'crop':[-8,-4,64,64]})

hero_sheet('guardian')
if ONLY:
 print('Guardian study rendered at native display size. Judge reports/squad/art/guardian-real-size.png before extending roster.');sys.exit(0)

for kind in ['witch','alchemist']: hero_sheet(kind)

def monster(kind,pose,f):
 n=144 if kind=='yarn' else 72;c=Canvas(n,n)
 x=n//2+([0,0,0,-2,-1,0][f] if pose=='attack' else 0)
 y=n-21+([0,-1,-2,-1,0,1][f] if pose in ['idle','move'] else 0)
 if kind=='guard':
  c.rect(x-17,y-27,33,36,'wood');c.rect(x-15,y-25,28,31,'copper');c.rect(x-12,y-22,22,17,'gold')
  c.rect(x-16,y-37,32,13,'amber');c.rect(x-18,y-35,36,3,'cream');c.rect(x-13,y-31,25,3,'wood')
  c.line(x-13,y-21,x+11,y+4,'woodLight',2);c.rect(x-15,y+10,10,6,'wood');c.rect(x+6,y+10,10,6,'wood')
  c.oval(x-17,y,13,14,'gold');c.oval(x-18,y-1,10,11,'teal')
  for dx,dy in [(-3,-4),(3,-4),(-3,3),(3,3)]:c.oval(x-18+dx,y+dy,2,2,'gold')
  c.line(x+20,y+7,x+22,y-25,'mist',3);c.line(x+17,y-4,x+27,y-4,'gold',2)
 elif kind=='flanker':
  c.poly([(x-16,y+9),(x-15,y-20),(x-10,y-40),(x+12,y-40),(x+14,y-10),(x+25,y+1),(x+21,y+11)],'rose')
  c.poly([(x-13,y+6),(x-12,y-22),(x-6,y-37),(x+5,y-37),(x+7,y+6)],'cream')
  for yy in [-34,-27,-20]:c.rect(x-11,y+yy,23,4,'plum')
  c.oval(x+14,y+6,11,5,'wine');c.line(x-14,y+9,x+22,y+10,'lavender')
  c.poly([(x-10,y-39),(x-15,y-48),(x-3,y-42)],'rose');c.poly([(x+6,y-40),(x+14,y-47),(x+12,y-35)],'rose')
 elif kind=='ranger':
  spread=[0,2,5,2,0,-2][f]
  c.poly([(x-3,y-12),(x-27-spread,y-42),(x-29,y-13),(x-13,y+7)],'plum')
  c.poly([(x+3,y-12),(x+27+spread,y-42),(x+29,y-13),(x+13,y+7)],'wine')
  c.poly([(x-9,y-15),(x-24,y-35),(x-22,y-13),(x-12,y)],'epic');c.poly([(x+9,y-15),(x+24,y-35),(x+22,y-13),(x+12,y)],'rose')
  for dx in [-17,17]:c.oval(x+dx,y-18,4,6,'gold');c.oval(x+dx,y-18,2,3,'ink')
  c.oval(x,y-12,5,21,'cream');c.line(x-2,y-28,x-11,y-39,'gold');c.line(x+2,y-28,x+11,y-39,'gold')
  c.line(x-22,y+6,x+24,y-3,'mist',2);c.line(x-27,y+7,x-18,y+2,'paper',2)
 elif kind=='healer':
  c.oval(x,y+10,24,4,'mist');c.oval(x-1,y+8,22,3,'paper')
  c.oval(x+19,y-14,12,12,'gold');c.oval(x+19,y-14,7,7,'night')
  c.poly([(x-22,y-28),(x+18,y-28),(x+13,y+7),(x-13,y+7)],'aqua');c.poly([(x-20,y-27),(x+11,y-27),(x+8,y+3),(x-12,y+3)],'paper')
  c.oval(x-2,y-27,20,5,'gold');c.oval(x-2,y-28,17,3,'coffee');c.rect(x-7,y-13,10,13,'sage');c.rect(x-11,y-9,18,5,'sage')
  for dx in [-9,4]:c.line(x+dx,y-34,x+dx+3,y-40-wave(f),'mist');c.line(x+dx+3,y-40-wave(f),x+dx,y-45,'cream')
 elif kind=='charger':
  c.oval(x,y-9,20,17,'rust');c.oval(x-4,y-13,17,13,'coral')
  for dx in range(-15,18,5):c.line(x+dx,y-23,x+dx+4,y+3,'rose',2)
  c.oval(x-20,y-10,6,18,'wood');c.oval(x+20,y-10,6,18,'woodLight');c.line(x-23,y-25,x-23,y+4,'gold')
  c.poly([(x-21,y-22),(x-28,y-36),(x-13,y-28)],'cream');c.poly([(x-7,y-24),(x-10,y-40),(x+4,y-28)],'gold')
  for dx in [-13,15]:c.oval(x+dx,y+10,7,7,'slate');c.oval(x+dx,y+10,3,3,'gold')
 elif kind=='elite':
  c.line(x+17,y-25,x+30,y-26,'gold',4);c.line(x+30,y-26,x+28,y-4,'gold',4)
  c.oval(x,y-10,23,24,'slate');c.oval(x-4,y-14,19,20,'teal');c.oval(x-10,y-20,8,10,'mist')
  c.rect(x-23,y-34,45,5,'copper');c.oval(x,y-35,20,8,'mist');c.rect(x-4,y-47,8,7,'gold');c.rect(x-17,y-30,31,3,'gold')
  c.rect(x-13,y-17,26,9,'ink');c.rect(x-10,y-15,6,3,'danger');c.rect(x+5,y-15,6,3,'danger')
  c.rect(x-18,y+11,12,6,'wood');c.rect(x+7,y+11,12,6,'wood');c.line(x-28,y-14,x-27,y+8,'gold',4)
 elif kind=='thread':
  for dx,dy in [(0,0),(-7,-6),(8,-8),(0,-13)]:c.oval(x+dx,y+dy,12,6,'rose');c.oval(x+dx,y+dy,8,3,'night')
  c.line(x-15,y-9,x-26,y-30,'epic',2);c.line(x+13,y-7,x+25,y-29,'epic',2)
 elif kind=='dummy':
  c.rect(x-3,y-21,6,31,'wood');c.rect(x-18,y+10,36,5,'woodLight');c.oval(x,y-22,24,21,'copper');c.oval(x-3,y-25,20,16,'cream')
  c.line(x-17,y-29,x+12,y-16,'amber',2);c.line(x-13,y-13,x+13,y-35,'amber',2)
 elif kind=='yarn':
  # A 112px tall armoured yarn body with crossed strands and an exposed central knot.
  y=101+wave(f);x=72
  c.line(x+43,y+8,x+63,y+15,'wine',5);c.line(x+63,y+15,x+59,y-3,'rose',3)
  c.oval(x,y-25,51,49,'wine');c.oval(x-5,y-29,46,44,'rust');c.oval(x-13,y-37,37,33,'coral');c.oval(x-22,y-49,23,18,'rose')
  for d in range(-35,36,9):
   c.line(x-42,y-26+d//2,x+28,y-57+d,'wine',4);c.line(x-42,y-28+d//2,x+28,y-59+d,'rose',2)
   c.line(x-29+d,y-65,x-3+d,y+13,'rust',3);c.line(x-30+d,y-65,x-4+d,y+13,'coral')
  c.oval(x-39,y+19,15,9,'wine');c.oval(x+36,y+19,15,9,'wine');c.oval(x-42,y+16,12,6,'coral');c.oval(x+33,y+16,12,6,'coral')
  c.oval(x-50,y-14,12,17,'rust');c.oval(x+48,y-16,12,17,'rust');c.line(x-57,y-18,x-49,y-23,'rose',3)
  c.rect(x-23,y-35,14,10,'ink');c.rect(x+12,y-35,14,10,'ink');c.rect(x-21,y-33,9,5,'gold');c.rect(x+14,y-33,9,5,'gold')
  c.line(x-26,y-41,x-7,y-37,'wine',4);c.line(x+9,y-37,x+29,y-41,'wine',4)
  c.oval(x,y-4,15,12,'gold');c.oval(x,y-5,10,8,'wine');c.line(x-8,y-10,x+8,y+1,'cream',3);c.line(x+8,y-10,x-8,y+1,'cream',3)
  if pose in ['windup','attack']:
   c.line(x-55,y-12,x-65,y-43,'gold',4);c.line(x+52,y-17,x+61,y-46,'gold',4)
  if pose=='phase2':
   c.poly([(x-31,y-65),(x-32,y-86),(x-12,y-76),(x,y-94),(x+14,y-76),(x+32,y-86),(x+30,y-65)],'gold')
   c.line(x-23,y-70,x+22,y-70,'cream',2)
 if kind not in ['elite','yarn','thread','dummy']: eyes(c,x-8,y-22,'hit' if pose in ['hit','defeat'] else 'idle',f)
 c.edge()
 if pose=='hit' and f==0:c.p=['cream' if k in ['coral','copper','rose'] else k for k in c.p]
 if pose=='windup':
  s=c;c=Canvas(n,n);foot=n-8
  for yy in range(n):
   for xx in range(n):
    col=s.p[yy*n+xx]
    if col:c.dot(xx,round(yy+(foot-yy)*[.03,.06,.10,.06,.03,0][f]),col)
 if pose=='defeat':
  s=c;c=Canvas(n,n)
  for yy in range(n):
   for xx in range(n):
    col=s.p[yy*n+xx]
    if col:c.dot(xx,n-28+yy//6 if f>=3 else yy,col)
 return c
def wave(f):return [0,-1,-2,-1,0,1][f]

ENEMIES=['guard','flanker','ranger','healer','charger','elite','yarn','thread','dummy']
ENEMY_POSES=['idle','move','attack','windup','hit','defeat','phase2']
for kind in ENEMIES:
 n=144 if kind=='yarn' else 72; sheet=Canvas(n*6,n*len(ENEMY_POSES));strip=Canvas(n*7,n)
 for r,pose in enumerate(ENEMY_POSES):
  for f in range(6):
   frame=monster(kind,pose,f);validate_frame(frame,f'{kind}/{pose}/{f}');sheet.blit(frame,f*n,r*n)
  strip.blit(monster(kind,pose,3),r*n,0)
 save(f'apps/web/public/art/squad/{kind}.png',sheet,{'frame':[n,n],'frames':6,'poses':ENEMY_POSES,'seed':0})
 save(f'reports/squad/art/{kind}-real-size.png',strip,{'scale':1,'poses':ENEMY_POSES})

def icon(kind):
 c=Canvas(24,24)
 if kind in ['shieldBash','rally','hearthwall','steadfast','guard']:
  c.poly([(4,3),(20,3),(20,15),(12,22),(4,15)],'gold');c.poly([(6,5),(18,5),(18,14),(12,19),(6,14)],'teal')
  c.rect(10,7,4,9,'cream');c.rect(8,9,8,3,'cream')
  if kind=='rally':c.line(1,2,1,15,'gold');c.line(22,2,22,15,'gold')
  if kind=='hearthwall':c.rect(0,11,3,11,'aqua');c.rect(21,11,3,11,'aqua')
 elif kind in ['threadSnare','snare','restrain','taunt']:
  c.oval(11,12,9,7,'epic');c.oval(11,12,6,4,'night');c.line(3,20,20,3,'cream',2);c.line(2,3,20,21,'rose',2)
 elif kind in ['emberOrb','burn','warmWick']:
  c.poly([(11,1),(15,9),(20,5),(22,16),(16,22),(7,22),(2,16),(7,7),(7,13)],'coral');c.poly([(11,7),(15,14),(18,13),(16,20),(9,21),(6,16)],'gold');c.rect(10,14,4,6,'cream')
 elif kind in ['lanternstorm','exposed']:
  for x,y in [(5,7),(16,5),(11,17)]:c.line(x,y-4,x,y+4,'gold',2);c.line(x-3,y,x+4,y,'gold',2);c.dot(x,y,'paper')
 elif kind in ['milkFlask','mossFlask','lastSip']:
  c.rect(9,2,7,4,'copper');c.rect(10,6,5,5,'mist');c.oval(12,16,8,7,'paper' if kind!='mossFlask' else 'sage');c.line(7,13,7,18,'aqua');c.rect(11,12,3,8,'teal');c.rect(8,15,9,3,'teal')
 elif kind=='nineLives':
  c.oval(12,13,10,10,'sage');c.oval(12,13,7,7,'leaf');c.rect(11,6,3,13,'paper');c.rect(6,11,13,3,'paper')
 elif kind=='stun':
  c.poly([(12,1),(15,8),(23,9),(17,14),(19,22),(12,18),(5,22),(6,14),(1,9),(9,8)],'gold')
 c.edge();return c

ICONS=['shieldBash','rally','hearthwall','threadSnare','emberOrb','lanternstorm','milkFlask','mossFlask','nineLives','steadfast','warmWick','lastSip','guard','snare','restrain','taunt','burn','exposed','stun']
for name in ICONS:save(f'apps/web/public/art/squad/icon-{name}.png',icon(name),{'size':[24,24],'shape':name})

# A quiet, authored cafe interior: actors occupy the open floor, scenery stays behind danger.
bg=Canvas(680,360);bg.rect(0,0,680,360,'night');bg.rect(0,0,680,110,'coffee');bg.rect(0,110,680,250,'floor')
for yy in range(110,360,30):
 bg.rect(0,yy,680,1,'wood')
 for xx in range((yy//30%2)*60,680,120):bg.rect(xx,yy,1,30,'wood')
for xx in [36,254,500]:
 bg.rect(xx,17,131,75,'wood');bg.rect(xx+4,20,123,68,'dusk');bg.rect(xx+8,24,115,60,'blue')
 bg.rect(xx+61,23,4,64,'woodLight');bg.rect(xx+5,48,122,3,'woodLight');bg.rect(xx-5,88,141,7,'copper')
 for sx,sy in [(17,33),(83,30),(103,68)]:bg.dot(xx+sx,sy,'gold')
 bg.poly([(xx+8,84),(xx+41,38),(xx+74,84)],'slate')
bg.rect(0,102,680,8,'woodLight');bg.rect(0,101,680,2,'copper')
for xx in [197,459]:
 bg.line(xx,0,xx,23,'woodLight');bg.poly([(xx-11,23),(xx+12,23),(xx+17,40),(xx-17,40)],'gold');bg.rect(xx-9,41,18,3,'cream')
for xx in [15,648]:
 bg.rect(xx,88,18,20,'rust');bg.rect(xx-2,86,22,5,'copper')
 for dx,dy in [(3,68),(14,64),(8,77)]:bg.line(xx+9,87,xx+dx,dy,'leaf',2);bg.oval(xx+dx,dy,7,4,'moss')
bg.rect(297,20,116,52,'wood');bg.rect(300,23,110,46,'teal');bg.line(308,35,399,35,'sage');bg.line(308,44,371,44,'mist');bg.line(308,53,386,53,'mist')
save('apps/web/public/art/squad/cafe-room.png',bg,{'size':[680,360],'seed':0,'light':'upper-left and two pendants','layers':'quiet wall, open floor'})

meta={'version':1,'hero':{'width':80,'height':80,'frames':6,'poses':POSES,'foot':[40,72],'launch':[61,43],'impact':[42,42],'contactFrame':3,'timingMs':[180,120,100,100,140,180]},'enemy':{'width':72,'height':72,'frames':6,'poses':ENEMY_POSES,'foot':[36,64],'launch':[18,36],'impact':[36,36],'contactFrame':3},'boss':{'width':144,'height':144,'frames':6,'foot':[72,132],'launch':[24,90],'impact':[72,85],'contactFrame':3}}
for path,data in [('apps/web/public/art/squad/metadata.json',meta),('tools/art/squad-manifest.json',{'date':'2026-11-05','generator':'python3 -B tools/art/squad.py','prompt':'None. Original scripted integer geometry; no reference images, image models, network or third-party game art.','palette':'tools/art/visual-palette.json','seed':0,'files':FILES})]:
 p=ROOT/path; s=json.dumps(data,indent=2)+'\n'
 if CHECK:assert p.read_text()==s, 'Manifest drift: '+path
 else:p.write_text(s)
print(('Checked' if CHECK else 'Generated'),len(FILES),'original files;',sum(f['bytes'] for f in FILES if f['file'].startswith('apps/')),'runtime image bytes')
