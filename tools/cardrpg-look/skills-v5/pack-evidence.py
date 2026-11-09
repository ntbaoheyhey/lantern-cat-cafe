from pathlib import Path
import gzip,json,hashlib,shutil
root=Path('reports/cardrpg-look/skills-v5/v01');archive=Path('/tmp/cardrpg-v5look-v01-unpacked');rows=[]
for p in sorted(root.rglob('*.json')):
 data=p.read_bytes()
 if len(data)<20000:continue
 packed=gzip.compress(data,compresslevel=9,mtime=0)
 if len(packed)>=len(data):continue
 target=archive/p.relative_to(root);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target)
 p.with_suffix(p.suffix+'.gz').write_bytes(packed)
 assert gzip.decompress(p.with_suffix(p.suffix+'.gz').read_bytes())==data
 rows.append({'path':str(p.relative_to(root)),'bytes':len(data),'gzipBytes':len(packed),'sha256':hashlib.sha256(data).hexdigest()});p.unlink()
if rows:(root/'packing.json').write_text(json.dumps({'method':'Lossless deterministic gzip of larger JSON receipts; decompressed SHA256 retained. Uncompressed originals also retained under /tmp/cardrpg-v5look-v01-unpacked. No image/video re-encoding.','rows':rows},indent=2)+'\n')
print({'savedBytes':sum(r['bytes']-r['gzipBytes']for r in rows),'additionalBytes':sum(p.stat().st_size for p in root.rglob('*')if p.is_file()),'totalBytes':sum(p.stat().st_size for p in root.parent.rglob('*')if p.is_file())})
from PIL import Image
images=[]
for p in sorted((root/'startup').glob('*.png')):
 im=Image.open(p).convert('RGBA');target=p.with_suffix('.webp');im.save(target,lossless=True,method=6)
 assert Image.open(target).convert('RGBA').tobytes()==im.tobytes()
 original=archive/p.relative_to(root);original.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,original)
 images.append({'before':str(p.relative_to(root)),'after':str(target.relative_to(root)),'beforeBytes':p.stat().st_size,'afterBytes':target.stat().st_size,'rgbaSha256':hashlib.sha256(im.tobytes()).hexdigest()});p.unlink()
if images:(root/'startup/image-packing.json').write_text(json.dumps({'method':'Lossless WebP; decoded RGBA verified byte-identical to original PNG. Original PNGs retained in /tmp/cardrpg-v5look-v01-unpacked/startup.','rows':images},indent=2)+'\n')
print({'totalAfterImagePacking':sum(p.stat().st_size for p in root.parent.rglob('*')if p.is_file())})
