#!/usr/bin/env python3
"""Original household creature and item art; integer geometry, no input images or network.
Parameters: palette visual-palette.json, seed 0, scale 1; exact per-shape coordinates below.
"""
import json, math, hashlib, sys
from pathlib import Path
from pipeline import Image, encode_png
ROOT=Path(__file__).resolve().parents[2]
P=json.loads((ROOT/'tools/art/visual-palette.json').read_text()); COLORS=list(P)
CHARS='0123456789ABCDEFGHIJKLMNOPQRSTUV'; RGBA={k:bytes.fromhex(v[1:])+b'\xff' for k,v in P.items()}
CHECK='--check' in sys.argv
OUT=ROOT/'apps/web/public/art/gameplay'; OUT.mkdir(parents=True,exist_ok=True)
class Canvas:
 def __init__(self,w,h): self.w=w;self.h=h;self.p=[None]*(w*h)
 def dot(self,x,y,c):
  x=int(x);y=int(y)
  if 0<=x<self.w and 0<=y<self.h:self.p[y*self.w+x]=c
 def rect(self,x,y,w,h,c):
  for yy in range(y,y+h):
   for xx in range(x,x+w):self.dot(xx,yy,c)
 def line(self,x,y,a,b,c):
  n=max(abs(a-x),abs(b-y),1)
  for i in range(n+1):self.dot(round(x+(a-x)*i/n),round(y+(b-y)*i/n),c)
 def oval(self,x,y,rx,ry,c):
  for yy in range(math.floor(y-ry),math.ceil(y+ry+1)):
   for xx in range(math.floor(x-rx),math.ceil(x+rx+1)):
    if ((xx-x)/max(.1,rx))**2+((yy-y)/max(.1,ry))**2<=1:self.dot(xx,yy,c)
 def poly(self,points,c):
  for y in range(min(p[1] for p in points),max(p[1] for p in points)+1):
   for x in range(min(p[0] for p in points),max(p[0] for p in points)+1):
    inside=False
    for i,(a,b) in enumerate(points):
     d,e=points[i-1]
     if (b>y)!=(e>y) and x<(d-a)*(y-b)/(e-b)+a:inside=not inside
    if inside:self.dot(x,y,c)
 def outline(self):
  old=self.p[:]
  for y in range(self.h):
   for x in range(self.w):
    if old[y*self.w+x] is None and any(0<=a<self.w and 0<=b<self.h and old[b*self.w+a] is not None for a,b in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]):self.dot(x,y,'ink')
 def png(self):return encode_png(Image(self.w,self.h,b''.join(RGBA[c] if c else b'\0'*4 for c in self.p)))
 def rows(self):return [''.join(CHARS[COLORS.index(c)] if c else '.' for c in self.p[y*self.w:(y+1)*self.w]) for y in range(self.h)]
 def blit(self,other,x,y,scale=1):
  for yy in range(other.h):
   for xx in range(other.w):
    col=other.p[yy*other.w+xx]
    if col:self.rect(x+xx*scale,y+yy*scale,scale,scale,col)

ROSTER=[
 ('Dust Bunny','Loose Yarn','Sock Puppet','Roomba Scout','Yarn Giant'),
 ('Pickle Imp','Toast Mimic','Spoon Bug','Blender Brute','Cucumber Scare'),
 ('Soap Slime','Rubber Duck','Sponge Crab','Hair Dryer Wisp','Bathtub Tyrant'),
 ('Mouse Trap','Dust Moth','Wind-up Robot','Box Fort Knight','Vacuum Beast'),
 ('Shadow Crow','Moth Swarm','Neon Dot','Chimney Ghost','Laser Dot Phantom')]
RAMPS=[('rust','rose','cream'),('moss','sage','paper'),('blue','aqua','paper'),('wood','copper','gold'),('plum','epic','lavender')]
def face(c,x,y,expression,wide=False):
 gap=5 if wide else 4
 if expression=='sleep':
  c.line(x-2,y,x,y,'ink');c.line(x+gap-1,y,x+gap+1,y,'ink')
 elif expression=='hurt':
  for d in [0,gap]:c.line(x+d-1,y-1,x+d+1,y+1,'ink');c.line(x+d+1,y-1,x+d-1,y+1,'ink')
 else:
  for d in [0,gap]:
   c.rect(x+d-1,y-1,3,4,'paper');c.rect(x+d-1,y,2,3,'ink');c.dot(x+d-1,y,'cream')
   if expression=='angry':c.line(x+d-2,y-2,x+d+1,y-1,'ink')
 c.line(x+1,y+5,x+3,y+5,'ink')
 if expression=='happy':c.dot(x+2,y+6,'rose')

