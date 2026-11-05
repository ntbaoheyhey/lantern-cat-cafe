#!/usr/bin/env python3
"""Original 24px patrol creatures and 16/24px badges. No input images or network.
Exact geometry below; locked Evening Atelier palette; seed0; native scale1; upper-left light.
"""
import hashlib, json
from gameplay import Canvas, ROOT, CHECK, files, save

KINDS=['scout','swift','armored','splitter','thief','treasure','hazard','cafe']
def eyes(c,x,y):
 for dx in [0,5]: c.rect(x+dx,y,2,3,'ink');c.dot(x+dx,y,'paper')
 c.dot(x+3,y+4,'rose')
def creature(kind):
 c=Canvas(24,24)
 if kind=='scout':
  for x,y,r in [(7,14,4),(12,11,6),(17,15,4),(11,17,6)]:c.oval(x,y,r,r-1,'mist')
  c.oval(10,11,4,3,'common');c.oval(10,10,2,1,'paper');c.line(8,7,6,3,'mist');c.line(14,6,17,2,'common');eyes(c,9,12)
 elif kind=='swift':
  c.poly([(10,3),(19,4),(17,15),(21,17),(20,21),(9,21),(6,17),(10,13)],'rose')
  c.rect(11,3,8,3,'cream');c.rect(11,7,7,2,'plum');c.line(11,8,10,14,'paper');eyes(c,11,10)
  for x,y in [(2,8),(1,14),(3,19)]:c.line(x,y,x+4,y,'aqua')
 elif kind=='armored':
  c.oval(12,15,9,6,'slate');c.oval(11,12,9,6,'mist');c.oval(10,10,6,3,'common');c.line(5,9,9,7,'paper')
  c.rect(4,16,16,3,'teal');eyes(c,8,12);c.poly([(15,11),(21,12),(20,19),(17,21),(14,17)],'gold');c.rect(16,13,3,4,'wood')
 elif kind=='splitter':
  for x,y,mid in [(8,13,'rose'),(16,16,'epic')]:
   c.oval(x,y,6,6,'plum');c.oval(x-1,y-1,5,5,mid);c.line(x-3,y-3,x+2,y+2,'cream');c.line(x-3,y+1,x+2,y-3,'wood');c.dot(x,y,'ink')
  c.line(3,18,1,21,'rose');c.line(18,21,22,22,'epic')
 elif kind in ['thief','treasure']:
  color='gold' if kind=='treasure' else 'common'
  c.line(18,18,22,15,'rose');c.line(22,15,21,12,'rose');c.oval(12,16,7,5,color);c.oval(9,11,5,5,color)
  c.oval(6,7,3,3,'rose');c.oval(12,7,3,3,'rose');c.dot(5,12,'ink');c.rect(9,11,2,2,'ink');c.dot(9,10,'paper')
  if kind=='treasure':
   c.poly([(4,6),(3,2),(7,4),(10,1),(13,4),(16,2),(15,6)],'gold');c.rect(6,5,8,2,'cream');c.oval(15,18,4,3,'rust');c.oval(14,17,3,2,'gold');c.dot(13,16,'paper')
  else:
   c.rect(5,9,9,2,'wine');c.dot(8,9,'paper');c.oval(16,18,4,4,'plum');c.oval(15,17,3,3,'epic');c.dot(14,17,'ink');c.dot(16,18,'ink')
 elif kind=='hazard':
  c.oval(12,19,10,3,'aqua');c.oval(14,18,7,2,'teal');c.rect(6,6,10,10,'cream');c.rect(7,7,7,7,'paper');c.rect(16,8,4,5,'copper');c.rect(17,9,2,3,'night');c.oval(10,6,5,2,'coffee');c.line(8,15,13,18,'copper');c.dot(4,17,'aqua')
 elif kind=='cafe':
  c.oval(13,17,6,5,'fur');c.poly([(5,12),(5,4),(11,7),(16,4),(19,13)],'copper');c.oval(11,12,7,5,'fur');c.line(6,6,8,9,'cream');eyes(c,8,11)
  c.rect(8,16,9,3,'sage');c.rect(7,19,4,3,'cream');c.rect(15,19,4,3,'cream');c.line(18,17,21,13,'fur')
 c.outline();return c

