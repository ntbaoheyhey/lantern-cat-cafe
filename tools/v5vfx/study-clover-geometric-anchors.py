"""Evaluate the frozen authored geometric-anchor hypothesis; no runtime writes."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import numpy as np

BASE = ROOT / 'work/v5/CXV/batch-m/clover-geometric-anchors-R1'
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
HOLDOUT_SHA = 'd0027a6605308aed890775b2487a2ea0046a1dde6ed262f7787671bae11be0e9'
holdout_path = BASE / 'holdout-annotations.json'
assert sha(holdout_path) == HOLDOUT_SHA
assert not (BASE / 'fit.json').exists(), 'Frozen experiment must not be overwritten'
PERIOD, HARMONICS = 300, 6
TRAINING = [9, 28, 46, 65, 84, 103, 121, 140, 159, 178, 196, 215, 234, 253, 271, 290]


def basis(t, derivative=0):
    t = np.asarray(t, float)
    terms = [np.ones_like(t) if derivative == 0 else np.zeros_like(t)]
    for k in range(1, HARMONICS + 1):
        w = 2 * np.pi * k / PERIOD
        terms += [w**derivative * np.cos(w*t + derivative*np.pi/2),
                  w**derivative * np.sin(w*t + derivative*np.pi/2)]
    return np.stack(terms, axis=-1)


def evaluate(observations, coefficients):
    t = [x['frame'] for x in observations]
    expected = np.array([x['xy'] for x in observations], float)
    actual = basis(t) @ coefficients
    error = actual - expected
    bounds = np.array([x['uncertaintyPxPerAxis'] for x in observations])
    passed = (np.abs(error) <= bounds[:, None]).all(axis=1)
    return {'samples': len(t), 'passed': int(passed.sum()), 'maxAbsErrorSourcePxPerAxis': np.abs(error).max(axis=0).tolist(),
            'rows': [{'frame': f, 'expected': e.tolist(), 'fitted': a.tolist(), 'signedError': d.tolist(),
                      'boundPerAxis': float(b), 'pass': bool(ok)} for f, e, a, d, b, ok in zip(t, expected, actual, error, bounds, passed)]}


design = basis(TRAINING)
assert design.shape == (16, 13)
coefficients, training, provenance = {}, {}, {}
plots = json.loads((BASE/'training-plots.json').read_text())
assert all(x['views'] == 1 and sha(x['path']) == x['sha256'] for x in plots['plots'])
for name, bound in [('face', 8), ('palm', 6)]:
    path = BASE / f'{name}-training-annotations.json'
    annotations = json.loads(path.read_text())
    observations = annotations['observations']
    assert [x['frame'] for x in observations] == TRAINING
    assert all(x['uncertaintyPxPerAxis'] == bound for x in observations)
    target = np.array([x['xy'] for x in observations], float)
    coef, residuals, rank, singular = np.linalg.lstsq(design, target, rcond=None)
    assert rank == 13 and np.isfinite(coef).all()
    coefficients[name] = coef
    training[name] = evaluate(observations, coef)
    provenance[name] = {'annotations': str(path), 'sha256': sha(path), 'rank': int(rank),
                        'condition': float(singular.max()/singular.min()), 'residualSumSquares': residuals.tolist()}

# Holdout values are first parsed after both coefficient matrices are fixed.
heldout = json.loads(holdout_path.read_text())
assert heldout['predeclaredModel']['maxHarmonic'] == HARMONICS
assert heldout['predeclaredModel']['periodFrames'] == PERIOD
assert heldout['trainingFrames'] == TRAINING
channels, raw = {}, {}
for name, coef in coefficients.items():
    observations = heldout['holdouts'][name]
    assert not set(TRAINING) & {x['frame'] for x in observations}
    holdout = evaluate(observations, coef)
    dense = basis(np.arange(PERIOD)) @ coef
    velocity = basis(np.arange(PERIOD), 1) @ coef
    acceleration = basis(np.arange(PERIOD), 2) @ coef
    passed = training[name]['passed'] == len(TRAINING) and holdout['passed'] == len(observations)
    channels[name] = {'decision': 'PASS sparse geometric controls only' if passed else 'REJECTED unchanged observation-bound gate',
                      'training': training[name], 'holdout': holdout, 'provenance': provenance[name],
                      'seam299to0SourcePx': float(np.linalg.norm(dense[-1]-dense[0])),
                      'closure300to0SourcePx': float(np.linalg.norm((basis([300, 0]) @ coef)[0] - dense[0])),
                      'peakSpeedSourcePxPerFrame': float(np.linalg.norm(velocity, axis=1).max()),
                      'peakAccelerationSourcePxPerFrame2': float(np.linalg.norm(acceleration, axis=1).max()),
                      'rangeSourceXY': [dense.min(axis=0).tolist(), dense.max(axis=0).tolist()]}
    raw[name] = {'coefficients': coef.tolist(), 'centers': dense.tolist(), 'velocity': velocity.tolist()}
report = {'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'model': heldout['predeclaredModel'],
          'holdout': {'path': str(holdout_path), 'sha256': sha(holdout_path)}, 'channels': channels,
          'limitations': 'Manual presentation anchors, not material correspondence. Sparse control pass cannot establish full trajectory, decoded-media, hp clearance, scene, cast, alpha, loop repair, budget or release acceptance.',
          'runtimeChanged': False}
(BASE/'fit.json').write_text(json.dumps(raw, indent=2)+'\n')
report['raw'] = {'path': str(BASE/'fit.json'), 'sha256': sha(BASE/'fit.json')}
(BASE/'report.json').write_text(json.dumps(report, indent=2)+'\n')
(ROOT/'reports/v5/CXV/M-clover-geometric-anchors-R1.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({k: {f: v[f] for f in ['decision', 'seam299to0SourcePx', 'closure300to0SourcePx', 'peakSpeedSourcePxPerFrame']} | {'trainingPass': v['training']['passed'], 'holdoutPass': v['holdout']['passed'], 'holdoutMaxErrorXY': v['holdout']['maxAbsErrorSourcePxPerAxis']} for k, v in channels.items()}))
