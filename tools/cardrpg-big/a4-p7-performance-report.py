# REFERENCE: P7 exact-source default-startup comparison and separate offline cold observations.
from pathlib import Path
import json,hashlib
root=Path.cwd();base=root/'reports/cardrpg-big/a4/p7/performance'
read=lambda p:json.loads(p.read_text())
rows=[]
harness=None
for width,cpu in [(1280,1),(1280,4),(1440,1)]:
 m=read(base/f'main-{width}-cpu{cpu}/checks.json');c=read(base/f'candidate-{width}-cpu{cpu}/checks.json')
 assert m['harnessSha256']==c['harnessSha256']
 if harness is None:harness=m['harnessSha256']
 assert m['harnessSha256']==harness
 for d in [m,c]:
  assert d['cold']['width']==width and d['cold']['cpu']==cpu and not d.get('incomplete',False)
  assert not d['errors'] and not d['prohibitedModules'] and not d['modelRequests']
 before=sum(x['bytes'] for x in m['chunks']);after=sum(x['bytes'] for x in c['chunks'])
 rows.append({'width':width,'cpu':cpu,'mainHead':m['buildHead'],'candidateHead':c['buildHead'],'beforeJsBytes':before,'afterJsBytes':after,'byteDelta':after-before,'bytesStatus':'PASS' if after<=before else 'MISS','mainTaskSeconds':m['cold']['taskSeconds'],'candidateTaskSeconds':c['cold']['taskSeconds'],'cpuStatus':'PASS' if c['cold']['taskSeconds']<=m['cold']['taskSeconds'] else 'MISS','mainMaxFrameMs':max(m['cold']['frames']),'candidateMaxFrameMs':max(c['cold']['frames'])})
offline=[]
for p in sorted(base.glob('offline-*/summary.json')):
 d=read(p);assert d['sha256']==hashlib.sha256((root/'docs/cardrpg3/index.html').read_bytes()).hexdigest()
 for row in d['rows']:
  assert not row['errors'];offline.append({k:row[k] for k in ['width','height','dpr','throttle','max','p95','p99','above50','within20']})
assert len(offline)==7
result={'defaultStartup':rows,'offlineCold':offline,'offlineBytes':(root/'docs/cardrpg3/index.html').stat().st_size,'method':'Fresh browser context, disabled cache, Metal Chromium; identical production default-URL harness against main340f88b9 and candidate. Three/model exclusion checked by chunk inventory. One observation per configuration: descriptive, no statistical regression guarantee. Main has no cardrpg3 offline artifact; seven offline observations are separate from the default app comparison. Screenshot capture disabled during offline timing.'}
(base/'summary.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
