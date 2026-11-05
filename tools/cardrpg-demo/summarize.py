from pathlib import Path
import json,hashlib,datetime
root=Path(__file__).resolve().parents[2];report=root/'reports/cardrpg';build=json.loads((root/'docs/cardrpg/build.json').read_text());digest=hashlib.sha256((root/'docs/cardrpg/index.html').read_bytes()).hexdigest();assert digest==build['sha256']
def load(p):return json.loads((report/p).read_text())
def q(v,p):
 s=sorted(v);return s[int((len(s)-1)*p)] if s else None
def stats(rows):
 frames=[n for r in rows for n in r['raf']]
 return dict(trials=len(rows),rafSamples=len(frames),longTasks=sum(len(r['longTasks']) for r in rows),aggregateP95Ms=q(frames,.95),aggregateP99Ms=q(frames,.99),worstCaseP95Ms=max(r['p95Ms'] for r in rows),worstCaseP99Ms=max(r['p99Ms'] for r in rows),p95Misses=sum(r['p95Ms']>16.700001 for r in rows),p99Misses=sum(r['p99Ms']>25.000001 for r in rows))
result=dict(date=datetime.datetime.now(datetime.timezone.utc).isoformat(),runtimeSource=build['head'],artifactSha256=digest,method='Raw RAF cadence and Long Tasks. Floating-point epsilon 0.000001ms only, no rounding 16.8ms down to16.7ms. Cold means first playback after model/material load warmup; no hidden first cast. No GPU timestamp claim.',measurements={})
for name,path,count in [('metal','performance-delivery/performance-metal.json',258),('transitions','performance-delivery/transitions.json',9),('software','performance-software-delivery/performance-software.json',8),('retina','performance-retina-delivery/performance-metal.json',258)]:
 d=load(path);assert d['artifactSha256']==digest,(path,'hash');assert len(d['rows'])==count,(path,len(d['rows']));assert not d['errors'],(path,d['errors'])
 entry=dict(path=str(path),summary=stats(d['rows']),byViewport={str(w):stats([r for r in d['rows'] if r['width']==w]) for w in sorted(set(r['width'] for r in d['rows']))},renderers=list(set(r.get('renderer','identity retained') for r in d['rows'])))
 if name=='metal':entry['byTemperature']={t:stats([r for r in d['rows'] if r['temperature']==t]) for t in ['cold','warm']}
 result['measurements'][name]=entry
life=load('lifecycle-delivery/measurement.json');assert life['artifactSha256']==digest;assert not life['errors'] and not life['warnings'];assert len(life['rows'])==3
result['lifecycle']={'campaigns':len(life['rows']),'longTasks':sum(len(r['long']) for r in life['rows']),'contextsByCampaign':[r['contexts'] for r in life['rows']],'strictP95Misses':sum(r['p95Ms']>16.700001 for r in life['rows'])}
retina_life=load('lifecycle-retina-delivery/measurement.json');assert retina_life['artifactSha256']==digest
assert not retina_life['errors'] and not retina_life['warnings'];assert len(retina_life['rows'])==1
result['retinaLifecycle']={'campaigns':1,'longTasks':sum(len(r['long']) for r in retina_life['rows']),
 'contextsByCampaign':[r['contexts'] for r in retina_life['rows']],
 'p95Ms':retina_life['rows'][0]['p95Ms'],'p99Ms':retina_life['rows'][0]['p99Ms'],
 'pixelRatio':retina_life['rows'][0]['pixelRatio']}
checks=['preview-lifetime/check.json','offline-path/check.json','offline-commands/check.json','fallback/check.json','meta/checks.json','layout-delivery/checks.json','art/effect-captures.json'];result['boundChecks']=[]
for p in checks:
 d=load(p);assert d['artifactSha256']==digest,(p,d.get('artifactSha256'));assert not d.get('errors'),(p,d.get('errors'));assert not d.get('requests'),p;assert not d.get('writes'),p;result['boundChecks'].append(p)
(report/'validation/performance-summary.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
