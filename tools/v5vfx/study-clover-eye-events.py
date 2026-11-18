"""Run the R5 event-coverage hypothesis chosen before new observations."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import numpy as np
import scipy
from scipy.interpolate import PchipInterpolator

BASE = ROOT / 'work/v5/CXV/batch-m/clover-eye-events-R5'
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
config = json.loads((BASE/'preregistration.json').read_text())
frozen = json.loads((BASE/'frozen-observations.json').read_text())
assert frozen['allFrozenBeforeFit'] and frozen['modelChosenBeforeNewViews']
assert frozen['preregistrationSha256'] == sha(BASE/'preregistration.json')
assert sha(ROOT/config['source']) == config['sourceSha256']
for item in frozen['files']+frozen['reviewedSheets']:
    assert sha(item['path']) == item['sha256']
for key in ['priorTraining', 'priorFailure']:
    assert sha(config[key]['path']) == config[key]['sha256']
old = json.loads(Path(config['priorTraining']['path']).read_text())
training = sorted(old['observations']['training']+frozen['observations']['training'], key=lambda r:r['frame'])
holdouts = frozen['observations']['holdouts']
times = np.array([r['frame'] for r in training], dtype=float)
held_times = np.array([r['frame'] for r in holdouts], dtype=float)
assert len(training) == 48 and len(holdouts) == 24 and np.all(np.diff(times)>0)
assert not set(times).intersection(held_times)
assert not set(times).intersection(r['frame'] for r in old['observations']['holdouts'])
values = np.array([r['eyeLineCenterSourcePx'] for r in training], dtype=float)
expected = np.array([r['eyeLineCenterSourcePx'] for r in holdouts], dtype=float)
curve = PchipInterpolator(np.concatenate([times-300,times,times+300]), np.tile(values,(3,1)), axis=0, extrapolate=False)
dense = curve(np.arange(300))
velocity = curve.derivative()(np.arange(300))
predicted = curve(held_times)
error = predicted-expected
gate = config['modelPreregisteredBeforeNewViews']['gate']
train_error = float(np.abs(curve(times)-values).max())
value_seam = float(np.abs(curve(0)-curve(300)).max())
velocity_seam = float(np.abs(curve.derivative()(0)-curve.derivative()(300)).max())
checks = dict(finite=bool(np.isfinite(dense).all() and np.isfinite(velocity).all() and np.isfinite(error).all()),
              trainingExact=train_error<=gate['trainingExactPx'],
              freshHeldouts=bool((np.abs(error)<=gate['freshHeldoutPerAxisSourcePx']).all()),
              periodicValue=value_seam<=gate['periodicValuePx'],
              periodicDerivative=velocity_seam<=gate['periodicDerivativePxPerFrame'])
held_rows=[dict(frame=int(t),observed=expected[i].tolist(),predicted=predicted[i].tolist(),
                errorSourcePx=error[i].tolist(),passBound=bool((np.abs(error[i])<=8).all())) for i,t in enumerate(held_times)]
raw=dict(centers=dense.tolist(),velocitiesPerFrame=velocity.tolist(),trainingFrames=times.tolist(),
         trainingCenters=values.tolist(),piecewiseBreakpoints=curve.x.tolist(),piecewiseCoefficients=curve.c.tolist())
raw_path=BASE/'model-output.json'
report_path=ROOT/'reports/v5/CXV/M-clover-eye-events-R5-model.json'
assert not raw_path.exists() and not report_path.exists(), 'Preserve previous results'
raw_path.write_text(json.dumps(raw,separators=(',',':'))+'\n')
report=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),source=config['source'],sourceSha256=config['sourceSha256'],
            model=config['modelPreregisteredBeforeNewViews'],modelPreregistrationSha256=sha(BASE/'preregistration.json'),
            observations=dict(path=str(BASE/'frozen-observations.json'),sha256=sha(BASE/'frozen-observations.json')),
            priorTraining=config['priorTraining'],priorFailure=config['priorFailure'],toolSha256=sha(__file__),
            versions=dict(python=sys.version.split()[0],numpy=np.__version__,scipy=scipy.__version__),
            trainingCount=48,heldoutCount=24,heldoutPassCount=sum(r['passBound'] for r in held_rows),
            checks=checks,passSparseControls=all(checks.values()),trainingMaxErrorSourcePx=train_error,
            maximumHeldoutAbsErrorSourcePx=np.abs(error).max(axis=0).tolist(),periodicValueErrorSourcePx=value_seam,
            periodicDerivativeErrorSourcePxPerFrame=velocity_seam,
            maximumAdjacentStepSourcePx=float(np.linalg.norm(np.roll(dense,-1,axis=0)-dense,axis=1).max()),
            seamAdjacentStepSourcePx=float(np.linalg.norm(dense[0]-dense[-1])),holdouts=held_rows,
            raw=dict(path=str(raw_path),sha256=sha(raw_path)),runtimeExported=False,
            limits=['Single-observer approximate authored presentation anchor,not anatomical or material truth.',
                    'Fresh model choice predates fresh views;event selection follows failed R4 and existing L1 blink evidence.',
                    'R4original failure retained;none of its holdouts used as fit targets.',
                    'Sparse source controls only;continuous source alignment,independent review,native capture and release gates separate.'])
report_path.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(passSparseControls=report['passSparseControls'],checks=checks,heldoutPassCount=report['heldoutPassCount'],
                     maximumHeldoutAbsErrorSourcePx=report['maximumHeldoutAbsErrorSourcePx'],failed=[r for r in held_rows if not r['passBound']])))
