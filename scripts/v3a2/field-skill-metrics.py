"""Measure painted output: full-canvas SSIM, per-action area and actual glyph ink heights."""
from pathlib import Path
import json,datetime,subprocess,itertools
import cv2,numpy as np
root=Path(__file__).resolve().parents[2];out=root/'reports/v3-battle/a2/V2'
def ssim(a,b):
 a=a.astype(np.float64);b=b.astype(np.float64);blur=lambda x:cv2.GaussianBlur(x,(11,11),1.5)
 ma=blur(a);mb=blur(b);va=blur(a*a)-ma*ma;vb=blur(b*b)-mb*mb;co=blur(a*b)-ma*mb
 return float((((2*ma*mb+6.5025)*(2*co+58.5225))/((ma*ma+mb*mb+6.5025)*(va+vb+58.5225)))[5:-5,5:-5].mean())
review=json.loads((out/'browser-review.json').read_text());assert not review['errors']
beats={}
for row in review['rows']:
 if row['tier']!='active':continue
 frames=[]
 for i in range(3):
  rgba=cv2.imread(str(out/f'{row["id"]}-effect-{i}.png'),cv2.IMREAD_UNCHANGED)
  # The same full canvas for all cats. Alpha is composited over black, not cropped.
  rgb=rgba[:,:,:3].astype(float)*(rgba[:,:,3:4].astype(float)/255)
  frames.append(cv2.resize(rgb.astype(np.uint8),(320,180),interpolation=cv2.INTER_AREA))
 beats[row['id']]=frames
pairs=[]
for a,b in itertools.combinations(beats,2):
 if a.rsplit('-',1)[0]==b.rsplit('-',1)[0]:continue
 values=[ssim(x,y) for x,y in zip(beats[a],beats[b])];pairs.append(dict(a=a,b=b,meanSSIM=float(np.mean(values)),beatSSIM=values))
fixtures={}
for id in ['wave1','wave3','boss']:
 path=out/'capture'/id/'capture.json'
 if not path.exists():continue
 cap=json.loads(path.read_text());glyphs={};actions=[];densities=[]
 for pi,plan in enumerate(cap['plans']):
  frames=cap['frames'][plan['frame']:cap['plans'][pi+1]['frame'] if pi+1<len(cap['plans']) else len(cap['frames'])]
  combat=any(e['type'] in ['action_start','charge'] for e in plan['events'])
  if not combat:continue
  visible=[f for f in frames if f['action'] and f['field']['coverage'] is not None]
  tier=next((f['action']['tier'] for f in frames if f['action']),'basic')
  actions.append(dict(skill=plan.get('presentationId') or plan['skillId'],tier=tier,coverage=max([f['field']['coverage'] for f in visible],default=0)))
  burst={}
  for f in frames:
   for n in f['numbers']:
    # First fully popped glyph gives its intended readable height; all colors count.
    if n['kind'] not in ['dot','fizzle']:
     glyphs.setdefault(n['key'],[]).append(n['glyphHeight']*720/cap['height'])
    if n['kind']=='damage' and f['action'] and f['action']['elapsed']>=f['action']['impact']:burst[n['key']]=n
  if tier=='ultimate' and any(e['type']=='damage' for e in plan['events']):
   duration=max(.4,(max((n['born'] for n in burst.values()),default=0)-min((n['born'] for n in burst.values()),default=0))/1000+.4)
   densities.append(dict(skill=plan.get('presentationId') or plan['skillId'],count=len(burst),seconds=duration,perSecond=len(burst)/duration))
 heights=[min(v) for v in glyphs.values()]
 fixtures[id]=dict(medianGlyphHeight720=float(np.median(heights)) if heights else 0,glyphSamples=len(heights),minActiveCoverage=min([a['coverage'] for a in actions if a['tier']=='active'],default=0),minBasicCoverage=min([a['coverage'] for a in actions if a['tier']=='basic'],default=0),impactNumbersPerSecond=min([d['perSecond'] for d in densities],default=0),fpsHigh=review['performance'].get(id,{}).get('fps'),actions=actions,ultimateImpacts=densities,parity=cap['parity'],browserErrors=cap['errors'])
meta=dict(generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip())
metrics=dict(_meta=meta,method='Full painted canvas composited over black, RGB Gaussian SSIM 11x11 sigma1.5 at320x180, mean of3 beats; no region cropping. Coverage actual alpha>=64/full viewport after feathered face masks. Unique glyph ink heights and number births from deterministic captures.',fixtures=fixtures,sequences=dict(count=len(review['rows']),maxCrossCatActiveSSIM=max(p['meanSSIM'] for p in pairs),pairsMeasured=len(pairs),minActiveCoverage=min(r['peakCoverage'] for r in review['rows'] if r['tier']=='active'),minBasicCoverage=min(r['peakCoverage'] for r in review['rows'] if r['tier']=='basic')),pairs=pairs)
if (out/'suite.json').exists():metrics['suite']=json.loads((out/'suite.json').read_text())
(out/'metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
print(json.dumps(metrics['sequences']));print('Most similar:',sorted(pairs,key=lambda p:p['meanSSIM'])[-4:])
for id,f in fixtures.items():print(id,{k:v for k,v in f.items() if k not in ['actions','ultimateImpacts']})
