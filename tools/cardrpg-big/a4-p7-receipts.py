# REFERENCE: GAMEPLAY-V4 P7; source-bound evidence audit, no browser reruns.
from pathlib import Path
import hashlib,json
root=Path.cwd();out=root/'reports/cardrpg-big/a4/p7'
def read(p):return json.loads((root/p).read_text())
def sha(p):return hashlib.sha256((root/p).read_bytes()).hexdigest()
def clean(data,path='receipt'):
 if isinstance(data,dict):
  for k,v in data.items():
   if k in ['errors','remote','requests','remoteRequests','overflowElements','rightOverflow']:assert v==[],(path,k,v)
   if k in ['overflow','pageOverflow','panelOverflow','bodyOverflow']:assert v==0,(path,k,v)
   clean(v,path+'.'+k)
 elif isinstance(data,list):
  for x in data:clean(x,path)
build=read('docs/cardrpg3/build.json');artifact=sha('docs/cardrpg3/index.html')
assert build['sha256']==artifact and build['gameplayV4'] and not build['runtimeDirty']
for field in ['sourceHashes','sourceAssetHashes']:
 for p,h in build[field].items():assert sha(p)==h,p
assert sha('docs/cardrpg3/baseline-v1.html')=='9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3'
assert (root/'docs/cardrpg3/baseline-v1.html').stat().st_size==23937000
gates=read('reports/cardrpg-big/validation/a4-p7.json');assert len(gates)==5
for g in gates:assert g['exit']==0 and sha(g['log'])==g['sha256'],g
functional=read('reports/cardrpg-big/a4/p7/full/functional.json');assert functional['sha256']==artifact and len({r['name'] for r in functional['rows']})==10
accepted={r['name']:r for r in functional['rows'] if r['exit']==0}
assert len(accepted)==10,'Every pack group needs passing evidence; original failures stay in the manifest.'
assert all(sum(r['name']==name for r in functional['rows'])<=3 for name in accepted),'At most two correction rounds per failure.'
images=[];groups=[]
for group,count in dict(studio=3,gallery=3,comparisons=93,lab=3,meta=3,reveal=8,invitations=4,designs=3,path=3,mechanics=4).items():
 directory=root/accepted[group].get('groupOut',f'reports/cardrpg-big/a4/p7/full/{group}');p=str((directory/'checks.json').relative_to(root));d=read(p);assert d['sha256']==artifact and len(d['rows'])==count,(group,len(d['rows']));clean(d,group)
 shots=[{'path':str(p.relative_to(root)),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(directory.iterdir()) if p.suffix in ['.png','.webp']];images.extend(shots);groups.append({'name':group,'rows':count,'captures':len(shots),'directory':str(directory.relative_to(root))})
assert len(images)==204,len(images)
new_screens=read('reports/cardrpg-big/a4/p7/new-screens/series.json');assert new_screens['sha256']==artifact
new_accepted={r['name']:r for r in new_screens['rows'] if r['exit']==0};assert len(new_accepted)==12
new_images=[];new_contrast=[]
for phase,count in [(1,10),(2,8),(4,10),(5,12)]:
 for width in [1280,1440,1024]:
  attempt=new_accepted[f'p{phase}-{width}'];directory=root/attempt['directory']/f'browser-{width}';d=read(str((directory/'checks.json').relative_to(root)))
  assert d['sha256']==artifact and len(d['captures'])==count;clean(d)
  samples=[x['ratio'] for capture in d['contrasts'] for x in capture['samples']];assert samples and min(samples)>=4.5
  new_contrast.extend(samples)
  shots=sorted(directory.glob('*.png'));assert len(shots)==count
  new_images.extend({'path':str(p.relative_to(root)),'sha256':sha(p),'bytes':p.stat().st_size} for p in shots)
assert len(new_images)==120
journey=read('reports/cardrpg-big/a4/p7/journey/checks.json');assert journey['complete'] and journey['sha256']==artifact;clean(journey)
assert any(e['kind']=='boss' for e in journey['encounters'])
assert journey['day7SaveSha256']==sha('reports/cardrpg-big/a4/p6/economy/day7.save')
assert journey['day7SaveSha256']==read('reports/cardrpg-big/a4/p6/path-preflight/day7-preflight.json')['saveSha256']
guide=read('reports/cardrpg-big/a4/p7/guide/checks.json');assert guide['sha256']==sha('docs/cardrpg3/gameplay-v4.html') and len(guide['rows'])==3;clean(guide)
assert all(row['keyboardEntry'] and min(x['ratio'] for x in row['contrast'])>=4.5 for row in guide['rows'])
balance=read('reports/cardrpg-big/a4/p6/acceptance.json');assert balance['artifactSha256']==artifact
result={'artifactSha256':artifact,'bytes':build['bytes'],'sourceHead':build['head'],'sourceInputs':len(build['sourceHashes']),'sourceGates':gates,'groups':groups,'packAttempts':functional['rows'],'screenshots':images,'newScreenshots':new_images,'newScreenCount':len(new_images),'newScreenMinContrast':min(new_contrast),'packCount':len(images),'journeyCaptures':len(journey['captures']),'day7BossStatus':'PASS' if journey.get('day7BossReached') else 'NOT VERIFIED','guideSha256':guide['sha256'],'guideScreenshots':sum(len(r['screenshots']) for r in guide['rows']),'guideMinContrast':min(x['ratio'] for r in guide['rows'] for x in r['contrast']),'numericMisses':[r[0] for r in balance['rows'] if r[3]=='MISS'],'method':'Exact artifact, source input, baseline, screenshot and log hashes; complete receipts and UI assertions. Functional success does not upgrade any balance, performance or visual-quality miss.'}
(out/'audit.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ['screenshots','sourceGates']}))
