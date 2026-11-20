"""Q2 own-content comparison: semantic vs alpha scale; two formations; swept labels.
Run with tools/.venv/bin/python. Screenshots are study material, not final acceptance.
"""
import json, math
from pathlib import Path
from PIL import Image, ImageDraw

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
units={u['id']:u for u in json.loads((HERE/'alpha-results.json').read_text())['units']}
faces=json.loads((HERE/'faces.json').read_text())['units']
cases=json.loads((HERE/'baseline.json').read_text())['cases']
def overlap(a,b):
 return max(0,min(a[0]+a[2],b[0]+b[2])-max(a[0],b[0]))*max(0,min(a[1]+a[3],b[1]+b[3])-max(a[1],b[1]))
def rect(r): return [r[k] for k in ['x','y','width','height']]
def place(case,method):
 w,h=case['width'],case['height'];result=[];lanes={};hasboss=case['fixture']=='boss';enemies=sum(a['side']=='enemy' for a in case['actors'])
 for actor in case['actors']:
  id=actor['asset'];u=units[id];alpha=u['thresholds']['128']['world'];aspect=alpha['width']/alpha['height'];side=actor['side'];boss=u['tier']=='boss'
  lane=lanes.get((side,actor['row']),0);lanes[side,actor['row']]=lane+1
  seat=actor.get('seat', (0 if actor['row']=='front' else 2)+lane)
  if method=='current':
   a=next(a for a in case['audit']['units'] if a['id']==actor['id']);b=a['box'];bounds=u['bounds'];s=b['height']/bounds['height'];hh=alpha['height']*s;ww=alpha['width']*s
   xx=b['x']+(alpha['x']-bounds['x'])*s if side=='party' else b['x']+(bounds['x']+bounds['width']-alpha['x']-alpha['width'])*s
   yy=case['stage']['y']+b['y']+(bounds['y']+bounds['height']-alpha['y']-alpha['height'])*s
   flip=side=='enemy'
  else:
   hh=h*.27*(1.6 if boss else 1);ww=hh*aspect;flip=False
   xs=[.35,.38,.18,.21] if method=='compact' else [.32,.35,.12,.15]
   ys=[.54,.83,.40,.69]
   x,y=xs[seat%4],ys[seat%4]
   if side=='enemy':
    if boss:x,y=.69,.81
    elif hasboss:x,y=.93,[.42,.74][seat%2]
    elif enemies>4:
     x=[.625,.60,.76,.735,.90,.875][seat] if method=='compact' else [.60,.60,.75,.75,.91,.91][seat]
     y=[.54,.83,.40,.69,.54,.83][seat]
    else:x=1-x
   cx=max(ww/2+w*.015,min(w-ww/2-w*.015,x*w));foot=y*h
   xx,yy=cx-ww/2,foot-hh
  f=faces[id];fx=(1-f[0]-f[2] if flip else f[0]);face=[xx+fx*ww,yy+f[1]*hh,f[2]*ww,f[3]*hh]
  result.append({**actor,'box':[xx,yy,ww,hh],'face':face,'flip':flip,'foot':yy+hh})
 return sorted(result,key=lambda a:a['foot'])
def labels(actors,w,h,method):
 result=[];missing=[];protected=[a['face'] for a in actors];scale=h/720
 for a in actors:
  x,y,bw,bh=a['box'];cx=x+bw/2;foot=y+bh
  # Same four-digit critical value per target; include the CRIT tag and pop.
  if method=='current':
   anchor=next((r for r in case['anchors'] if r['id']==a['id']),{})
   lane=anchor.get('textLane',{});cx=lane.get('x',cx)+lane.get('width',0)/2;cy=lane.get('y',foot-100)+20
   r=[max(0,cx-95*scale),cy-65*scale-48,190*scale,118*scale+48]
   result.append({'id':a['id'],'rect':r});continue
  lw,top,bottom,rise=134*scale,43*scale,26*scale,24*scale
  choices=[]
  for cy in [foot-18*scale,foot-45*scale,foot+16*scale,foot-bh*.36]:
   for dx in [0,-bw*.35,bw*.35,-bw*.65,bw*.65,-bw*.9,bw*.9]:
    r=[cx+dx-lw/2,cy-top-rise,lw,top+bottom+rise]
    if r[0]<8 or r[0]+r[2]>w-8 or r[1]<46 or r[1]+r[3]>h-min(96,h*.12)-8:continue
    if any(overlap(r,b)>0 for b in protected+[p['rect'] for p in result]):continue
    choices.append((dx*dx+(cy-(foot-18*scale))**2,r))
  if choices:result.append({'id':a['id'],'rect':min(choices,key=lambda p:p[0])[1]})
  else:missing.append(a['id'])
 return {'placed':result,'missing':missing,'faceOverlaps':sum(overlap(p['rect'],f)>0 for p in result for f in protected),'edgeLabels':sum(p['rect'][0]<8 or p['rect'][0]+p['rect'][2]>w-8 for p in result)}
