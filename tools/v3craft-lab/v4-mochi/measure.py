"""Own-art normalization; no reference pixels. LEARN/A1,A4; no source overwrites."""
from pathlib import Path
from PIL import Image
from scipy.ndimage import label
from skimage.color import rgb2lab
import numpy as np,json,sys
key,top,chin=sys.argv[1],float(sys.argv[2]),float(sys.argv[3])
original=Image.open('apps/web/public/units/mochi/runtime.webp').convert('RGBA');base=Image.new('RGBA',(896,896));base.alpha_composite(original,(128,128));im=Image.open(f'tools/v3craft-lab/poses/raw/mochi/{key}.png').convert('RGBA')
def bbox(a):
 y,x=np.where(a[:,:,3]>=128);return np.array([x.min(),y.min(),x.max()+1,y.max()+1])
def foot(a):
 b=bbox(a);y,x=np.where((a[:,:,3]>=128)&(np.indices(a.shape[:2])[0]>=b[3]-5));return np.array([x.mean(),b[3]])
a=np.array(im);comp,n=label(a[:,:,3]>=8);sizes=np.bincount(comp.ravel());sizes[0]=0;keep=comp==sizes.argmax();a[:,:,3]=np.where(keep,a[:,:,3],0);b=bbox(a);bb=bbox(np.array(base));scale=(bb[3]-bb[1])/(b[3]-b[1]);offset=np.rint(foot(np.array(base))-foot(a)*scale).astype(int);scaled=Image.fromarray(a).resize(tuple(np.rint(np.array(im.size)*scale).astype(int)),Image.Resampling.LANCZOS);norm=Image.new('RGBA',base.size);norm.alpha_composite(scaled,tuple(offset));dst=Path('tools/v3craft-lab/v4-mochi/raw');dst.mkdir(exist_ok=True);norm.save(dst/(key+'-normal.png'));a=np.array(norm);c=np.array(base);m=a[:,:,3]>=128;bm=c[:,:,3]>=128;de=np.linalg.norm(rgb2lab(a[:,:,:3]/255)[m].mean(0)-rgb2lab(c[:,:,:3]/255)[bm].mean(0));head=(chin-top)*scale/(376-190);unbounded=b*scale+np.tile(offset,2);nb=bbox(a)
r={'candidate':key,'rawOpaqueBounds':b.tolist(),'scale':float(scale),'offset':offset.tolist(),'iou':float((m&bm).sum()/(m|bm).sum()),'meanLabDeltaE76':float(de),'headRatio':float(head),'headLandmarksSource':[top,chin],'headLandmarksK0':[190,376],'headLandmarkUncertaintyPx':4,'clipped':bool(unbounded[0]<0 or unbounded[1]<0 or unbounded[2]>base.width or unbounded[3]>base.height),'frontReachBodyWidth':float((nb[2]-bb[2])/(bb[2]-bb[0])),'footDriftPx':int(abs(nb[3]-bb[3])),'accepted':False};Path(f'tools/v3craft-lab/v4-mochi/{key}-metrics.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
