#!/usr/bin/env python3
"""Original pixel UI drawings. No media inputs; Python standard library only."""
import argparse
import base64
import hashlib
import importlib.util
import json
import platform
from pathlib import Path
import sys
import zlib

COLORS = {
    'ink': '#100c18', 'rim': '#4a3a5e', 'muted': '#72578d', 'cream': '#fff3e0',
    'amber': '#ffb86b', 'wood': '#c9701a', 'brown': '#734120', 'gold': '#f0de96',
    'cyan': '#8fd8ff', 'blue': '#1d437a', 'purple': '#bb74ff', 'violet': '#5c2b8c',
    'lilac': '#e5ccff', 'pink': '#ff8fb1', 'rose': '#af2e52',
}
SPECS = [
    ('frame-rune', 48, 'Rune frame', 'ui.rune-slot', 'An original chamfered cyan slot rim with four tiny corner gems, upper-left light and a transparent32px centre.'),
    ('frame-pet', 48, 'Companion frame', 'ui.pet-slot', 'An original amber slot rim with two small cat-ear corners, pink inner-ear pixels and a transparent32px centre.'),
    ('frame-skill', 48, 'Skill frame', 'ui.skill-slot', 'An original violet slot rim with short stitched edge ticks, lilac highlights and a transparent32px centre.'),
    ('empty-rune', 32, 'Empty rune slot', 'ui.empty-rune', 'An original hollow diamond socket in muted plum with a small cyan centre glint; no letters or game meaning.'),
    ('empty-pet', 32, 'Empty companion slot', 'ui.empty-pet', 'An original three-toe pink paw impression with a rose lower pad and one cream glint; no character reference.'),
    ('empty-skill', 32, 'Empty skill slot', 'ui.empty-skill', 'An original small violet diamond tile carrying a cream angular spark; no reference icon or named skill.'),
    ('empty-catalog', 32, 'Quiet catalog', 'ui.empty-catalog', 'An original blank cream ledger with an amber bookmark and three neutral page strokes, drawn on a native32px grid.'),
    ('welcome-parcel', 64, 'Welcome parcel', 'ui.welcome-parcel', 'An original warm paper parcel seen at a slight angle, a cyan ribbon and bow, dark pixel outlines and two tiny glints. Native64px, no text or media reference.'),
]

class Canvas:
    def __init__(self, size): self.size = size; self.pixels = bytearray(size * size * 4)
    def dot(self, x, y, color):
        assert 0 <= x < self.size and 0 <= y < self.size
        value = bytes(4) if color is None else bytes.fromhex(COLORS[color][1:]) + bytes([255])
        i = (y * self.size + x) * 4; self.pixels[i:i + 4] = value
    def rect(self, x0, y0, x1, y1, color):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): self.dot(x, y, color)
    def polygon(self, points, color):
        for y in range(self.size):
            for x in range(self.size):
                inside = False; j = len(points) - 1
                for i, (xi, yi) in enumerate(points):
                    xj, yj = points[j]
                    if (yi > y + .5) != (yj > y + .5) and x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi: inside = not inside
                    j = i
                if inside: self.dot(x, y, color)
    def diamond(self, cx, cy, radius, color):
        for y in range(cy - radius, cy + radius + 1):
            for x in range(cx - radius, cx + radius + 1):
                if abs(x - cx) + abs(y - cy) <= radius: self.dot(x, y, color)
    def ellipse(self, cx, cy, rx, ry, color):
        for y in range(cy - ry, cy + ry + 1):
            for x in range(cx - rx, cx + rx + 1):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1: self.dot(x, y, color)

