"""Join the final unchanged fixtures and selected R7 live variant, with source labels."""
from pathlib import Path
import json, statistics
root=Path('reports/v4-art/REVIEW/A4')
cases=json.loads((root/'dynamic-occlusion.json').read_text())
results=[]
for case in cases:
    rows=case['rows'];source='v8 formation + full sampled class motion'
    values=[]
    for f in rows:
        units=f['units'];cats=[u for u in units if u['side']=='party'];foes=[u for u in units if u['side']=='enemy']
        hs=[u['box']['height']/case['height'] for u in cats];median=statistics.median(hs)
        left=min(u['box']['x'] for u in units)/case['width']
        right=1-max(u['box']['x']+u['box']['width'] for u in units)/case['width']
        values.append({'t':f['t'],'catMedian':median,'catDeviation':max(abs(h/median-1) for h in hs),
                       'left':left,'right':right,'span':1-left-right,
                       'gap':(min(u['box']['x'] for u in foes)-max(u['box']['x']+u['box']['width'] for u in cats))/case['width'],
                       'boss':next((u['box']['height']/case['height'] for u in foes if u['kind']=='boss'),None),
                       'occlusion':max(o['fraction'] for o in f['occlusion'])})
    limits={'catMedian':('min',.30),'catDeviation':('max',.08),'left':('min',.03),'right':('min',.03),
            'span':('min',.80),'gap':('max',.20),'boss':('min',.45),'occlusion':('max',.15)}
    extrema={};failures=[]
    for key,(direction,limit) in limits.items():
        valid=[v for v in values if v[key] is not None]
        if not valid:continue
        worst=(min if direction=='min' else max)(valid,key=lambda v:v[key])
        extrema[key]={'value':worst[key],'t':worst['t']}
        if (worst[key]<limit if direction=='min' else worst[key]>limit):failures.append(key)
    wrong=sum(u['sign']!=((1 if u['side']=='party' else -1)*(-1 if u['native']=='left' else 1)) for f in rows for u in f['facings'])
    results.append({'fixture':case['fixture'],'width':case['width'],'height':case['height'],'source':source,
                    'samples':len(rows),'extrema':extrema,'numericFailures':failures,'wrongFacing':wrong,
                    'hudBottomHeight':86.390625 if case['height']==720 else 96,'errors':case['errors']})
(root/'final-metrics.json').write_text(json.dumps({'scope':'Live10fps actual rendered-alpha evidence paired with three720p films and new900p boss film; visual inspection recorded in REVIEW.md. This script does not assign visual acceptance.','cases':results},indent=2)+'\n')
print([(r['fixture'],r['width'],r['numericFailures'],r['wrongFacing']) for r in results])