def creature(ch,index,anim,frame):
 n=40 if index==4 else 28 if index==3 else 24;c=Canvas(n,n);x=n//2;y=n-10
 low,mid,hi=RAMPS[ch-1]; bob=[0,-1,0,1][frame%4] if anim in ['idle','walk'] else 0
 x+=(-2 if anim=='attack' and frame==1 else 1 if anim=='windup' else 0);y+=bob
 expression='angry' if anim in ['windup','attack'] else 'hurt' if anim in ['hit','defeat'] else 'sleep' if frame==2 else 'happy'
 name=ROSTER[ch-1][index]
 if index==4:
  y=n-15
  if ch==1: # Huge yarn spool, four distinct curved strands and a loose tail.
   c.line(30,32,37,28,'rust');c.line(37,28,36,23,'rose');c.oval(x,y,14,13,'rust');c.oval(x-2,y-2,12,11,'coral');c.oval(x-5,y-5,7,6,'rose')
   for k in range(4):c.line(x-11+k*5,y-9,x-5+k*5,y+9,'rust');c.line(x-12+k*5,y-10,x-6+k*5,y+8,'rose')
   c.line(x-10,y+7,x+9,y+2,'cream');c.oval(x-11,y+9,4,3,'rust');c.oval(x+10,y+9,4,3,'rust')
  elif ch==2: # Crooked cucumber crown, leaf ears, seeds and ridged skin.
   c.poly([(9,32),(8,13),(14,3),(24,5),(30,15),(29,32)],'moss');c.poly([(10,30),(10,13),(15,5),(21,6),(23,30)],'sage');c.line(15,9,13,24,'paper')
   c.poly([(24,9),(33,3),(32,13)],'leaf');c.poly([(11,8),(4,4),(5,13)],'leaf')
   for a,b in [(25,14),(26,22),(23,28),(11,19),(20,9)]:c.rect(a,b,2,2,'leaf')
   c.oval(12,35,5,2,'leaf');c.oval(27,35,5,2,'leaf')
  elif ch==3: # Porcelain tub with claw feet and an irritated foam crown.
   c.poly([(3,22),(36,22),(31,34),(9,34)],'blue');c.poly([(5,22),(34,22),(29,31),(10,31)],'aqua');c.rect(3,20,34,4,'paper');c.rect(5,23,27,1,'mist')
   for a,b,r in [(10,18,5),(17,12,6),(25,17,6),(30,13,4)]:c.oval(a,b,r,r,'aqua');c.oval(a-1,b-1,r-1,r-2,'paper')
   c.rect(6,14,2,7,'copper');c.line(6,14,10,14,'gold');c.rect(10,34,4,4,'copper');c.rect(28,34,4,4,'copper')
  elif ch==4: # Canister vacuum: hose nose, handle, bag, brass wheels.
   c.rect(17,7,15,3,'mist');c.rect(28,9,4,8,'slate');c.oval(23,25,12,11,'rust');c.oval(21,22,10,8,'copper');c.oval(20,18,7,3,'gold')
   c.line(14,26,6,27,'slate');c.rect(3,20,6,9,'mist');c.rect(3,18,9,4,'slate');c.rect(2,16,11,3,'common');c.rect(17,29,13,3,'wood');c.oval(15,35,4,3,'slate');c.oval(30,35,4,3,'slate');c.dot(15,34,'gold');c.dot(30,34,'gold')
  else: # Phantom mantle with three tails and a clear diamond laser eye.
   c.poly([(4,29),(10,12),(18,5),(26,9),(35,28),(29,36),(23,30),(17,36),(12,29),(5,35)],'plum');c.poly([(8,27),(13,13),(18,8),(23,11),(30,27),(23,25),(17,30)],'epic');c.poly([(15,15),(20,10),(25,16),(20,23)],'rose');c.poly([(17,15),(20,12),(23,16),(20,20)],'paper');c.rect(19,15,2,4,'wine')
   for a,b in [(8,7),(31,13),(4,21)]:c.line(a-2,b,a+2,b,'lavender');c.line(a,b-2,a,b+2,'lavender')
  if ch!=5:face(c,x-6,y-3,expression,True)
  elif expression=='angry':c.line(15,15,25,13,'wine')
 elif ch==1 and index==0: # Dust bunny, long leaning ears.
  c.oval(x,y+1,8,7,'mist');c.oval(x-2,y-1,7,6,'common');c.oval(x-5,y-7,2,7,'common');c.oval(x+2,y-8,2,6,'common');c.line(x-5,y-11,x-5,y-5,'rose');c.line(x+2,y-11,x+2,y-6,'rose');c.oval(x-4,y-2,4,3,'paper');face(c,x-4,y-1,expression)
 elif (ch==1 and index==1):
  c.oval(x,y+1,8,7,'rust');c.oval(x-2,y-1,7,6,'rose')
  for k in range(3):c.line(x-6+k*4,y-4,x-3+k*4,y+6,'rust')
  c.line(x+6,y+3,22,y+5,'coral');c.line(22,y+5,20,y+8,'rose');face(c,x-4,y-1,expression)
 elif ch==1 and index==2:
  c.poly([(7,22),(6,11),(9,4),(16,4),(17,13),(21,16),(20,21)],'common');c.rect(8,5,8,4,'rose');c.rect(8,6,8,1,'paper');c.rect(8,13,10,4,'lavender');face(c,9,10,expression)
 elif ch==1 and index==3:
  c.oval(x,y+3,12,5,'slate');c.oval(x-1,y+1,11,5,'mist');c.oval(x-3,y-1,7,3,'paper');c.rect(x+6,y-6,3,6,'slate');c.dot(x+7,y-7,'rose');c.rect(x-10,y+5,4,3,'ink');c.rect(x+6,y+5,4,3,'ink');face(c,x-5,y,expression)
 elif ch==2 and index==0:
  c.oval(x,y,6,9,'moss');c.oval(x-2,y-2,4,7,'sage');c.poly([(7,9),(3,5),(3,12)],'leaf');c.poly([(16,8),(21,4),(21,12)],'leaf');c.dot(14,6,'paper');c.dot(15,18,'leaf');face(c,x-4,y-2,expression)
 elif ch==2 and index==1:
  c.rect(5,8,15,14,'rust');c.oval(8,8,4,4,'amber');c.oval(16,8,4,4,'amber');c.rect(6,9,13,11,'cream');c.rect(7,11,11,7,'fur');c.rect(9,11,5,4,'gold');face(c,8,13,expression)
 elif ch==2 and index==2:
  c.line(7,21,16,10,'mist');c.line(6,21,15,9,'paper');c.oval(16,7,5,6,'mist');c.oval(15,6,4,4,'paper');c.oval(16,7,2,3,'slate');c.line(10,15,5,13,'copper');c.line(12,16,19,19,'copper');face(c,11,14,expression)
 elif ch==2 and index==3:
  c.rect(7,18,15,7,'rust');c.rect(9,5,11,14,'aqua');c.rect(8,3,13,3,'slate');c.rect(20,7,4,8,'mist');c.rect(10,6,2,6,'paper');c.poly([(11,17),(14,12),(18,17)],'sage');c.rect(9,22,10,2,'gold');face(c,10,11,expression)
 elif ch==3 and index==0:
  c.oval(x,y+3,9,6,'blue');c.oval(x-2,y+1,8,5,'aqua');c.oval(x-5,y-1,3,2,'paper');c.oval(18,5,3,3,'aqua');c.dot(17,4,'paper');face(c,x-4,y+1,expression)
 elif ch==3 and index==1:
  c.oval(14,17,8,5,'amber');c.oval(13,15,7,5,'gold');c.oval(9,9,5,5,'gold');c.oval(8,7,3,2,'cream');c.rect(2,11,6,3,'rust');c.dot(7,8,'ink');c.oval(16,16,4,2,'fur');c.poly([(20,14),(23,10),(22,18)],'gold')
 elif ch==3 and index==2:
  c.rect(6,9,13,11,'amber');c.rect(7,9,11,9,'gold');
  for a,b in [(8,11),(15,10),(10,17),(16,17)]:c.rect(a,b,2,2,'amber')
  for sign in [-1,1]:c.line(x+sign*6,17,x+sign*10,14,'coral');c.oval(x+sign*10,12,2,3,'coral');c.line(x+sign*5,20,x+sign*8,22,'rust')
  face(c,x-4,13,expression)
 elif ch==3 and index==3:
  c.oval(15,11,10,7,'blue');c.oval(13,9,8,5,'aqua');c.rect(4,7,5,8,'slate');c.rect(14,15,5,9,'coral');c.line(19,23,23,25,'mist');c.line(23,25,26,22,'mist');face(c,10,10,expression)
 elif ch==4 and index==0:
  c.poly([(2,21),(7,10),(19,13),(22,22)],'wood');c.poly([(3,20),(8,11),(18,14),(20,20)],'copper');c.line(7,19,15,12,'mist');c.line(8,20,16,13,'paper');c.poly([(15,15),(18,18),(13,19)],'gold');face(c,6,16,expression)
 elif ch==4 and index==1 or ch==5 and index==1:
  c.poly([(10,13),(3,5),(1,12),(5,20),(10,18)],mid);c.poly([(14,13),(21,5),(23,12),(19,20),(14,18)],low);c.oval(x,15,2,7,'cream');c.line(x-1,9,x-4,5,'gold');c.line(x+1,9,x+4,5,'gold');c.oval(6,12,2,3,hi);c.oval(18,12,2,3,mid);c.dot(x-1,11,'ink');c.dot(x+1,11,'ink')
 elif ch==4 and index==2:
  c.rect(6,6,12,10,'slate');c.rect(7,6,10,7,'mist');c.rect(7,16,10,5,'rust');c.line(18,13,22,13,'gold');c.rect(21,11,2,5,'gold');c.rect(6,21,4,2,'slate');c.rect(15,21,4,2,'slate');c.rect(5,17,3,3,'copper');face(c,9,9,expression)
 elif ch==4 and index==3:
  c.rect(6,12,16,13,'wood');c.rect(7,12,14,10,'copper');c.rect(7,4,15,9,'amber');c.rect(8,5,5,3,'gold');c.rect(9,9,11,3,'ink');c.line(6,12,21,23,'woodLight');c.rect(2,15,5,9,'slate');c.line(24,6,24,24,'gold');c.line(22,10,26,10,'cream');c.rect(8,25,4,2,'wood');c.rect(19,25,4,2,'wood')
 elif ch==5 and index==0:
  c.oval(12,15,7,7,'plum');c.oval(9,10,5,5,'slate');c.poly([(5,9),(0,12),(6,13)],'gold');c.poly([(14,13),(23,8),(19,20)],'night');c.line(10,21,9,23,'gold');c.line(14,21,15,23,'gold');c.dot(8,9,'paper');c.dot(8,10,'ink');c.line(14,14,18,16,'epic')
 elif ch==5 and index==2:
  c.poly([(12,5),(21,13),(12,22),(3,13)],'wine');c.poly([(12,7),(19,13),(12,20),(5,13)],'rose');c.poly([(11,9),(15,13),(11,17),(8,13)],'paper');c.dot(12,13,'wine');c.line(4,4,7,4,'epic');c.line(6,2,6,6,'epic')
 elif ch==5 and index==3:
  c.poly([(5,26),(4,15),(9,7),(19,7),(24,15),(23,26),(18,23),(13,27),(9,23)],'plum');c.poly([(6,21),(6,15),(11,8),(17,8),(20,15),(18,23),(13,21)],'lavender');c.rect(8,3,13,5,'slate');c.rect(6,7,17,2,'mist');face(c,10,15,expression)
 # A shared grounded contact shadow preserves runtime foot anchors; it is part of the original art.
 c.outline()
 shift_y = -1 if anim in ['idle','walk'] and frame==1 else -2 if anim in ['idle','walk'] and frame==3 else 1 if anim=='windup' and frame==1 else -1 if anim=='attack' and frame==2 else 0
 shift_x = -1 if (anim=='windup' and frame==2) or (anim=='hit' and frame==1) else 0
 if shift_x or shift_y:
  moved=Canvas(n,n);moved.blit(c,shift_x,shift_y);c=moved
 if anim=='hit' and frame==0:c.p=[hi if col==mid else col for col in c.p]
 c.rect(n//2-4,n-1,8,1,'ink')
 if anim=='defeat':
  src=c;c=Canvas(n,n);keep=max(1,n-frame*max(2,n//7))
  for yy in range(keep):
   sy=min(n-1,int(yy*n/keep))
   for xx in range(n):
    col=src.p[sy*n+xx]
    if col:c.dot(xx,n-keep+yy,col)
  for a in range(6):
   angle=a*math.pi/3;c.rect(round(n/2+math.cos(angle)*(5+frame*2)),round(n-9+math.sin(angle)*5),2,2,hi)
  c.rect(n//2-3,n-1,6,1,'ink')
 return c

files=[]
def save(path,data,parameters):
 path=ROOT/path;data=data if isinstance(data,bytes) else data.encode()
 if CHECK:assert path.exists() and path.read_bytes()==data,f'Regenerate {path}'
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
 files.append({'file':str(path.relative_to(ROOT)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'parameters':parameters})
def main():
 art={};contact=Canvas(5*44*3,5*44*3)
 for ch,row in enumerate(ROSTER,1):
  for index,name in enumerate(row):
   id='mon.'+'.'.join(name.lower().replace('-','').split());kind='boss' if index==4 else 'elite' if index==3 else 'regular'
   animations={};n=40 if index==4 else 28 if index==3 else 24
   for anim,count in [('idle',4),('walk',4),('windup',3),('attack',4),('hit',2),('defeat',6 if kind=='boss' else 4)]:
    frames=[creature(ch,index,anim,i) for i in range(count)];animations[anim]=[f.rows() for f in frames]
    sheet=Canvas(n*count,n)
    for i,f in enumerate(frames):sheet.blit(f,i*n,0)
    save(f'apps/web/public/art/gameplay/{id}-{anim}.png',sheet.png(),{'chapter':ch,'shape':name,'animation':anim,'frames':count,'frameSize':n,'scale':1,'seed':0})
   art[id]={'id':id,'name':name,'kind':kind,'isPilot':True,'size':{'w':n,'h':n},'palette':{'k':int(P['ink'][1:],16),**{CHARS[i]:int(P[k][1:],16) for i,k in enumerate(COLORS)}},'frames':animations}
   contact.blit(creature(ch,index,'idle',0),index*44*3+(44-n)*3//2,(ch-1)*44*3+(44-n)*3,3)
   if kind=='boss':
    for expression,anim in [('calm','idle'),('alert','windup')]:
     portrait=Canvas(48,48);portrait.blit(creature(ch,index,anim,0),4,6)
     save(f'apps/web/public/art/gameplay/portrait-boss-{ch}-{expression}.png',portrait.png(),{'chapter':ch,'shape':name,'expression':expression,'size':48,'seed':0})
 # Compact generated data: the reviewable geometry is the generator, not thousands of repeated pixel rows.
 save('apps/web/src/art/monsters/gameplay.generated.ts',"// Generated by tools/art/gameplay.py; original art, no input images.\nimport type { MonsterArt } from './types';\nexport const GAMEPLAY_MONSTERS: Readonly<Record<string, MonsterArt>> = "+json.dumps(art,separators=(',',':'))+';\n',{'roster':25,'palette':'visual-palette.json','seed':0})
 save('reports/gameplay/character-contact.png',contact.png(),{'grid':'chapters by rows, roster by columns','scale':3})
 manifest={'generator':'python3 -B tools/art/gameplay.py','date':'2026-11-04','palette':'tools/art/visual-palette.json','seed':0,'files':files}
 m=ROOT/'tools/art/gameplay-manifest.json';data=json.dumps(manifest,indent=2)+'\n'
 if CHECK:assert m.read_text()==data,'manifest drift'
 else:m.write_text(data)
 print(('Checked' if CHECK else 'Generated'),len(files),'original assets;',sum(f['bytes'] for f in files if f['file'].startswith('apps/web/public')),'shipped PNG bytes')

if __name__ == '__main__':main()
