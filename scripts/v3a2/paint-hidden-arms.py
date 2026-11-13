"""Original sleeve painting for two shields whose approved source had no arm behind it."""
from pathlib import Path
import json,math
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[2]
for id,palette in [('panko',((179,152,112),(222,203,169))),('biscuit',((186,155,115),(239,214,174)))]:
 folder=ROOT/'art/units'/id/'depth-parts';mp=folder/'manifest.json';m=json.loads(mp.read_text());r=json.loads((ROOT/'apps/web/public/units'/id/'rig.json').read_text());nodes={n['name']:i for i,n in enumerate(r['nodes'])};world={}
 def pos(i):
  if i in world:return world[i]
  n=r['nodes'][i];p=pos(n['parent']) if n['parent']>=0 else (0,0);world[i]=(p[0]+n['x'],p[1]+n['y']);return world[i]
 for i in range(len(r['nodes'])):pos(i)
 p=next(p for p in r['parts'] if p['name']=='arm-r');points=[(sum((a['x']+world[a['bone']][0])*a['weight'] for a in v),sum((a['y']+world[a['bone']][1])*a['weight'] for a in v)) for v in p['vertices']];box=(min(v[0] for v in points),min(v[1] for v in points),max(v[0] for v in points),max(v[1] for v in points));w,h=Image.open(folder/'arm-r.png').size
 def pixel(p):return ((p[0]-box[0])/(box[2]-box[0])*w,(box[3]-p[1])/(box[3]-box[1])*h)
 shoulder=pixel(pos(nodes['shoulder_r']));hand=pixel(pos(nodes['hand_r']));radius=max(24,round(w*.09));mask=Image.new('L',(w,h));d=ImageDraw.Draw(mask);d.line((*shoulder,*hand),fill=255,width=radius*2)
 for x,y in [shoulder,hand]:d.ellipse((x-radius,y-radius,x+radius,y+radius),fill=255)
 yy,xx=np.mgrid[:h,:w];dx=hand[0]-shoulder[0];dy=hand[1]-shoulder[1];distance=np.abs((xx-shoulder[0])*dy-(yy-shoulder[1])*dx)/max(1,math.hypot(dx,dy));shade=np.clip(1-distance/radius,0,1)*.65+np.sin(xx*.13+yy*.08)*.025;rgb=np.array(palette[0])+(np.array(palette[1])-np.array(palette[0]))*shade[:,:,None];art=Image.fromarray(np.dstack([np.clip(rgb,0,255).astype(np.uint8),np.array(mask.filter(ImageFilter.GaussianBlur(.6)))]));art.save(folder/'arm-r.png')
 for image in m['images']:
  if image['name']=='arm-r':image['paint']='Original hidden sleeve, two sampled material colors and directional cloth grain; source had only the shield.'
  if image.get('sourcePart')=='arm-r' and image['name'] in ['weapon','off_weapon']:image.pop('behind',None)
 mp.write_text(json.dumps(m,indent=2)+'\n');print(id,'painted sleeve',shoulder,hand,'radius',radius)
