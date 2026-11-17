"""Crop the original FX alpha bounds and export a reusable lossless texture."""
from pathlib import Path
from PIL import Image
import hashlib,json
import numpy as np
lab=Path('tools/v3craft-lab/v4-yarn-giant');source=Path('tools/v3craft-lab/poses/raw/yarn-giant/braid-wave-A1.png')
im=Image.open(source).convert('RGBA');a=np.array(im);y,x=np.where(a[:,:,3]>=8)
box=[max(0,int(x.min())-4),max(0,int(y.min())-4),min(im.width,int(x.max())+5),min(im.height,int(y.max())+5)]
im=im.crop(tuple(box));im.thumbnail((1024,1024),Image.Resampling.LANCZOS)
a=np.array(im);y,x=np.where(a[:,:,3]>=128);right=int(x.max());tip=[float(right),float(np.median(y[x>=right-1]))]
out=lab/'textures';out.mkdir(exist_ok=True);path=out/'braid-wave.webp';im.save(path,lossless=True,method=6,exact=True)
row={'source':str(source),'sourceCrop':box,'path':str(path),'dimensions':list(im.size),'tip':tip,'tipUv':[tip[0]/im.width,tip[1]/im.height],
 'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'note':'Rightmost painted tip is the leftward basic strike anchor; full texture forms the ultimate braid fan.'}
(lab/'fx-export.json').write_text(json.dumps(row,indent=2)+'\n');print(json.dumps(row))
