"""Find screen-space approach corridors from unchanged real renderer alpha."""
from pathlib import Path
import json,heapq,math,sys
import numpy as np
from scipy.signal import fftconvolve
from PIL import Image,ImageDraw
R=Path('reports/v4-art/REVIEW/A6');d=json.loads((R/'raw/path-masks.json').read_text());W,H=d['width'],d['height'];step=8
scale=float(sys.argv[1]) if len(sys.argv)>1 else 1.;suffix='-minor'+str(scale).replace('.','') if len(sys.argv)>1 else ''
layout=sys.argv[2] if len(sys.argv)>2 else 'A'
if layout!='A':suffix+='-'+layout
def mask(row):
 a=np.zeros((H,W),bool)
 for y,x,z in row['runs']:a[y,x:z]=1
 if scale<1 and any(k in row['id'] for k in ['kettle-knight','spool-ram','pollen-scout','crumb-sentinel']):
  yy,xx=np.where(a);x0,x1=xx.min(),xx.max()+1;y0,y1=yy.min(),yy.max()+1
  factor=.65 if layout in ['I','J'] and 'pollen' in row['id'] else scale
  im=Image.fromarray(a[y0:y1,x0:x1].astype(np.uint8)*255);im=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.LANCZOS)
  dx,dy=(-20,-35) if 'kettle' in row['id'] else (55,20) if 'spool' in row['id'] else (0,0)
  if layout not in ['A','G','H','I','J']:dx,dy=(-20,0) if 'kettle' in row['id'] else ({'B':100,'C':130,'D':155,'E':130,'F':130}[layout],20) if 'spool' in row['id'] else (0,0)
  if layout in ['E','F'] and 'crumb-sentinel' in row['id']:dx,dy=(30,25) if layout=='E' else (40,40)
  if layout in ['G','H','I','J']:
   seat=(.72,.35) if 'kettle' in row['id'] else (.64,.92) if 'spool' in row['id'] else (.73,.68) if 'crumb' in row['id'] else None
   if layout=='H' and 'kettle' in row['id']:seat=(.69,.34)
   if layout in ['I','J'] and 'pollen' in row['id']:seat=(.88,.28)
   if seat:dx,dy=seat[0]*W-(x0+x1)/2,seat[1]*H-y1
   else:dx,dy=0,0
  left=round((x0+x1-im.width)/2+dx);top=round(y1-im.height+dy);a[:]=0;a[top:top+im.height,left:left+im.width]=np.asarray(im)>=128
 return a
others=[r for r in d['result'][0]['rows'] if r['id']!='panko'];others.sort(key=lambda r:r['order'],reverse=True)
above=np.zeros((H,W),bool);visible=[]
for r in others:
 a=mask(r);hidden=int((a&above).sum());visible.append((r['id'],a&~above,hidden,int(a.sum()),r['order']));above|=a
xs=np.arange(0,W,step);ys=np.arange(0,H,step);maps=[];summary=[]
for snap in d['result']:
 row=next(r for r in snap['rows'] if r['id']=='panko');a=mask(row);yy,xx=np.where(a);x0,x1=xx.min(),xx.max()+1;y0,y1=yy.min(),yy.max()+1;template=a[y0:y1,x0:x1].astype(np.float32)
 role=snap['role'];offx=x0-role['x'];offy=y0-role['y'];left=np.rint(xs+offx).astype(int);top=np.rint(ys+offy).astype(int);cost=np.zeros((len(ys),len(xs)),np.float32)
 validx=(left>=math.ceil(W*.03))&(left+template.shape[1]<=math.floor(W*.97));validy=(top>=0)&(top+template.shape[0]<=H)
 lx=np.clip(left,0,W-template.shape[1]);ty=np.clip(top,0,H-template.shape[0]);higher=np.zeros((H,W),bool)
 for ident,v,hidden,count,order in visible:
  if order>row['order']:higher|=v;continue
  coverage=fftconvolve(v.astype(np.float32),template[::-1,::-1],mode='valid');c=(coverage[np.ix_(ty,lx)]+hidden)/count;cost=np.maximum(cost,c)
 if higher.any():
  coverage=fftconvolve(higher.astype(np.float32),template[::-1,::-1],mode='valid');cost=np.maximum(cost,coverage[np.ix_(ty,lx)]/template.sum())
 cost[~validy,:]=1;cost[:,~validx]=1;maps.append(cost);summary.append({'ms':snap['ms'],'offset':[offx,offy],'maskSize':list(template.shape),'role':role})
