"""Independently check frozen canvas observations; no browser or visual acceptance."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math
import sys

sys.path.insert(0, '/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/python')
import cv2
import numpy as np
cv2.setNumThreads(1)

claim_path, output = map(Path, sys.argv[1:])
assert not output.exists()
hashes = {}


def read(path, expected=None):
    path = Path(path).resolve()
    data = path.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    assert expected is None or expected == digest, str(path)
    hashes[str(path)] = digest
    return data


def load(path, expected=None):
    return json.loads(read(path, expected))


def stat(mask):
    rows, cols = np.nonzero(mask)
    return dict(pixels=int(cols.size), bbox=None if not cols.size else
                [int(cols.min()), int(rows.min()), int(cols.max()+1), int(rows.max()+1)])


def overlap(a, b):
    return max(0, min(a['x']+a['width'], b['x']+b['width'])-max(a['x'], b['x'])) * max(
        0, min(a['y']+a['height'], b['y']+b['height'])-max(a['y'], b['y']))


claim = load(claim_path)
refs = {key: load(claim[key]['path'], claim[key]['sha256'])
        for key in ['raw', 'preregistration', 'artifact', 'measurement', 'release']}
read(claim['harness']['path'], claim['harness']['sha256'])
raw, pre, measured = (refs[x] for x in ['raw', 'preregistration', 'measurement'])
base = Path(claim['raw']['path']).parent
for item in load(base/'harness-provenance.json'):
    read(base/item['name'], item['sha256'])
for key in ['sourceCommit', 'indexSha256', 'url']:
    assert all(x[key] == raw[key] for x in [pre, claim, measured, refs['artifact']])
assert raw['pass'] and not raw['errors'] and not raw['blockedRequests']
assert raw['viewport'] == [1280, 720] and raw['fixture']['mediaCats'] == ['mochi']
assert len(raw['cases']) == len(raw['actions']) == 5
assert not raw['runtimeSourceSubstitutions']
assert [{k: c[k] for k in ['mode', 'cat', 'skill', 'ms']} for c in raw['cases']] == pre['cases']
assert all(a['rulesEqual'] and a['observedBattle'] == a['expectedBattle'] for a in raw['actions'])
expected = {c['key']: c for c in measured['cases']}
results = []
states, pictures, pairs, checks = 0, 0, 0, 0

for case in raw['cases']:
    old = expected[case['key']]
    state = case['before']
    scene, presentation = state['scene'], state['presentation']
    assert presentation['fontStatus'] == 'loaded'
    assert scene['paused'] and scene['renderTime'] == case['fixedTime']
    assert scene['totalBadge']['hidden'] and scene['labelTargetShift'] == 0
    media = scene['media']['mochi']
    video = media['state']
    frame = math.floor((video['currentTime'] + 1e-6) * 30)
    assert video['ready'] and not video.get('failure') and not video['disposed'] and not video['seeking']
    assert media['planeVisible'] and media['rootVisible']
    assert abs(video['currentTime'] - video['desired']) <= 1/60
    assert round(media['decoded']['mediaTime'] * 30) == frame
    assert abs(video['sourceFrame'] - frame) < 1e-5
    assert case['mode'] != 'reduced' or frame == 0
    images = {}
    assert [c['variant'] for c in case['captures']] == pre['sequence']
    for cap in case['captures']:
        data = read(cap['path'], cap['sha256'])
        a = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
        assert list(a.shape[1::-1]) == cap['dimensions'] == [1280, 720]
        assert a.shape[2] in (3, 4)
        images[cap['variant']] = a
        pictures += 1
        for when in ['before', 'after']:
            assert cap[when] == state, (case['key'], cap['variant'], when)
            states += 1
    repeats = []
    for a, b in [('screen0', 'screen1'), ('screen0', 'screen2'), ('canvas0', 'canvas1'), ('canvas0', 'canvas2')]:
        assert images[a].shape == images[b].shape
        row = dict(a=a, b=b, **stat(np.any(images[a] != images[b], axis=2)))
        assert row['pixels'] == 0
        repeats.append(row)
        pairs += 1
    assert repeats == old['repeatComparisons']
    rect = presentation['canvas']['rect']
    assert [rect['width'], rect['height']] == presentation['renderer']['bitmap']
    assert all(float(rect[k]).is_integer() for k in ['x', 'y', 'width', 'height'])
    assert all(n['style']['transform'] == 'none' for n in presentation['ancestors'] if n['pseudo'] is None)
    x, y, w, h = [int(rect[k]) for k in ['x', 'y', 'width', 'height']]
    screen = images['screen0'][y:y+h, x:x+w, :3]
    canvas = images['canvas0'][:, :, :3]
    assert screen.shape == canvas.shape
    changed = np.any(screen != canvas, axis=2)
    union = np.zeros((h, w), dtype=bool)
    for entry in scene['labels'] + scene['hud']:
        r = entry['rect']
        left, top = max(0, math.floor(r['x']-x-2)), max(0, math.floor(r['y']-y-2))
        right, bottom = min(w, math.ceil(r['x']+r['width']-x+2)), min(h, math.ceil(r['y']+r['height']-y+2))
        union[top:bottom, left:right] = True
    cross = dict(allPixels=stat(changed), insideLabelHudGuard=stat(changed & union),
                 outsideLabelHudGuard=stat(changed & ~union))
    for key, value in cross.items():
        assert value == old['screenCanvas'][key]
        checks += 1
    assert old['screenCanvas']['supportedMapping']
    assert images['canvas0'].shape[2] == 4
    assert np.unique(images['canvas0'][:, :, 3]).tolist() == old['screenCanvas']['canvasAlphaValues'] == [255]
    nodes = presentation['footer']
    boxes = {name: next(n['rect'] for n in nodes if name in (n['class'] or '').split())
             for name in ['b3-bottom', 'b3-speed', 'b3-party', 'b3-bottom-actions']}
    footer, speed, party = [boxes[k] for k in ['b3-bottom', 'b3-speed', 'b3-party']]
    f = pre['footerCapacity']
    panels = [dict(x=speed['right']+f['controlClearance']+i*(f['panelWidth']+f['panelGap']),
                   y=footer['top']+f['topOffset'], width=f['panelWidth'], height=f['panelHeight']) for i in range(f['count'])]
    assert panels == old['footerCapacity']['panels']
    assert all(p['x'] >= footer['left'] and p['y'] >= footer['top'] and
               p['x']+p['width'] <= party['left']-f['controlClearance'] and
               p['y']+p['height'] <= footer['bottom'] for p in panels)
    assert not any(overlap(p, a['body']) for p in panels for a in scene['anchors'] if a['visible'] and a.get('body'))
    assert not any(overlap(p, n['rect']) for p in panels for n in nodes if n['class'] != 'b3-bottom')
    slack = party['left']-f['controlClearance']-panels[-1]['x']-panels[-1]['width']
    assert slack == old['footerCapacity']['rightSlack'] == 33
    assert old['footerCapacity']['nominalBoxPass']
    after = [n for n in presentation['ancestors'] if n['pseudo'] == '::after' and 'dp-arena' in (n['class'] or '').split()]
    assert after == old['arenaAfter'] and len(after) == 1
    assert after[0]['style']['background'].startswith('rgba(0, 0, 0, 0) none ')
    results.append(dict(key=case['key'], repeatsExact=True, fullStatesExact=True,
                        screenCanvas=cross, nominalFooterSlack=slack, arenaAfterBackground=after[0]['style']['background']))

assert (pictures, pairs, states, checks) == (30, 20, 60, 15)
read(Path(__file__))
receipt = dict(utc=datetime.now(timezone.utc).isoformat(), claim=dict(path=str(claim_path), sha256=hashes[str(claim_path.resolve())]),
               sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'], url=raw['url'],
               imagesVerified=pictures, repeatedPairs=pairs, fullStateSnapshots=states, crossMethodStatistics=checks,
               artifactHashes=hashes, cases=results, imagesViewed=0, productionAcceptance=False,
               decision='ACCEPT numerical repeatability and nominal capacity only',
               limits=['Cross-method residual pixels do not establish label paint or repair conceal controls.',
                       'Footer boxes alone do not prove full paint, real content, focus or ownership association.',
                       'Expected and observed action states match; independent rule replay is recorded separately.',
                       'No image was opened or art accepted; native Clover and commissioned Mochi population remains separate.'])
output.write_text(json.dumps(receipt, indent=2)+'\n')
print(json.dumps(dict(output=str(output), hashes=len(hashes), images=pictures, pairs=pairs, states=states,
                     residualPixels=[c['screenCanvas']['outsideLabelHudGuard']['pixels'] for c in results])))