def sheet(case,actors,method,nums):
 w,h=case['width'],case['height'];image=Image.new('RGBA',(w,h),'#715144');d=ImageDraw.Draw(image)
 d.rectangle([0,0,w,h*.19],fill='#b8a07e');d.rectangle([0,h*.19,w,h],fill='#a77d5c')
 for a in actors:
  src=Image.open(HERE/'raw'/f"{a['asset']}.png");r=units[a['asset']]['thresholds']['128']['pixels'];src=src.crop((r['x'],r['y'],r['x']+r['width'],r['y']+r['height']))
  if a['flip']:src=src.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
  x,y,ww,hh=a['box'];src=src.resize((round(ww),round(hh)),Image.Resampling.LANCZOS);image.alpha_composite(src,(round(x),round(y)))
  f=a['face'];d.rectangle([f[0],f[1],f[0]+f[2],f[1]+f[3]],outline='#5fffc0',width=1)
 for p in nums['placed']:
  x,y,ww,hh=p['rect'];d.rectangle([x,y,x+ww,y+hh],outline='#ffe260',width=1)
 hud=126 if method=='current' else min(96,h*.12);d.rectangle([0,h-hud,w,h],fill='#28242e')
 d.text((12,12),f"{case['fixture']} {w}x{h} - {method} (green faces, yellow full number trajectory)",fill='white')
 return image.convert('RGB').resize((640,round(h/w*640)),Image.Resampling.LANCZOS)

results=[]
for case in cases:
 panels=[]
 for method in ['current','compact','wide']:
  actors=place(case,method);w,h=case['width'],case['height'];occlusions=[]
  for i,a in enumerate(actors):
   for b in actors[i+1:]:
    if overlap(a['face'],b['box'])>0:occlusions.append([a['asset'],b['asset'],round(overlap(a['face'],b['box']),1)])
  hud=126 if method=='current' else min(96,h*.12);numbers=labels(actors,w,h,method)
  result={'fixture':case['fixture'],'viewport':[w,h],'method':method,'catMinHeight':min(a['box'][3]/h for a in actors if a['side']=='party'),'span':(max(a['box'][0]+a['box'][2] for a in actors)-min(a['box'][0] for a in actors))/w,'stage':case['stage']['height']/h if method=='current' else 1,'hud':hud/h,'faceBodyIntersections':occlusions,'hudIntersections':[a['asset'] for a in actors if a['foot']>h-hud],'numbers':numbers,'actors':actors}
  results.append(result);panels.append(sheet(case,actors,method,numbers))
 montage=Image.new('RGB',(1280,panels[0].height*2),'#22232b')
 for i,p in enumerate(panels):montage.paste(p,(i%2*640,i//2*p.height))
 montage.save(HERE/f"layout-{case['fixture']}-{w}.jpg",quality=88)

scale=[]
for side in ['party','enemy']:
 rows=[u for u in units.values() if u['side']==side and u['tier']!='boss'];old=[u['thresholds']['128']['world']['height']/u['core']['world']['height']*u['core']['ratio'] for u in rows]
 scale.append({'side':side,'semanticMaxMin':max(old)/min(old),'alpha128MaxMin':1,'maxThresholdDifference':max(u['thresholds']['17']['world']['height']/u['thresholds']['128']['world']['height']-1 for u in rows)})
(HERE/'results.json').write_text(json.dumps({'scale':scale,'cases':results},indent=2)+'\n')
for r in results:print(r['fixture'],r['viewport'],r['method'],'minH',round(r['catMinHeight'],3),'span',round(r['span'],3),'faceBoxCollisions',len(r['faceBodyIntersections']),'hud',r['hudIntersections'],'numberFaceOverlaps',r['numbers']['faceOverlaps'],'unplaced',len(r['numbers']['missing']))
