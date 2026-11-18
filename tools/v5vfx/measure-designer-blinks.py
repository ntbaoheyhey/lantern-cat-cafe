from pathlib import Path
import sys,json,datetime
sys.path.insert(0,str(Path('work/v5/CXV/python').resolve()))
import cv2,numpy as np
p=Path('work/v5/CXV/ref/batch-m');out={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'HSV iris area in upper face, connected components split at tracked nose X; apparent closure if <20% side p90 area. Area is visibility, not eye-open parameter. Tail measured silhouette band outside torso; extent only, no inferred joint lag.','clips':{}}
for cat in ['mochi','clover']:
 a=np.load(p/(cat+'-frames.npy'),mmap_mode='r');ch=np.load(p/(cat+'-channels.npz'));rows=[]
 for i,im in enumerate(a):
  hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV);x0=(375 if cat=='mochi' else 311)+ch['nose'][i,0];height=215 if cat=='mochi' else 227
  h,s,v=cv2.split(hsv[:height]);mask=((h>38)&(h<95)&(s>65)&(v>65)).astype(np.uint8) if cat=='mochi' else ((h>22)&(h<80)&(s>100)&(v>75)).astype(np.uint8)
  noseY=(173 if cat=='mochi' else 168)+ch['nose'][i,1]
  if cat=='clover':mask[:max(0,int(noseY-60))]=0;mask[max(0,int(noseY-7)):]=0
  n,lab,stats,cent=cv2.connectedComponentsWithStats(mask)
  areas=[0,0];heights=[0,0]
  for j in range(1,n):
   if stats[j,cv2.CC_STAT_AREA]<6:continue
   cx,cy=cent[j]
   if cy<(100 if cat=='mochi' else 95) or abs(cx-x0)>100:continue
   side=0 if cx<x0 else 1;areas[side]+=int(stats[j,cv2.CC_STAT_AREA]);heights[side]=max(heights[side],int(stats[j,cv2.CC_STAT_HEIGHT]))
  # Leftmost silhouette outside torso: report changing extent, not 'tail tip'.
  lo,hi=(220,400) if cat=='mochi' else (380,550);band=im[lo:hi,:220].max(2)>25;ys,xs=np.where(band)
  rows.append({'frame':i,'eyes':areas,'eyeHeights':heights,'leftSilhouette':int(xs.min()) if len(xs) else None})
 areas=np.array([r['eyes'] for r in rows]);events=[]
 for side in range(2):
  limit=float(np.percentile(areas[:,side],90)*.2);closed=(areas[:,side]<limit)&(np.array([r['eyeHeights'][side] for r in rows])<7);starts=np.where(closed&~np.r_[False,closed[:-1]])[0];ends=np.where(closed&~np.r_[closed[1:],False])[0]
  events.append({'side':'left' if side==0 else 'right','p90IrisArea':float(np.percentile(areas[:,side],90)),'closureThreshold':limit,'closureWindows':[{'startFrame':int(s),'endFrame':int(e),'durationMs':round((e-s+1)/30*1000,1),'minimumFrame':int(s+areas[s:e+1,side].argmin())} for s,e in zip(starts,ends)]})
 out['clips'][cat]={'events':events,'rows':rows};print(cat,json.dumps(events),flush=True)
 # Fresh crops show sampled closure minima for independent check, not old overview images.
 candidates=sorted(set(w['minimumFrame'] for e in events for w in e['closureWindows']))[:8];tiles=[]
 for i in candidates:
  im=a[i]; crop=im[70:220,220:430] if cat=='mochi' else im[80:230,150:390];tile=np.full((184,256,3),24,np.uint8);small=cv2.resize(crop,(240,150));tile[25:175,8:248]=small;cv2.putText(tile,f'{cat} F{i} {i/30:.2f}s',(5,17),cv2.FONT_HERSHEY_SIMPLEX,.43,(230,230,230),1,cv2.LINE_AA);tiles.append(tile)
 if tiles:
  while len(tiles)%4:tiles.append(np.full((184,256,3),24,np.uint8))
  sheet=np.concatenate([np.concatenate(tiles[j:j+4],axis=1) for j in range(0,len(tiles),4)],axis=0);cv2.imwrite(str(p/(cat+'-blink-check-r3.jpg')),sheet,[cv2.IMWRITE_JPEG_QUALITY,90]);print(cat,'blink sheet',sheet.shape)
(p/'blink-measurements-r3.json').write_text(json.dumps(out,indent=2)+'\n')
