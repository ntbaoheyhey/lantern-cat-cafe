#!/usr/bin/env python3
"""Original 64px collectible art, authored from integer shapes. Existing token metadata unchanged."""
import json
from gameplay import Canvas, ROOT, CHECK, P, files, save

def relic(id):
 c=Canvas(64,64)
 # Quiet jewel-box backing and stepped plaque; no copied reference palette or art.
 c.rect(1,1,62,62,'night');c.rect(3,3,58,58,'dusk');c.rect(6,6,52,52,'night');c.rect(8,52,48,6,'walnut');c.rect(10,53,44,2,'copper')
 for x in [4,57]:
  for y in [4,57]:c.rect(x,y,3,3,['common','rare','epic','gold'][id-1])
 if id==1:
  c.oval(32,12,6,6,'copper');c.oval(32,12,3,3,'night');c.poly([(18,19),(47,19),(50,44),(42,51),(20,51),(13,44)],'rust');c.poly([(19,20),(44,20),(47,42),(39,48),(23,48),(17,42)],'rose');c.line(20,22,18,37,'cream')
  c.oval(32,39,9,7,'cream')
  for x,y in [(22,30),(28,26),(37,26),(43,30)]:c.oval(x,y,4,5,'paper')
  c.rect(29,48,6,2,'copper')
 elif id==2:
  c.oval(32,12,7,7,'mist');c.oval(32,12,4,4,'night');c.poly([(24,17),(40,17),(46,30),(45,39),(50,44),(50,48),(14,48),(14,44),(19,39),(18,30)],'blue');c.poly([(25,18),(38,18),(43,30),(42,41),(46,45),(18,45),(23,40),(21,31)],'common');c.poly([(25,20),(30,19),(27,31),(26,40),(21,43),(25,32)],'paper');c.rect(14,45,36,4,'mist');c.rect(16,45,31,1,'aqua');c.oval(32,50,5,4,'gold');c.rect(30,32,4,8,'slate');c.oval(32,40,4,3,'slate')
 elif id==3:
  c.oval(32,25,24,14,'plum');c.oval(31,23,23,11,'epic');c.oval(32,21,18,7,'night');c.line(13,18,20,13,'lavender');c.rect(12,27,4,4,'gold');c.rect(48,27,4,4,'gold');c.rect(26,31,12,5,'plum');c.rect(29,32,6,4,'gold');c.oval(32,44,11,11,'gold');c.oval(36,39,8,9,'night');c.line(24,41,26,37,'paper');c.rect(26,49,5,2,'cream');c.poly([(43,38),(45,42),(49,44),(45,46),(43,50),(41,46),(37,44),(41,42)],'lavender')
 else:
  c.oval(32,40,15,15,'amber');c.oval(29,37,12,12,'gold');c.poly([(17,25),(17,8),(27,15),(38,15),(47,8),(47,27)],'amber');c.poly([(20,24),(20,12),(28,18),(37,18),(44,12),(44,26)],'gold');c.oval(32,26,15,11,'gold');c.poly([(21,21),(22,16),(25,20)],'rose');c.poly([(40,20),(43,16),(43,22)],'rust');c.line(24,24,29,24,'ink');c.line(36,24,41,24,'ink');c.dot(31,29,'rust');c.line(29,31,34,31,'rust');c.rect(18,33,28,4,'coral');c.oval(32,36,3,3,'cream')
  c.oval(47,36,5,12,'amber');c.oval(47,27,5,7,'gold');c.rect(44,23,5,2,'cream');c.oval(23,48,7,6,'copper');c.oval(23,46,6,5,'gold');c.rect(21,43,2,6,'paper');c.oval(40,51,7,4,'gold');c.rect(26,40,8,9,'amber');c.rect(29,42,2,5,'cream')
 # Jewels and top-left reflected highlights, individually sparse.
 for x,y in [(10,11),(53,16)]:c.line(x-2,y,x+2,y,'cream');c.line(x,y-2,x,y+2,'cream')
 return c

names=['Paw Charm','Silver Bell','Moon Collar','Golden Maneki'];contact=Canvas(4*68*2,68*2)
for id,name in enumerate(names,1):
 c=relic(id);rects=[]
 for y in range(c.h):
  x=0
  while x<c.w:
   col=c.p[y*c.w+x];end=x+1
   while end<c.w and c.p[y*c.w+end]==col:end+=1
   if col:rects.append(f'<rect x="{x}" y="{y}" width="{end-x}" height="1" fill="{P[col]}"/>')
   x=end
 svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges"><title>'+name+'</title>'+''.join(rects)+'</svg>\n'
 params={'id':id,'name':name,'size':64,'scale':1,'seed':0,'light':'upper-left'}
 save(f'apps/web/public/relics/{id}.svg',svg,params)
 save(f'apps/web/public/art/gameplay/relic-{id}.png',c.png(),params)
 contact.blit(c,(id-1)*136+4,4,2)
save('reports/gameplay/relic-contact.png',contact.png(),{'scale':2,'ids':[1,2,3,4]})
p=ROOT/'tools/art/gameplay-relics.json';data=json.dumps({'generator':'python3 -B tools/art/gameplay-relics.py','date':'2026-11-04','palette':'tools/art/visual-palette.json','files':files},indent=2)+'\n'
if CHECK:assert p.read_text()==data,'relic manifest drift'
else:p.write_text(data)
print(('Checked' if CHECK else 'Generated'),'4 original Relics; token metadata/contracts untouched')
