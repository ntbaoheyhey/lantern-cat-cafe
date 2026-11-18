"""Validate two fresh footer heldouts and create two unviewed <=1024px previews."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math
import sys
import urllib.request

sys.path.insert(0, '/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/python')
import cv2
import numpy as np
cv2.setNumThreads(1)
ROOT = Path(__file__).resolve().parents[2]
base = ROOT/'work/v5/CXI/batch-m/footer-heldouts-r1'
output = base/'measurement.json'
assert not output.exists()
hashes = {}


def read(path, expected=None):
    path = Path(path).resolve()
    b = path.read_bytes()
    h = hashlib.sha256(b).hexdigest()
    assert expected is None or expected == h, str(path)
    hashes[str(path)] = h
    return b


raw = json.loads(read(base/'report.json'))
pre = json.loads(read(raw['preregistration']['path'], raw['preregistration']['sha256']))
build = json.loads(read(raw['build']['path'], raw['build']['sha256']))
assert raw['sourceCommit'] == pre['sourceCommit'] == build['sourceCommit']
assert raw['indexSha256'] == pre['indexSha256'] == build['indexSha256']
with urllib.request.urlopen(raw['url'], timeout=15) as response:
    assert hashlib.sha256(response.read()).hexdigest() == raw['indexSha256']
read(base/'capture-footer-heldouts-frozen.mjs', raw['harnessSha256'])
assert raw['harnessSha256'] == pre['harness']['sha256']
assert raw['pass'] and raw['finishedUTC'] and not raw['errors'] and not raw['blockedRequests']
assert raw['fixture']['mediaCats'] == ['mochi'] and raw['viewport'] == [1280, 720]
assert not raw['runtimeSourceSubstitutions'] and len(raw['cases']) == 2
views = []
images, states, pairs = 0, 0, 0

for case in raw['cases']:
    assert [p['phase'] for p in case['phases']] == ['baseline', 'candidate']
    decoded = {}
    for phase in case['phases']:
        records = {}
        assert [c['variant'] for c in phase['captures']] == pre['sequence']
        for cap in phase['captures']:
            b = read(cap['path'], cap['sha256'])
            im = cv2.imdecode(np.frombuffer(b, np.uint8), cv2.IMREAD_UNCHANGED)
            assert list(im.shape[1::-1]) == cap['dimensions'] == [1280, 720]
            records[cap['variant']] = im
            images += 1
            for when in ['before', 'after']:
                assert cap[when] == phase['before']
                states += 1
        for a, b in [('screen0', 'screen1'), ('screen0', 'screen2'), ('canvas0', 'canvas1'), ('canvas0', 'canvas2')]:
            assert np.array_equal(records[a], records[b])
            pairs += 1
        decoded[phase['phase']] = records
    assert np.array_equal(decoded['baseline']['canvas0'], decoded['candidate']['canvas0'])
    before, after = [p['before'] for p in case['phases']]
    for key in ['battle', 'plan', 'sceneTime', 'renderTime', 'host', 'anchors', 'hud', 'labels', 'media']:
        assert before['scene'][key] == after['scene'][key]
    assert before['presentation']['footer'] == after['presentation']['footer']
    assert [p['actor'] for p in after['panels']] == ['mochi']
    original = next(i for i in before['information'] if i['class'] == 'b3-world' and i['actor'] == 'mochi')
    transferred = next(i for i in after['information'] if i['class'] == 'b3-cxv-identity' and i['actor'] == 'mochi')
    assert all(original[k] == transferred[k] for k in ['meters', 'badges'])
    media = after['scene']['media']['mochi']
    v = media['state']
    frame = math.floor((v['currentTime']+1e-6)*30)
    assert v['ready'] and not v['seeking'] and not v.get('failure') and not v['disposed']
    assert round(media['decoded']['mediaTime']*30) == frame and abs(v['sourceFrame']-frame) < 1e-5
    assert case['mode'] != 'reduced' or frame == 0
    capture = next(c for c in case['phases'][1]['captures'] if c['variant'] == 'screen0')
    preview = cv2.resize(decoded['candidate']['screen0'], (1024, 576), interpolation=cv2.INTER_AREA)
    path = base/(case['key']+'-preview.png')
    assert not path.exists() and cv2.imwrite(str(path), preview)
    read(path)
    views.append(dict(path=str(path), sha256=hashes[str(path)], dimensions=[1024, 576], raw=capture['path'],
                      captureUTC=capture['utc'], case=case['key'], badgeCount=len(transferred['badges']),
                      decodedFrame=frame, body=next(a['body'] for a in after['scene']['anchors'] if a['id'] == 'mochi'),
                      measured=True, viewed=False, views=0))

assert (images, states, pairs) == (24, 48, 16)
read(Path(__file__))
receipt = dict(utc=datetime.now(timezone.utc).isoformat(), sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'], url=raw['url'],
               raw=dict(path=str(base/'report.json'), sha256=hashes[str((base/'report.json').resolve())]),
               imageHashes=images, fullStateSnapshots=states, repeatedPairs=pairs, rawBodyPairs=2, views=views, artifactHashes=hashes,
               captureTimeTool=dict(path=str(base/'capture-footer-heldouts-frozen.mjs'), sha256=raw['harnessSha256']),
               postCaptureFix='Capture completed with STOP absent; future source guard corrected from peer STOP-CXV to own STOP-CXI. Capture-time bytes preserved.',
               productionAcceptance=False)
output.write_text(json.dumps(receipt, indent=2)+'\n')
(base/'viewed.json').write_text(json.dumps(dict(images=views), indent=2)+'\n')
print(json.dumps(dict(images=images, states=states, pairs=pairs, previews=[{k:v[k] for k in ['path', 'dimensions', 'case', 'badgeCount']} for v in views])))
