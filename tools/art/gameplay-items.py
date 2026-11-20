#!/usr/bin/env python3
"""Original 32px equipment silhouettes. No reference images, downloads or generator model."""
import json
from gameplay import Canvas, ROOT, CHECK, files, save

WEAPONS=['sword','hammer','daggers','spear','bow','staff','flasks']
SETS={'cozy':('rust','fur','cream'),'ranger':('leaf','sage','paper'),'moon':('plum','epic','lavender')}
ACCESSORIES={'bell':'collar','ribbon':'collar','studded':'collar','pearl':'earring','fishhook':'earring','feather':'earring','paw':'ring','hunter':'ring','lucky':'ring','catnip':'charm','mouse':'charm','star':'charm'}

def icon(kind,variant='cozy'):
 c=Canvas(32,32);low,mid,hi=SETS.get(variant,('wood','gold','cream'))
 if kind in ['sword','daggers','spear']:
  offsets=[0] if kind!='daggers' else [-5,6]
  for off in offsets:
   x=15+off;top=3 if kind=='spear' else 4 if kind=='sword' else 10
   c.rect(x-1,top+4,3,22-top,'mist');c.poly([(x-2,top+6),(x+1,top),(x+4,top+6),(x+2,21),(x-2,21)],'common');c.line(x,top+4,x,20,'paper');c.rect(x-5,20,11,3,'copper');c.rect(x-4,20,9,1,'gold');c.rect(x-1,23,3,5,'rust');c.dot(x,26,'cream')
 elif kind=='hammer':
  c.rect(14,10,4,19,'wood');c.rect(14,15,1,11,'copper');c.rect(5,5,22,10,'slate');c.rect(6,5,19,7,'mist');c.rect(7,5,17,2,'paper');c.rect(12,4,8,12,'gold');c.rect(14,5,4,9,'amber');c.rect(13,27,6,2,'copper')
 elif kind=='bow':
  c.poly([(10,3),(20,7),(25,15),(20,23),(10,29),(17,21),(20,15),(17,9)],'rust');c.line(11,4,20,10,'gold');c.line(20,10,23,15,'copper');c.line(10,4,10,28,'cream');c.line(4,16,25,16,'copper');c.poly([(24,13),(29,16),(24,19)],'paper');c.rect(5,15,3,3,'rose')
 elif kind=='staff':
  c.rect(14,11,4,18,'wood');c.rect(14,11,1,16,'copper');c.poly([(9,5),(15,2),(23,7),(22,14),(15,17),(8,12)],'gold');c.poly([(11,6),(16,4),(20,8),(18,13),(12,12)],'epic');c.rect(12,7,3,3,'paper');c.rect(13,18,6,3,'rose');c.dot(17,27,'gold')
 elif kind=='flasks':
  for x,y,color in [(8,14,'sage'),(20,20,'epic')]:
   c.rect(x-2,y-10,5,7,'mist');c.oval(x,y,6,7,'aqua');c.oval(x,y+2,5,4,color);c.line(x-3,y-4,x-4,y,'paper');c.rect(x-3,y-11,7,3,'copper');c.rect(x-2,y+2,5,2,'paper')
 elif kind=='helmet':
  c.oval(16,18,12,9,low);c.oval(14,16,10,8,mid);c.poly([(6,15),(7,3),(15,11)],mid);c.poly([(18,11),(25,3),(26,15)],low);c.poly([(9,12),(9,7),(12,11)],hi);c.rect(4,23,24,5,low);c.rect(5,23,21,2,hi);c.rect(11,15,4,2,hi)
 elif kind=='armor':
  c.poly([(5,7),(11,4),(15,8),(20,4),(27,8),(29,15),(23,18),(23,28),(8,28),(8,18),(3,15)],low);c.poly([(6,8),(11,6),(16,10),(20,6),(25,9),(26,14),(21,16),(21,25),(10,25),(10,16),(5,14)],mid);c.line(15,10,15,26,hi);c.rect(11,20,10,3,low);c.rect(15,20,3,3,'gold');c.line(6,9,8,13,hi)
 elif kind in ['gloves','boots']:
  for x,y in [(3,6),(18,9)]:
   c.rect(x+2,y,8,14,low);c.rect(x+2,y+1,6,10,mid);c.rect(x+3,y+2,2,7,hi)
   if kind=='gloves':c.rect(x,y+7,4,9,mid);c.oval(x+6,y+14,5,5,mid);c.rect(x+1,y+17,10,3,low);c.rect(x+2,y+17,8,1,hi)
   else:c.rect(x,y+13,10,6,mid);c.rect(x,y+18,12,3,low);c.rect(x+1,y+14,4,2,hi);c.rect(x+2,y+7,8,3,low);c.rect(x+5,y+7,3,3,'gold')
 elif kind=='collar':
  c.oval(16,13,12,8,low);c.oval(16,11,11,5,mid);c.oval(16,10,8,3,None);c.oval(16,13,7,3,None);c.line(7,8,11,6,hi)
  if variant=='ribbon':
   c.poly([(15,19),(7,15),(7,25),(15,22)],'rose');c.poly([(17,19),(25,15),(25,25),(17,22)],'coral');c.rect(14,18,5,6,'cream')
  elif variant=='studded':
   for x in [5,11,22,27]:c.rect(x,14,2,3,'paper')
   c.rect(14,18,5,6,'common')
  else:c.oval(16,22,6,6,'gold');c.oval(14,20,3,3,'cream');c.rect(15,23,3,3,'rust')
 elif kind=='earring':
  c.oval(16,10,5,7,'gold');c.oval(16,10,3,5,None);c.line(12,6,14,4,'paper')
  if variant=='feather':c.poly([(17,14),(25,14),(25,23),(18,29),(14,27)],'sage');c.line(16,27,23,17,'paper')
  elif variant=='pearl':c.poly([(16,13),(24,21),(16,29),(8,21)],'epic');c.poly([(16,16),(19,20),(16,24),(13,20)],'paper')
  else:c.oval(16,22,8,7,'gold');c.oval(16,22,5,4,None);c.line(10,18,13,16,'cream')
 elif kind=='ring':
  metal='common' if variant=='hunter' else 'epic' if variant=='lucky' else 'copper'
  c.oval(16,19,10,10,metal);c.oval(16,19,7,7,None);c.line(8,13,11,10,'paper');c.poly([(11,9),(16,3),(22,9),(16,15)],'gold' if variant=='paw' else 'aqua');c.poly([(13,8),(16,5),(18,8),(16,10)],'paper')
 else:
  c.oval(16,6,4,4,'gold');c.oval(16,6,2,2,None)
  if variant=='catnip':c.poly([(16,28),(8,21),(10,13),(17,14),(24,11),(25,21)],'sage');c.line(16,27,17,15,'paper');c.line(12,20,17,23,'moss')
  elif variant=='mouse':
   c.oval(16,21,8,6,'common');c.oval(11,16,4,4,'rose');c.oval(21,16,4,4,'rose');c.line(23,24,29,28,'rose');c.dot(12,21,'ink');c.dot(19,21,'ink');c.dot(15,25,'coral')
  else:c.poly([(16,10),(20,16),(28,17),(22,22),(24,29),(16,25),(8,29),(10,22),(4,17),(12,16)],'gold');c.poly([(16,13),(18,18),(23,18),(18,21),(16,24),(14,20),(9,18),(14,18)],'cream')
 c.outline();return c

