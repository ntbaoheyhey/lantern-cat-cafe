#!/usr/bin/env python3
"""Original ORIG1 icons authored as native coordinate drawings; no media inputs."""
import argparse
import hashlib
import html
import json
import platform
import zlib
from pathlib import Path
import subprocess
import sys

import pipeline

ROOT = Path(__file__).resolve().parents[2]
C = {
    'outline': '#100c18', 'cream': '#fff3e0', 'light': '#fff0d8',
    'silver': '#dad6e5', 'steel': '#a29cb0', 'metalshade': '#626c7c',
    'wood': '#c9701a', 'woodshade': '#734120', 'deepwood': '#3d200e',
    'gold': '#d0b064', 'goldlight': '#f0de96', 'amber': '#ffb86b',
    'pink': '#ff8fb1', 'red': '#ff6b6b', 'redshade': '#af2e52',
    'green': '#6be08a', 'leaf': '#3f9e5a', 'leafshade': '#1f6937',
    'cyan': '#8fd8ff', 'blue': '#4aa8ff', 'blueshade': '#1d437a',
    'lilac': '#e5ccff', 'purple': '#bb74ff', 'purpleshade': '#5c2b8c',
}
def rgba(name):
    value = C[name].lstrip('#')
    return bytes([int(value[i:i+2], 16) for i in (0, 2, 4)] + [255])

class Canvas:
    def __init__(self): self.p = bytearray(32 * 32 * 4)
    def dot(self, x, y, color):
        x, y = int(x), int(y)
        if 3 <= x <= 28 and 3 <= y <= 28:
            i = (y * 32 + x) * 4
            self.p[i:i+4] = rgba(color) if color else bytes(4)
    def rect(self, x0, y0, x1, y1, color):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): self.dot(x, y, color)
    def line(self, pts, color, width=1):
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            dx, dy = abs(x1-x0), -abs(y1-y0)
            sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
            error = dx + dy
            while True:
                for oy in range(width):
                    for ox in range(width): self.dot(x0+ox, y0+oy, color)
                if x0 == x1 and y0 == y1: break
                twice = 2 * error
                if twice >= dy: error += dy; x0 += sx
                if twice <= dx: error += dx; y0 += sy
    def poly(self, pts, color):
        for y in range(3, 29):
            for x in range(3, 29):
                inside = False
                j = len(pts)-1
                for i, (xi, yi) in enumerate(pts):
                    xj, yj = pts[j]
                    if (yi > y+.5) != (yj > y+.5) and x+.5 < (xj-xi)*(y+.5-yi)/(yj-yi)+xi:
                        inside = not inside
                    j = i
                if inside: self.dot(x, y, color)
    def ellipse(self, cx, cy, rx, ry, color):
        for y in range(3, 29):
            for x in range(3, 29):
                if ((x-cx)/rx)**2 + ((y-cy)/ry)**2 <= 1: self.dot(x, y, color)
    def heart(self, x=16, y=16, color='pink'):
        self.poly([(x-9,y-5),(x-6,y-8),(x-2,y-8),(x,y-5),(x+2,y-8),(x+6,y-8),(x+9,y-5),(x+9,y),(x,y+10),(x-9,y)],color)
    def star(self, x=16, y=16, color='goldlight'):
        self.poly([(x,y-10),(x+3,y-3),(x+10,y),(x+3,y+3),(x,y+10),(x-3,y+3),(x-10,y),(x-3,y-3)],color)
    def finish(self):
        original = bytes(self.p)
        for y in range(1, 31):
            for x in range(1, 31):
                if original[(y*32+x)*4+3]: continue
                if any(original[((y+dy)*32+x+dx)*4+3] for dx in (-1,0,1) for dy in (-1,0,1)):
                    self.p[(y*32+x)*4:(y*32+x)*4+4] = rgba('outline')
        return pipeline.Image(32,32,bytes(self.p))

def fish(c, x=16, y=16):
    c.ellipse(x,y,8,5,'cyan');c.poly([(x+6,y),(x+12,y-5),(x+12,y+5)],'blue')
    c.line([(x-6,y-2),(x-2,y-4),(x+2,y-4)],'cream');c.dot(x-4,y-1,'outline')

