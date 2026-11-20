"""Save original effect, prompt and provenance before any next generation."""
from pathlib import Path
from datetime import datetime, timezone
from PIL import Image
import json, shutil, hashlib, sys, numpy as np
lab=Path('tools/v3craft-lab/v4-binding-thread')
name,source=sys.argv[1:3]
out=lab/'raw'/(name+'.png')
assert not out.exists(), 'Preserve prior raw effect'
shutil.copy2(source,out)
p=Path('assets/provenance.json');d=json.loads(p.read_text())
d['assets'].append({'id':'v4-binding-thread-'+name,'date':datetime.now(timezone.utc).isoformat(),'tool':'built-in image_gen','prompt':(lab/(name+'-prompt.txt')).read_text().strip(),'referenceInput':'own art only','inputs':['apps/web/public/units/binding-thread/runtime.webp'],'output':str(out),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'status':'candidate; drill review pending'})
p.write_text(json.dumps(d,indent=2)+'\n')
im=Image.open(out).convert('RGBA');a=np.array(im);y,x=np.where(a[:,:,3]>=8)
im=im.crop((x.min(),y.min(),x.max()+1,y.max()+1));im.thumbnail((768,768),Image.Resampling.LANCZOS)
textures=lab/'textures';textures.mkdir(exist_ok=True)
im.save(textures/(name+'.webp'),quality=94,method=6,exact=True)
bg=Image.new('RGBA',im.size,'#37313c');bg.alpha_composite(im)
bg.convert('RGB').save(lab/(name+'-preview.jpg'),quality=93)
print(json.dumps({'raw':str(out),'texture':str(textures/(name+'.webp')),'dimensions':im.size,'bytes':(textures/(name+'.webp')).stat().st_size}))
