"""Crop the original FX alpha bounds and export a reusable lossless texture."""
from pathlib import Path
from PIL import Image
import hashlib,json
import numpy as np
lab=Path('tools/v3craft-lab/v4-needle-moth');source=lab/'raw/sewing-needle.png'
im=Image.open(source).convert('RGBA');a=np.array(im);y,x=np.where(a[:,:,3]>=8)
box=[max(0,int(x.min())-4),max(0,int(y.min())-4),min(im.width,int(x.max())+5),min(im.height,int(y.max())+5)]
im=im.crop(tuple(box));im.thumbnail((1024,1024),Image.Resampling.LANCZOS)
a=np.array(im);y,x=np.where(a[:,:,3]>=128);left=int(x.min());tip=[float(left),float(np.median(y[x<=left+1]))]
out=lab/'textures';out.mkdir(exist_ok=True);path=out/'sewing-needle.webp';im.save(path,lossless=True,method=6,exact=True)
row={'source':str(source),'sourceCrop':box,'path':str(path),'dimensions':list(im.size),'tip':tip,'tipUv':[tip[0]/im.width,tip[1]/im.height],
 'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'note':'Leftmost opaque point is provisional needle tip; inspect first FX image before using this socket.'}
(lab/'fx-export.json').write_text(json.dumps(row,indent=2)+'\n');print(json.dumps(row))
