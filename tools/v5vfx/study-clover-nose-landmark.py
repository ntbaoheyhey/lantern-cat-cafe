"""Diagnostic visible landmark only; never exports a head/socket transform."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np

cv2.setNumThreads(1)
BASE = ROOT / 'work/v5/CXV/batch-m/clover-nose-landmark-R1'
assert not (BASE / 'report.json').exists(), 'Frozen outputs must not be overwritten'
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
ann_path = BASE / 'annotations.json'
ann = json.loads(ann_path.read_text())
cfg = ann['predeclaredDiagnostic']
assert sha(ann['plot']['path']) == ann['plot']['sha256']
source_path = ROOT / 'work/v5/CXV/ref/batch-m/clover-frames.npy'
frames = np.load(source_path, mmap_mode='r')
assert frames.shape == (300, 640, 526, 3)
gray = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in frames]
params = dict(winSize=tuple(cfg['LK']['winSize']), maxLevel=cfg['LK']['maxLevel'],
              criteria=tuple(cfg['LK']['criteria']), minEigThreshold=cfg['LK']['minEigThreshold'])
offsets = np.array(cfg['fiveProbeOffsets'], np.float32)


def step(a, b, points):
    nxt, status, error = cv2.calcOpticalFlowPyrLK(a, b, points, None, **params)
    back, back_status, _ = cv2.calcOpticalFlowPyrLK(b, a, nxt, None, **params)
    fb = np.linalg.norm(back[:, 0] - points[:, 0], axis=1)
    valid = (status[:, 0] > 0) & (back_status[:, 0] > 0) & np.isfinite(fb) & (fb < cfg['stepFBMaxSourcePx'])
    return nxt, fb, valid, error[:, 0]


def track(order, initial):
    current = (np.array(initial, np.float32) + offsets)[:, None, :]
    points = {order[0]: current[:, 0].copy()}
    rows = []
    for a, b in zip(order[:-1], order[1:]):
        for name in ['STOP-ALL', 'STOP-CXV']:
            assert not (Path('/Users/bao/taskbar-hero-mailbox') / name).exists(), name
        current, fb, valid, error = step(gray[a], gray[b], current)
        points[b] = current[:, 0].copy()
        rows.append(dict(fromFrame=a, toFrame=b, forwardBackwardPx=fb.tolist(), valid=valid.tolist(), l1Error=error.tolist()))
    return np.array([points[i] for i in range(300)]), rows


initial = np.array(cfg['initialPoint'], np.float32)
# Known translated image and textureless controls check the tracker plumbing.
translated = cv2.warpAffine(gray[0], np.array([[1, 0, 3], [0, 1, -2]], np.float32), gray[0].shape[::-1])
q, fb, valid, _ = step(gray[0], translated, initial[None, None, :])
control_error = float(np.linalg.norm(q[0, 0] - initial - [3, -2]))
assert valid[0] and control_error < .2
flat = np.full_like(gray[0], 128)
_, flat_status, _ = cv2.calcOpticalFlowPyrLK(flat, flat, initial[None, None, :], None, **params)
assert not flat_status.any()
forward, forward_rows = track(list(range(300)), cfg['initialPoint'])
reverse, reverse_rows = track(list(range(299, -1, -1)), cfg['reverseInitialPoint'])
scale = np.array([421/526 * 318/409, .8 * .78])
tc = cfg['independentTemplate']
template = cv2.getRectSubPix(gray[0], (tc['size'], tc['size']), tuple(map(float, initial)))
radius = tc['fixedSearchRadius']
half = (tc['size']-1)//2
left = int(np.floor(initial[0]))-radius-half
top = int(np.floor(initial[1]))-radius-half
size = radius*2+tc['size']
template_rows = []
for i in range(300):
    search = gray[i][top:top+size, left:left+size]
    correlation = cv2.matchTemplate(search, template, cv2.TM_CCOEFF_NORMED)
    _, peak, _, position = cv2.minMaxLoc(correlation)
    point = np.array(position, float) + [left+half, top+half]
    delta = (point - forward[i, 0]) * scale
    template_rows.append(dict(frame=i, correlation=float(peak), point=point.tolist(), disagreementDeliveryPx=float(np.linalg.norm(delta))))
manual = []
for r in ann['rows']:
    frame = r['frame']
    delta = forward[frame, 0] - r['xy']
    outside = np.maximum(np.abs(delta)-r['uncertaintyPxPerAxis'], 0)
    manual.append(dict(frame=frame, observed=r['xy'], predicted=forward[frame, 0].tolist(),
        centerErrorSourcePx=float(np.linalg.norm(delta)), outsideManualBoxSourcePx=float(np.linalg.norm(outside)),
        declaredUncertaintyPxPerAxis=r['uncertaintyPxPerAxis']))
reverse_delta = np.linalg.norm((forward[:, 0] - reverse[:, 0]) * scale, axis=1)
seam = float(np.linalg.norm((forward[-1, 0] - forward[0, 0]) * scale))
fv = np.array([r['valid'] for r in forward_rows])
rv = np.array([r['valid'] for r in reverse_rows])
ffb = np.array([r['forwardBackwardPx'] for r in forward_rows])
rfb = np.array([r['forwardBackwardPx'] for r in reverse_rows])
gates = dict(allForwardCenterValid=bool(fv[:, 0].all()), allReverseCenterValid=bool(rv[:, 0].all()),
    manualCentersWithin2SourcePx=all(r['centerErrorSourcePx'] <= cfg['manualCenterErrorMaxSourcePx'] for r in manual),
    manualBoxesContainPredictions=all(r['outsideManualBoxSourcePx'] == 0 for r in manual),
    fixedTemplateCorrelationAtLeast08=min(r['correlation'] for r in template_rows) >= tc['minCorrelation'],
    templateDisagreementAtMost2DeliveryPx=max(r['disagreementDeliveryPx'] for r in template_rows) <= tc['maxDisagreementDeliveryPx'],
    independentReverseWithin2DeliveryPx=float(reverse_delta.max()) <= 2,
    seamAtMost2DeliveryPx=seam <= cfg['sourceSeamMaxDeliveryPx'])
raw = dict(forwardPoints=forward.tolist(), reversePoints=reverse.tolist(), forwardRows=forward_rows,
           reverseRows=reverse_rows, fixedTemplate=template_rows, manualControls=manual)
raw_path = BASE / 'tracks.json'
raw_path.write_text(json.dumps(raw, separators=(',', ':'))+'\n')
report = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    source=dict(path=str(source_path), sha256=sha(source_path)), annotations=dict(path=str(ann_path), sha256=sha(ann_path)),
    harness=dict(path=str(Path(__file__).resolve()), sha256=sha(__file__)), raw=dict(path=str(raw_path), sha256=sha(raw_path)),
    syntheticTranslationErrorPx=control_error, texturelessControlRejected=True,
    centerForwardFBMaxSourcePx=float(ffb[:, 0].max()), centerReverseFBMaxSourcePx=float(rfb[:, 0].max()),
    allProbeForwardSurvivors=int(fv.all(axis=0).sum()), allProbeReverseSurvivors=int(rv.all(axis=0).sum()),
    fixedTemplateMinCorrelation=min(r['correlation'] for r in template_rows),
    fixedTemplateMaxDisagreementDeliveryPx=max(r['disagreementDeliveryPx'] for r in template_rows),
    independentReverseMaxDeliveryPx=float(reverse_delta.max()), seamDeliveryPx=seam,
    rangeDeliveryPx=np.ptp(forward[:, 0]*scale, axis=0).tolist(), manualControls=manual, gates=gates,
    diagnosticPass=all(gates.values()), socketAccepted=False, runtimeChanged=False,
    limits='Only a visible nose apex is tracked. Sparse manual observations have +/-2sourcepx per-axis uncertainty and are not full trajectory ground truth. No six-corner transform or cheek/head socket substitution is authorized. Existing rejected socket studies remain rejected.')
(BASE / 'report.json').write_text(json.dumps(report, indent=2)+'\n')
(ROOT / 'reports/v5/CXV/M-clover-nose-landmark-R1.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report))
