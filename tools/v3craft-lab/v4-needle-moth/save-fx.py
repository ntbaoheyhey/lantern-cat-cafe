"""Persist original built-in FX painting and exact provenance before another job."""
from pathlib import Path
from datetime import datetime, timezone
from PIL import Image
import hashlib, json, shutil, sys
lab=Path('tools/v3craft-lab/v4-needle-moth')
out=lab/'raw/sewing-needle.png'
assert not out.exists(), 'Refusing to overwrite original FX paint'
shutil.copy2(sys.argv[1],out)
p=Path('assets/provenance.json');data=json.loads(p.read_text())
data['assets'].append({'id':'v4-needle-moth-sewing-needle','date':datetime.now(timezone.utc).isoformat(),
 'tool':'built-in image_gen','prompt':(lab/'sewing-needle-prompt.txt').read_text().strip(),
 'inputs':['apps/web/public/units/needle-moth/runtime.webp'],'referenceInput':'own art only',
 'output':str(out),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'status':'candidate; two lab drills and private comparison pending'})
p.write_text(json.dumps(data,indent=2)+'\n')
im=Image.open(out).convert('RGBA');print(json.dumps({'output':str(out),'size':im.size,'alphaBounds':im.getbbox()}))
im.thumbnail((768,768));bg=Image.new('RGBA',im.size,'#37313c');bg.alpha_composite(im)
bg.convert('RGB').save(lab/'sewing-needle-preview.jpg',quality=94)