def badge(kind):
 c=Canvas(24,24)
 if kind=='ember':
  c.poly([(12,2),(15,9),(19,6),(21,15),(18,21),(8,22),(3,16),(7,8),(8,13)],'coral');c.poly([(12,8),(14,13),(17,12),(17,19),(11,21),(7,17)],'gold');c.rect(10,14,3,5,'cream')
 elif kind=='moss':
  c.poly([(5,20),(4,10),(9,4),(21,2),(20,14),(14,20)],'moss');c.poly([(6,16),(7,9),(12,5),(19,4),(15,12)],'sage');c.line(3,22,18,6,'cream');c.line(7,17,6,11,'leaf');c.line(11,13,17,14,'leaf')
 elif kind=='star':
  c.poly([(12,2),(15,8),(22,9),(17,14),(18,22),(12,18),(5,22),(6,14),(1,9),(9,8)],'gold');c.poly([(12,6),(14,11),(18,11),(14,14),(12,18),(10,13),(6,11),(10,10)],'cream')
 elif kind=='journal':
  c.rect(3,3,17,18,'copper');c.rect(5,3,14,16,'cream');c.rect(7,5,10,12,'teal');c.rect(3,3,3,18,'rust');c.line(7,19,19,19,'paper');c.oval(12,11,3,2,'gold')
 elif kind=='achievement':
  c.poly([(5,13),(11,13),(8,23),(5,20),(2,21)],'rose');c.poly([(13,13),(19,13),(22,21),(18,20),(16,23)],'plum');c.oval(12,10,8,8,'gold');c.oval(11,9,6,6,'cream');c.oval(11,10,3,2,'rust');c.dot(8,7,'rust');c.dot(12,6,'rust');c.dot(15,8,'rust')
 c.outline();return c

def counter(kind):
 c=Canvas(16,16)
 if kind=='dodge':
  c.poly([(8,1),(14,8),(8,14),(2,8)],'aqua');c.poly([(8,4),(11,8),(8,11),(5,8)],'night');c.line(1,3,4,3,'paper');c.line(0,12,3,12,'paper')
 elif kind=='break':
  c.poly([(2,2),(13,2),(13,9),(8,14),(2,9)],'gold');c.poly([(8,2),(6,6),(10,8),(6,12),(8,8),(4,6)],'ink');c.line(3,3,3,7,'cream')
 else:
  c.poly([(8,0),(10,5),(15,7),(10,10),(8,15),(5,10),(0,7),(5,5)],'epic');c.rect(7,4,2,5,'ink');c.dot(7,11,'ink')
 c.outline();return c

assets={**{f'encounter-{k}':creature(k) for k in KINDS},**{f'icon-{k}':badge(k) for k in ['ember','moss','star','journal','achievement']},**{f'counter-{k}':counter(k) for k in ['dodge','break','interrupt']}}
contact=Canvas(8*96,2*96)
for index,(name,c) in enumerate(assets.items()):
 params={'shape':name,'size':[c.w,c.h],'scale':1,'seed':0,'light':'upper-left','input_images':[]}
 save(f'apps/web/public/art/gameplay2/{name}.png',c.png(),params);contact.blit(c,(index%8)*96+8,(index//8)*96+8,3)
save('reports/gameplay2/art-contact.png',contact.png(),{'scale':3,'grid':'8x2'})
manifest={'generator':'python3 -B tools/art/gameplay2.py','check':'python3 -B tools/art/gameplay2.py --check','date':'2026-11-05','palette':'tools/art/visual-palette.json','prompt':'None. Original procedural geometry in tools/art/gameplay2.py; no model or external image inputs.','files':files}
path=ROOT/'tools/art/gameplay2-manifest.json';data=json.dumps(manifest,indent=2)+'\n'
if CHECK:assert path.read_text()==data,'manifest drift'
else:path.write_text(data)
print(('Checked' if CHECK else 'Generated'),len(assets),'assets;',sum(f['bytes'] for f in files if f['file'].startswith('apps/')),'shipped bytes')
