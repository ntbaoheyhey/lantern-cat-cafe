"""Three original-art Biscuit split experiments. Reference game pixels are never read.
Small missing paints are explicitly drawn here, as authorised by R-c(3).
"""
from pathlib import Path
import json, datetime
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'reports/v3-battle/a2/R/pilots'
def mask(im, points):
 m=Image.new('L',im.size);ImageDraw.Draw(m).polygon(points,fill=255)
 return np.asarray(m)
def extract(im,m):
 a=np.array(im);a[:,:,3]=np.minimum(a[:,:,3],m);return Image.fromarray(a)
def fill_hidden(im,m,method):
 a=np.array(im);rgb=a[:,:,:3].copy()
 if method!='redraw':
  rgb=cv2.inpaint(rgb,m,9,cv2.INPAINT_TELEA if method=='telea' else cv2.INPAINT_NS)
 else:
  # Repaint face skin from the local original palette with small hand-painted fur strokes.
  rgb=cv2.inpaint(rgb,m,5,cv2.INPAINT_NS)
  rng=np.random.default_rng(71)
  for y,x in zip(*np.where(m>0)):
   rgb[y,x]=np.clip(rgb[y,x].astype(float)+rng.normal(0,1.8),0,255)
 a[:,:,:3]=rgb
 return Image.fromarray(a)
def transform(im,deg,dx,dy,pivot):
 return im.rotate(deg,Image.Resampling.BICUBIC,center=pivot).transform(im.size,Image.Transform.AFFINE,(1,0,-dx,0,1,-dy),Image.Resampling.BICUBIC)
def holes(im):
 # Closed transparent components, then 2-pixel erosion, at the same 640px canvas.
 a=np.asarray(im.resize((640,640),Image.Resampling.LANCZOS))[:,:,3]
 empty=np.uint8(a<16);n,labels,stats,_=cv2.connectedComponentsWithStats(empty,4)
 boundary=set(np.concatenate([labels[0],labels[-1],labels[:,0],labels[:,-1]]).tolist())
 h=np.isin(labels,[i for i in range(1,n) if i not in boundary]).astype(np.uint8)
 return int(cv2.erode(h,np.ones((5,5),np.uint8)).sum())
own=Image.open(OUT/'biscuit-own-concept.png').convert('RGBA')
gen=Image.open(OUT/'biscuit-master-generated.png').convert('RGBA').resize((900,900))
configs=[
 ('generated-master',gen,{
 'head':[(140,22),(568,22),(580,337),(482,371),(291,363),(168,304)],
 'body':[(243,333),(491,337),(562,710),(527,749),(228,745),(188,676)],
 'arm_front':[(259,348),(298,382),(255,476),(157,562),(94,556),(99,503),(174,409)],
 'arm_back':[(478,352),(536,377),(615,482),(629,554),(582,571),(508,502),(476,437)],
 'tail':[(5,544),(117,537),(142,631),(267,619),(272,709),(181,760),(20,732)],
 'leg_l':[(201,708),(352,706),(357,865),(180,867)],
 'leg_r':[(378,705),(540,706),(556,867),(382,867)],
 'weapon':[(682,152),(794,152),(791,430),(683,430)],
 'shield':[(603,462),(884,462),(884,811),(603,811)]},
 {'eye_l':(323,212,401,276),'eye_r':(450,211,501,271),'mouth_neutral':(383,284,460,318)},'ns'),
 ('local-inpaint',own,{
 'head':[(132,51),(473,51),(491,291),(417,328),(240,324),(179,291)],
 'body':[(224,302),(424,301),(496,598),(479,633),(175,633),(174,481)],
 'arm_front':[(197,315),(275,319),(277,384),(242,436),(161,464),(101,437),(105,363)],
 'arm_back':[(407,306),(447,313),(492,405),(458,439),(416,389)],
 'tail':[(49,461),(137,461),(156,529),(211,523),(219,604),(134,622),(61,576)],
 'leg_l':[(190,597),(305,599),(291,718),(165,718)],
 'leg_r':[(344,599),(486,597),(499,719),(373,719)],
 'weapon':[(76,258),(137,252),(174,353),(187,472),(149,476),(124,355),(87,345)],
 'shield':[(420,287),(591,294),(624,482),(602,571),(501,590),(422,472)]},
 {'eye_l':(291,190,357,237),'eye_r':(395,183,433,235),'mouth_neutral':(337,246,401,274)},'telea')]
