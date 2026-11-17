"""Persist built-in output and provenance before any further generation (A5)."""
from pathlib import Path
from datetime import datetime,timezone
from PIL import Image,ImageDraw
import json,shutil,hashlib,sys,numpy as np
key,source=sys.argv[1:3];inputs=sys.argv[3:]
P=Path('tools/v3craft-lab/v4-clover');out=Path('tools/v3craft-lab/poses/raw/clover')/(key+'.png')
if out.exists():raise SystemExit('Refusing to overwrite candidate '+str(out))
shutil.copy2(source,out)
prompt=(P/(key+'-prompt.txt')).read_text().strip()
p=Path('assets/provenance.json');data=json.loads(p.read_text())
data['assets'].append({'id':'v4-clover-'+key.lower(),'date':datetime.now(timezone.utc).isoformat(),'tool':'built-in image_gen','prompt':prompt,'referenceInput':'own art: '+'; '.join(inputs),'inputs':inputs,'output':str(out),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'status':'candidate; quantitative/visual review pending'})
p.write_text(json.dumps(data,indent=2)+'\n')
im=Image.open(out).convert('RGBA');w=im.width;a=np.array(im);y,x=np.where(a[:,:,3]>=128)
print(json.dumps({'candidate':key,'dimensions':im.size,'opaqueBounds':[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]}))
im.thumbnail((768,768));bg=Image.new('RGBA',im.size,'#37313c');bg.alpha_composite(im);d=ImageDraw.Draw(bg)
for y in range(0,im.height,64):d.text((4,y),str(round(y*w/im.width)),fill='white')
bg.convert('RGB').save(P/(key+'-preview.jpg'),quality=94)
