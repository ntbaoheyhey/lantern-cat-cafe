#!/usr/bin/env python3
"""Original ART2 coordinate drawings. No media inputs or third-party content."""
import hashlib
import html
import json
import platform
from pathlib import Path
import zlib
import pipeline

ROOT = Path(__file__).resolve().parents[2]
OUT = 'apps/web/public/ui-art2'
PALETTE = {'ink':'#100c18','bg':'#2a1f36','rim':'#4a3a5e','muted':'#72578d',
           'cream':'#fff3e0','amber':'#ffb86b','wood':'#c9701a','brown':'#734120',
           'gold':'#f0de96','cyan':'#8fd8ff','blue':'#1d437a','purple':'#bb74ff',
           'violet':'#5c2b8c','lilac':'#e5ccff','pink':'#ff8fb1','green':'#6be08a',
           'leaf':'#1f6937','silver':'#b9b6c9','steel':'#626c7c','rare':'#4aa8ff',
           'orange':'#ff9a3c'}
QUALITIES = {'common':('silver','steel','cream'),'uncommon':('green','leaf','cream'),
             'rare':('rare','blue','cyan'),'epic':('purple','violet','lilac'),
             'legendary':('orange','brown','gold')}
SKILLS = ['seamsweep','kettlepulse','hempair','windowthrust','rafterecho','lanternarc','mossparcel']
STATES = {'bag-empty':'An open quilted satchel with a folded lining and one loose thread.',
          'market-empty':'A quiet wooden market stand with an empty display cushion and a hanging lamp.',
          'forge-no-materials':'A small cold anvil beside an empty supply tray and neatly hung tongs.',
          'no-wallet':'An open coin purse with an empty centre and a loose clasp, without a currency symbol.',
          'offline':'A sleeping lamp beside a window with separated signal-like stars, without text.',
          'landing':'A warm cafe window above a sleeping original cat and a mug on a wooden counter.'}

class Canvas:
    def __init__(self,size): self.size=size; self.p=bytearray(size*size*4)
    def dot(self,x,y,color):
        assert 0<=x<self.size and 0<=y<self.size
        i=(y*self.size+x)*4;self.p[i:i+4]=bytes.fromhex(PALETTE[color][1:])+b'\xff' if color else bytes(4)
    def rect(self,x0,y0,x1,y1,color):
        for y in range(y0,y1+1):
            for x in range(x0,x1+1):self.dot(x,y,color)
    def poly(self,points,color):
        for y in range(self.size):
            for x in range(self.size):
                inside=False;j=len(points)-1
                for i,(xi,yi) in enumerate(points):
                    xj,yj=points[j]
                    if (yi>y+.5)!=(yj>y+.5) and x+.5<(xj-xi)*(y+.5-yi)/(yj-yi)+xi:inside=not inside
                    j=i
                if inside:self.dot(x,y,color)
    def diamond(self,x,y,r,color):
        for dy in range(-r,r+1):
            for dx in range(-r,r+1):
                if abs(dx)+abs(dy)<=r:self.dot(x+dx,y+dy,color)
    def oval(self,x,y,rx,ry,color):
        for dy in range(-ry,ry+1):
            for dx in range(-rx,rx+1):
                if dx*dx/(rx*rx)+dy*dy/(ry*ry)<=1:self.dot(x+dx,y+dy,color)

def frame(kind,quality,slot=False,skill=None):
    c=Canvas(48);accent,shade,light=QUALITIES[quality]
    c.poly([(8,2),(40,2),(46,8),(46,40),(40,46),(8,46),(2,40),(2,8)],'ink')
    c.rect(5,5,42,42,'rim');c.rect(8,8,39,39,None)
    c.rect(9,4,38,5,accent);c.rect(4,9,5,38,accent)
    c.rect(9,42,38,43,shade);c.rect(42,9,43,38,shade)
    for x,y in [(6,6),(41,6),(6,41),(41,41)]:c.diamond(x,y,2,accent)
    c.dot(5,5,light);c.dot(40,5,light)
    if kind=='pet':
        c.poly([(6,9),(8,2),(16,6)],'ink');c.poly([(32,6),(40,2),(42,9)],'ink')
        c.poly([(9,3),(13,6),(8,7)],'pink');c.poly([(35,6),(39,3),(40,7)],'pink')
    if kind=='skill':
        for y in [12,20,28,36]:c.rect(5,y,6,y+1,light)
        for i in range(SKILLS.index(skill)+1):c.dot(15+i*3,43,accent)
    if slot:
        if kind=='rune':
            c.diamond(24,24,11,'ink');c.diamond(24,24,9,shade);c.diamond(24,24,6,None)
            c.diamond(24,24,2,accent);c.dot(23,23,light)
        else:
            for x,y in [(17,19),(24,16),(31,19)]:c.oval(x,y,2,3,shade);c.dot(x,y-1,accent)
            c.oval(24,29,7,5,shade);c.oval(24,27,5,3,accent);c.dot(22,26,light)
    return pipeline.Image(48,48,bytes(c.p))

