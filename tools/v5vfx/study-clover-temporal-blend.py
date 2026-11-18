"""Numerical-only loop-transition control. Never exports replacement artwork."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import numpy as np

prereg_path = ROOT / 'reports/v5/CXV/M-clover-temporal-blend-R1-preregistration.json'
spec = json.loads(prereg_path.read_text())
assert datetime.datetime.now(datetime.timezone.utc) >= datetime.datetime.fromisoformat(spec['studyGateUTC'].replace('Z', '+00:00'))
source = Path(spec['source'])
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert sha(source) == spec['sha256']
assert source.stat().st_size == int(np.prod(spec['shape']))
raw = np.memmap(source, np.uint8, 'r', shape=tuple(spec['shape']))
count, height, width, channels = raw.shape
n = spec['blendFrames']
assert (count, channels, n, count-n) == (300, 4, 15, spec['outputFrames'])
x, y, w, h = spec['ROI']
opaque, vacant = spec['opaqueThreshold'], spec['vacantThreshold']


def smooth(t):
    return t*t*t*(t*(t*6-15)+10)


def blend(a, b, weight):
    return a.astype(np.float32)*(1-weight)+b.astype(np.float32)*weight


def stats(values):
    a = np.array(values, dtype=float)
    return dict(count=len(values), minimum=float(a.min()), median=float(np.median(a)),
                p95=float(np.quantile(a, .95)), maximum=float(a.max()))


def metrics(a, b):
    aa, bb = a[..., 3], b[..., 3]
    support = (aa > vacant) | (bb > vacant)
    opposed = ((aa >= opaque) & (bb <= vacant)) | ((bb >= opaque) & (aa <= vacant))
    d = np.abs(a.astype(np.float32)-b.astype(np.float32))
    return dict(rgbMAE=float(d[..., :3][support].mean()), alphaMAE=float(d[..., 3][support].mean()),
                opposedOpaqueVacantPixels=int(opposed.sum()), supportPixels=int(support.sum()))


def region(frame, name):
    return frame if name == 'whole' else frame[y:y+h, x:x+w]


# Analytic controls validate weights and unchanged-image identity, not art quality.
assert smooth(0) == 0 and smooth(1) == 1 and smooth(.5) == .5
weights = [smooth(j/(n-1)) for j in range(n)]
assert all(a <= b for a, b in zip(weights, weights[1:]))
assert np.array_equal(blend(raw[0], raw[299], 0), raw[0])
assert np.array_equal(blend(raw[0], raw[299], 1), raw[299])
assert np.array_equal(blend(raw[0], raw[0], .5), raw[0])

report = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
              preregistration=dict(path=str(prereg_path), sha256=sha(prereg_path)),
              source=dict(path=str(source), sha256=sha(source), shape=spec['shape']),
              harnessSha256=sha(__file__), analyticControls=True,
              outputFrames=count-n, outputSeconds=(count-n)/spec['fps'],
              originalSeconds=count/spec['fps'], cycleDurationChangePercent=-100*n/count,
              regions={}, imagesViewed=0, candidateArtExported=False, runtimeChanged=False,
              productionAcceptance=False)
for name in ('whole', 'observationROI'):
    original = [metrics(region(raw[j-1], name), region(raw[j], name)) for j in range(1, count)]
    rows, transition = [], []
    previous = region(raw[count-n-1], name)
    for j, weight in enumerate(weights):
        a, b = region(raw[count-n+j], name), region(raw[j], name)
        mixed = blend(a, b, weight)
        opposed = ((a[..., 3] >= opaque) & (b[..., 3] <= vacant)) | ((b[..., 3] >= opaque) & (a[..., 3] <= vacant))
        ambiguous = opposed & (mixed[..., 3] > vacant) & (mixed[..., 3] < opaque)
        rows.append(dict(sourceFrames=[count-n+j, j], weight=weight,
                         opposedOpaqueVacantPixels=int(opposed.sum()),
                         mixedOpacityPixels=int(ambiguous.sum()),
                         mixedOpacityRange=([float(mixed[..., 3][ambiguous].min()), float(mixed[..., 3][ambiguous].max())]
                                            if ambiguous.any() else None)))
        transition.append(metrics(previous, mixed))
        previous = mixed
    closing = metrics(previous, region(raw[n], name))
    # The new loop boundary is an original adjacent pair, by construction.
    assert closing == metrics(region(raw[n-1], name), region(raw[n], name))
    report['regions'][name] = dict(originalAdjacent={k: stats([r[k] for r in original]) for k in original[0]},
        originalSeam=metrics(region(raw[-1], name), region(raw[0], name)),
        candidateTransition={k: stats([r[k] for r in transition]) for k in transition[0]},
        candidateBoundary=closing, transitionRows=rows,
        maxMixedOpacityPixels=max(row['mixedOpacityPixels'] for row in rows))
report['opaqueSilhouettesPreserved'] = all(r['maxMixedOpacityPixels'] == 0 for r in report['regions'].values())
report['originalCycleDurationPreserved'] = report['outputFrames'] == count
report['disposition'] = 'REJECT simple crossfade for delivery; numerical smoothness does not preserve opacity or cycle duration.' if not report['opaqueSilhouettesPreserved'] or not report['originalCycleDurationPreserved'] else 'Study only; native/art gates still required.'
report['limits'] = ['Premultiplied RGBA code-value calculation, not linear-light color validation or a packed-video decoder gate.',
                    'Opposed opacity is a same-coordinate silhouette diagnostic, not anatomical correspondence or a recovered alpha layer.',
                    'ROI contains tail and cloth; no dense semantic mask or perceptual double-contour verdict.',
                    'No motion retiming, repaired frame, video, atlas, application source or registry was exported.']
output = ROOT / 'reports/v5/CXV/M-clover-temporal-blend-R1.json'
assert not output.exists()
output.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(dict(disposition=report['disposition'], seconds=report['outputSeconds'],
                     regions={name: dict(mixed=r['maxMixedOpacityPixels'], originalSeam=r['originalSeam']['rgbMAE'],
                                         boundary=r['candidateBoundary']['rgbMAE'], maxTransition=r['candidateTransition']['rgbMAE']['maximum'])
                              for name, r in report['regions'].items()})))