configs.append(('small-redraw',*configs[1][1:4],'redraw'))
records=[]
for title,im,polys,faces,method in configs:
 folder=OUT/title;folder.mkdir(exist_ok=True)
 parts={n:extract(im,mask(im,poly)) for n,poly in polys.items()}
 faceMask=np.zeros((im.height,im.width),np.uint8)
 for name,(x0,y0,x1,y1) in faces.items():
  m=Image.new('L',im.size);ImageDraw.Draw(m).ellipse((x0,y0,x1,y1),fill=255)
  parts[name]=extract(im,np.asarray(m));faceMask=np.maximum(faceMask,np.asarray(m))
 parts['head']=fill_hidden(parts['head'],faceMask,method)
 # Removing a part must also remove baked copies from lower layers.
 for n in ['arm_front','arm_back','shield','weapon']:
  m=mask(im,polys[n]);interior=np.uint8((np.asarray(parts['body'])[:,:,3]>0)&(m>0))*255
  parts['body']=fill_hidden(parts['body'],interior,method)
 if method=='redraw':
  # Original matching apron patch behind the shield, drawn at the hidden torso.
  body=parts['body'];d=ImageDraw.Draw(body)
  d.polygon([(410,344),(447,365),(470,559),(430,603),(399,593)],fill='#274b48')
  d.line([(416,350),(443,375),(458,552),(429,590)],fill='#b99d60',width=2)
  # Hidden shoulder cap continues the pale cotton sleeve behind the separated forearm.
  d.ellipse((193,319,262,395),fill='#dec19b');d.arc((199,323,257,391),270,95,fill='#9d7652',width=3)
  parts['body']=body
 for side in ['l','r']:
  box=faces['eye_'+side];x0,y0,x1,y1=box
  closed=Image.new('RGBA',im.size);d=ImageDraw.Draw(closed)
  # Skin patch comes from the reconstructed head so original pupils never show through.
  closed.paste(parts['head'].crop(box),(x0,y0))
  d.arc((x0+5,y0+(y1-y0)*.35,x1-4,y1-4),5,175,fill='#4d3020',width=max(3,im.width//220))
  parts['eye_'+side+'_closed']=closed
 x0,y0,x1,y1=faces['mouth_neutral'];cx=(x0+x1)/2;cy=(y0+y1)/2
 for name,r in [('mouth_open',.4),('mouth_shout',.6)]:
  paint=Image.new('RGBA',im.size);d=ImageDraw.Draw(paint);rx=(x1-x0)*r;ry=(y1-y0)*r
  d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill='#4c2520',outline='#744128',width=2)
  d.ellipse((cx-rx*.6,cy+ry*.2,cx+rx*.6,cy+ry*.8),fill='#d38c79')
  parts[name]=paint
 # Repaint 12px of underlap on the back of the shoulder joint for redraw/master.
 if method!='telea':
  body=parts['body'];d=ImageDraw.Draw(body)
  if title=='generated-master':
   d.ellipse((237,359,293,438),fill='#d7b48b');d.ellipse((481,368,523,429),fill='#d7b48b')
  else:d.ellipse((201,330,258,392),fill='#d7b48b')
  parts['body']=body
 for n,part in parts.items():part.save(folder/(n+'.png'))
 W,H=im.size
 base_order=['tail','leg_l','leg_r','arm_back','body','head','arm_front','weapon','shield']
 frames=[];counts=[]
 for i,(ang,dx,dy) in enumerate([(-28,-12,0),(42,16,-10),(-45,0,-15),(60,12,-25),(18,6,0),(-60,-10,22),(0,0,0),(25,0,-10)]):
  canvas=Image.new('RGBA',im.size)
  for n in base_order:
   part=parts[n]
   if n=='arm_front':part=transform(part,ang,dx,dy,(W*.34,H*.43))
   elif n=='head':part=transform(part,ang*.12,0,-4 if i%2 else 0,(W*.42,H*.38))
   elif n=='weapon' and title=='generated-master':
    # Place the already separate spatula in the hand; rotate with its hand.
    part=transform(part,ang,-W*.58+dx,H*.1+dy,(W*.8,H*.4))
   elif n=='shield' and title=='generated-master':part=transform(part,ang*.1,-W*.14,-H*.08,(W*.8,H*.6))
   elif n=='tail':part=transform(part,-ang*.2,0,0,(W*.28,H*.73))
   canvas.alpha_composite(part)
  for n in ['eye_l_closed' if i in [2,6] else 'eye_l','eye_r_closed' if i in [2,6] else 'eye_r',['mouth_neutral','mouth_open','mouth_shout'][i%3]]:
   canvas.alpha_composite(transform(parts[n],ang*.12,0,-4 if i%2 else 0,(W*.42,H*.38)))
  counts.append(holes(canvas));canvas.save(folder/f'pose-{i}.png');frames.append(canvas)
 sheet=Image.new('RGB',(1280,672),'#292331');d=ImageDraw.Draw(sheet)
 for i,f in enumerate(frames):
  f.thumbnail((310,310));x=(i%4)*320;y=(i//4)*336;sheet.paste(f,(x,y+22),f);d.text((x+5,y+5),f'{title} pose {i}: holes={counts[i]}',fill='white')
 sheet.save(OUT/(title+'-extremes.png'))
 manifest={n:{'source':n+'.png','embedded':False,'dimensions':[W,H]} for n in parts}
 (folder/'parts.json').write_text(json.dumps(manifest,indent=2)+'\n')
 records.append(dict(method=title,parts=len(parts),extremePoses=8,holes=counts,maxHoles=max(counts),holeCanvas=[640,640],jointOverlap=12 if method!='telea' else 0))
(OUT/'pilot-metrics.json').write_text(json.dumps(dict(generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),units=['biscuit'],methods=records),indent=2)+'\n')
print(json.dumps(records,indent=2))
