from PIL import Image
from pathlib import Path
import numpy as np,json,sys
base=Path('reports/v3-feel/REVIEW')/(sys.argv[1] if len(sys.argv)>1 else 'QR-P1')
report={}
for kind in ['basic','ultimate']:
 img=Image.open(base/f'{kind}-peak-mask.png').convert('RGBA');a=np.array(img);m=a[:,:,3]>=.08*255;ys,xs=np.nonzero(m);cx=float(xs.mean());cy=float(ys.mean());scores=[]
 for angle in [90,180,270]:
  rot=np.array(Image.fromarray((m*255).astype('uint8')).rotate(angle,resample=Image.Resampling.NEAREST,center=(cx,cy)))>0
  scores.append(float(np.logical_and(m,rot).sum()/np.logical_or(m,rot).sum()))
 rgb=a[:,:,:3][m]/255;hi=rgb.max(1);lo=rgb.min(1);linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4);lum=linear @ np.array([.2126,.7152,.0722])
 report[kind]={'alphaThreshold':.08,'areaFraction':float(m.mean()),'thresholdSensitivity':{str(v):float((a[:,:,3]>=v*255).mean()) for v in [.04,.08,.12]},'centroid':[cx,cy],'rotationalIou':scores,'symmetryMax':max(scores),'saturationMean':float(((hi-lo)/np.maximum(hi,1e-9)).mean()),'p95LinearLuminance':float(np.percentile(lum,95)),'method':'Full-resolution 1280x720 isolated union; focus dim/banner/background excluded. Before actor occlusion.'}
(base/'mask-measurements.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