def paw(c, x, y, color='pink'):
    c.ellipse(x,y+3,4,4,color)
    for dx,dy in [(-4,-2),(0,-4),(4,-2)]: c.ellipse(x+dx,y+dy,1,2,color)

def draw_item(c, name):
    if name == 'seamblade':
        c.poly([(8,23),(15,10),(24,3),(27,4),(24,12),(13,25)],'steel')
        c.line([(10,22),(17,10),(24,5)],'cream',2);c.line([(15,23),(23,13),(26,6)],'metalshade')
        c.line([(6,27),(12,21)],'woodshade',3);c.line([(7,26),(11,22)],'amber')
        c.line([(7,20),(15,25)],'goldlight',2)
    elif name == 'kettlemaul':
        c.line([(13,28),(16,13)],'woodshade',4);c.line([(13,26),(15,16)],'wood')
        c.poly([(8,7),(12,4),(24,4),(28,8),(27,16),(23,19),(11,17),(7,13)],'steel')
        c.rect(12,5,23,7,'silver');c.line([(9,9),(9,13),(13,16),(23,17)],'metalshade',2)
        c.rect(12,10,24,12,'gold');c.rect(15,9,17,11,'goldlight');c.dot(22,14,'outline')
    elif name == 'hemknives':
        for shift in (0,14):
            c.poly([(5+shift,20),(7+shift,8),(11+shift,4),(13+shift,6),(11+shift,21)],'steel')
            c.line([(7+shift,18),(9+shift,9),(11+shift,6)],'cream')
            c.rect(6+shift,21,9+shift,27,'woodshade');c.rect(5+shift,19,12+shift,21,'gold')
            c.dot(7+shift,24,'goldlight')
    elif name == 'windowpike':
        c.line([(5,28),(22,8)],'woodshade',3);c.line([(6,27),(21,9)],'gold')
        c.poly([(19,6),(28,3),(26,13),(23,14)],'steel');c.poly([(21,7),(27,4),(23,11)],'cream')
        c.line([(19,12),(23,16)],'goldlight',2)
    elif name == 'rafterbow':
        c.line([(23,4),(16,5),(10,10),(8,16),(11,23),(17,27),(23,28)],'woodshade',3)
        c.line([(22,5),(16,7),(12,11),(10,16),(13,22),(18,25),(23,26)],'wood')
        c.line([(24,5),(24,27)],'cream');c.line([(4,16),(27,16)],'goldlight')
        c.poly([(28,16),(23,12),(23,20)],'silver');c.line([(5,13),(8,16),(5,19)],'blue')
    elif name == 'lanternrod':
        c.line([(11,28),(17,13)],'woodshade',3);c.line([(12,27),(17,15)],'gold')
        c.ellipse(18,6,3,3,'gold');c.ellipse(18,6,1,1,None)
        c.poly([(12,9),(24,9),(23,20),(14,20)],'gold');c.rect(15,11,21,17,'amber')
        c.rect(15,11,17,15,'goldlight');c.dot(16,12,'cream');c.line([(12,9),(18,7),(24,9)],'goldlight')
        c.rect(14,19,23,21,'woodshade')
    elif name == 'mossflasks':
        for x,y,color,shade in [(10,17,'green','leaf'),(23,23,'cyan','blue')]:
            c.ellipse(x,y,6,7,color);c.rect(x-2,y-12,x+2,y-5,'steel');c.rect(x-3,y-12,x+3,y-10,'wood')
            c.poly([(x-5,y+1),(x+5,y-1),(x+4,y+6),(x-3,y+6)],shade)
            c.line([(x-3,y-3),(x-4,y),(x-3,y+2)],'cream');c.rect(x-5,y+3,x+5,y+4,'gold')
    elif name == 'quiltcap':
        c.poly([(5,19),(7,11),(12,6),(20,6),(25,11),(27,20)],'purple')
        c.poly([(7,17),(10,10),(14,8),(18,8),(18,18)],'lilac')
        c.rect(4,19,28,25,'gold');c.rect(5,19,27,21,'goldlight');c.rect(18,11,23,16,'pink')
        c.line([(18,11),(23,16)],'purpleshade');c.dot(9,23,'cream');c.dot(13,23,'cream')
    elif name == 'porchcoat':
        c.poly([(5,10),(11,6),(20,6),(27,10),(28,18),(23,20),(22,28),(9,28),(8,20),(3,17)],'woodshade')
        c.poly([(10,8),(15,11),(15,26),(10,26)],'amber');c.poly([(18,10),(21,8),(22,26),(18,26)],'wood')
        c.line([(11,7),(15,12),(19,7)],'goldlight',2);c.rect(7,13,10,17,'gold');c.rect(22,13,26,17,'gold')
        c.rect(10,20,13,23,'cream');c.rect(19,20,22,23,'pink');c.dot(16,17,'goldlight');c.dot(16,23,'goldlight')
    elif name == 'spoolmitts':
        for shift in (0,15):
            c.poly([(4+shift,11),(6+shift,8),(11+shift,9),(13+shift,13),(12+shift,22),(6+shift,22),(3+shift,16)],'amber')
            c.rect(5+shift,20,12+shift,27,'woodshade');c.rect(5+shift,21,12+shift,22,'goldlight');c.rect(5+shift,25,12+shift,26,'gold')
            c.line([(6+shift,10),(5+shift,15),(7+shift,18)],'cream')
    elif name == 'eaveboots':
        for shift in (0,15):
            c.poly([(5+shift,6),(12+shift,6),(11+shift,19),(13+shift,22),(13+shift,27),(3+shift,27),(3+shift,23),(6+shift,19)],'woodshade')
            c.rect(6+shift,7,10+shift,10,'goldlight');c.line([(7+shift,12),(7+shift,18),(5+shift,22),(11+shift,23)],'wood',2)
            c.rect(4+shift,26,13+shift,28,'metalshade')
    elif name == 'chimecollar':
        c.ellipse(16,13,11,8,'purple');c.ellipse(16,12,8,5,None)
        c.line([(7,10),(9,7),(16,5),(22,7)],'lilac');c.rect(14,18,18,21,'goldlight')
        c.poly([(13,22),(14,20),(19,20),(20,22),(21,27),(12,27)],'gold');c.rect(15,21,17,25,'goldlight');c.dot(16,28,'woodshade')
    elif name == 'pantrystud':
        c.line([(7,5),(11,7),(14,12)],'goldlight',2)
        c.poly([(16,8),(26,13),(26,23),(17,28),(9,22),(9,14)],'gold')
        c.poly([(16,11),(23,15),(23,21),(17,25),(12,20),(12,15)],'cyan')
        c.line([(16,11),(12,15),(12,19)],'cream');c.ellipse(17,18,3,2,'blue');c.poly([(19,18),(22,16),(22,20)],'blue')
    elif name == 'hemring':
        c.ellipse(16,17,10,11,'gold');c.ellipse(16,16,6,7,None)
        c.line([(7,16),(8,10),(12,7),(18,7),(23,10)],'goldlight',2)
        c.line([(10,23),(15,26),(21,24)],'woodshade',2);c.line([(19,6),(23,11),(20,15)],'lilac',2)
        c.dot(11,9,'cream')
    elif name == 'purrcharm':
        c.line([(14,6),(16,3),(19,6),(17,10)],'cyan',2)
        c.ellipse(16,19,10,10,'woodshade');c.ellipse(15,18,8,8,'amber');c.ellipse(13,16,4,3,'goldlight')
        paw(c,17,18,'pink');c.dot(11,12,'cream')
    else: raise ValueError(name)