def scene(kind):
    c=Canvas(96)
    c.oval(48,81,38,6,'ink');c.rect(11,76,84,79,'brown');c.rect(11,76,84,76,'wood')
    if kind=='bag-empty':
        c.poly([(24,33),(70,33),(78,70),(68,78),(28,78),(18,69)],'ink')
        c.poly([(27,35),(68,35),(73,67),(65,74),(30,74),(23,67)],'brown')
        c.rect(27,47,68,51,'wood');c.rect(44,47,51,57,'gold');c.rect(46,49,49,53,'ink')
        c.oval(47,35,25,10,'ink');c.oval(47,34,21,6,'rim');c.rect(31,31,60,32,'lilac')
        c.rect(29,59,34,64,'amber');c.rect(59,59,64,64,'amber')
        c.rect(68,63,78,64,'lilac');c.rect(77,64,78,69,'lilac')
    elif kind=='market-empty':
        c.rect(19,24,22,75,'ink');c.rect(72,24,75,75,'ink');c.rect(23,59,71,65,'wood')
        c.rect(26,65,29,75,'brown');c.rect(66,65,69,75,'brown')
        c.poly([(14,28),(23,17),(71,17),(81,28),(77,37),(18,37)],'ink')
        c.poly([(19,28),(26,21),(69,21),(76,28),(73,33),(22,33)],'purple')
        for x in [28,42,56]:c.rect(x,22,x+4,32,'lilac')
        c.oval(47,58,17,3,'pink');c.rect(59,37,60,42,'gold');c.rect(55,43,64,52,'ink');c.rect(58,45,61,49,'amber')
    elif kind=='forge-no-materials':
        c.rect(34,63,58,75,'brown');c.rect(37,57,55,63,'steel')
        c.poly([(20,43),(62,43),(78,49),(63,55),(30,55),(20,50)],'ink')
        c.poly([(24,45),(61,45),(70,49),(60,51),(28,51)],'silver');c.rect(30,51,59,56,'steel')
        c.rect(65,67,82,73,'wood');c.rect(68,68,79,70,'ink')
        c.rect(23,23,25,39,'steel');c.rect(29,23,31,39,'steel');c.rect(25,35,29,37,'silver')
        c.rect(18,19,37,22,'brown');c.dot(22,20,'gold');c.dot(32,20,'gold')
    elif kind=='no-wallet':
        c.oval(48,54,28,22,'ink');c.oval(48,54,24,18,'purple')
        c.oval(48,40,25,11,'ink');c.oval(48,40,20,7,'rim');c.rect(32,34,63,35,'lilac')
        c.oval(34,29,3,3,'gold');c.oval(62,29,3,3,'gold');c.rect(34,30,36,35,'gold');c.rect(60,30,62,35,'gold')
        c.rect(30,59,32,64,'lilac');c.rect(36,68,59,69,'violet')
    elif kind=='offline':
        c.rect(45,18,77,55,'ink');c.rect(48,21,74,52,'blue');c.rect(60,21,62,52,'rim');c.rect(48,36,74,38,'rim')
        for x,y in [(53,27),(68,43),(69,27)]:c.diamond(x,y,1,'gold')
        c.rect(23,33,26,65,'brown');c.poly([(14,34),(19,23),(32,23),(38,34)],'ink');c.poly([(18,31),(21,26),(30,26),(34,31)],'steel')
        c.rect(16,66,34,70,'wood');c.rect(18,66,32,67,'gold');c.rect(38,71,43,72,'muted');c.rect(48,71,53,72,'muted')
    else:
        c.rect(17,12,77,52,'ink');c.rect(20,15,74,49,'blue');c.rect(45,15,48,49,'wood');c.rect(20,32,74,35,'wood')
        c.oval(63,23,5,5,'gold');c.oval(65,21,4,4,'blue')
        for x,y in [(28,23),(36,43),(64,43)]:c.diamond(x,y,1,'cream')
        c.oval(43,65,23,11,'ink');c.oval(43,64,20,9,'amber');c.oval(30,61,11,10,'wood')
        c.poly([(21,57),(22,47),(29,53),(35,48),(39,59)],'ink');c.poly([(24,55),(24,51),(29,56)],'pink')
        c.rect(24,61,28,62,'ink');c.rect(33,61,36,62,'ink');c.dot(30,65,'pink')
        c.rect(48,57,50,62,'brown');c.rect(54,58,56,63,'brown')
        c.oval(70,66,7,8,'cream');c.oval(76,65,5,4,'cream');c.oval(77,65,2,2,None);c.oval(69,59,5,2,'brown')
    return pipeline.Image(96,96,bytes(c.p))

