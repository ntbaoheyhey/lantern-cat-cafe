"""Read-only published PSD -> explicitly temporary Spine rig. Never alters sources."""
import argparse, hashlib, json, math, re
from pathlib import Path
from psd_tools import PSDImage
from PIL import Image
from PIL import ImageDraw, ImageFilter
import numpy as np
parser=argparse.ArgumentParser();parser.add_argument('parts');parser.add_argument('--out',required=True)
a=parser.parse_args();source=Path(a.parts).resolve();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
meta=json.loads(source.read_text());unit_id=meta['id'];view=meta['view'];folder=source.parent
psd_path=folder/f'{unit_id}-{view}.psd';notes=folder/f'{unit_id}-{view}-rig-notes.md'
source_hash={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [source,psd_path,notes]}
root=Path(__file__).resolve().parents[3];config=json.loads((root/'assets/cardrpg-look/spine/config.json').read_text());slots=json.loads((root/'assets/cardrpg-look/spine/slots.json').read_text());unit=next(u for u in slots['units'] if u['id']==unit_id)
pivots={m[0]:[float(m[1]),float(m[2])] for m in re.findall(r'\| (root|hip|head|hp-anchor|vfx-origin|main-hand|off-hand) \| ([\d.]+), ([\d.]+) \|',notes.read_text())}
if len(pivots)!=7:raise ValueError('Rig notes must publish all seven socket pivots')
psd=PSDImage.open(psd_path);leaves={layer.name:layer for layer in psd.descendants() if not layer.is_group()}
parts=[]
for part in sorted(meta['parts'],key=lambda p:p['draw_order']):
 layer=leaves[part['name']];rgba=layer.topil().convert('RGBA');box=rgba.getbbox()
 if box is None:continue
 rgba=rgba.crop(box);left=layer.left+box[0];top=layer.top+box[1]
 parts.append(dict(part,image=rgba,left=left,top=top,width=rgba.width,height=rgba.height))
# The published closed-eye alternates contain a lash line only. Supply a small
# derived fur cover from the same flattened face so hiding iris layers cannot
# expose the dark eye sockets. This is a flagged placeholder patch, not a source edit.
flat=Image.open(folder/f'{unit_id}-{view}-flat.png').convert('RGBA')
for closed in [p for p in parts if p['name'].endswith('-closed')]:
 white=next(p for p in parts if p['name']==closed['name'].replace('-closed','-white'))
 lash=next(p for p in parts if p['name']==closed['name'].replace('-closed','-lash-upper'))
 x0,y0=min(white['left'],lash['left'])-10,min(white['top'],lash['top'])-10;x1,y1=max(white['left']+white['width'],lash['left']+lash['width'])+10,white['top']+white['height']+10
 mask=Image.new('L',flat.size);ImageDraw.Draw(mask).rounded_rectangle((x0,y0,x1,y1),radius=24,fill=255)
 # Sample clean adjacent cheek fur, not the iris edge; retain original closed line.
 cx=white['left']+white['width']//2;cy=white['top']+white['height']+22
 fur=flat.crop((cx-15,cy,cx+15,cy+20)).resize((x1-x0,y1-y0),Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(2))
 color=tuple(int(v) for v in np.median(np.array(fur).reshape(-1,4),axis=0)[:3]);cover=Image.new('RGBA',flat.size,(*color,255));cover.paste(fur,(x0,y0));cover.putalpha(mask.filter(ImageFilter.GaussianBlur(4)));cover.alpha_composite(closed['image'],(closed['left'],closed['top']))
 box=cover.getbbox();closed.update(image=cover.crop(box),left=box[0],top=box[1],width=box[2]-box[0],height=box[3]-box[1],derived='same-face cheek texture cover beneath published closed lash; designer review')
