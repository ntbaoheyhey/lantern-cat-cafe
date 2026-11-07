"""REFERENCE: tools/cardrpg-big/sharpness.py. Native pixel comparison, no filtering."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
root=Path('reports/cardrpg-big2/stage')
def compare(before_root, after_root):
 rows=[]
 for dpr in (1,2):
  for label in ('hero-face','enemy','hud-text','portrait','skill-icon'):
   name=f'dpr{dpr}-{label}'
   pair={}
   for phase, directory in (('before',before_root),('after',after_root)):
    path=directory/f'{name}.png'
    a=np.asarray(Image.open(path).convert('L'),dtype=float)
    lap=-4*a[1:-1,1:-1]+a[:-2,1:-1]+a[2:,1:-1]+a[1:-1,:-2]+a[1:-1,2:]
    pair[phase]={'path':str(path),'width':a.shape[1],'height':a.shape[0],'laplacianVariance':float(lap.var())}
   gain=100*(pair['after']['laplacianVariance']/pair['before']['laplacianVariance']-1)
   rows.append({'crop':name,**pair,'changePercent':gain,'targetPass':gain>=40})
 return rows
rows=compare(root/'before',root/'after')
baseline_rows=compare(Path('reports/cardrpg-big/baseline/sharpness'),root/'after')
result={'method':'Four-neighbour grayscale Laplacian variance at native DPR1/2 pixels. Same named crops and idle time; composition, projected scale, lighting and antialiasing can change this measure. No resizing or filtering. rows compare pinned B2c with B3; baselineRows compare original F0 with B3 for the requested cumulative +40% target. This is an edge metric, not a perceptual score.','rows':rows,'passes':sum(r['targetPass'] for r in rows),'total':len(rows),'baselineRows':baseline_rows,'baselinePasses':sum(r['targetPass'] for r in baseline_rows)}
(root/'sharpness-metrics.json').write_text(json.dumps(result,indent=2))
print(json.dumps({'pairs':len(rows),'b3IncrementalPasses':result['passes'],'fromF0Passes':result['baselinePasses'],'changes':{r['crop']:round(r['changePercent'],3) for r in rows}}))