def drawings():
    for kind in ['rune','pet']:
        for quality in QUALITIES:
            for slot in [False,True]:
                name=f'{kind}-{"slot" if slot else "frame"}-{quality}'
                prompt=f'Original {quality} {kind} '+('empty slot with a symbolic socket or paw impression' if slot else 'chamfered portrait rim with a transparent 32px centre')+'. Native48px, upper-left light, integer pixels, no text or media reference.'
                yield name,frame(kind,quality,slot),prompt
    for i,skill in enumerate(SKILLS):
        yield 'skill-frame-'+skill,frame('skill',list(QUALITIES)[i%5],skill=skill),f'Original48px stitched rim for the {skill} project skill icon, transparent32px centre and {i+1} small edge stitches; upper-left light, no text, no media inputs.'
    for kind,prompt in STATES.items():yield kind,scene(kind),prompt+' Original native96px illustration; integer pixels, upper-left light, no text, no external media.'

def write_exact(path,data):
    if path.exists():
        if path.read_bytes()!=data:raise FileExistsError('Refusing to replace existing art: '+str(path))
    else:pipeline.write_new(path,data)

def main():
    entries=[];script_hash=hashlib.sha256(Path(__file__).read_bytes()).hexdigest();palette=pipeline.load_palette()
    for name,image,prompt in drawings():
        assert pipeline.palette_lock(image,palette).pixels==image.pixels
        assert len({image.pixels[i:i+3] for i in range(0,len(image.pixels),4) if image.pixels[i+3]})<=16
        data=pipeline.encode_png(image);path=f'{OUT}/{name}.png';write_exact(ROOT/path,data)
        entries.append({'id':name,'path':path,'width':image.width,'height':image.height,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'prompt':prompt,'date':'2026-11-03','source':'Original coordinate drawing; no media input','tool':'Python coordinate raster + tools/art/pipeline.py','generator':'tools/art/ui_art2.py','generatorSha256':script_hash,'postProcessing':['native integer pixels','identity cafe-night-v1 palette lock','deterministic lossless PNG'],'runtime':{'python':platform.python_version(),'zlib':zlib.ZLIB_RUNTIME_VERSION}})
    registry={'schemaVersion':1,'palette':'cafe-night-v1','entries':entries}
    write_exact(ROOT/'tools/art/ui-art2.json',pipeline.json_bytes(registry))
    cards=''.join(f'<figure><img src="../../../{r["path"]}" width="{r["width"]*2}" height="{r["height"]*2}" alt="{html.escape(r["id"].replace("-"," "))}" loading="lazy"><figcaption>{r["id"]}<small>{r["width"]}px · {r["bytes"]} bytes</small></figcaption></figure>' for r in entries)
    document='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ART2 · Original pixel art</title><style>:root{color-scheme:dark;background:#120b19;color:#fff3e0;font:14px/1.5 system-ui}body{margin:24px}h1{color:#ffb86b}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}figure{margin:0;padding:16px;background:#2a1f36;border:2px solid #72578d;display:grid;justify-items:center;align-content:center;min-height:230px}img{image-rendering:pixelated;max-width:100%;object-fit:contain}figcaption{text-align:center;overflow-wrap:anywhere}small{display:block;color:#c3aed0}a{color:#ffb86b}</style><h1>ART2 · Original pixel art</h1><p>33 additive drawings. Five qualities, seven skill frames and six quiet-state illustrations. All use the existing cafe-night-v1 palette and integer pixels. Runtime display follows the existing default-off original economy flag.</p><main>'+cards+'</main></html>'
    write_exact(ROOT/'docs/ui/art/art2.html',document.encode())
    print(json.dumps({'assets':len(entries),'pngBytes':sum(r['bytes'] for r in entries),'largestPng':max(r['bytes'] for r in entries)}))

if __name__=='__main__':main()