visible=[p for p in parts if not p.get('hidden')];top=min(p['top'] for p in visible);bottom=max(p['top']+p['height'] for p in visible);left=min(p['left'] for p in visible);right=max(p['left']+p['width'] for p in visible)
scale=unit['targetHeight']/(bottom-top);origin=[pivots['root'][0],bottom]
def xy(p):return[(p[0]-origin[0])*scale,(origin[1]-p[1])*scale]
# Share paint details with useful bones; never one bone per pixel layer.
parents={'root':None,'hip':'root','head-pivot':'hip','head':'head-pivot','hp-anchor':'head','vfx-origin':'hip','main-hand':'r-paw','off-hand':'l-paw'}
pos=dict(pivots);pos['head-pivot']=pivots['head']
eyes=[p['pivot'] for p in parts if p['name'].endswith('-white') and p['name'].startswith('eye-')]
if eyes:pos['head']=[sum(p[0] for p in eyes)/len(eyes),sum(p[1] for p in eyes)/len(eyes)+20]
for p in parts:
 n=p['name']
 if re.fullmatch(r'tail-\d+',n) or n in ['r-leg-upper','r-leg-lower','r-foot','l-leg-upper','l-leg-lower','l-foot','r-arm-upper','r-arm-lower','r-paw','l-arm-upper','l-arm-lower','l-paw','ear-r-outer','ear-l-outer','skirt-front-r','skirt-front-l','apron-bib','lantern-handle','hair-tuft-1','hair-tuft-2']:
  pos[n]=p['pivot'];parents[n]=('tail-'+str(int(n.split('-')[-1])-1)) if n.startswith('tail-') and n!='tail-1' else p.get('parent','hip')
# Lantern paint hangs from the shield hand; face paint shares the head bone.
parents['lantern-handle']='off-hand'
for n,p in list(parents.items()):
 if p and p not in parents:parents[n]='head' if p.startswith(('head','ear','eye')) else 'hip'
bones=[];added=set()
while len(added)<len(parents):
 for n,parent in parents.items():
  if n in added or parent and parent not in added:continue
  point=xy(pos[n]);base=xy(pos[parent]) if parent else [0,0]
  bone={'name':n}
  if parent:bone.update(parent=parent,x=point[0]-base[0],y=point[1]-base[1])
  bones.append(bone);added.add(n)

def bone_for(p):
 n=p['name']
 if n in parents:return n
 if n.startswith('ear-r'):return 'ear-r-outer'
 if n.startswith('ear-l'):return 'ear-l-outer'
 if n.startswith(('eye','head','cheek','brow','nose','mouth')):return 'head'
 if n.startswith('lantern'):return 'lantern-handle'
 if n.startswith('shield'):return 'off-hand'
 parent=p.get('parent','hip')
 return parent if parent in parents else 'hip'
# Pack trimmed half-resolution layers on one page with four pixel gutters.
for p in parts:p['packed']=p['image'].resize((max(1,round(p['width']*scale)),max(1,round(p['height']*scale))),Image.Resampling.LANCZOS)
page_width=1024;x=y=row_height=4
for p in sorted(parts,key=lambda p:-p['packed'].height):
 w,h=p['packed'].size
 if x+w+4>page_width:x=4;y+=row_height+4;row_height=0
 p['atlas']=[x,y,w,h];x+=w+4;row_height=max(row_height,h)
page_height=2**math.ceil(math.log2(y+row_height+4))
if max(page_width,page_height)>config['atlasMax']:raise ValueError('PSD parts exceed single page atlas budget')
atlas_image=Image.new('RGBA',(page_width,page_height));atlas=[f'{unit_id}.png',f'size: {page_width},{page_height}','format: RGBA8888','filter: Linear,Linear','repeat: none','pma: true'];attachments={};spine_slots=[]
for p in parts:
 n=p['name'];x,y,w,h=p['atlas'];atlas_image.paste(p['packed'],(x,y));atlas.extend([n,f'bounds: {x},{y},{w},{h}'])
 b=bone_for(p);pivot=xy(pos[b]);center=xy([p['left']+p['width']/2,p['top']+p['height']/2]);spine_slots.append({'name':n,'bone':b,**({} if p.get('hidden') else {'attachment':n})});attachments[n]={n:{'x':center[0]-pivot[0],'y':center[1]-pivot[1],'width':p['width']*scale,'height':p['height']*scale}}
