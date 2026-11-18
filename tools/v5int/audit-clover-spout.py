"""Independently audit the pinned source observations and spout pixel conversion.

No images are viewed or changed. This does not accept decoded media or a scene.
"""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, '/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/python')
import numpy as np

PAYLOAD = Path('/Users/bao/taskbar-hero-cardrpg-a6/reports/v5/CXV/M-clover-spout-delivery-R1.json')
OUT = ROOT / 'reports/v5/CXI/evidence/v8-clover-spout-source-review.json'
verified = {}


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024*1024), b''):
            digest.update(block)
    return digest.hexdigest()


def verify_refs(value):
    if isinstance(value, dict):
        if 'path' in value and 'sha256' in value:
            path = value['path']
            if path not in verified:
                verified[path] = sha(path)
            assert verified[path] == value['sha256'], path
        for child in value.values():
            verify_refs(child)
    elif isinstance(value, list):
        for child in value:
            verify_refs(child)


delivery = json.loads(PAYLOAD.read_text())
source = json.loads(Path(delivery['sourceReport']['path']).read_text())
raw = json.loads(Path(source['raw']['path']).read_text())
annotations = json.loads(Path(source['annotations']['path']).read_text())
for document in [delivery, source, annotations]:
    verify_refs(document)
verified[str(PAYLOAD)] = sha(PAYLOAD)
assert delivery['deliverySize'] == [318, 390]
assert delivery['opaqueHeight'] == 384 and delivery['frames'] == 300 and delivery['fps'] == 30
assert delivery['partialManifest']['socketChannels'] == {'vfx-origin': 'spout'}
assert set(delivery['partialManifest']['socketTracks']) == {'spout'}
points = np.asarray(raw['forwardPoints'], dtype=float)
reverse = np.asarray(raw['reversePoints'], dtype=float)
assert points.shape == reverse.shape == (300, 5, 2)
assert np.isfinite(points).all() and np.isfinite(reverse).all()
axis_scale = np.array([421/526*318/409, 512/640*390/500])
offset = .5*axis_scale - np.array([0, 2])*[318/409, 390/500] - .5
centers = points[:, 0]
converted = centers*axis_scale+offset
origin = np.asarray(delivery['partialManifest']['sockets']['vfx-origin'])
track = np.asarray(delivery['partialManifest']['socketTracks']['spout'])
assert track.shape == (300, 2) and np.isfinite(track).all()
np.testing.assert_array_equal(track[0], [0, 0])
assert np.max(np.abs(origin-converted[0])) <= .5e-6
assert np.max(np.abs(track-(converted-converted[0]))) <= .5e-6
max_world_error = 0.
for frame in range(300):
    for fraction in [0, .125, .5, .875, 1]:
        next_frame = (frame+1) % 300
        represented = origin+track[frame]*(1-fraction)+track[next_frame]*fraction
        expected = (centers[frame]*(1-fraction)+centers[next_frame]*fraction)*axis_scale+offset
        max_world_error = max(max_world_error, float(np.max(np.abs(represented-expected))*512/384))
assert max_world_error < 2e-6
manual_errors = []
assert len(annotations['rows']) == len(raw['manualControls']) == 9
for annotation, reported in zip(annotations['rows'], raw['manualControls']):
    frame = annotation['frame']
    delta = centers[frame]-annotation['xy']
    error = float(np.linalg.norm(delta))
    assert np.max(np.abs(delta)) <= annotation['uncertaintyPxPerAxis']
    assert error <= 2 and abs(error-reported['centerErrorSourcePx']) < 1e-10
    np.testing.assert_array_equal(reported['predicted'], centers[frame])
    manual_errors.append(error)
for direction in ['forwardRows', 'reverseRows']:
    assert len(raw[direction]) == 299
    assert all(all(row['valid']) for row in raw[direction])
    assert max(max(row['forwardBackwardPx']) for row in raw[direction]) < .75
correlation = min(row['correlation'] for row in raw['fixedTemplate'])
template_error = max(float(np.linalg.norm((np.asarray(row['point'])-centers[row['frame']])*axis_scale)) for row in raw['fixedTemplate'])
reverse_error = float(np.linalg.norm((centers-reverse[:, 0])*axis_scale, axis=1).max())
steps = np.linalg.norm(np.roll(converted, -1, axis=0)-converted, axis=1)
assert correlation >= .8 and template_error < 2 and reverse_error < 2 and steps[-1] < 2
for actual, expected in [(correlation, source['fixedTemplateMinCorrelation']), (template_error, source['fixedTemplateMaxDisagreementDeliveryPx']), (reverse_error, source['independentReverseMaxDeliveryPx']), (steps[-1], delivery['continuity']['seamDeliveryPx']), (steps.max(), delivery['continuity']['maxStepDeliveryPx'])]:
    assert abs(actual-expected) < 1e-10, (actual, expected)
report = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), payload=str(PAYLOAD), payloadSha256=sha(PAYLOAD), verifiedHashes=verified,
              decision='SCOPED ACCEPT: source evidence arithmetic and delivery conversion; actual adapter audited separately', fractionalChecks=1500,
              maxWorldError=max_world_error, manualControls=len(manual_errors), maxManualErrorSourcePx=max(manual_errors),
              fixedTemplateMinCorrelation=correlation, templateMaxDisagreementDeliveryPx=template_error, independentReverseMaxDeliveryPx=reverse_error,
              seamDeliveryPx=float(steps[-1]), maxStepDeliveryPx=float(steps.max()), imagesViewed=0, runtimeChanged=False,
              limits='Hashes and reported-track arithmetic independently verified. Optical flow and analyst annotation accuracy are not re-established by this audit; sparse labels are observations, not full trajectory ground truth. No decoded-media, cast, fringe, tail-loop, budget or scene acceptance.')
OUT.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({k: v for k, v in report.items() if k != 'verifiedHashes'}))
print('Verified hashes:', len(verified))
