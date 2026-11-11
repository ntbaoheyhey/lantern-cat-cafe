"""Prepare our concept art for 3D material projection; no new generative calls."""
from pathlib import Path
from PIL import Image,ImageFilter
import json,hashlib,numpy as np
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'assets/cardrpg-look/v3-textures';OUT.mkdir(parents=True,exist_ok=True)
rows=[]
for name in ['mochi','soot','button-guard','yarn-giant']:
 source=ROOT/f'assets/source/look-v3/concepts/{name}.png';im=Image.open(source).convert('RGBA');im.thumbnail((1024,1024),Image.Resampling.LANCZOS)
 # Alpha is not used by opaque 3D materials. Transparent border pixels get a neutral material colour.
 bg=Image.new('RGBA',im.size, {'mochi':'#dfc6a0','soot':'#41424e','button-guard':'#66263d','yarn-giant':'#672b50'}[name]);bg.alpha_composite(im)
 path=OUT/f'{name}-paint.png';bg.convert('RGB').save(path,optimize=True)
 # Original authored fibre normal: restrained diagonal combing, no source-image relighting.
 size=256;y,x=np.mgrid[:size,:size];height=np.sin(x*.42+y*.14)+.45*np.sin(x*1.1+y*.34)+.2*np.sin(x*2.4-y*.18)
 dx=np.gradient(height,axis=1)*.17;dy=np.gradient(height,axis=0)*.17
 n=np.dstack((-dx,-dy,np.ones_like(dx)));n/=np.linalg.norm(n,axis=2,keepdims=True)
 norm=OUT/f'{name}-fibres.png';Image.fromarray(np.uint8((n*.5+.5)*255)).save(norm,optimize=True)
 rows.append({'id':name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'textureSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'normalSha256':hashlib.sha256(norm.read_bytes()).hexdigest(),'size':im.size,'tool':'Pillow/NumPy, deterministic authored fibre field','seed':0})
(OUT/'provenance.json').write_text(json.dumps(rows,indent=2)+'\n')
