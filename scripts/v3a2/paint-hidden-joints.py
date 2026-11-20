"""Original hidden-joint backing, traced from our rendered *gaps*, never reference art."""
from pathlib import Path
import json,sys
import cv2
import numpy as np
from PIL import Image,ImageFilter
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'reports/v3-battle/a2/M2'
ids=sys.argv[1:] or list(json.loads((OUT/'face-annotations.json').read_text()))
for id in ids:
 folder=ROOT/'art/units'/id/'depth-parts';mp=folder/'manifest.json';manifest=json.loads(mp.read_text());report=json.loads((OUT/f'rig-{id}.json').read_text());patches={};stats=[]
 original={p['name']:p for p in manifest['images'] if not p['name'].startswith('hidden-')}
 sources={name:np.array(Image.open(folder/spec['file']).convert('RGBA')) for name,spec in original.items()}
 distance={name:cv2.distanceTransform((a[:,:,3]<16).astype(np.uint8),cv2.DIST_L2,5) for name,a in sources.items()}
 # Retain and extend existing backings even after all measured holes close.
 for old in manifest['images']:
  if not old['name'].startswith('hidden-'):continue
  name=old['sourcePart'];h,w=sources[name].shape[:2];pad=96;initial=np.zeros((h+pad*2,w+pad*2),np.uint8)
  previous=np.array(Image.open(folder/old['file']).convert('RGBA'))[:,:,3];x,y,ww,hh=old['rect'];initial[y+pad:y+pad+hh,x+pad:x+pad+ww]=previous
  patches[name]=dict(mask=initial,bone=old['bone'],pad=pad,overlap=12)
 for pose in report['extremes']:
  if not pose['points']:continue
  bitmap=np.zeros((640,640),np.uint8)
  for x,y in pose['points']:bitmap[y,x]=1
  count,labels,areas,_=cv2.connectedComponentsWithStats(bitmap,8)
  for component in range(1,count):
   ys,xs=np.where(labels==component);candidates=[]
   for name,spec in pose.get('maps',{}).items():
    if name in ['head','weapon','off_weapon']:continue
    if name not in original:continue
    a=sources[name];h,w=a.shape[:2];m=spec['matrix'];px=np.rint((m[0]*xs+m[1]*ys+m[2])*w).astype(int);py=np.rint((m[3]*xs+m[4]*ys+m[5])*h).astype(int)
    inside=(px>=0)&(px<w)&(py>=0)&(py<h)
    if inside.mean()<.5:continue
    d=distance[name][np.clip(py,0,h-1),np.clip(px,0,w-1)];score=float(np.median(d))+float((1-inside.mean())*100)
    # Prefer the cloth/body substrate over a moving prop for a joint-sized gap.
    if name in ['weapon','off_weapon']:score+=8
    candidates.append((score,name,px,py,spec['bone'],float(np.max(d))))
   if not candidates:continue
   score,name,px,py,bone,maxd=min(candidates,key=lambda v:v[0]);h,w=sources[name].shape[:2];pad=96
   if name not in patches:
    initial=np.zeros((h+pad*2,w+pad*2),np.uint8);old=next((i for i in manifest['images'] if i['name']==f'hidden-{name}'),None)
    if old:
     previous=np.array(Image.open(folder/old['file']).convert('RGBA'))[:,:,3];x,y,ww,hh=old['rect'];initial[y+pad:y+pad+hh,x+pad:x+pad+ww]=previous
    patches[name]=dict(mask=initial,bone=bone,pad=pad,overlap=12)
   patch=patches[name];mask=np.zeros_like(patch['mask']);px=np.clip(px+pad,0,mask.shape[1]-1);py=np.clip(py+pad,0,mask.shape[0]-1);mask[py,px]=255
   radius=14;kernel=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(radius*2+1,radius*2+1));mask=cv2.dilate(mask,kernel)
   patch['mask']=np.maximum(patch['mask'],mask);stats.append(dict(pose=pose['name'],part=name,erodedHolePixels=len(xs),radius=radius))
 for name,patch in patches.items():
  source=sources[name];h,w=source.shape[:2];pad=patch['pad'];a=np.pad(source,((pad,pad),(pad,pad),(0,0)));mask=patch['mask']
  # Continue the hidden paint beneath the existing material. Only opaque
  # substrate receives this extra overlap; the visible silhouette is unchanged.
  overlap_kernel=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(65,65))
  underpaint=cv2.dilate(mask,overlap_kernel)
  mask=np.maximum(mask,np.where(a[:,:,3]>=16,underpaint,0).astype(np.uint8))
  # Sample nearest original painted material for hidden extensions, then blend
  # grain across the seam. Existing visible paint is always drawn over this.
  _,labels=cv2.distanceTransformWithLabels((a[:,:,3]<16).astype(np.uint8),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
  yy,xx=np.where(a[:,:,3]>=16);colors=np.zeros((len(yy)+1,3),np.uint8);colors[labels[yy,xx]]=a[yy,xx,:3]
  rgb=colors[labels];rgb=cv2.GaussianBlur(rgb,(5,5),0);result=np.dstack([rgb,mask]);ys,xs=np.where(mask>0);left,top,right,bottom=int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)
  Image.fromarray(result).crop((left,top,right,bottom)).save(folder/f'hidden-{name}.png')
  manifest['images']=[i for i in manifest['images'] if i['name']!=f'hidden-{name}'];manifest['images'].append(dict(name=f'hidden-{name}',sourcePart=name,file=f'hidden-{name}.png',rect=[left-pad,top-pad,right-left,bottom-top],slot=f'hidden-{name}',visible=True,bone=patch['bone'],behind=name,paint='Original sampled cloth/fur hidden joint substrate; 12px minimum intended overlap'))
 manifest['hiddenJointPaint']=stats;mp.write_text(json.dumps(manifest,indent=2)+'\n');print(id,len(patches),'painted joint backings,',len(stats),'gap components')
