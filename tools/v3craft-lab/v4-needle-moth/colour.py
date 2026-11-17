"""A1/A5 masked Lab translation, retaining original alpha and untouched raw art."""
from pathlib import Path
from PIL import Image
from skimage.color import rgb2lab,lab2rgb
import numpy as np,json,sys
key=sys.argv[1];amount=float(sys.argv[2]);P=Path('tools/v3craft-lab/v4-needle-moth')
a=np.array(Image.open(P/'raw'/f'{key}-normal.png').convert('RGBA'))
b=np.array(Image.open('apps/web/public/units/needle-moth/runtime.webp').convert('RGBA'))
mask=a[:,:,3]>=128;reference=b[:,:,3]>=128
lab=rgb2lab(a[:,:,:3]/255);ref=rgb2lab(b[:,:,:3]/255)
offset=ref[reference].mean(0)-lab[mask].mean(0)
out=a.copy();out[:,:,:3]=np.rint(np.clip(lab2rgb(lab+offset*amount),0,1)*255).astype('uint8')
path=P/'raw'/f'{key}-colour-{round(amount*100)}.png';Image.fromarray(out).save(path)
de=float(np.linalg.norm(rgb2lab(out[:,:,:3]/255)[mask].mean(0)-ref[reference].mean(0)))
record={'candidate':key,'amount':amount,'LabOffset':offset.tolist(),'meanLabDeltaE76':de,'output':str(path),'alphaUnchanged':bool(np.array_equal(a[:,:,3],out[:,:,3]))}
(P/f'{key}-colour-{round(amount*100)}.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
