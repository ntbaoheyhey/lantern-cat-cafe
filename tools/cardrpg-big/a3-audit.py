"""REFERENCE: reports/cardrpg-big/memory/PROMPT-A3.md. Saved-receipt and source-byte audit; no browsers or timing runs."""
from pathlib import Path
import json,hashlib,subprocess
base=Path('reports/cardrpg-big/a3');out=base/'task3-fixed';full=base/'task3-pack'
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text())
main=Path('docs/cardrpg3/index.html');hash=sha(main);build=read('docs/cardrpg3/build.json')
assert hash==read(out/'functional.json')['sha256'];assert build['sha256']==hash and not build['runtimeDirty']
for field in ['sourceHashes','sourceAssetHashes']:
 for p,h in build[field].items():assert sha(p)==h,p
assert sha('docs/cardrpg3/baseline-v1.html')=='9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3'
gates=read('reports/cardrpg-big/validation/a3-task3-fixed.json');assert len(gates)==5
for g in gates:assert g['exit']==0 and sha(g['log'])==g['sha256'],g
copy=read(base/'task1/l1-copy.json')
for p in copy['files']:assert sha(p['path'])==p['sha256'],p['path']
changed=subprocess.check_output(['git','diff','--name-only','0eb729b5','HEAD','--','apps/web/src','packages','contracts','supabase'],text=True).splitlines()
allowed={'apps/web/src/game/cardrpg/depth/'+s for s in ['App.tsx','meta.css','TeamCollection.tsx','Equipment.tsx','Invitations.tsx','Invitations.test.tsx','invitations.css','Encounter.tsx']}
assert set(changed)<=allowed,changed
protected=subprocess.check_output(['git','diff','--name-only','a106dfca','--','packages/game-rules/src','packages/chain','contracts','supabase'],text=True).splitlines()
assert protected==[],protected
func=read(full/'functional.json');assert func['sha256']==hash and len(func['rows'])==10 and all(r['exit']==0 for r in func['rows'])
def clean(d,p):
 if isinstance(d,dict):
  for k,v in d.items():
   if k in ['errors','remote','requests','remoteRequests','overflowElements','rightOverflow']:assert v==[],(p,k,v)
   if k in ['overflow','pageOverflow','panelOverflow','bodyOverflow']:assert v==0,(p,k,v)
   if k in ['passed','accountUnchanged','accountRestored','local']:assert v is True,(p,k,v)
   clean(v,p+'.'+k)
 elif isinstance(d,list):
  for v in d:clean(v,p)
groups=[];images=[]
for group,count in dict(studio=3,gallery=3,comparisons=93,lab=3,meta=3,reveal=8,invitations=4,designs=3,path=3,mechanics=4).items():
 p=full/group/'checks.json';d=read(p);assert d['sha256']==hash and len(d['rows'])==count,(group,len(d['rows']));clean(d,group)
 shots=[dict(path=str(p),bytes=p.stat().st_size,sha256=sha(p)) for p in sorted((full/group).iterdir()) if p.suffix in ['.png','.webp']];images+=shots
 groups.append(dict(name=group,path=str(p),sha256=sha(p),rows=count,screenshots=len(shots)))
assert len(images)==204,len(images)
ui=[]
for w in [1024,1280,1440]:
 p=out/f'screens-{w}/checks.json';d=read(p);assert d['artifactSha256']==hash and d['passed'] and len(d['rows'])==9;clean(d,str(p))
 for r in d['rows']:
  assert r['firstViewport'],(w,r['screen']);assert sha(r['screenshot'])==r['sha256'];assert sha(r['background'])==r['backgroundSha256']
 ui.append(dict(width=w,rows=9,firstViewport=9))
contrast=read(out/'screens-1024/contrast.json');assert {r['width'] for r in contrast['rows']}=={1024,1280,1440};assert contrast['activeFailures']==0;assert {r['artifactSha256'] for r in contrast['rows']}=={hash}
proof=dict(sha256=hash,bytes=main.stat().st_size,sourceHead=build['head'],sourceInputs=len(build['sourceHashes']),gates=gates,groups=groups,screenCount=len(images),screenshots=images,ui=ui,contrast={k:v for k,v in contrast.items() if k!='rows'},baselineUnchanged=True,l1CopiesUnchanged=len(copy['files']),protectedChanges=[],changedSource=changed,method='Saved exact-hash receipts, source bytes and log hashes audited. Does not upgrade historical timing or visual quality claims.')
(out/'audit.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps({k:proof[k] for k in ['sha256','bytes','sourceInputs','screenCount','ui','contrast','protectedChanges']}))