def draw_stat(c, name):
    if name == 'hp':
        c.heart();c.poly([(17,12),(24,10),(24,17),(16,25)],'redshade');c.line([(9,13),(9,11),(12,10)],'cream',2)
    elif name == 'atk':
        c.poly([(6,24),(21,7),(26,4),(28,6),(24,12),(11,27)],'silver');c.line([(8,23),(23,7)],'cream',2)
        c.line([(6,19),(14,27)],'gold',2);c.line([(5,28),(10,23)],'woodshade',3)
    elif name == 'def':
        c.poly([(5,7),(16,3),(27,7),(25,20),(16,28),(7,20)],'gold')
        c.poly([(8,9),(16,6),(24,9),(22,18),(16,24),(10,18)],'purple');c.line([(16,7),(16,23)],'lilac')
        c.line([(9,13),(23,13)],'lilac');c.dot(12,10,'cream')
    elif name == 'attackSpeed':
        c.poly([(5,8),(15,14),(5,20),(5,16),(10,14),(5,12)],'cyan')
        c.poly([(15,8),(27,16),(15,24),(15,19),(21,16),(15,13)],'goldlight')
        c.line([(5,25),(12,25)],'blue',2);c.line([(4,5),(11,5)],'cream')
    elif name == 'critChance':
        c.poly([(3,16),(9,9),(16,6),(23,9),(29,16),(23,23),(16,26),(9,23)],'silver')
        c.ellipse(16,16,7,8,'blue');c.star(16,16,'goldlight');c.rect(14,14,17,17,'cream')
    elif name == 'critDamage':
        c.poly([(16,3),(20,10),(27,7),(24,15),(29,20),(21,21),(20,28),(14,23),(6,27),(8,19),(3,13),(12,11)],'redshade')
        c.star(16,16,'amber');c.poly([(16,8),(20,16),(16,23),(11,16)],'goldlight');c.dot(15,13,'cream')
    elif name == 'dodge':
        paw(c,10,20,'cyan');paw(c,23,9,'blue');c.line([(5,10),(9,7),(14,7)],'silver');c.line([(19,26),(23,24),(27,21)],'silver')
    elif name == 'hpRegen':
        c.heart(16,17,'green');c.poly([(17,11),(27,4),(26,14),(20,17)],'leaf')
        c.line([(18,15),(25,7)],'cream');c.line([(8,15),(11,12)],'goldlight',2)
    elif name == 'fishBonus':
        c.rect(6,18,27,27,'woodshade');c.line([(7,20),(26,20)],'gold',2);c.line([(9,24),(24,24)],'wood')
        fish(c,14,12)
    elif name == 'xpBonus':
        c.poly([(6,5),(25,5),(25,27),(6,27)],'gold');c.rect(7,6,22,24,'cream');c.rect(7,6,10,24,'lilac')
        c.rect(13,18,15,20,'purple');c.rect(16,14,18,16,'purple');c.rect(19,10,21,12,'purple')
    elif name == 'materialFind':
        c.poly([(6,12),(9,7),(19,7),(23,13),(22,26),(7,26)],'woodshade');c.rect(9,10,19,12,'goldlight')
        c.ellipse(20,18,6,6,'cyan');c.ellipse(20,18,3,3,'blueshade');c.line([(24,23),(28,28)],'gold',2)
    elif name == 'bossDamage':
        c.poly([(5,28),(5,10),(11,4),(21,4),(27,10),(27,28)],'metalshade');c.rect(10,11,22,28,'woodshade')
        c.line([(8,10),(12,7),(21,7)],'silver',2)
        for x in (12,17,22): c.line([(x,13),(x-4,24)],'red',2)
    else: raise ValueError(name)

