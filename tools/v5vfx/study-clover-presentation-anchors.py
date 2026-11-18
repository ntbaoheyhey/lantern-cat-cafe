"""Evaluate one preregistered R4 presentation-curve model; no runtime writes."""
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

BASE = ROOT / 'work/v5/CXV/batch-m/clover-presentation-anchors-R4'
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
config_path = BASE / 'model-preregistration.json'
config = json.loads(config_path.read_text())
observations_path = Path(config['frozenObservations'])
assert sha(observations_path) == config['frozenObservationsSha256']
observations = json.loads(observations_path.read_text())
assert observations['allObservationsFrozenBeforeFit']
assert sha(ROOT / observations['source']) == observations['sourceSha256']
for item in observations['files']:
    assert sha(item['path']) == item['sha256']
for item in observations['reviewedSheets']:
    assert item['views'] == 1 and sha(item['path']) == item['sha256']
raw_path = BASE / 'model-output.json'
report_path = ROOT / 'reports/v5/CXV/M-clover-presentation-R4-model.json'
assert not raw_path.exists() and not report_path.exists(), 'Preserve previous results'

period = config['periodFrames']
training = observations['observations']['training']
holdouts = observations['observations']['holdouts']
times = np.array([row['frame'] for row in training], dtype=float)
held_times = np.array([row['frame'] for row in holdouts], dtype=float)
assert len(training) == 24 and len(holdouts) == 12
assert len(set(times).intersection(held_times)) == 0
assert np.all(np.diff(times) > 0) and times[0] >= 0 and times[-1] < period
channels, raw = {}, {}
for field, tolerance in config['gate']['holdoutsPerAxisSourcePx'].items():
    values = np.array([row[field] for row in training], dtype=float)
    expected = np.array([row[field] for row in holdouts], dtype=float)
    # Only training knots enter the interpolator. Three copies make the central
    # cycle independent of scipy's nonperiodic outer endpoint slope formula.
    curve = PchipInterpolator(np.concatenate([times-period, times, times+period]),
                              np.tile(values, (3, 1)), axis=0, extrapolate=False)
    dense_times = np.arange(period, dtype=float)
    dense, velocity = curve(dense_times), curve.derivative()(dense_times)
    predicted = curve(held_times)
    delta = predicted - expected
    train_error = float(np.abs(curve(times)-values).max())
    seam_value = float(np.abs(curve(0)-curve(period)).max())
    seam_velocity = float(np.abs(curve.derivative()(0)-curve.derivative()(period)).max())
    finite = bool(np.isfinite(dense).all() and np.isfinite(velocity).all() and np.isfinite(predicted).all())
    checks = {
        'finite': finite,
        'trainingExact': train_error <= config['gate']['trainingMaxAbsErrorPx'],
        'heldoutBounds': bool((np.abs(delta) <= tolerance).all()),
        'periodicValue': seam_value <= config['gate']['periodicValueMaxAbsPx'],
        'periodicDerivative': seam_velocity <= config['gate']['periodicDerivativeMaxAbsPxPerFrame'],
    }
    held_rows = [dict(frame=int(t), observed=expected[i].tolist(), predicted=predicted[i].tolist(),
                      errorSourcePx=delta[i].tolist(), passBound=bool((np.abs(delta[i]) <= tolerance).all()))
                 for i, t in enumerate(held_times)]
    adjacent = np.roll(dense, -1, axis=0)-dense
    channels[field] = dict(
        decision='PASS sparse presentation controls only' if all(checks.values()) else 'REJECT unchanged observation-bound gate',
        checks=checks, trainingCount=len(training), holdoutCount=len(holdouts),
        heldoutPassCount=sum(row['passBound'] for row in held_rows), heldoutBoundPerAxisSourcePx=tolerance,
        maxHeldoutAbsErrorSourcePx=np.abs(delta).max(axis=0).tolist(), trainingMaxErrorSourcePx=train_error,
        periodicValueErrorSourcePx=seam_value, periodicDerivativeErrorSourcePxPerFrame=seam_velocity,
        maximumAdjacentStepSourcePx=float(np.linalg.norm(adjacent, axis=1).max()),
        seamAdjacentStepSourcePx=float(np.linalg.norm(adjacent[-1])),
        trainingRange=[values.min(axis=0).tolist(), values.max(axis=0).tolist()],
        outputRange=[dense.min(axis=0).tolist(), dense.max(axis=0).tolist()], holdouts=held_rows)
    raw[field] = dict(centers=dense.tolist(), velocitiesPerFrame=velocity.tolist(),
                      trainingFrames=times.tolist(), trainingCenters=values.tolist(),
                      piecewiseBreakpoints=curve.x.tolist(), piecewiseCoefficients=curve.c.tolist())

raw_path.write_text(json.dumps(raw, separators=(',', ':'))+'\n')
report = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
              source=observations['source'], sourceSha256=observations['sourceSha256'],
              observationsSha256=sha(observations_path), modelPreregistration=config,
              modelPreregistrationSha256=sha(config_path), toolSha256=sha(__file__),
              versions=dict(python=sys.version.split()[0], numpy=np.__version__, scipy=scipy.__version__),
              raw=dict(path=str(raw_path), sha256=sha(raw_path)), channels=channels,
              passSparseControls=all(all(c['checks'].values()) for c in channels.values()),
              runtimeExported=False, limits=observations['limits']+[config['limitation'], config['decision']])
report_path.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(dict(report=str(report_path), passSparseControls=report['passSparseControls'],
                     channels={k:dict(passCount=v['heldoutPassCount'], maxError=v['maxHeldoutAbsErrorSourcePx'], checks=v['checks'])
                               for k,v in channels.items()})))
