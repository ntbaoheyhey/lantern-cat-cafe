"""Compare saved startup chunks; changes in dormant preload maps remain explicit."""
from pathlib import Path
import json,re,hashlib
old=json.load(open('reports/cardrpg-look/validation/flag-off/checks.json'))
new=json.load(open('reports/cardrpg-look/validation/l1/flag-off/checks.json'))
root=Path('reports/cardrpg-look/validation/l1/flag-off')
hash=lambda b:hashlib.sha256(b).hexdigest()
norm=lambda s:re.sub(r'-[\w-]{8}(\.(?:js|css))',r'-HASHHASH\1',s)
rows=[]
for a,b in zip(sorted(old['chunks'],key=lambda c:str(c['modules'])),sorted(new['chunks'],key=lambda c:str(c['modules']))):
 assert a['modules']==b['modules']
 x=(Path('/tmp/cardrpg-look-flag-off-dist')/a['path'].lstrip('/')).read_bytes()
 y=(Path('/tmp/cardrpg-look-l1-flag-off')/b['path'].lstrip('/')).read_bytes()
 assert hash(x)==a['sha256'] and hash(y)==b['sha256']
 nx,ny=norm(x.decode()),norm(y.decode())
 row={'before':a['path'],'after':b['path'],'beforeSha256':hash(x),'afterSha256':hash(y),'byteDelta':len(y)-len(x),'moduleSetEqual':True,'identicalAfterChunkHashNormalization':nx==ny}
 if nx!=ny:
  assert a['path'].startswith('/assets/index-')
  for label,raw in [('before',x),('after',y)]: (root/f'startup-index-{label}.txt').write_bytes(raw)
  def parse(s):
   deps=json.loads(re.search(r'm\.f=(\[.*?\])',s).group(1))
   maps=[[deps[i] for i in json.loads(r)] for r in re.findall(r'__vite__mapDeps\((\[.*?\])\)',s)]
   body=re.sub(r'^const __vite__mapDeps=.*?;\n','',s)
   body=re.sub(r'__vite__mapDeps\(\[.*?\]\)','PRELOAD_MAP',body)
   return body,maps
  bx,mx=parse(nx);by,my=parse(ny);assert bx==by
  assert mx[-1]==my[-1], 'Default startup dependencies changed'
  row.update(onlyDormantPreloadMetadataChanged=True,defaultPreloadEqual=True,beforePreloadMaps=mx,afterPreloadMaps=my)
 rows.append(row)
receipt={'beforeBytes':sum(c['bytes'] for c in old['chunks']),'afterBytes':sum(c['bytes'] for c in new['chunks']),'strictByteEquality':False,'scripts':len(rows),'modules':len(set(m for c in new['chunks'] for m in c['modules'])),'rows':rows,'explanation':'4 added bytes in Vite entry preload metadata for dormant cardrpg/squad3d branches. Default dependency list and all 686 loaded modules match; other chunk changes are content-hash references. This is a strict byte-parity MISS, not byte-identical output.'}
(root/'startup-diff.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({k:v for k,v in receipt.items() if k!='rows'}))
