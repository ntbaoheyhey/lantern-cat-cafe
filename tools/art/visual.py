#!/usr/bin/env python3
"""Original Evening Atelier art. Standard library only; no input images.
Run: python3 -B tools/art/visual.py [--check]. Coordinates are native pixels.
"""
import hashlib
import json
import math
from pathlib import Path
import sys
from pipeline import Image, encode_png, decode_png

ROOT = Path(__file__).resolve().parents[2]
P = json.loads((ROOT / 'tools/art/visual-palette.json').read_text())
OUT = ROOT / 'apps/web/public/art/visual'
CHECK = '--check' in sys.argv
RGBA = {k: bytes.fromhex(v[1:]) + b'\xff' for k, v in P.items()}

class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.p = bytearray(w * h * 4)
    def dot(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (int(y)*self.w+int(x))*4
            self.p[i:i+4] = RGBA[c]
    def rect(self, x, y, w, h, c):
        for yy in range(y, y+h):
            for xx in range(x, x+w): self.dot(xx, yy, c)
    def ellipse(self, x, y, rx, ry, c):
        for yy in range(math.floor(y-ry), math.ceil(y+ry+1)):
            for xx in range(math.floor(x-rx), math.ceil(x+rx+1)):
                if ((xx-x)/max(rx,.1))**2+((yy-y)/max(ry,.1))**2 <= 1: self.dot(xx, yy, c)
    def poly(self, pts, c):
        for y in range(min(p[1] for p in pts), max(p[1] for p in pts)+1):
            for x in range(min(p[0] for p in pts), max(p[0] for p in pts)+1):
                inside=False
                for i,(a,b) in enumerate(pts):
                    d,e=pts[i-1]
                    if (b>y)!=(e>y) and x<(d-a)*(y-b)/(e-b)+a:inside=not inside
                if inside:self.dot(x,y,c)
    def line(self, x,y,a,b,c):
        n=max(abs(a-x),abs(b-y),1)
        for i in range(n+1): self.dot(round(x+(a-x)*i/n),round(y+(b-y)*i/n),c)
    def export(self): return encode_png(Image(self.w,self.h,bytes(self.p)))

def framed(c,x,y,w,h,fill):
    c.rect(x,y,w,h,'ink'); c.rect(x+1,y+1,w-2,h-2,'woodLight');c.rect(x+2,y+2,w-4,h-4,fill)
def plant(c,x,y):
    c.rect(x-4,y,9,7,'ink');c.rect(x-3,y,7,6,'rust');c.rect(x-2,y,5,1,'copper')
    c.line(x,y,x,y-14,'moss')
    for dx,dy in [(-4,-5),(4,-8),(-3,-12),(3,-15)]:
        c.ellipse(x+dx,y+dy,4,2,'leaf');c.line(x,y+dy+3,x+dx,y+dy,'moss');c.dot(x+dx,y+dy-1,'sage')
def books(c,x,y,n=5):
    colors=['rust','teal','plum','woodLight','blue']
    for i in range(n):
        h=6+(i*3)%5;c.rect(x+i*4,y-h,3,h,colors[i%5]);c.rect(x+i*4,y-h+1,2,1,'copper')
def cup(c,x,y):
    c.rect(x,y,6,5,'cream');c.rect(x+6,y+1,2,3,'copper');c.rect(x+1,y+4,5,1,'copper');c.rect(x+1,y,4,1,'coffee')

def room(ch):
    c=Canvas(256,96)
    wall=['dusk','teal','blue','wine','night'][ch-1]
    c.rect(0,0,256,96,'floor');c.rect(0,0,256,70,wall)
    # Staggered, quiet wallpaper and bevelled wainscot.
    for x in range(0,256,16):
        c.rect(x,2,1,64,'slate' if ch==3 else 'wood')
        c.dot(x+8,12+(x//16%2)*8,'mist' if ch==3 else 'plum')
    c.rect(0,0,256,3,'ink');c.rect(0,3,256,1,'copper')
    c.rect(0,62,256,3,'woodLight');c.rect(0,65,256,2,'coffee');c.rect(0,67,256,15,'walnut')
    for x in range(0,256,24):
        framed(c,x+2,69,20,12,'wood')
    c.rect(0,81,256,2,'copper')
    for y in [84,88,92]:
        c.rect(0,y,256,1,'coffee')
        for x in range((y%3)*12,256,38):c.rect(x,y+1,1,3,'woodLight');c.rect(x+3,y+2,15,1,'wood')
    # Arched dusk window: original skyline, moon and selective warm frame.
    framed(c,62,8,64,49,'wood');c.rect(65,11,58,43,'blue')
    c.rect(65,25,58,29,'plum' if ch in [1,5] else 'teal');c.rect(65,41,58,13,'coral' if ch==5 else 'slate')
    c.ellipse(110,20,5,5,'cream');c.ellipse(112,18,4,4,'blue')
    for x,y in [(70,17),(82,13),(97,23),(118,31),(74,34)]:c.dot(x,y,'cream')
    for x,h in [(66,7),(77,11),(86,6),(99,10),(112,8)]:
        c.rect(x,54-h,9,h,'night');c.poly([(x-1,54-h),(x+4,49-h),(x+10,54-h)],'night');c.dot(x+3,57-h,'gold')
    c.rect(93,11,2,43,'woodLight');c.rect(65,33,58,2,'woodLight');c.rect(61,55,66,3,'copper');c.rect(61,58,66,2,'coffee')
    c.poly([(58,9),(70,9),(67,43),(60,50),(57,47)],'wine');c.line(60,10,61,46,'coral')
    c.poly([(120,9),(132,9),(132,49),(125,43)],'wine');c.line(129,10,128,45,'coral')
    # Shelf, framed paw picture, pendant lamp, and tiny tea ritual.
    framed(c,154,13,20,19,'dusk');c.ellipse(164,24,4,3,'gold')
    for x,y in [(160,20),(164,18),(168,20)]:c.rect(x,y,2,2,'gold')
    c.rect(143,48,53,3,'ink');c.rect(143,47,53,1,'copper');books(c,147,47,6);plant(c,185,41)
    c.rect(192,2,1,16,'coffee');c.poly([(188,18),(197,18),(201,24),(184,24)],'ink');c.poly([(188,18),(196,18),(199,23),(186,23)],'gold');c.rect(190,24,5,2,'cream')
    c.rect(167,65,36,3,'ink');c.rect(167,64,36,1,'copper');c.rect(171,68,3,14,'woodLight');c.rect(197,68,3,14,'woodLight');cup(c,178,58)
    # Each chapter has a distinct silhouette and material story.
    if ch==2:
        framed(c,136,51,27,31,'teal');c.rect(139,55,21,13,'coffee');c.rect(142,58,15,8,'rust');c.rect(143,65,14,1,'gold')
        for x in [139,146,153]:c.dot(x,53,'cream')
        c.rect(209,40,22,43,'slate');c.rect(210,41,19,18,'mist');c.rect(210,61,19,20,'teal');c.rect(225,45,2,8,'gold')
    if ch==3:
        for y in [58,66,74]:
            for x in range(0,256,10):c.rect(x,y,9,7,'teal');c.dot(x+1,y+1,'aqua')
        c.ellipse(163,71,20,11,'ink');c.ellipse(163,69,19,10,'common');c.ellipse(163,65,17,5,'aqua');c.rect(178,57,3,9,'mist');c.rect(173,55,8,3,'common')
    if ch==4:
        framed(c,145,51,32,31,'wood');c.line(148,54,172,78,'copper');c.line(172,54,148,78,'rust')
        c.ellipse(197,67,13,15,'wine');c.ellipse(197,64,11,11,'plum');c.line(191,54,201,74,'coral');c.line(188,61,206,66,'coral')
        c.rect(18,13,20,4,'woodLight');books(c,18,13)
    if ch==5:
        c.rect(0,4,256,57,'night');c.rect(0,35,256,26,'dusk');c.rect(0,49,256,12,'plum')
        c.ellipse(99,21,11,11,'cream');c.ellipse(103,17,9,9,'night')
        for i in range(24):c.dot((i*47+19)%256,7+(i*13)%39,'gold' if i%4==0 else 'mist')
        for i in range(10):
            x=i*29-8;h=8+(i*7)%19;c.rect(x,61-h,24,h,'night');c.poly([(x-2,61-h),(x+11,53-h),(x+26,61-h)],'night');c.rect(x+7,64-h,2,3,'gold')
        c.line(0,18,75,30,'woodLight');c.line(75,30,180,24,'woodLight');c.line(180,24,255,13,'woodLight')
        for x,y in [(20,22),(55,27),(90,29),(130,27),(170,25),(210,20)]:c.rect(x,y,4,6,'amber');c.rect(x+1,y,2,4,'cream')
    # Quiet rug sits behind actors and anchors them to the floor.
    c.ellipse(111,86,45,5,'wine');c.ellipse(111,85,41,3,'rust');c.ellipse(111,85,35,2,'woodLight')
    return c

def foreground(ch):
    c=Canvas(256,96);plant(c,38,82);plant(c,225,86)
    c.rect(22,88,37,5,'coffee');c.rect(23,87,36,1,'woodLight');cup(c,45,82)
    c.ellipse(207,92,12,3,'ink');c.ellipse(207,91,11,2,'teal');c.rect(201,90,12,1,'aqua')
    return c

def mochi(frame):
    c=Canvas(48,48);dy=1 if frame in [2,3,6] else 0
    if frame >= 8:
        # A curled, sleeping silhouette; a one-pixel breathing change, never a KO pose.
        c.ellipse(24,38,20,5,'coffee');c.ellipse(25,31,18,11,'ink');c.ellipse(25,30,17,10,'amber')
        c.ellipse(24,29,14,9,'fur');c.ellipse(30,32,9,6,'cream')
        lift=frame%2
        c.poly([(6,25),(7,15+lift),(14,20),(21,16+lift),(24,27)],'ink')
        c.poly([(8,25),(9,19+lift),(14,23),(20,20+lift),(22,27)],'fur')
        c.ellipse(15,28+lift,10,8,'ink');c.ellipse(15,27+lift,9,7,'fur');c.ellipse(15,31+lift,6,3,'cream')
        c.line(8,27+lift,12,28+lift,'ink');c.line(17,28+lift,21,27+lift,'ink');c.dot(15,30+lift,'coral')
        c.rect(20,31,9,3,'blue');c.rect(20,31,8,1,'aqua')
        c.ellipse(33,31,8,7,'rust');c.ellipse(32,30,7,6,'fur');c.ellipse(30,28,5,4,'amber')
        c.rect(28,34,9,2,'cream');c.rect(12,36,10,3,'cream');return c
    tx=1 if frame in [5,6] else 0
    # Lifted tail, generous head, cream muzzle, knitted dusk scarf, asymmetrical whiskers.
    c.ellipse(35+tx,33,7,7,'ink');c.ellipse(35+tx,31,5,7,'amber');c.ellipse(35+tx,29,3,6,'fur');c.ellipse(33+tx,28,2,4,'night')
    c.ellipse(23,33,11,11,'ink');c.ellipse(23,32,10,10,'amber');c.ellipse(22,31,8,9,'fur');c.ellipse(23,35,5,6,'cream')
    c.rect(15,40,7,4,'ink');c.rect(16,40,6,3,'cream');c.rect(25,40,7,4,'ink');c.rect(25,40,6,3,'cream')
    c.poly([(10,17+dy),(10,3+dy),(20,10+dy),(29,10+dy),(36,3+dy),(37,21+dy)],'ink')
    c.poly([(12,17+dy),(12,6+dy),(20,12+dy),(29,12+dy),(34,6+dy),(35,20+dy)],'fur')
    c.poly([(14,14+dy),(14,9+dy),(19,14+dy)],'rose');c.poly([(30,14+dy),(33,9+dy),(33,15+dy)],'rose')
    c.ellipse(23,21+dy,15,12,'ink');c.ellipse(23,20+dy,14,11,'amber');c.ellipse(22,19+dy,13,10,'fur');c.ellipse(23,25+dy,9,6,'cream')
    c.rect(20,10+dy,2,4,'rust');c.rect(24,10+dy,2,4,'rust');c.rect(28,12+dy,2,3,'rust')
    for x in [15,28]:
        if frame in [3,7]:c.line(x,21+dy,x+3,21+dy,'ink')
        else:c.rect(x,18+dy,4,5,'ink');c.dot(x,18+dy,'paper');c.dot(x+2,21+dy,'moss')
    c.rect(21,24+dy,3,2,'coral');c.dot(22,26+dy,'ink');c.dot(20,27+dy,'rust');c.dot(24,27+dy,'rust')
    for x in [8,32]:c.rect(x,25+dy,6,1,'copper');c.rect(x,28+dy,5,1,'rust')
    c.rect(14,31,18,3,'blue');c.rect(15,31,16,1,'aqua');c.rect(28,34,4,6,'blue');c.rect(28,39,4,1,'aqua');c.rect(22,33,3,3,'gold');c.dot(23,33,'paper')
    if frame==5:
        c.line(10,4,11,8,'night');c.line(11,4,14,7,'ink');c.dot(12,6,'fur')
    return c

def forge():
    c=Canvas(160,120)
    # Workshop plinth with cat-ear bellows and a small banked fire, no existing game reference.
    c.ellipse(80,103,54,8,'ink');c.ellipse(80,100,45,7,'wood');c.ellipse(80,97,38,6,'woodLight')
    c.rect(54,65,52,30,'ink');c.rect(56,67,48,26,'wood');c.rect(60,71,40,22,'rust')
    c.rect(68,73,25,20,'coffee');c.poly([(71,90),(73,78),(78,86),(83,75),(87,86),(90,81),(91,91)],'amber');c.poly([(75,90),(79,83),(83,87),(86,82),(88,91)],'gold')
    c.poly([(42,58),(114,58),(103,67),(91,68),(91,73),(67,73),(67,66),(47,65)],'ink')
    c.poly([(44,57),(115,57),(102,63),(64,63),(47,62)],'slate');c.rect(49,56,57,2,'mist');c.rect(58,54,38,2,'common')
    c.rect(28,88,8,10,'walnut');c.rect(29,87,7,2,'copper');cup(c,119,89)
    return c

assets={}
for ch in range(1,6):
    assets[f'room-{ch}.png']=room(ch);assets[f'foreground-{ch}.png']=foreground(ch)
frames=[mochi(i) for i in range(10)];sheet=Canvas(48*10,48)
for i,f in enumerate(frames):
    for y in range(48):sheet.p[(y*480+i*48)*4:(y*480+(i+1)*48)*4]=f.p[y*48*4:(y+1)*48*4]
assets['mochi-idle.png']=sheet;assets['mochi.png']=frames[0];assets['forge-hearth.png']=forge()
outputs={}
for name,c in assets.items():outputs[OUT/name]=c.export()
css='/* Generated by tools/art/visual.py. Do not edit. */\n:root {\n'+''.join(f'  --v-{k}: {v};\n' for k,v in P.items())+'}\n'
ts='// Generated by tools/art/visual.py. Original Evening Atelier palette.\nexport const VISUAL_PALETTE = '+json.dumps(P,indent=2)+' as const;\nexport const VISUAL_MOTION = { impactMs: 70, critStopMs: 60, settleMs: 480, idleMs: 5600, maxShakePx: 2 } as const;\n'
outputs[ROOT/'apps/web/src/visual/tokens.css']=css.encode();outputs[ROOT/'apps/web/src/visual/tokens.ts']=ts.encode()
manifest={'date':'2026-11-04','generator':'python3 -B tools/art/visual.py','palette':'tools/art/visual-palette.json','seed':0,'scale':'1 native pixel; integer CSS/scene scale; no interpolation','assets':[]}
for path,data in outputs.items():
    if path.suffix=='.png':
        im=decode_png(data);pixels={im.pixels[i:i+4] for i in range(0,len(im.pixels),4)}
        assert all(p[3]==0 or p in RGBA.values() for p in pixels), path
        assert all(p[3] in [0,255] for p in pixels),path
        manifest['assets'].append({'file':str(path.relative_to(ROOT)),'width':im.width,'height':im.height,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
    if CHECK:
        assert path.exists() and path.read_bytes()==data,f'{path}: drift, palette or pixel geometry changed; regenerate'
    else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
assert sum(a['bytes'] for a in manifest['assets'])<1500000
m=ROOT/'tools/art/visual-manifest.json';raw=(json.dumps(manifest,indent=2)+'\n').encode()
if CHECK:assert m.read_bytes()==raw,'manifest drift'
else:m.write_bytes(raw)
print(f"{'Checked' if CHECK else 'Generated'} {len(assets)} original assets, {sum(a['bytes'] for a in manifest['assets'])} bytes, {len(P)} colors")