pixels=np.array(atlas_image,dtype=np.uint16);pixels[:,:,:3]=(pixels[:,:,:3]*pixels[:,:,3:4]+127)//255;Image.fromarray(pixels.astype('uint8')).save(out/f'{unit_id}.png',compress_level=9)
skel={'skeleton':{'spine':config['runtimeVersion']+'.00','x':(left-origin[0])*scale,'y':0,'width':(right-left)*scale,'height':unit['targetHeight']},'bones':bones,'slots':spine_slots,'skins':[{'name':'default','attachments':attachments}],'events':{n:{} for n in ['hit','cast','ult-start','ult-end']},'animations':{},'laneC':{'status':'placeholder','source':str(source),'sourceHashes':source_hash,'tool':'psd-to-spine.py','parts':len(parts),'sourceScale':scale,'derivedPatches':{p['name']:p['derived'] for p in parts if 'derived' in p},'notes':'Automatic hidden fills and blink need designer review. Never final character art.'}}
for name in unit['animations']:
 spec=config['animations'][name];duration=sum(spec['seconds'])/2
 def t(f):return round(f*duration,4)
 def rotate(value):return [{'time':0,'value':0},{'time':t(.5),'value':value},{'time':duration,'value':0}]
 tracks={'root':{'translate':[{'time':0,'x':0,'y':0},{'time':duration,'x':0,'y':0}]}}
 if name in ['idle','idle-phase2','victory']:
  tracks['hip']={'scale':[{'time':0,'x':1,'y':1},{'time':t(.5),'x':.998,'y':1.006},{'time':duration,'x':1,'y':1}]}
  tracks['head-pivot']={'rotate':rotate(1.0 if name!='victory' else 2)}
  for n in parents:
   if n.startswith('tail-'):tracks[n]={'rotate':rotate(.5 if int(n[-1])%2 else -.7)}
   if n.startswith('ear-'):tracks[n]={'rotate':rotate(1.5)}
   if n.startswith(('skirt-','hair-','lantern-')):tracks[n]={'rotate':rotate(1.1)}
 elif name=='appear':tracks['root']['translate']=[{'time':0,'x':-80},{'time':t(.7),'x':4},{'time':duration}]
 elif name=='ko':tracks['hip']={'rotate':[{'time':0},{'time':t(.8),'value':-68},{'time':duration,'value':-72}],'translate':[{'time':0},{'time':duration,'y':-unit['targetHeight']*.25}]}
 elif name=='hurt':tracks['hip']={'rotate':rotate(4),'translate':[{'time':0},{'time':t(.25),'x':-12},{'time':duration}]}
 else:
  tracks['hip']={'rotate':[{'time':0},{'time':t(.24),'value':2},{'time':t(.55),'value':-2},{'time':duration}]}
  tracks['r-arm-upper']={'rotate':[{'time':0},{'time':t(.25),'value':-5},{'time':t(.55),'value':5},{'time':duration}]}
  tracks['l-arm-upper']={'rotate':[{'time':0},{'time':t(.25),'value':3},{'time':t(.55),'value':-4},{'time':duration}]}
  if name=='attack':tracks['root']['translate']=[{'time':0},{'time':t(.25),'x':-15},{'time':t(.48),'x':24},{'time':duration}]
 clip={'bones':tracks}
 if spec['events']:clip['events']=[{'name':n,'time':t(f)} for n,f in spec['events'].items()]
 if name in ['idle','victory']:
  clips={}
  for p in parts:
   n=p['name']
   if n.startswith('eye-'):
    closed=n.endswith('-closed');clips[n]={'attachment':[{'time':0,'name':None if closed else n},{'time':t(.67),'name':n if closed else None},{'time':t(.715),'name':None if closed else n},{'time':duration,'name':None if closed else n}]}
  clip['slots']=clips
 skel['animations'][name]=clip
(out/f'{unit_id}.json').write_text(json.dumps(skel,indent=2)+'\n');(out/f'{unit_id}.atlas').write_text('\n'.join(atlas)+'\n')
for p in [source,psd_path,notes]:assert hashlib.sha256(p.read_bytes()).hexdigest()==source_hash[p.name]
print(json.dumps({'id':unit_id,'parts':len(parts),'bones':len(bones),'atlas':[page_width,page_height],'scale':scale,'output':str(out),'sourceUnchanged':True}))