def draw_skill(c, name):
    if name == 'seamsweep':
        c.poly([(27,5),(20,8),(13,14),(9,21),(7,28),(4,20),(7,12),(15,6)],'cyan')
        c.line([(25,6),(16,10),(10,17),(7,24)],'cream',2)
        for x,y in [(17,17),(21,14),(25,11)]:c.rect(x,y,x+1,y+1,'gold')
    elif name == 'kettlepulse':
        c.ellipse(16,18,12,9,'gold');c.ellipse(16,18,9,6,None);c.ellipse(16,18,6,4,'amber');c.ellipse(16,18,3,2,None)
        c.line([(16,4),(16,15)],'silver',3);c.line([(11,10),(17,16),(23,10)],'cream',2)
    elif name == 'hempair':
        c.poly([(4,24),(6,15),(14,7),(20,4),(13,13),(9,25)],'lilac')
        c.poly([(13,28),(16,18),(24,10),(28,9),(23,18),(18,28)],'purple')
        c.line([(7,21),(10,15),(15,10)],'cream');c.line([(17,25),(21,18),(25,14)],'pink')
    elif name == 'windowthrust':
        c.poly([(4,28),(10,17),(20,7),(25,6),(28,3),(27,12),(17,13),(8,25)],'blue')
        c.line([(7,25),(23,9)],'cream',2);c.line([(5,16),(12,9)],'cyan');c.line([(17,27),(26,18)],'cyan')
    elif name == 'rafterecho':
        for y in (10,22):
            c.line([(4,y),(26,y)],'goldlight',2);c.poly([(28,y+1),(22,y-4),(22,y+6)],'cyan');c.line([(5,y-3),(9,y+1),(5,y+5)],'blue')
        c.line([(12,14),(15,16),(12,18)],'lilac')
    elif name == 'lanternarc':
        c.line([(5,24),(6,14),(13,6),(23,5),(28,11)],'gold',3);c.line([(7,20),(9,13),(15,8),(22,7)],'goldlight')
        c.star(19,19,'amber');c.poly([(19,13),(23,19),(19,25),(15,19)],'cream')
    elif name == 'mossparcel':
        c.poly([(6,11),(16,6),(26,11),(26,24),(16,29),(6,24)],'leafshade')
        c.poly([(7,13),(15,17),(15,27),(7,23)],'leaf');c.poly([(17,17),(25,13),(25,23),(17,27)],'green')
        c.line([(16,8),(16,27)],'goldlight',2);c.line([(7,12),(16,16),(25,12)],'goldlight')
        c.poly([(14,10),(9,5),(15,5),(18,10),(24,5),(26,7),(20,13)],'green');c.dot(12,7,'cream')
    else: raise ValueError(name)

