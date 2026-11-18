"""Recompute frozen R4 presentation arithmetic; never view or alter lane images."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path('/Users/bao/taskbar-hero-chain')
LANE = Path('/Users/bao/taskbar-hero-cardrpg-a6')
sys.path.insert(0, str(LANE / 'work/v5/CXV/python'))
import numpy as np
from scipy.interpolate import PchipInterpolator

checked = {}
def verify(path, expected):
    path = Path(path)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest == expected, path
    checked[str(path)] = digest
    return path

report_path = LANE / 'reports/v5/CXV/M-clover-presentation-R4-model.json'
lane = json.loads(report_path.read_text())
config = lane['modelPreregistration']
obs_path = verify(config['frozenObservations'], config['frozenObservationsSha256'])
obs = json.loads(obs_path.read_text())
verify(LANE / obs['source'], obs['sourceSha256'])
for artifact in obs['files'] + obs['reviewedSheets']:
    verify(artifact['path'], artifact['sha256'])
raw_path = verify(lane['raw']['path'], lane['raw']['sha256'])
raw = json.loads(raw_path.read_text())
training, holdouts = obs['observations']['training'], obs['observations']['holdouts']
assert len(training) == 24 and len(holdouts) == 12
assert set(r['frame'] for r in training).isdisjoint(r['frame'] for r in holdouts)
times = np.array([r['frame'] for r in training])
rows = {}
for channel, bound in [('eyeLineCenterSourcePx', 8), ('visiblePawCenterSourcePx', 6)]:
    values = np.array([r[channel] for r in training])
    curve = PchipInterpolator(np.concatenate([times - 300, times, times + 300]), np.tile(values, (3, 1)), axis=0)
    predicted = curve(np.arange(300))
    assert np.max(np.abs(predicted - np.array(raw[channel]['centers']))) < 1e-10
    errors = np.abs(curve([r['frame'] for r in holdouts]) - np.array([r[channel] for r in holdouts]))
    claimed = lane['channels'][channel]
    assert np.max(np.abs(errors.max(axis=0) - claimed['maxHeldoutAbsErrorSourcePx'])) < 1e-10
    passes = int(np.sum(np.max(errors, axis=1) <= bound))
    assert passes == claimed['heldoutPassCount']
    assert np.max(np.abs(curve(times) - values)) < 1e-10
    assert np.max(np.abs(curve(0) - curve(300))) < 1e-10
    assert np.max(np.abs(curve.derivative()(0) - curve.derivative()(300))) < 1e-10
    rows[channel] = {'samplesVerified': 300, 'training': 24, 'holdouts': 12, 'holdoutsPassing': passes,
                     'maxAbsError': errors.max(axis=0).tolist(), 'boundPerAxis': bound,
                     'failedFrames': [holdouts[i]['frame'] for i in range(12) if np.max(errors[i]) > bound]}
    for row in training + holdouts:
        if channel.startswith('eye'):
            center = np.mean(row['eyeLineEndpointsSourcePx'], axis=0)
        else:
            left, top, right, bottom = row['visiblePawBoundsSourcePx']
            center = np.array([(left + right) / 2, (top + bottom) / 2])
        assert np.max(np.abs(center - row[channel])) <= 1.01e-4
diagnosis_path = LANE / 'reports/v5/CXV/M-clover-presentation-R4-diagnosis.json'
diagnosis = json.loads(diagnosis_path.read_text())
failed = next(r for r in holdouts if r['frame'] == 205)
neighbors = [r for r in training if r['frame'] in [197, 210]]
lower_bound = failed['eyeLineCenterSourcePx'][1] - max(r['eyeLineCenterSourcePx'][1] for r in neighbors)
assert abs(lower_bound - diagnosis['nearestPossibleLocalNoOvershootErrorY']) < 1e-12
assert lower_bound > 8 and not lane['runtimeExported'] and not lane['passSparseControls']
result = {'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'delivery': str(report_path),
          'deliverySha256': hashlib.sha256(report_path.read_bytes()).hexdigest(), 'artifactsVerified': len(checked),
          'artifactHashes': checked, 'channels': rows, 'failedEyeFrame': 205, 'bestLocalNoOvershootErrorY': lower_bound,
          'decision': 'ACCEPT scoped numerical R4 rejection. Eye fails; paw passes only sparse authored controls; no combined model or runtime acceptance.',
          'limits': ['No images reopened. Manual single-observer coordinates are not independent anatomical ground truth.',
                     'Holdouts were observed before model choice, so this is not blinded validation.',
                     'The no-overshoot bound follows coordinates alone; the closed-lid interpretation is the lane observation, not CXI visual evidence.',
                     'R5 fresh event observations are a new study; they must not erase the R4 failure.'], 'imagesViewed': 0}
out = ROOT / 'reports/v5/CXI/evidence/v8-clover-presentation-r4-review.json'
out.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'path': str(out), 'artifactsVerified': len(checked), 'channels': rows, 'localErrorLowerBound': lower_bound}))
