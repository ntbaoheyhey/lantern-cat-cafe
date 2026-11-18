"""Export the independently observed Clover spout channel for CXI adapter review."""
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
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
ref = lambda p: dict(path=str(p), sha256=sha(p))
report_path = ROOT / 'reports/v5/CXV/M-clover-spout-landmark-R1.json'
report = json.loads(report_path.read_text())
for key in ['source', 'annotations', 'harness', 'raw', 'sourceVisualReceipt']:
    item = report[key]
    assert sha(item['path']) == item['sha256']
assert report['diagnosticPass'] and all(report['gates'].values())
assert report['sourceVisualReview']['views'] == 1
assert sha(report['sourceVisualReview']['path']) == report['sourceVisualReview']['sha256']
coordinates_path = Path('/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-m-clover-provisional-sockets.json')
contract = json.loads(coordinates_path.read_text())
video_path = ROOT / 'work/v5/CXV/ref/batch-m/clover.mp4'
assert sha(video_path) == contract['sourceSha256']
assert contract['deliverySize'] == [318, 390] and contract['opaqueHeight'] == 384
raw = json.loads(Path(report['raw']['path']).read_text())
points = np.array(raw['forwardPoints'])[:, 0, :]
assert points.shape == (300, 2) and np.isfinite(points).all()
pre = np.array([421/526, 512/640])
crop = np.array([0, 2])
final = np.array([318/409, 390/500])
delivery = ((points+.5)*pre-crop)*final-.5
origin = np.round(delivery[0], 6)
track = np.round(delivery-delivery[0], 6)
assert np.all(track[0] == 0)
assert np.all(delivery >= 0) and np.all(delivery < [318, 390])
foot = np.array(contract['foot']['xy'])
scale = 512/384
max_error = 0.
checks = 0
for i in range(300):
    j = (i+1) % 300
    for t in [0, .125, .5, .875, 1]:
        represented = origin+track[i]*(1-t)+track[j]*t
        source_interpolated = points[i]*(1-t)+points[j]*t
        expected = ((source_interpolated+.5)*pre-crop)*final-.5
        world = (represented-foot)*[scale, -scale]
        direct = (expected-foot)*[scale, -scale]
        max_error = max(max_error, float(np.max(np.abs(world-direct))))
        checks += 1
assert checks == 1500 and max_error < 2e-6
source_roundtrip = ((delivery+.5)/final+crop)/pre-.5
roundtrip = float(np.max(np.abs(source_roundtrip-points)))
assert roundtrip < 1e-10
matte_path = Path('/Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m/matte-r2/clover-premul.rgba')
matte = np.memmap(matte_path, np.uint8, 'r', shape=(300, 390, 318, 4))
distances = {}
for threshold in [5, 128]:
    values = []
    for i, point in enumerate(delivery):
        mask = matte[i, :, :, 3] >= threshold
        yx = np.argwhere(mask)[:, ::-1]
        values.append(float(np.sqrt(np.min(np.sum((yx-point)**2, axis=1)))))
    distances[str(threshold)] = dict(maxDistanceToOpaquePixelCenter=float(max(values)), frame=int(np.argmax(values)))
steps = np.linalg.norm(np.roll(delivery, -1, axis=0)-delivery, axis=1)
accelerations = np.linalg.norm(np.roll(delivery, -1, axis=0)-2*delivery+np.roll(delivery, 1, axis=0), axis=1)
result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), cat='clover',
    status='SCOPED_SOURCE_DELIVERY_CANDIDATE; actual loader and decoded scene/cast gates pending',
    sourceReport=ref(report_path), coordinateContract=ref(coordinates_path), sourceVideo=ref(video_path),
    matteSource=ref(matte_path), harness=ref(__file__), fps=30, frames=300,
    units='DELIVERY PIXEL offsets; +x right,+y down; add to independent vfx-origin position before world conversion and cast deformation',
    semantics='Visible terminal spout lip, per CXI 2026-11-18T09:50:51.044Z; supersedes provisional tea-body vfx-origin only',
    deliverySize=[318, 390], opaqueHeight=384, foot=contract['foot'],
    conversion=dict(sourceSize=[526, 640], preResize=[421, 512], cropRectXYXY=[0, 2, 409, 502],
                    finalResize=[318, 390], pixelCenterConvention=True),
    partialManifest=dict(sockets={'vfx-origin':origin.tolist()}, socketTracks={'spout':track.tolist()}, socketChannels={'vfx-origin':'spout'}),
    requiredCXILoaderChange='Add independent spout channel to DESIGNER_SOCKET_CHANNELS and own validation tests; do not bind vfx-origin to prop or lantern',
    previousProvisionalVfxOrigin=contract['provisionalSockets']['vfx-origin'],
    uncertainty=dict(manualSourcePxPerAxis=2, manualDeliveryPxPerAxis=(2*pre*final).tolist(),
                     note='Observational annotation bounds, not a statistical confidence interval; no hidden aperture or bone recovery'),
    conversionChecks=dict(fractionalChecks=checks, maxWorldError=max_error, maxSourceRoundtripError=roundtrip),
    continuity=dict(maxStepDeliveryPx=float(steps.max()), maxStepFrame=int(steps.argmax()),
                    seamDeliveryPx=float(steps[-1]), maxSecondDifferenceDeliveryPx=float(accelerations.max())),
    alphaProximityDiagnostic=distances,
    sourceGates=report['gates'], sourceVisualEvidenceReuse=report['sourceVisualReview'],
    unresolved=['head', 'hp-anchor', 'off-hand', 'decoded media and scene/cast proof', 'Clover tail loop', 'budget'],
    runtimeChanged=False, registryChanged=False, imagesReopened=0,
    limits='This is an independently measured source-coordinate channel with arithmetic checks, not actual adapter, decoded-media, fringe, loop, occlusion or scene acceptance. Hip/mainHand payload and all prior failed transforms remain unchanged. Alpha proximity reports distance only; it is not an alpha-quality or full-sequence visibility claim.')
out = ROOT / 'reports/v5/CXV/M-clover-spout-delivery-R1.json'
assert not out.exists()
out.write_text(json.dumps(result, separators=(',', ':'))+'\n')
print(json.dumps(dict(output=ref(out), origin=origin.tolist(), continuity=result['continuity'],
    conversionChecks=result['conversionChecks'], alphaProximityDiagnostic=distances)))
