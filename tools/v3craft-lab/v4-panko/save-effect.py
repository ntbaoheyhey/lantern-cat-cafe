from pathlib import Path
from PIL import Image
from datetime import datetime,timezone
import json,shutil,hashlib,sys,numpy as np
name,source=sys.argv[1:3];p=Path('tools/v3craft-lab/v4-panko');raw=Path('tools/v3craft-lab/fx/raw')/name;raw.mkdir(parents=True,exist_ok=True);out=raw/'1.png'
assert not out.exists(),'Do not overwrite raw effect'
shutil.copy2(source,out);prompt=(p/(name+'-prompt.txt')).read_text().strip()
prov=Path('assets/provenance.json');d=json.loads(prov.read_text());d['assets'].append({'id':'v4-panko-'+name,'date':datetime.now(timezone.utc).isoformat(),'tool':'built-in image_gen','prompt':prompt,'referenceInput':'none; original effect','output':str(out),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()});prov.write_text(json.dumps(d,indent=2)+'\n')
im=Image.open(out).convert('RGBA');a=np.array(im);y,x=np.where(a[:,:,3]>=8);im=im.crop((x.min(),y.min(),x.max()+1,y.max()+1));im.thumbnail((768,768),Image.Resampling.LANCZOS)
tex=p/'textures';tex.mkdir(exist_ok=True);im.save(tex/(name+'.webp'),quality=94,method=6,exact=True)
bg=Image.new('RGBA',im.size,'#302b38');bg.alpha_composite(im);bg.convert('RGB').save(p/(name+'-preview.jpg'),quality=93)
print(name,'raw',out,'texture',im.size,(tex/(name+'.webp')).stat().st_size)
