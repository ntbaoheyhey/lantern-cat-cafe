"""L1 visible-point optical tracking; ranges are measurements, phase is fitted evidence."""
from pathlib import Path
import sys,json,datetime,hashlib
sys.path.insert(0,str(Path('work/v5/CXV/python').resolve()))
import cv2,numpy as np
cv2.setNumThreads(2)
p=Path('work/v5/CXV/ref/batch-m')
regions={
 'mochi':{'body':[292,248,54,44],'head':[285,106,58,29],'nose':[362,161,27,26],'earLeft':[238,39,36,45],'earRight':[367,43,30,49],'hair':[308,75,38,28],'tail':[120,229,48,36],'prop':[446,277,29,60],'lantern':[499,293,31,52],'cloth':[290,327,53,26],'footLeft':[231,435,38,25],'footRight':[361,435,37,26]},
 'clover':{'body':[234,323,60,35],'head':[252,95,43,24],'nose':[298,156,26,29],'earLeft':[154,29,32,51],'earRight':[336,29,27,52],'hair':[251,75,40,27],'tail':[66,419,41,29],'prop':[425,219,41,56],'cloth':[211,507,70,28],'leaf':[198,235,54,30],'bag':[207,376,36,47],'footLeft':[167,591,34,26],'footRight':[296,591,35,25]}}
result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'OpenCV pyramidal LK sequential tracks of frame0 corners in manual anatomical ROIs; forward/back error<=1px, >=3 points retained; median displacement from frame0. Frequencies fitted 1-4 harmonics of 10s; periods are dominant components, not unique physical cycles. Phase lag of matching harmonic vs body; uncertainty >=1frame and .25px. Black boundary not treated as alpha.','clips':{}}
for cat,rois in regions.items():
 frames=np.load(p/(cat+'-frames.npy'),mmap_mode='r');gray=[cv2.cvtColor(f,cv2.COLOR_BGR2GRAY) for f in frames];starts=[];groups={}
 for name,(x,y,w,h) in rois.items():
  mask=np.zeros(gray[0].shape,np.uint8);mask[y:y+h,x:x+w]=255
  pts=cv2.goodFeaturesToTrack(gray[0],maxCorners=24,qualityLevel=.03,minDistance=3,mask=mask)
  if pts is None:raise RuntimeError(name)
  groups[name]=list(range(len(starts),len(starts)+len(pts)));starts.extend(pts[:,0].tolist())
 first=np.array(starts,np.float32).reshape(-1,1,2);at=first.copy();alive=np.ones(len(first),bool);hist=[at[:,0].copy()];valid=[alive.copy()]
 for i in range(1,len(gray)):
  nxt,status,err=cv2.calcOpticalFlowPyrLK(gray[i-1],gray[i],at,None,winSize=(21,21),maxLevel=3,criteria=(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,30,.01))
  back,bs,be=cv2.calcOpticalFlowPyrLK(gray[i],gray[i-1],nxt,None,winSize=(21,21),maxLevel=3,criteria=(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,30,.01))
  alive &= (status[:,0]>0)&(bs[:,0]>0)&(np.linalg.norm(back[:,0]-at[:,0],axis=1)<1)
  at=nxt;hist.append(at[:,0].copy());valid.append(alive.copy())
 hist=np.array(hist);valid=np.array(valid);series={};rows={};t=np.arange(len(gray))/30
 for name,ids in groups.items():
  keep=[i for i in ids if valid[:,i].all()]; partial=False
  if len(keep)<3:keep=ids;partial=True
  delta=hist[:,keep]-first[keep,0];line=np.median(delta,axis=1);series[name]=line
  slopes=np.diff(line,axis=0)*30
  axis=int(np.ptp(line,axis=0).argmax());center=line[:,axis]-line[:,axis].mean();fft=np.fft.rfft(center);k=int(np.argmax(np.abs(fft[1:5])))+1
  phase=float(np.angle(fft[k])); power=float(np.abs(fft[k])**2/max(1e-9,(np.abs(fft[1:])**2).sum()))
  rows[name]={'roi':rois[name],'trackedPoints':len(ids),'survivingPoints':len(keep) if not partial else 0,'quality':'REJECT unstable' if partial else 'usable projection, not rig parameter','xyRangePx':np.ptp(line,axis=0).round(3).tolist(),'xyRangePctHeight':(np.ptp(line,axis=0)/(431 if cat=='mochi' else 617)*100).round(3).tolist(),'dominantAxis':'xy'[axis],'dominantHarmonic':k,'dominantPeriodS':10/k,'dominantPowerFraction':round(power,3),'phaseRadians':phase,'extremaFrames':[int(line[:,axis].argmin()),int(line[:,axis].argmax())],'maxSpeedPxPerS':float(np.max(np.linalg.norm(slopes,axis=1))),'seamDeltaPx':(line[-1]-line[0]).round(3).tolist()}
 body=series['body'];bf=np.fft.rfft(body[:,int(np.ptp(body,axis=0).argmax())]-body[:,int(np.ptp(body,axis=0).argmax())].mean())
 for row in rows.values():
  k=row['dominantHarmonic'];diff=(row['phaseRadians']-np.angle(bf[k])+np.pi)%(2*np.pi)-np.pi;row['lagVsBodySameHarmonicMs']=round(float(-diff/(2*np.pi)*(10/k)*1000),1)
 np.savez(p/(cat+'-channels.npz'),**series)
 result['clips'][cat]={'frames':len(gray),'channels':rows}
 print(cat,json.dumps({k:{f:v[f] for f in ['survivingPoints','xyRangePctHeight','dominantPeriodS','dominantPowerFraction','seamDeltaPx']} for k,v in rows.items()}),flush=True)
(p/'channels.json').write_text(json.dumps(result,indent=2)+'\n')
