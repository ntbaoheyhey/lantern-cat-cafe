"""Evaluate the preregistered untouched/sham/conceal screenshot sequence."""
from pathlib import Path
import datetime, hashlib, importlib.util, json, sys

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('measure', ROOT / 'tools/v5vfx/measure-action-labels.py')
measure = importlib.util.module_from_spec(spec)
spec.loader.exec_module(measure)
measure.MEDIA=('mochi',)
import cv2
cv2.setNumThreads(2)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
base = Path(sys.argv[1]).resolve()
assert base.is_relative_to(ROOT / 'work/v5/CXV')
rawpath = base / 'report.json'
raw = json.loads(rawpath.read_text())
artifactpath = base / 'artifact-verification.json'
artifact = json.loads(artifactpath.read_text())
assert all(raw[key] == artifact[key] for key in ('sourceCommit', 'indexSha256', 'url'))
provenancepath = base / 'harness-provenance.json'
for item in json.loads(provenancepath.read_text()):
    assert sha(base / item['name']) == item['sha256']
prepath = Path(raw['preregistration']['path'])
assert sha(prepath) == raw['preregistration']['sha256']
pre = json.loads(prepath.read_text())
assert raw['harnessSha256'] == pre['harness']['sha256']
assert raw['sourceCommit'] == pre['sourceCommit'] and raw['indexSha256'] == pre['indexSha256']
pairs = [('untouched-0', 'untouched-1'), ('untouched-1', 'untouched-2'),
         ('untouched-2', 'sham-style'), ('untouched-2', 'sham-restored'),
         ('untouched-2', 'restored-1'), ('restored-1', 'restored-repeat-1'),
         ('untouched-2', 'restored-2'), ('hidden-1', 'hidden-2')]
results, hashes = [], 0
for case in raw['cases']:
    images, gates = {}, []
    for capture in case['captures']:
        assert sha(capture['path']) == capture['sha256']
        hashes += 1
        images[capture['variant']] = cv2.imread(capture['path'])
        assert images[capture['variant']].shape == (720, 1280, 3)
        for when in ('before', 'after'):
            state = capture[when]
            gate = measure.stable(state, case['before'], case['fixedTime'], case['mode'] == 'reduced')
            meters = capture[when + 'Meters']
            initial_meters = case['captures'][0]['beforeMeters']
            gate['meters'] = meters['meters'] == initial_meters['meters']
            gate['fontReady'] = meters['fontStatus'] == 'loaded'
            gates.append(dict(variant=capture['variant'], when=when, gates=gate))
    assert list(images) == pre['conditioningStudy']['shots']
    comparisons = []
    for a, b in pairs:
        difference = measure.delta(images[a], images[b])
        comparisons.append(dict(a=a, b=b, thresholds={str(t): measure.stats(difference > t) for t in (0, 1, 2, 4)}))
    results.append(dict(key=case['key'],arm=case['arm'],placement=case['placement'],method=case['method'], comparisons=comparisons, stateGates=gates,
                        allStateExact=all(all(g['gates'].values()) for g in gates),
                        allRgbExact=all(c['thresholds']['0']['count'] == 0 for c in comparisons)))
result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
              raw=dict(path=str(rawpath), sha256=sha(rawpath)), preregistration=raw['preregistration'],
              artifact=dict(path=str(artifactpath), sha256=sha(artifactpath)),
              provenance=dict(path=str(provenancepath), sha256=sha(provenancepath)),
              harness=dict(path=__file__, sha256=sha(__file__)), stateVerifierSha256=sha(ROOT / 'tools/v5vfx/measure-action-labels.py'),
              sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'], url=raw['url'],
              hashes=hashes, capturePass=raw['pass'], captureFailure=raw.get('failure'),
              rulesExact=all(a['rulesEqual'] and a['observedBattle'] == a['expectedBattle'] for a in raw['actions']),
              cases=results, productionAcceptance=False, imagesViewed=0, limits=pre['limits'])
output = base / 'mochi-controls-measurement.json'
assert not output.exists()
output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(dict(cases=len(results), hashes=hashes, capturePass=raw['pass'],
                     stateFailures=[r['key'] for r in results if not r['allStateExact']],
                     pixelFailures=[r['key'] for r in results if not r['allRgbExact']])))
