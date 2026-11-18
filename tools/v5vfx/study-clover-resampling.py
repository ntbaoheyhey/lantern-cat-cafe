"""Attribute one intermediate RGB resize without changing matte or runtime assets."""
from pathlib import Path
import datetime
import hashlib
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(1)
BASE = Path('/Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m')
OUT = ROOT / 'work/v5/CXV/batch-m/clover-resampling-R1'
OUT.mkdir(exist_ok=False)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
ref = lambda p: dict(path=str(p), sha256=sha(p))
source = BASE / 'sources/clover-idle-original.mp4'
matte_path = BASE / 'matte-r2/clover-premul.rgba'
final_path = BASE / 'clover-four-plane-q21-r1/source.rgba'
measurement_path = BASE / 'experiments/clover-384/measurements.json'
notebook = Path('/Users/bao/taskbar-hero-mailbox/LEARN/CXV-media-resampling-v8-20261118.md')
assert sha(source) == '4bbdffe74e33437d9c7dcdc863be0335ac4680bf42cce7dd05db3b0eaaaae150'
assert sha(matte_path) == 'c7741308c934b742022fe293dc3419c2d28cb72c3c3d7bc960bb56117e86574f'
assert sha(final_path) == '21fd9e6e159cbb1390c96dfc1b3dab4dffaa96d1ecb16ed7a97b0cbfcdecb7ac'
m = json.loads(measurement_path.read_text())
assert m['studyCanvas'] == [421, 512] and m['deliveryCanvas'] == [318, 390]
assert m['sourceBoundsAtStudy'] == [1, 5, 406, 499]
command = ['ffmpeg', '-nostdin', '-v', 'error', '-i', str(source), '-vf',
           'scale=421:512:flags=lanczos', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']
report = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
              inputs=[ref(p) for p in [source, matte_path, final_path, measurement_path, notebook, __file__]],
              command=command, crop=[0, 2, 409, 502], intermediate=[318, 390], final=[212, 260],
              cv2=cv2.__version__, numpy=np.__version__, rows=[], pass_=False,
              imagesViewed=0, runtimeChanges=False,
              limits='Numerical operator attribution only; direct resize is a control, not quality ground truth. '
                     'Final alpha strata remain frozen. No alpha/fringe/halo recovery, art acceptance or native timing claim.')
save = lambda: (OUT / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
save()
try:
    raw = subprocess.check_output(command)
    frames = np.frombuffer(raw, np.uint8).reshape((300, 512, 421, 3))
    report['decodedStudyRGBSha256'] = hashlib.sha256(raw).hexdigest()
    matte = np.memmap(matte_path, np.uint8, 'r', shape=(300, 390, 318, 4))
    final = np.memmap(final_path, np.uint8, 'r', shape=(300, 260, 212, 4))
    resize = lambda frame, size: cv2.resize(frame, size, interpolation=cv2.INTER_AREA)
    def comparison(left, right, masks):
        difference = np.abs(left.astype(np.float64) - right.astype(np.float64))
        return {key: dict(count=int(mask.sum()), mae=float(difference[mask].mean()) if mask.any() else 0,
                          maximum=float(difference[mask].max()) if mask.any() else 0,
                          absoluteSum=float(difference[mask].sum())) for key, mask in masks.items()}
    for i, frame in enumerate(frames):
        crop = frame[2:502, :409]
        mid = resize(crop, (318, 390))
        reconstructed = mid.copy()
        reconstructed[matte[i, :, :, 3] == 0] = 0
        reproduction_error = int(np.abs(reconstructed.astype(np.int16) - matte[i, :, :, :3]).max())
        final_error = int(np.abs(resize(matte[i], (212, 260)).astype(np.int16) - final[i]).max())
        sequential = resize(mid, (212, 260))
        direct = resize(crop, (212, 260))
        floating = resize(resize(crop.astype(np.float32), (318, 390)), (212, 260))
        alpha = final[i, :, :, 3]
        masks = dict(all=np.ones(alpha.shape, bool), transparent=alpha == 0,
                     edge=(alpha > 0) & (alpha < 250), opaque=alpha >= 250)
        row = dict(frame=i, sourceMatteRGBMaxError=reproduction_error, finalRGBAMaxError=final_error,
                   sequentialVsDirect=comparison(sequential, direct, masks),
                   integerRounding=comparison(sequential, floating, masks),
                   matteZeroing=comparison(sequential, final[i, :, :, :3], masks))
        report['rows'].append(row)
        assert reproduction_error == 0 and final_error == 0, 'Pipeline reproduction mismatch at frame ' + str(i)
    report['aggregate'] = {}
    for metric in ['sequentialVsDirect', 'integerRounding', 'matteZeroing']:
        report['aggregate'][metric] = {}
        for stratum in ['all', 'transparent', 'edge', 'opaque']:
            values = [r[metric][stratum] for r in report['rows']]
            count = sum(v['count'] for v in values)
            report['aggregate'][metric][stratum] = dict(pixelFrames=count,
                mae=sum(v['absoluteSum'] for v in values)/(count*3) if count else 0,
                maximum=max(v['maximum'] for v in values),
                frameMAEP95=float(np.percentile([v['mae'] for v in values], 95)))
    controls = {}
    for kind in ['constant', 'step', 'impulse']:
        control = np.full((500, 409), 128, np.float32) if kind == 'constant' else np.zeros((500, 409), np.float32)
        if kind == 'step':
            control[:, 204:] = 255
        if kind == 'impulse':
            control[:, 204] = 255
        sequential = resize(resize(control, (318, 390)), (212, 260))
        direct = resize(control, (212, 260))
        controls[kind] = dict(sequentialProfile=sequential[130, 101:111].tolist(),
                              directProfile=direct[130, 101:111].tolist(),
                              maxDelta=float(np.abs(sequential-direct).max()))
        if kind == 'constant':
            assert np.max(np.abs(sequential-128)) < .0001 and np.max(np.abs(direct-128)) < .0001
    report['controls'] = controls
    report['pass_'] = True
except Exception as error:
    report['failure'] = repr(error)
    raise
finally:
    report['finishedUTC'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    save()
    print(json.dumps(dict(out=str(OUT), passed=report['pass_'], frames=len(report['rows']),
                          aggregate=report.get('aggregate'), failure=report.get('failure'))))
