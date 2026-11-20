"""Original small face paints from manually annotated original atlases (A2 R-c method 3)."""
from pathlib import Path
import json,datetime
import cv2
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'reports/v3-battle/a2/M2'
annotations=json.loads((OUT/'face-annotations.json').read_text())
records=[]
for index,(id,a) in enumerate(annotations.items()):
 original=Image.open(OUT/'source'/id/'head.png').convert('RGBA');rgb=np.array(original)[:,:,:3].copy();alpha=np.array(original)[:,:,3];w,h=original.size
 masks={}
 for name,box in a['face'].items():
  m=Image.new('L',(w,h));d=ImageDraw.Draw(m);d.ellipse(box,fill=255);mask=np.array(m)
  masks[name]=cv2.dilate(mask,np.ones((5,5),np.uint8))
 combined=np.maximum.reduce(list(masks.values()));skin=cv2.inpaint(rgb,combined,5,cv2.INPAINT_NS)
 # Continue our own fur/cloth grain through missing eye and mouth regions.
 rng=np.random.default_rng(sum(map(ord,id)));grain=rng.normal(0,1.0,(h,w,1))
 skin=np.where(combined[:,:,None]>0,np.clip(skin.astype(float)+grain,0,255),skin).astype(np.uint8)
 cleaned=Image.fromarray(np.dstack([skin,alpha]));folder=OUT/'painted-faces'/id;folder.mkdir(parents=True,exist_ok=True);cleaned.save(folder/'head.png')
 variants={}
 for name,mask in masks.items():
  source=np.array(original);source[:,:,3]=np.minimum(source[:,:,3],mask);part=Image.fromarray(source);variants[name]=part;part.save(folder/(name+'.png'))
  box=a['face'][name];x0,y0,x1,y1=box;pw,ph=x1-x0,y1-y0
  if name.startswith('eye_'):
   patch=np.array(cleaned);patch[:,:,3]=np.minimum(patch[:,:,3],mask);closed=Image.fromarray(patch);d=ImageDraw.Draw(closed)
   color='#453026' if index<9 else '#a0632d' if id not in ['rain-spool'] else '#3d868f'
   d.arc((x0+pw*.08,y0+ph*.12,x1-pw*.08,y0+ph*.74),5,175,fill=color,width=max(2,round(ph*.09)))
   for t in [.22,.72]:
    x=x0+pw*t;d.line((x,y0+ph*.70,x-pw*.04,y0+ph*.77),fill=color,width=max(1,round(ph*.045)))
   variants[name+'_closed']=closed;closed.save(folder/(name+'_closed.png'))
  else:
   for variant,amount in [('mouth_open',.58),('mouth_shout',.93)]:
    patch=np.array(cleaned);patch[:,:,3]=np.minimum(patch[:,:,3],mask);mouth=Image.fromarray(patch);d=ImageDraw.Draw(mouth)
    cx=(x0+x1)/2;cy=(y0+y1)/2;rw=pw*(.24 if variant=='mouth_open' else .34);rh=ph*amount*.5
    if index<9:
     d.ellipse((cx-rw,cy-rh,cx+rw,cy+rh),fill='#51302d',outline='#392724',width=max(1,round(pw*.025)))
     d.ellipse((cx-rw*.65,cy+rh*.12,cx+rw*.65,cy+rh*.80),fill='#bf786a')
     d.arc((cx-rw,cy-rh,cx+rw,cy+rh),210,330,fill='#eed2aa',width=max(1,round(pw*.025)))
    else:
     # Original stitched/engraved vent treatment matches these toy creatures.
     d.rounded_rectangle((cx-rw,cy-rh,cx+rw,cy+rh),radius=max(2,rh*.55),fill='#241c21',outline='#ad783d',width=max(1,round(pw*.03)))
     d.line((cx-rw*.7,cy+rh*.35,cx+rw*.7,cy+rh*.35),fill='#dc9b4b' if id!='rain-spool' else '#6ab9bb',width=max(1,round(ph*.09)))
    variants[variant]=mouth;mouth.save(folder/(variant+'.png'))
 # A neutral redraw is exact source imagery; closed/open states are new small paints.
 panels=[]
 for mode in ['neutral','closed','open','shout']:
  frame=cleaned.copy()
  for side in ['l','r']:frame=Image.alpha_composite(frame,variants['eye_'+side+('_closed' if mode=='closed' else '')])
  frame=Image.alpha_composite(frame,variants['mouth_'+('neutral' if mode in ['neutral','closed'] else mode)])
  thumb=Image.new('RGBA',(280,260),'#4f4754');copy=frame.copy();copy.thumbnail((280,260),Image.Resampling.LANCZOS);thumb.alpha_composite(copy,((280-copy.width)//2,(260-copy.height)//2));panels.append(thumb)
 sheet=Image.new('RGBA',(1120,292),'#4f4754');d=ImageDraw.Draw(sheet);d.text((12,9),id+' / neutral / blink / open / shout',fill='white')
 for i,p in enumerate(panels):sheet.alpha_composite(p,(i*280,32))
 sheet.convert('RGB').save(folder/'review.png')
 records.append(dict(id=id,parts=list(variants),method='A2 R-c(3): local original-palette missing-face paint, NS substrate, fur grain, authored eyelid and mouth marks',date=datetime.datetime.now(datetime.timezone.utc).isoformat()))
(OUT/'face-paint-provenance.json').write_text(json.dumps(records,indent=2)+'\n')
print('Prepared',len(records),'original separate face sets; public assets unchanged')