assets={}
for kind in WEAPONS:assets[kind]=icon(kind)
for name in SETS:
 for kind in ['helmet','armor','gloves','boots']:assets[f'arm.{name}.{kind}']=icon(kind,name)
for name,kind in ACCESSORIES.items():assets['acc.'+name]=icon(kind,name)
for kind in ['helmet','armor','gloves','boots','collar','earring','ring','charm']:assets['slot'+kind.capitalize()]=icon(kind)
assets['slotWeapon']=icon('sword')
contact=Canvas(8*40*2,5*40*2)
for index,(key,c) in enumerate(assets.items()):
 save(f'apps/web/public/art/gameplay/item-{key}.png',c.png(),{'key':key,'size':32,'scale':1,'light':'upper-left','seed':0})
 contact.blit(c,(index%8)*80+8,(index//8)*80+8,2)
save('reports/gameplay/item-contact.png',contact.png(),{'grid':'8 columns','scale':2})
save('apps/web/src/art/gameplayItemKeys.ts','// Generated by tools/art/gameplay-items.py\nexport const GAMEPLAY_ITEM_KEYS = new Set('+json.dumps(list(assets))+');\n',{'keys':len(assets)})
manifest={'generator':'python3 -B tools/art/gameplay-items.py','date':'2026-11-04','palette':'tools/art/visual-palette.json','seed':0,'files':files}
p=ROOT/'tools/art/gameplay-items.json';data=json.dumps(manifest,indent=2)+'\n'
if CHECK:assert p.read_text()==data,'item manifest drift'
else:p.write_text(data)
print(('Checked' if CHECK else 'Generated'),len(assets),'original item silhouettes')
