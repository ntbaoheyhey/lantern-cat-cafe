"""Deterministic cut-out exporter from our four concept masters; no model calls.
Authored semantic partitions, 12px underlap, original alpha preserved/cleaned.
Never modifies source masters. Output is a six-layer rig, not a flat sprite.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, json, hashlib, argparse
ROOT=Path(__file__).resolve().parents[3]
parser=argparse.ArgumentParser()
parser.add_argument('--config',type=Path,help='Reviewed per-unit semantic polygons')
parser.add_argument('--out',type=Path,default=ROOT/'assets/cardrpg-look/v3-painted')
args=parser.parse_args()
if (ROOT/'STOP-B').exists():raise RuntimeError('STOP-B requested')
OUT=args.out;OUT.mkdir(parents=True,exist_ok=True)
# Normalized polygons, listed front-to-back; remaining pixels form the body.
CONFIG={
'mochi':dict(role='guardian',height=1.90,face=[.49,.30],layers=[
 ('head',[(0,0),(1,0),(1,.45),(.72,.49),(.29,.49),(0,.44)],[.50,.46]),
 ('armR',[(.68,.47),(1,.43),(1,1),(.69,1),(.66,.70)],[.72,.51]),
 ('armL',[(.28,.49),(.40,.49),(.43,.56),(.28,.77),(.13,.76),(.14,.63)],[.35,.52]),
 ('tail',[(0,.48),(.22,.48),(.23,.74),(.32,.84),(.24,.91),(0,.85)],[.29,.80]),
 ('feet',[(.23,.85),(.72,.85),(.72,1),(.23,1)],[.49,.88])]),
'soot':dict(role='witch',height=2.0,face=[.53,.29],layers=[
 ('head',[(0,0),(1,0),(1,.39),(.74,.43),(.35,.44),(.17,.43),(0,.30)],[.54,.43]),
 ('armR',[(.75,.41),(1,.35),(1,.75),(.76,.73),(.69,.53)],[.75,.49]),
 ('armL',[(.33,.55),(.44,.60),(.39,.70),(.26,.77),(.24,.68)],[.37,.59]),
 ('tail',[(0,.45),(.25,.48),(.25,.72),(.33,.86),(.28,.90),(0,.87)],[.30,.84]),
 ('feet',[(.28,.86),(.74,.86),(.74,1),(.28,1)],[.5,.88])]),
'button-guard':dict(role='guard',height=1.65,face=[.54,.28],layers=[
 ('head',[(.13,0),(.77,0),(.77,.34),(.29,.37),(.13,.31)],[.51,.34]),
 ('armR',[(.73,0),(1,0),(1,.79),(.75,.76),(.70,.44)],[.75,.43]),
 ('armL',[(0,.31),(.25,.30),(.37,.37),(.29,.71),(0,.80)],[.28,.40]),
 ('footL',[(0,.74),(.45,.74),(.45,1),(0,1)],[.33,.78]),
 ('footR',[(.57,.73),(.88,.73),(.88,1),(.57,1)],[.67,.78])]),
'yarn-giant':dict(role='yarn',height=2.35,face=[.40,.30],layers=[
 ('head',[(.13,0),(.67,0),(.67,.40),(.49,.45),(.24,.40),(.13,.29)],[.43,.40]),
 ('armR',[(.63,.23),(1,.17),(1,1),(.68,.91),(.65,.58)],[.75,.36]),
 ('armL',[(0,.24),(.25,.25),(.29,.52),(.23,.92),(0,.94)],[.20,.38]),
 ('footL',[(.18,.80),(.49,.80),(.49,1),(.18,1)],[.36,.85]),
 ('footR',[(.49,.80),(.76,.80),(.76,1),(.49,1)],[.63,.85])])}
if args.config:CONFIG=json.loads(args.config.read_text())
rows={}
for name,cfg in CONFIG.items():
 source=ROOT/f'assets/source/look-v3/concepts/{name}.png'
 im=Image.open(source).convert('RGBA');im.thumbnail((900,900),Image.Resampling.LANCZOS);w,h=im.size
 arr=np.array(im);arr[:,:,3][arr[:,:,3]<10]=0
 # Original painted colours preserved; lock highlights to warm cream, reduce stray cyan edge fringe.
 rgb=arr[:,:,:3].astype(float);rgb=np.minimum(rgb,[255,248,231]);arr[:,:,:3]=rgb.astype('uint8');im=Image.fromarray(arr)
 covered=Image.new('L',im.size,0);layers=[]
 for part,poly,pivot in cfg['layers']:
  m=Image.new('L',im.size,0);ImageDraw.Draw(m).polygon([(round(x*w),round(y*h)) for x,y in poly],fill=255)
  # Disjoint ownership before underlap; the union exactly covers the master.
  mask=Image.fromarray(np.minimum(np.array(m),255-np.array(covered)).astype('uint8'))
  covered=Image.fromarray(np.maximum(np.array(m),np.array(covered)).astype('uint8'))
  layers.append((part,mask,pivot))
 layers.append(('body',Image.fromarray(255-np.array(covered)),[.5,.66]))
 result=[]
 for index,(part,mask,pivot) in enumerate(reversed(layers)):
  mask=mask.filter(ImageFilter.MaxFilter(25));a=np.minimum(np.array(mask),arr[:,:,3]);bounds=Image.fromarray(a).getbbox()
  if not bounds:continue
  layer=im.copy();layer.putalpha(Image.fromarray(a));layer=layer.crop(bounds)
  layer.thumbnail((512,512),Image.Resampling.LANCZOS)
  dest=OUT/f'{name}-{part}.webp';layer.save(dest,'WEBP',quality=89,method=6,alpha_quality=100)
  result.append(dict(part=part,pivot=pivot,rect=[bounds[0]/w,bounds[1]/h,(bounds[2]-bounds[0])/w,(bounds[3]-bounds[1])/h],file=dest.name,depth=index*.012,sha256=hashlib.sha256(dest.read_bytes()).hexdigest()))
 rows[name]=dict(role=cfg['role'],height=cfg['height'],aspect=w/h,face=cfg['face'],layers=result,sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest())
 if cfg.get('eyes'):rows[name]['eyes']=cfg['eyes']
(OUT/'rigs.json').write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps({n:len(c['layers']) for n,c in rows.items()}))