start=d['result'][0]['role'];end=d['result'][-1]['role'].copy()
if layout in ['E','F']:end['x']+=30
if layout=='J':end['x']-=10
S=(round(start['y']/step),round(start['x']/step));G=(round(end['y']/step),round(end['x']/step))
cost=np.maximum(maps[0],maps[1]);dist={S:(float(cost[S]),0.)};parents={};q=[(*dist[S],S)];found=None
while q:
 peak,length,u=heapq.heappop(q)
 if dist.get(u)!=(peak,length):continue
 if u==G:found=u;break
 for dy,dx in [(0,1),(1,0),(0,-1),(-1,0),(1,1),(1,-1),(-1,1),(-1,-1)]:
  v=(u[0]+dy,u[1]+dx)
  if not(0<=v[0]<len(ys) and 0<=v[1]<len(xs)):continue
  val=(max(peak,float(cost[v])),length+math.hypot(dx,dy)*step)
  if v not in dist or val<dist[v]:dist[v]=val;parents[v]=u;heapq.heappush(q,(*val,v))
path=[]
if found:
 u=found
 while u!=S:path.append([u[1]*step,u[0]*step]);u=parents[u]
 path.append([S[1]*step,S[0]*step]);path.reverse()
phase=None
if layout=='J':
 def shortest(grid,source,cap):
  if grid[source]>cap:return {},{}
  ds={source:0.};ps={};queue=[(0.,source)]
  while queue:
   length,u=heapq.heappop(queue)
   if ds.get(u)!=length:continue
   for dy,dx in [(0,1),(1,0),(0,-1),(-1,0),(1,1),(1,-1),(-1,1),(-1,-1)]:
    v=(u[0]+dy,u[1]+dx)
    if not(0<=v[0]<len(ys) and 0<=v[1]<len(xs)) or grid[v]>cap:continue
    value=length+math.hypot(dx,dy)*step
    if value<ds.get(v,float('inf')):ds[v]=value;ps[v]=u;heapq.heappush(queue,(value,v))
  return ds,ps
 for cap in [.13,.14,.15]:
  a,pa=shortest(cost,S,cap);b,pb=shortest(maps[-1],G,cap)
  choices=[u for u in a if u in b and b[u]<=85 and b[u]/max(1,a[u]+b[u])<=.09]
  if not choices:continue
  middle=min(choices,key=lambda u:a[u]+b[u]);before=[];u=middle
  while u!=S:before.append(u);u=pa[u]
  before.append(S);before.reverse();after=[];u=middle
  while u!=G:u=pb[u];after.append(u)
  path=[[u[1]*step,u[0]*step] for u in before+after];phase={'cap':cap,'switchRoot':[middle[1]*step,middle[0]*step],'lengthBefore':a[middle],'lengthAfter':b[middle],'fractionBefore':a[middle]/(a[middle]+b[middle]),'path':path};break
heat=np.zeros((*cost.shape,3),np.uint8);heat[:,:,0]=np.minimum(255,cost*500);heat[:,:,1]=np.where(cost<=.15,150,30);heat[:,:,2]=30
im=Image.fromarray(heat).resize((960,600),Image.Resampling.NEAREST);draw=ImageDraw.Draw(im)
if path:draw.line([(x*960/W,y*600/H) for x,y in path],fill='white',width=2)
draw.text((10,10),f'Panko K1 alpha corridor | minor scale {scale} | minimax {dist.get(G)} | green<=15%',fill='white');im.save(R/('raw/path-map'+suffix+'.jpg'),quality=90)
diagnostic=[]
snap=d['result'][1];row=snap['rows'][0];a=mask(row);yy,xx=np.where(a);x0,x1=xx.min(),xx.max()+1;y0,y1=yy.min(),yy.max()+1;t=a[y0:y1,x0:x1];ox=x0-snap['role']['x'];oy=y0-snap['role']['y']
for x,y in path:
 px=int(round(x+ox));py=int(round(y+oy));moved=np.zeros((H,W),bool)
 if 0<=px<=W-t.shape[1] and 0<=py<=H-t.shape[0]:moved[py:py+t.shape[0],px:px+t.shape[1]]=t
 for ident,v,hidden,count,order in visible:
  value=(hidden+int((v&moved).sum()))/count
  if value>.15:diagnostic.append({'x':x,'y':y,'id':ident,'fraction':value})
result={'method':'Integer-translated alpha from actual900p draw; current static unit alpha/ordering;8px grid, K1 union100/250ms. Diagnostic only, not a film gate.','templates':summary,'start':[start['x'],start['y']],'goal':[end['x'],end['y']],'minimax':dist.get(G),'path':path,'K2GoalCost':float(maps[-1][G]),'pathCollisions':sorted(diagnostic,key=lambda r:r['fraction'],reverse=True),'phaseRoute':phase}
(R/('path-map'+suffix+'.json')).write_text(json.dumps(result,indent=2,default=lambda o:o.item())+'\n');print(json.dumps({'scale':scale,'minimax':result['minimax'],'K2GoalCost':result['K2GoalCost'],'points':len(path),'start':result['start'],'goal':result['goal']},separators=(',',':')))