def draw(asset_id, size):
    c = Canvas(size)
    if asset_id.startswith('frame-'):
        kind = asset_id[6:]
        accent, shade, light = {'rune': ('cyan', 'blue', 'cream'), 'pet': ('amber', 'brown', 'gold'), 'skill': ('purple', 'violet', 'lilac')}[kind]
        c.polygon([(8,2),(40,2),(46,8),(46,40),(40,46),(8,46),(2,40),(2,8)], 'ink')
        c.rect(5,5,42,42,'rim'); c.rect(8,8,39,39,None)
        c.rect(9,4,38,5,accent); c.rect(4,9,5,38,accent)
        c.rect(9,42,38,43,shade); c.rect(42,9,43,38,shade)
        for x,y in [(6,6),(41,6),(6,41),(41,41)]: c.diamond(x,y,2,accent)
        c.dot(5,5,light); c.dot(40,5,light)
        if kind == 'pet':
            c.polygon([(6,8),(8,2),(15,5)],'ink'); c.polygon([(33,5),(40,2),(42,8)],'ink')
            c.polygon([(9,3),(12,5),(8,6)],'pink'); c.polygon([(36,5),(39,3),(40,6)],'pink')
        elif kind == 'skill':
            for y in [12,20,28,36]: c.rect(5,y,6,y+1,light); c.rect(41,y,42,y+1,shade)
    elif asset_id == 'empty-rune':
        c.diamond(16,16,12,'ink'); c.diamond(16,16,10,'muted'); c.diamond(16,16,7,None)
        c.diamond(16,16,2,'cyan'); c.dot(15,15,'cream')
    elif asset_id == 'empty-pet':
        for x,y in [(9,10),(16,7),(23,10)]:
            c.ellipse(x,y,3,4,'ink'); c.ellipse(x,y,2,3,'pink')
        c.ellipse(16,21,8,6,'ink'); c.ellipse(16,20,6,4,'pink'); c.rect(12,23,20,24,'rose'); c.dot(13,18,'cream')
    elif asset_id == 'empty-skill':
        c.diamond(16,16,12,'ink'); c.diamond(16,16,10,'violet'); c.diamond(16,16,8,'purple')
        c.polygon([(14,8),(21,8),(17,15),(22,15),(11,25),(14,18),(10,18)],'cream')
    elif asset_id == 'empty-catalog':
        c.rect(5,4,26,28,'ink'); c.rect(7,5,24,26,'cream'); c.rect(7,5,9,26,'muted')
        c.rect(20,5,22,15,'amber'); c.polygon([(20,15),(23,15),(23,18),(21,16),(20,18)],'amber')
        for y in [12,17,22]: c.rect(12,y,17,y,'muted')
    else:
        c.polygon([(7,28),(30,15),(57,27),(57,50),(32,62),(7,49)],'ink')
        c.polygon([(10,29),(30,18),(54,28),(32,39)],'amber')
        c.polygon([(10,32),(30,42),(30,58),(10,47)],'wood')
        c.polygon([(33,42),(54,31),(54,48),(33,58)],'brown')
        c.polygon([(24,22),(30,19),(39,23),(33,27)],'gold')
        c.polygon([(25,23),(31,20),(47,28),(41,31)],'cyan')
        c.rect(29,40,33,58,'blue'); c.rect(29,40,31,58,'cyan')
        for x in [25,38]: c.ellipse(x,15,7,4,'ink'); c.ellipse(x,14,5,2,'cyan')
        c.rect(29,13,33,19,'blue'); c.rect(29,13,31,17,'cream')
        c.diamond(9,12,2,'gold'); c.diamond(52,10,2,'cream')
    return bytes(c.pixels)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--out', default='apps/web/src/art/ui-slots')
    parser.add_argument('--manifest', default='tools/art/ui-slots.json')
    parser.add_argument('--date', default='2026-11-03')
    parser.add_argument('--preview', action='store_true', help='Return a PNG data URL; write no files.')
    args = parser.parse_args(); repo = args.repo.resolve()
    sys.path.insert(0,str(repo/'tools/art')); import pipeline
    palette = pipeline.load_palette(repo/'tools/art/palette.json')
    images = {}; encoded = {}
    for asset_id,size,label,catalog_id,prompt in SPECS:
        original = pipeline.Image(size,size,draw(asset_id,size))
        image = pipeline.palette_lock(pipeline.snap(original,size,size),palette)
        assert image.pixels == original.pixels, 'Drawing must already use the locked palette.'
        assert len({image.pixels[i:i+4] for i in range(0,len(image.pixels),4) if image.pixels[i+3]}) <= 16
        images[asset_id] = image; encoded[asset_id] = pipeline.optimize_png(pipeline.encode_png(image))
    if args.preview:
        sheet,_ = pipeline.pack(images,columns=4,gutter=4)
        print('data:image/png;base64,'+base64.b64encode(pipeline.encode_png(sheet)).decode()); return
    output = (repo/args.out).resolve(); manifest_path = (repo/args.manifest).resolve()
    assert str(output.relative_to(repo)).startswith(('apps/web/src/art/','apps/web/public/'))
    if output.exists() or manifest_path.exists(): raise FileExistsError('Use new output paths; existing assets are never replaced.')
    script_hash = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    entries=[]
    for asset_id,size,label,catalog_id,prompt in SPECS:
        path = output/(asset_id+'.png'); pipeline.write_new(path,encoded[asset_id])
        entries.append({'id':asset_id,'catalogId':catalog_id,'label':label,'width':size,'height':size,'frames':1,'path':str(path.relative_to(repo)),
            'sha256':hashlib.sha256(encoded[asset_id]).hexdigest(),'prompt':prompt,'date':args.date,'source':'Original coordinate drawing; no media inputs',
            'tool':'Python coordinate raster + tools/art/pipeline.py','generator':'tools/art/ui_slots.py','generatorSha256':script_hash,
            'seed':None,'imageModel':None,'license':'original, made for this project','postProcessing':['native integer pixels','identity snap','cafe-night-v1 palette lock','lossless optimize'],
            'runtime':{'python':platform.python_version(),'zlib':zlib.ZLIB_RUNTIME_VERSION}})
    obj={'schemaVersion':1,'palette':'cafe-night-v1','date':args.date,'entries':entries}
    pipeline.write_new(manifest_path,pipeline.json_bytes(obj))
    print(json.dumps({'assets':len(entries),'manifest':str(manifest_path.relative_to(repo))}))

if __name__ == '__main__': main()
