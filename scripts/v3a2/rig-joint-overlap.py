"""Measure master-pixel attachment overlap from alpha, never manifest claims."""
from pathlib import Path
import json,subprocess,datetime
import cv2,numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'reports/v3-battle/a2/M2'
records=[]
def diameter(alpha):return float(cv2.distanceTransform(alpha.astype(np.uint8),cv2.DIST_L2,5).max()*2)
for mp in sorted((ROOT/'art/units').glob('*/depth-parts/manifest.json')):
 manifest=json.loads(mp.read_text());rig=json.loads((ROOT/'apps/web/public/units'/manifest['id']/'rig.json').read_text());images={p['name']:p for p in manifest['images']};parts={p['name']:p for p in rig['parts']};world={}
 def position(i):
  if i in world:return world[i]
  node=rig['nodes'][i];p=position(node['parent']) if node['parent']>=0 else (0,0);world[i]=(p[0]+node['x'],p[1]+node['y']);return world[i]
 for i in range(len(rig['nodes'])):position(i)
 def box(part):
  points=[(sum((w['x']+world[w['bone']][0])*w['weight'] for w in v),sum((w['y']+world[w['bone']][1])*w['weight'] for w in v)) for v in part['vertices']]
  return min(p[0] for p in points),min(p[1] for p in points),max(p[0] for p in points),max(p[1] for p in points)
 head=box(parts['head']);factor=Image.open(mp.parent/images['head']['file']).width/(head[2]-head[0])
 bounds=[box(parts[p['name']]) for p in manifest['images']];left=min(b[0] for b in bounds);top=max(b[3] for b in bounds);width=int(np.ceil((max(b[2] for b in bounds)-left)*factor))+4;height=int(np.ceil((top-min(b[1] for b in bounds))*factor))+4
 groups={};patches=[]
 for p in manifest['images']:
  if p['name']!=p['sourcePart'] and not p['name'].startswith('hidden-'):continue
  b=box(parts[p['name']]);w=max(1,round((b[2]-b[0])*factor));h=max(1,round((b[3]-b[1])*factor));x=round((b[0]-left)*factor);y=round((top-b[3])*factor)
  image=Image.open(mp.parent/p['file']).convert('RGBA');mask=np.array(image.resize((w,h)))[:,:,3]>=16
  group=groups.setdefault(p['sourcePart'],np.zeros((height,width),bool));group[y:y+h,x:x+w]|=mask
  if p['name'].startswith('hidden-'):
   source=np.array(Image.open(mp.parent/images[p['sourcePart']]['file']).convert('RGBA'))[:,:,3];patch=np.array(image)[:,:,3];xx,yy,ww,hh=p['rect'];over=np.zeros_like(patch);x1=max(xx,0);y1=max(yy,0);x2=min(xx+ww,source.shape[1]);y2=min(yy+hh,source.shape[0]);over[y1-yy:y2-yy,x1-xx:x2-xx]=source[y1:y2,x1:x2];patches.append(dict(part=p['name'],overlapDiameter=diameter((over>=16)&(patch>=16))))
 joints=[]
 for name,mask in groups.items():
  if name=='body':continue
  parent=groups['body'];joints.append(dict(part=name,parent='body',overlapDiameter=diameter(mask&parent)))
 records.append(dict(id=manifest['id'],masterPixelsPerWorldUnit=factor,joints=joints,backings=patches,minOverlap=min([p['overlapDiameter'] for p in joints+patches])))
report={'_meta':{'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()},'method':'Alpha >=16, master-space rest attachment intersections. Overlap is diameter of the largest inscribed disk; includes original joints and new hidden backing intersections.','units':records,'minOverlap':min(r['minOverlap'] for r in records)}
(OUT/'joint-overlap.json').write_text(json.dumps(report,indent=2)+'\n')
for r in records:print(r['id'],round(r['minOverlap'],2),[(j['part'],round(j['overlapDiameter'],2)) for j in r['joints']+r['backings'] if j['overlapDiameter']<12])
