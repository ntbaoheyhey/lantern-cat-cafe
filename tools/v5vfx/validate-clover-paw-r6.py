"""Validate the immutable R4 paw curve against fresh R6 observations; never fit."""
from pathlib import Path
import datetime
import hashlib
import json

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'work/v5/CXV/batch-m/clover-paw-validation-R6'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
cfg=json.loads((BASE/'preregistration.json').read_text())
obs=json.loads((BASE/'frozen-observations.json').read_text())
assert obs['allFrozenBeforePrediction'] and cfg['fixedModel']['fitProhibited']
assert sha(BASE/'preregistration.json')==obs['preregistrationSha256']
assert sha(ROOT/cfg['source'])==cfg['sourceSha256']
for item in obs['files']+obs['reviewedSheets']:
    assert sha(item['path'])==item['sha256']
model=cfg['fixedModel']
assert sha(model['report'])==model['reportSha256'] and sha(model['raw']['path'])==model['raw']['sha256']
original=json.loads(Path(model['report']).read_text())
assert not original['passSparseControls'], 'Preserve the original combined rejection'
points=json.loads(Path(model['raw']['path']).read_text())[model['field']]['centers']
assert len(points)==300 and [r['frame'] for r in obs['rows']]==cfg['frames']
rows=[]
for row in obs['rows']:
    center=row['visiblePawCenterSourcePx']
    predicted=points[row['frame']]
    error=None if center is None else [predicted[i]-center[i] for i in (0,1)]
    rows.append(dict(frame=row['frame'],observed=center,predicted=predicted,errorSourcePx=error,
                     passBound=error is not None and all(abs(v)<=cfg['gate']['all24WithinBoundPerAxisSourcePx'] for v in error)))
passed=len(rows)==24 and all(r['passBound'] for r in rows)
report=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            source=cfg['source'],sourceSha256=cfg['sourceSha256'],model=cfg['fixedModel'],
            preregistration=dict(path=str(BASE/'preregistration.json'),sha256=sha(BASE/'preregistration.json')),
            observations=dict(path=str(BASE/'frozen-observations.json'),sha256=sha(BASE/'frozen-observations.json')),
            toolSha256=sha(__file__),observationsFrozenBeforePredictions=True,fitPerformed=False,
            freshHeldoutCount=len(rows),passCount=sum(r['passBound'] for r in rows),
            maxAbsErrorSourcePx=[max(abs(r['errorSourcePx'][i]) for r in rows if r['errorSourcePx'] is not None) for i in (0,1)],
            passSparseControls=passed,rows=rows,runtimeExported=False,
            limits=['Standalone validation of unchanged paw channel;combined R4 rejection remains unchanged.',
                    'Manual single-observer approximate visible geometry;not independent annotation or continuous correspondence.',
                    'Sparse source acceptance only;adapter,native decoded source alignment,independent review and release gates separate.'])
out=ROOT/'reports/v5/CXV/M-clover-paw-R6-validation.json'
assert not out.exists()
out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(passSparseControls=passed,passCount=report['passCount'],maxAbsErrorSourcePx=report['maxAbsErrorSourcePx'],failed=[r for r in rows if not r['passBound']])))
