from pathlib import Path
import json,hashlib
root=Path('reports/cardrpg-look');cold=json.loads((root/'validation/l0/cold7/summary.json').read_text());casts=[]
for cat in ['mochi','soot','clover']:
 casts+=json.loads((root/f'validation/l0/casts-{cat}/summary.json').read_text())['rows']
assert len(cold['rows'])==7 and len(casts)==12
rows=cold['rows'];cmax=max(c['summary']['max'] for r in casts for c in r['casts']);ready=[r['battleReadyMs'] for r in rows];hub=[r['loadToInteractiveMs'] for r in rows]
data={'artifact':cold['sha256'],'coldRuns':7,'coldMaxMs':max(r['max'] for r in rows),'coldInteractiveRangeMs':[min(hub),max(hub)],'battleReadyRangeMs':[min(ready),max(ready)],'sliceActions':12,'casts':24,'castMaxMs':cmax,'errors':sum(len(r['errors']) for r in rows+casts),'note':'All measured on immutable baseline HTML, not lookV2. page-open max includes opening; per-cast windows are recorded separately. No full matrix.'}
(root/'validation/l0/measurement-summary.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(data))
