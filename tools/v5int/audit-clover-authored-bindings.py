"""Independent numeric audit of frozen Clover head/paw observations and exports."""
from pathlib import Path
import datetime
import hashlib
import json
import math

ROOT = Path(__file__).resolve().parents[2]
LANE = Path('/Users/bao/taskbar-hero-cardrpg-a6')
checked = {}

def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def verify(ref):
    path = Path(ref['path'])
    if str(path) not in checked:
        assert digest(path) == ref['sha256'], path
        checked[str(path)] = ref['sha256']
    else:
        assert checked[str(path)] == ref['sha256'], path
    return json.loads(path.read_text()) if path.suffix == '.json' else None

def read_report(name):
    path = LANE / 'reports/v5/CXV' / name
    return verify({'path': str(path), 'sha256': digest(path)})

paw = read_report('M-clover-paw-R6-validation.json')
pre = verify(paw['preregistration'])
observations = verify(paw['observations'])
model = verify(paw['model']['raw'])
prior = verify({'path': paw['model']['report'], 'sha256': paw['model']['reportSha256']})
assert not prior['passSparseControls'] and paw['model']['fitProhibited']
assert not paw['fitPerformed'] and observations['allFrozenBeforePrediction']
assert observations['utc'] < paw['utc'] and pre['utc'] < observations['utc']
assert observations['preregistrationSha256'] == paw['preregistration']['sha256']
for ref in observations['files'] + observations['reviewedSheets']:
    verify(ref)
rows = observations['rows']
frames = [row['frame'] for row in rows]
assert len(rows) == len(set(frames)) == 24 and frames == pre['frames']
assert set(frames).isdisjoint(pre['excludedReviewedFrames'])
assert set(frames).isdisjoint(model[paw['model']['field']]['trainingFrames'])
errors = []
for obs, reported in zip(rows, paw['rows']):
    frame = obs['frame']
    x1, y1, x2, y2 = obs['visiblePawBoundsSourcePx']
    center = [(x1+x2)/2, (y1+y2)/2]
    assert center == obs['visiblePawCenterSourcePx'] == reported['observed']
    prediction = model[paw['model']['field']]['centers'][frame]
    assert prediction == reported['predicted'] and frame == reported['frame']
    error = [prediction[i]-center[i] for i in range(2)]
    assert max(abs(error[i]-reported['errorSourcePx'][i]) for i in range(2)) < 1e-10
    assert max(map(abs, error)) <= pre['observationBoundSourcePxPerAxis'] == 6
    errors.append(list(map(abs, error)))
maximum = [max(row[i] for row in errors) for i in range(2)]
assert maximum == paw['maxAbsErrorSourcePx'] and paw['passCount'] == 24

exports = []
for name, channel, socket, points in [
    ('M-clover-eye-delivery-R5.json', 'head', 'head', None),
    ('M-clover-paw-delivery-R6.json', 'freePaw', 'off-hand', model[paw['model']['field']]['centers'])
]:
    delivery = read_report(name)
    source_report = verify(delivery['sourceReport'])
    if points is None:
        points = verify(source_report['raw'])['centers']
    for key in ['sourceVideo', 'coordinateContract', 'harness']:
        verify(delivery[key])
    assert delivery['deliverySize'] == [318, 390] and delivery['frames'] == 300
    assert delivery['fps'] == 30 and delivery['opaqueHeight'] == 384
    manifest = delivery['partialManifest']
    origin, track = manifest['sockets'][socket], manifest['socketTracks'][channel]
    assert len(track) == len(points) == 300 and track[0] == [0, 0]
    if channel == 'freePaw':
        assert manifest['socketChannels'] == {'off-hand': 'freePaw'}
        assert set(manifest['sockets']) == {'off-hand'}
        assert set(manifest['socketTracks']) == {'freePaw'}
    converted = [[((p[0]+.5)*421/526)*318/409-.5,
                  ((p[1]+.5)*512/640-2)*390/500-.5] for p in points]
    error = 0
    for frame in range(300):
        nxt = (frame+1) % 300
        for fraction in [0, .125, .5, .875, 1]:
            for axis in range(2):
                actual = origin[axis] + (1-fraction)*track[frame][axis] + fraction*track[nxt][axis]
                expected = (1-fraction)*converted[frame][axis] + fraction*converted[nxt][axis]
                assert math.isfinite(actual)
                error = max(error, abs(actual-expected)*512/384)
    assert error < 1.4e-6
    assert abs(error-delivery['conversionChecks']['maxWorldError']) < 1e-10
    exports.append({'channel': channel, 'socket': socket, 'frames': 300,
                    'fractionalChecks': 1500, 'maxWorldError': error,
                    'deliverySize': delivery['deliverySize']})

report = {'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'harness': {'path': str(Path(__file__).resolve()), 'sha256': digest(__file__)},
          'verifiedArtifacts': len(checked), 'artifactHashes': checked,
          'freshPawControls': 24, 'pawMaxErrorSourcePx': maximum,
          'noRefit': True, 'priorCombinedRejectionPreserved': True, 'exports': exports,
          'imagesViewed': 0, 'runtimeAdopted': False,
          'decision': 'ACCEPT sparse frozen paw controls and numeric head/paw exports only.',
          'remaining': ['Convert 318x390 export to current 212x260 media explicitly.',
                        'Add independent freePaw loader channel and verify adapter/native alignment.',
                        'No independent visual, continuous anatomical, matte, seam or performance claim.']}
out = ROOT/'reports/v5/CXI/evidence/v8-clover-authored-bindings-review.json'
out.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({'report': str(out), 'artifacts': len(checked), 'pawControls': 24, 'exports': exports}))
