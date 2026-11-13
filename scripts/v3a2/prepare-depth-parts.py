"""Paint original hidden areas and split annotated hand-held props; no reference inputs."""
from pathlib import Path
import json,datetime,shutil,sys
import cv2
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[2];REPORT=ROOT/'reports/v3-battle/a2/M2'
faces=json.loads((REPORT/'face-annotations.json').read_text());weapons=json.loads((ROOT/'scripts/v3a2/weapon-annotations.json').read_text())
records=[]
def rgba(path):return np.array(Image.open(path).convert('RGBA'))
def hidden_fill(a,mask):
 rgb=cv2.inpaint(a[:,:,:3],mask,7,cv2.INPAINT_NS);result=a.copy();result[:,:,:3]=rgb;result[:,:,3]=np.maximum(a[:,:,3],mask);return result
for id in faces:
 if sys.argv[1:] and id not in sys.argv[1:]:continue
 out=ROOT/'art/units'/id/'depth-parts';out.mkdir(parents=True,exist_ok=True)
 images=[];source=REPORT/'source'/id
 for path in source.glob('*.png'):
  a=rgba(path);h,w=a.shape[:2];filled=0
  # Transparent islands in painted material become dark recessed paint, so
  # openings do not reveal the floor through the torso/face during deformation.
  solid=(a[:,:,3]>16).astype(np.uint8);count,labels,stats,_=cv2.connectedComponentsWithStats(1-solid,8)
  mask=np.zeros((h,w),np.uint8)
  for i in range(1,count):
   x,y,ww,hh,area=stats[i]
   if x>0 and y>0 and x+ww<w and y+hh<h:
    mask[labels==i]=255;filled+=int(area)
  if filled:a=hidden_fill(a,mask)
  Image.fromarray(a).save(out/path.name)
  images.append(dict(name=path.stem,sourcePart=path.stem,file=path.name,filledInteriorPixels=filled))
 # Head substrate plus seven small, physically separate original facial parts.
 faceDir=REPORT/'painted-faces'/id
 shutil.copyfile(faceDir/'head.png',out/'head.png')
 for name in ['eye_l','eye_r','eye_l_closed','eye_r_closed','mouth_neutral','mouth_open','mouth_shout']:
  a=rgba(faceDir/(name+'.png'));ys,xs=np.where(a[:,:,3]>0);box=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
  Image.fromarray(a).crop(box).save(out/(name+'.png'))
  images.append(dict(name=name,sourcePart='head',file=name+'.png',rect=[box[0],box[1],box[2]-box[0],box[3]-box[1]],slot='mouth' if name.startswith('mouth') else name[:5],visible=name in ['eye_l','eye_r','mouth_neutral'],bone='head'))
 for wi,spec in enumerate(weapons.get(id,[])):
  name='weapon' if wi==0 else 'off_weapon';arm=spec['source'];a=rgba(out/(arm+'.png'));h,w=a.shape[:2]
  m=Image.new('L',(w,h));d=ImageDraw.Draw(m)
  for polygon in spec['polygons']:d.polygon([(round(x*w),round(y*h)) for x,y in polygon],fill=255)
  mask=np.array(m);mask=np.minimum(mask,a[:,:,3]);prop=a.copy();prop[:,:,3]=mask
  # The painted handle behind the paw overlaps the joint and rotates as one prop.
  if 'bridge' in spec:
   p,q,width,color=spec['bridge'];im=Image.fromarray(prop);draw=ImageDraw.Draw(im)
   draw.line((p[0]*w,p[1]*h,q[0]*w,q[1]*h),fill=color,width=max(3,round(width*w)))
   im.alpha_composite(Image.fromarray(prop));prop=np.array(im)
  cleaned=a.copy();cleaned[:,:,3]=np.where(mask>0,0,a[:,:,3])
  if 'keep' in spec:
   keep=Image.new('L',(w,h));ImageDraw.Draw(keep).polygon([(round(x*w),round(y*h)) for x,y in spec['keep']],fill=255);cleaned[:,:,3]=np.minimum(a[:,:,3],np.array(keep))
  if 'fillHoles' in spec:
   count,labels,stats,_=cv2.connectedComponentsWithStats((prop[:,:,3]<16).astype(np.uint8),8);color=np.array([int(spec['fillHoles'][j:j+2],16) for j in [1,3,5]])
   for label in range(1,count):
    x,y,ww,hh,_=stats[label]
    if x<=0 or y<=0 or x+ww>=w or y+hh>=h:continue
    yy,xx=np.where(labels==label);grain=(np.sin(yy*.045+np.sin(xx*.025)*2)*5+np.cos(xx*.033)*3)[:,None]
    prop[yy,xx,:3]=np.clip(color+grain,0,255);prop[yy,xx,3]=255
  if 'backingPolygon' in spec:
   silk=Image.new('L',(w,h));ImageDraw.Draw(silk).polygon([(round(x*w),round(y*h)) for x,y in spec['backingPolygon']],fill=255)
   yy,xx=np.mgrid[:h,:w];wave=(np.sin(yy*.04+np.sin(xx*.02)*2)*7+np.cos(xx*.021)*4)[:,:,None]
   paint=np.clip(np.array([23,70,72])+wave,0,255).astype(np.uint8);back=Image.fromarray(np.dstack([paint,np.array(silk)]));back.alpha_composite(Image.fromarray(prop));prop=np.array(back)
  Image.fromarray(cleaned).save(out/(arm+'.png'));Image.fromarray(prop).save(out/(name+'.png'))
  images.append(dict(name=name,sourcePart=arm,file=name+'.png',slot=name,visible=True,grip=spec['grip'],bone=name,hand='hand_'+arm[-1],behind=arm))
 manifest=dict(version=2,id=id,method='A2 R-c small original-palette paint with annotated prop separation',images=images,faceSeed=sum((i+1)*ord(c) for i,c in enumerate(id)),jointOverlapRequired=12,weaponRequired=id in weapons)
 (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 records.append(dict(id=id,faces=7,weapons=len(weapons.get(id,[])),tool='Pillow + OpenCV NS; authored masks and handle paint',prompt='Separate the original approved face and held objects; repaint only hidden source material; use no third-party references',date=datetime.datetime.now(datetime.timezone.utc).isoformat()))
recordPath=REPORT/'depth-paint-provenance.json';old=json.loads(recordPath.read_text()) if recordPath.exists() else [];ids={r['id'] for r in records};recordPath.write_text(json.dumps([r for r in old if r['id'] not in ids]+records,indent=2)+'\n')
print('Prepared',len(records),'original face/prop masters')
