"""Bounded nonrigid support diagnostic; never exports runtime socket data."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np

cv2.setNumThreads(2)
cv2.setRNGSeed(42)
out = Path(sys.argv[1]).resolve()
assert out.is_relative_to(ROOT / 'work/v5/CXV') and not out.exists()
out.mkdir(parents=True)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
base = ROOT / 'work/v5/CXV/ref/batch-m'
frames = np.load(base / 'clover-frames.npy', mmap_mode='r')
assert frames.shape == (300, 640, 526, 3)
gray = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in frames]
spec = ROOT / 'work/v5/CXV/batch-m/clover-head-support-R1/spec.json'
config = json.loads(spec.read_text())['head']
roi = config['sourceRoi']
pre = np.array([421 / 526, .8])
final = np.array([318 / 409, .78])
scale = pre * final
target = ((np.array(config['delivery']) + .5) / final + [0, 2]) / pre - .5
origin = target.copy()
normalizer = 40.
regularization = .001

def kernel(a, b):
    r2 = ((a[:, None, :] - b[None, :, :]) ** 2).sum(axis=2)
    return .5 * r2 * np.log(np.maximum(r2, 1e-30))

def fit(source, destination):
    a = (source - origin) / normalizer
    p = np.column_stack([np.ones(len(a)), a])
    matrix = np.block([[kernel(a, a) + regularization * np.eye(len(a)), p],
                       [p.T, np.zeros((3, 3))]])
    # Interpolating displacement preserves exact affine reproduction.
    rhs = np.vstack([(destination - source) / normalizer, np.zeros((3, 2))])
    return a, np.linalg.solve(matrix, rhs)

def evaluate(model, points):
    a, coeff = model
    points = np.atleast_2d(points)
    q = (points - origin) / normalizer
    basis = np.column_stack([kernel(q, a), np.ones(len(q)), q])
    return points + normalizer * (basis @ coeff)

def inside(point, support):
    hull = cv2.convexHull(support.astype(np.float32))
    return cv2.pointPolygonTest(hull, tuple(map(float, point)), False) >= 0

# Numeric sanity checks are evidence for the solver, not for the art tracks.
synthetic = origin + np.array([[-20, -20], [0, -20], [20, -20], [-20, 20], [0, 20], [20, 20], [0, 0]])
affine = np.array([[1.1, .08], [-.04, .95]])
expected = synthetic @ affine.T + [3, 7]
probe = origin + np.array([[-3, 2], [4, -5]])
solver_error = float(np.max(np.abs(evaluate(fit(synthetic, expected), probe) - (probe @ affine.T + [3, 7]))))
assert solver_error < 1e-10

mask = np.zeros(gray[0].shape, np.uint8)
x, y, w, h = roi
mask[y:y+h, x:x+w] = 255
first = cv2.goodFeaturesToTrack(gray[0], maxCorners=32, qualityLevel=.02, minDistance=3, mask=mask)
assert first is not None
current = first.copy()
alive = np.ones(len(first), bool)
history = [current[:, 0].copy()]
bidirectional = []
for i in range(1, 300):
    for name in ('STOP-ALL', 'STOP-CXV'):
        assert not (Path('/Users/bao/taskbar-hero-mailbox') / name).exists(), name
    nxt, status, _ = cv2.calcOpticalFlowPyrLK(gray[i-1], gray[i], current, None, winSize=(21, 21), maxLevel=3, criteria=(3, 30, .01))
    back, bs, _ = cv2.calcOpticalFlowPyrLK(gray[i], gray[i-1], nxt, None, winSize=(21, 21), maxLevel=3, criteria=(3, 30, .01))
    error = np.linalg.norm(back[:, 0] - current[:, 0], axis=1)
    alive &= (status[:, 0] > 0) & (bs[:, 0] > 0) & (error < .75)
    bidirectional.append(error.tolist())
    current = nxt
    history.append(current[:, 0].copy())
ids = np.flatnonzero(alive)
support = first[ids, 0].astype(float)
interior = [j for j in range(len(ids)) if inside(support[j], np.delete(support, j, 0))]
inside_target = inside(target, support) if len(support) >= 3 else False
rows = []
mapped = []
for i, tracked in enumerate(history):
    destination = tracked[ids].astype(float)
    model = fit(support, destination)
    point = evaluate(model, target)[0]
    mapped.append(point)
    errors = []
    for j in interior:
        smaller = fit(np.delete(support, j, 0), np.delete(destination, j, 0))
        errors.append(float(np.linalg.norm(evaluate(smaller, support[j])[0] - destination[j])))
    # Finite-difference Jacobian only in supported area around the socket.
    probe = np.array([target + [d, e] for d in (-2, 0, 2) for e in (-2, 0, 2) if inside(target + [d, e], support)])
    determinants = []
    for q in probe:
        dx = (evaluate(model, q + [.1, 0])[0] - evaluate(model, q - [.1, 0])[0]) / .2
        dy = (evaluate(model, q + [0, .1])[0] - evaluate(model, q - [0, .1])[0]) / .2
        determinants.append(float(np.linalg.det(np.column_stack([dx, dy]))))
    rows.append(dict(frame=i, mapped=point.tolist(), heldOutErrors=errors, jacobianDeterminants=determinants))
mapped = np.array(mapped)
delta = (mapped - mapped[0]) * scale
all_errors = np.array([r['heldOutErrors'] for r in rows])
all_dets = [d for r in rows for d in r['jacobianDeterminants']]
gates = dict(sixSurvivors=len(ids) >= 6, targetInsideHull=inside_target,
             threeInteriorHeldOut=len(interior) >= 3,
             heldOut70Percent=bool(all_errors.size and np.min(np.mean(all_errors <= 2, axis=1)) >= .7),
             heldOutMax2px=bool(all_errors.size and np.max(all_errors) <= 2),
             positiveJacobian=bool(all_dets and min(all_dets) > 0),
             seam2DeliveryPx=float(np.linalg.norm(delta[-1])) <= 2)
raw = dict(initial=first[:, 0].tolist(), survivors=ids.tolist(), history=np.array(history).tolist(),
           bidirectionalErrors=bidirectional, interiorHeldOut=interior, rows=rows)
raw_path = out / 'raw.json'
raw_path.write_text(json.dumps(raw, separators=(',', ':')) + '\n')
report = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), cat='clover', socket='head',
              sourceSha256=sha(base / 'clover.mp4'), spec=dict(path=str(spec), sha256=sha(spec)),
              runnerSha256=sha(__file__), sourceRoi=roi, sourcePoint=target.tolist(),
              method='Fixed regularized TPS on same sequential LK support; interior leave-one-out and local Jacobian diagnostics; no runtime export.',
              normalizationPx=normalizer, regularization=regularization, solverAffineError=solver_error,
              tracked=len(first), survivors=len(ids), interiorHeldOut=len(interior),
              heldOutMaxErrorPx=float(np.max(all_errors)) if all_errors.size else None,
              heldOutMinInlierFraction=float(np.min(np.mean(all_errors <= 2, axis=1))) if all_errors.size else None,
              minJacobianDet=min(all_dets) if all_dets else None,
              seamDeliveryPx=float(np.linalg.norm(delta[-1])), rangeDeliveryPx=np.ptp(delta, axis=0).tolist(),
              gates=gates, diagnosticPass=all(gates.values()), accepted=False,
              limits='Independent fixed-F0 appearance gate remains failed. This experiment cannot authorize export, anatomy, or full head transform.',
              raw=dict(path=str(raw_path), sha256=sha(raw_path)))
(out / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