SPECS = {
 'stat': {
  'hp':'A stitched pink heart with a clear cream glint and shaded lower lobe.',
  'atk':'An upward steel strike with a brass guard and a cloth grip.',
  'def':'A quilted shield with stitched seams and a warm brass rim.',
  'attackSpeed':'Two forward step arrows with short motion dashes.',
  'critChance':'A bright star centered in a watchful blue eye.',
  'critDamage':'A sharp amber impact star over a jagged red burst.',
  'dodge':'Two separated pawprints moving around a curved path.',
  'hpRegen':'A green heart cradled by a fresh leaf.',
  'fishBonus':'A small blue fish resting above a woven pantry basket.',
  'xpBonus':'A cream notebook with three ascending square trail marks, no letters.',
  'materialFind':'A cloth supply pouch with a blue inspection lens.',
  'bossDamage':'A household gate marked by three diagonal claw scratches.',
 },
 'item': {
  'seamblade':'A curved saber with a stitched grip, brass guard and steel edge.',
  'kettlemaul':'A rounded hollow maul head with a low brass band and wooden haft.',
  'hemknives':'Two separated narrow apron knives with warm cloth handles.',
  'windowpike':'A long diagonal wooden pike with a small bright steel point.',
  'rafterbow':'A curved attic-wood bow, taut cream cord and a single ready arrow.',
  'lanternrod':'A shaded brass lantern atop a slanted wooden staff.',
  'mossflasks':'Two green and blue flasks in protective sleeves with cork tops.',
  'quiltcap':'A folded cloth cap with one stitched patch and a padded brim.',
  'porchcoat':'A broad patched evening coat with distinct cuffs and buttons.',
  'spoolmitts':'Two separated padded mitts with thread-wrapped wrist cuffs.',
  'eaveboots':'Two quiet leather boots with pale folded tops and sturdy soles.',
  'chimecollar':'A lilac collar loop with a small golden first-watch bell.',
  'pantrystud':'A polished brass ear clasp with a blue pantry-fish inset.',
  'hemring':'A smooth golden ring wrapped with one loose lilac thread.',
  'purrcharm':'A warm round keepsake with a pink paw and a short blue tie.',
 },
 'skill': {
  'seamsweep':'One sweeping cyan crescent with three small stitch sparks.',
  'kettlepulse':'Concentric brass pulse rings under a descending bright strike.',
  'hempair':'Two separated diagonal lilac cuts with different lengths.',
  'windowthrust':'A narrow blue thrust with a bright leading point and side streaks.',
  'rafterecho':'Two parallel arrow notes joined by one small echo mark.',
  'lanternarc':'A curved brass arc ending in a warm lantern-like spark.',
  'mossparcel':'A leaf-wrapped green poultice parcel with a bright tie.',
 },
}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,required=True);parser.add_argument('--date',required=True);args=parser.parse_args()
    args.out.mkdir(parents=True,exist_ok=False)
    for folder in ['raw','snapped','locked','trimmed','padded','final']: (args.out/folder).mkdir()
    palette=pipeline.load_palette();allowed={bytes(p[:3]) for p in palette};entries=[];commands=[]
    def run(command):
        result=subprocess.run([sys.executable,str(ROOT/'tools/art/pipeline.py')]+command,capture_output=True,text=True)
        commands.append({'args':command,'exit':result.returncode,'output':(result.stdout+result.stderr).strip()})
        if result.returncode: raise RuntimeError(result.stdout+result.stderr)
    for kind,items in SPECS.items():
        for key,brief in items.items():
            asset_id=f'{kind}-{key.lower()}';c=Canvas();{'stat':draw_stat,'item':draw_item,'skill':draw_skill}[kind](c,key)
            image=c.finish();raw=args.out/'raw'/f'{asset_id}.png';pipeline.write_new(raw,pipeline.encode_png(image))
            snap=args.out/'snapped'/raw.name;locked=args.out/'locked'/raw.name;trimmed=args.out/'trimmed'/raw.name;padded=args.out/'padded'/raw.name;final=args.out/'final'/raw.name
            run(['snap',str(raw),str(snap),'--width','32','--height','32']);run(['lock',str(snap),str(locked)])
            run(['trim',str(locked),str(trimmed),'--metadata',str(trimmed.with_suffix('.json'))]);run(['pad',str(trimmed),str(padded),'--width','32','--height','32']);run(['optimize',str(padded),str(final)]);run(['check',str(final),'--width','32','--height','32'])
            result=pipeline.decode_png(final.read_bytes());bounds=[(x,y) for y in range(32) for x in range(32) if result.at(x,y)[3]]
            assert bounds and min(x for x,y in bounds)>=2 and max(x for x,y in bounds)<=29 and min(y for x,y in bounds)>=2 and max(y for x,y in bounds)<=29
            assert all(result.at(x,y)[:3] in allowed for x,y in bounds)
            entries.append({'id':asset_id,'kind':kind,'key':key,'path':f'final/{asset_id}.png','width':32,'height':32,'sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'prompt':'Original32x32 native pixel icon. '+brief+' One-pixel object contour, top-left light,2px safe padding, cafe-night-v1 palette, binary alpha, no text, gradients or external media.','date':args.date,'tool':'Codex-authored Python coordinate drawing + tools/art/pipeline.py','imageModel':None,'seed':None,'palette':'cafe-night-v1'})
    run(['sheet',str(args.out/'atlas')]+[str(args.out/e['path']) for e in entries]+['--columns','8','--fps','12'])
    report={'schemaVersion':1,'runtime':{'python':platform.python_version(),'zlib':zlib.ZLIB_RUNTIME_VERSION,'zlibCompile':zlib.ZLIB_VERSION},'scope':'34 original static icons; atlas order is lookup order, not an animation','date':args.date,'generatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'palette':'cafe-night-v1','externalMediaInputs':[],'entries':entries,'commands':commands}
    pipeline.write_new(args.out/'provenance.json',pipeline.json_bytes(report))
    figures=''.join('<figure><img src="'+html.escape(e['path'])+'" alt=""><figcaption>'+html.escape(e['id'])+'</figcaption></figure>' for e in entries)
    document='''<!doctype html><meta charset="utf-8"><title>Original icon review</title><style>body{margin:16px;background:#2a1f36;color:#fff3e0;font:12px monospace}main{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}figure{margin:0;min-height:126px;display:grid;place-items:center;border:1px solid #72578d}img{width:96px;height:96px;image-rendering:pixelated}figcaption{font-size:11px}body.light{background:#fff3e0;color:#100c18}body.silhouette img{filter:brightness(0)}</style><h1>Original ORIG1 icons — native32px</h1><main>'''+figures+'''</main><script>const p=new URLSearchParams(location.search);document.body.className=p.get('theme')||'';const scale=Number(p.get('scale')||3);for(const image of document.images){image.style.width=32*scale+'px';image.style.height=32*scale+'px';}</script>'''
    pipeline.write_new(args.out/'review.html',document.encode())
    print(f'{len(entries)} original icons passed the full pipeline; review at {args.out}/review.html')

if __name__=='__main__':main()
