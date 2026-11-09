"""Pack immutable measured receipts; do not copy HTML builds or raw capture frames."""
from pathlib import Path
import sys,gzip,json,hashlib,shutil
source,target=map(Path,sys.argv[1:3]);images=set(sys.argv[3:]);rows=[]
for p in sorted(source.rglob('*')):
 if not p.is_file():continue
 rel=p.relative_to(source)
 if any(part in ('dist','frames','node_modules','staged') for part in rel.parts):continue
 if p.suffix not in ('.json','.gz','.log','.webp'):continue
 if p.suffix=='.webp' and not any(str(rel).startswith(prefix+'/') for prefix in images):continue
 data=p.read_bytes();dest=target/rel
 if p.suffix in ('.json','.log') and len(data)>12000:
  dest=dest.with_suffix(dest.suffix+'.gz');packed=gzip.compress(data,compresslevel=9,mtime=0)
 else:packed=data
 dest.parent.mkdir(parents=True,exist_ok=True)
 if dest.exists() and dest.read_bytes()!=packed:dest=dest.with_name(dest.stem+'-'+hashlib.sha256(data).hexdigest()[:12]+dest.suffix)
 dest.write_bytes(packed);rows.append(dict(source=str(p),path=str(dest.relative_to(target)),sourceBytes=len(data),packedBytes=len(packed),sha256=hashlib.sha256(data).hexdigest()))
(target/'packing.json').write_text(json.dumps({'method':'Lossless receipt gzip; selected original WebP captures copied unchanged. Raw PNG/masks/video intermediates and immutable HTML builds remain at recorded /tmp paths. Failed receipts retained; existing evidence cannot be overwritten.', 'rows':rows},indent=2))
print(json.dumps({'files':len(rows),'packedBytes':sum(r['packedBytes']for r in rows)}))
