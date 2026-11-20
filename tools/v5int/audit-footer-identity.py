"""Independent fixed-state footer pilot audit, without opening images or a browser."""
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
base, output = map(Path, sys.argv[1:])
assert not output.exists()
hashes = {}


def read(path, expected=None):
    path = Path(path).resolve()
    data = path.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    assert expected is None or digest == expected, str(path)
    hashes[str(path)] = digest
    return data


def load(path, expected=None):
    return json.loads(read(path, expected))


def stat(mask):
    y, x = np.nonzero(mask)
    return dict(pixels=int(x.size), bbox=None if not x.size else
                [int(x.min()), int(y.min()), int(x.max()+1), int(y.max()+1)])


def contains(a, b):
    return a['left'] <= b['left'] and a['top'] <= b['top'] and a['right'] >= b['right'] and a['bottom'] >= b['bottom']


def intersects(a, b, gap=0):
    return a['x'] < b['x']+b['width']+gap and b['x'] < a['x']+a['width']+gap and a['y'] < b['y']+b['height']+gap and b['y'] < a['y']+a['height']+gap


raw = load(base/'report.json')
pre = load(raw['preregistration']['path'], raw['preregistration']['sha256'])
measured = load(base/'footer-identity-measurement.json')
artifact = load(base/'artifact-verification.json')
assert load(base/'exit.json')['exit'] == 0
for item in load(base/'harness-provenance.json'):
    read(base/item['name'], item['sha256'])
assert raw['harnessSha256'] == pre['harness']['sha256']
assert raw['runtimeDiagnostic']['prototypeSha256'] == pre['prototype']['sha256']
for k in ['sourceCommit', 'indexSha256', 'url']:
    assert raw[k] == pre[k] == measured[k] == artifact[k]
assert raw['pass'] and raw['finishedUTC'] and not raw['errors'] and not raw['blockedRequests']
assert len(raw['cases']) == len(raw['actions']) == 4
assert raw['viewport'] == [1280, 720] and raw['fixture']['mediaCats'] == ['mochi']
assert not raw['runtimeSourceSubstitutions']
assert [{k: c[k] for k in pre['cases'][0]} for c in raw['cases']] == pre['cases']
expected = {c['key']: c for c in measured['cases']}
rows = []
pictures, states, repeats, pixels = 0, 0, 0, 0

for case in raw['cases']:
    baseline = case['phases'][0]['before']
    assert case['phases'][0]['phase'] == 'baseline'
    assert [p['phase'] for p in case['phases']] == pre['phases']
    original = {x['actor']: x for x in baseline['information'] if x['class'] == 'b3-world'}
    claim = expected[case['key']]
    images = {}
    phase_rows = []
    for phase in case['phases']:
        name = phase['phase']
        assert not phase.get('skipped'), 'This frozen four-case pilot had actual controls in every phase'
        assert [c['variant'] for c in phase['captures']] == pre['sequence']
        reference = phase['before']
        assert reference['scene']['paused'] and reference['scene']['renderTime'] == case['fixedTime']
        assert reference['presentation']['fontStatus'] == 'loaded'
        media = reference['scene']['media']['mochi']
        video = media['state']
        frame = math.floor((video['currentTime']+1e-6)*30)
        assert video['ready'] and not video.get('failure') and not video['seeking'] and not video['disposed']
        assert media['planeVisible'] and media['rootVisible']
        assert abs(video['currentTime']-video['desired']) <= 1/60
        assert round(media['decoded']['mediaTime']*30) == frame and abs(video['sourceFrame']-frame) < 1e-5
        assert case['mode'] != 'reduced' or frame == 0
        group = {}
        for capture in phase['captures']:
            data = read(capture['path'], capture['sha256'])
            im = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
            assert list(im.shape[1::-1]) == capture['dimensions'] == [1280, 720]
            group[capture['variant']] = im
            pictures += 1
            for when in ['before', 'after']:
                assert capture[when] == reference, (case['key'], name, capture['variant'], when)
                states += 1
        comparisons = []
        for a, b in [('screen0', 'screen1'), ('screen0', 'screen2'), ('canvas0', 'canvas1'), ('canvas0', 'canvas2')]:
            assert group[a].shape == group[b].shape
            value = stat(np.any(group[a] != group[b], axis=2))
            assert value['pixels'] == 0
            comparisons.append(dict(a=a, b=b, **value))
            repeats += 1
        assert comparisons == next(p for p in claim['phases'] if p['phase'] == name)['repeatComparisons']
        images[name] = group
        if name == 'baseline':
            continue
        active = name != 'restored'
        originals = {x['actor']: x for x in reference['information'] if x['class'] == 'b3-world'}
        assert set(originals) == set(original)
        for k in ['battle', 'plan', 'sceneTime', 'renderTime', 'host', 'anchors', 'hud', 'labels', 'media']:
            assert reference['scene'][k] == baseline['scene'][k], (case['key'], name, k)
        assert reference['presentation']['footer'] == baseline['presentation']['footer']
        assert all(originals[k] == v for k, v in original.items() if k != 'mochi')
        assert all(originals['mochi'][k] == original['mochi'][k] for k in ['meters', 'badges'])
        assert originals['mochi']['visibility'] == ('hidden' if active else original['mochi']['visibility'])
        assert [p['actor'] for p in reference['panels']] == (['mochi'] if active else [])
        panel_results = []
        for panel in reference['panels']:
            box = panel['rect']
            info = next(x for x in reference['information'] if x['class'] == 'b3-cxv-identity' and x['actor'] == panel['actor'])
            assert [box['width'], box['height']] == [160, 72]
            assert all(info[k] == original['mochi'][k] for k in ['meters', 'badges'])
            assert panel['name'] == 'Mochi' and panel['groupRole'] == 'group' and panel['groupLabel'] == 'cxv-identity-name-mochi'
            assert panel['visibility'] == 'visible' and not panel['hidden']
            assert info['noEffects'] == (None if info['badges'] else 'No effects')
            for child in panel['children']:
                for r in [child['rect'], *child['textRects']]:
                    assert not r['width'] or not r['height'] or contains(box, r), (case['key'], name, child)
                if child['class'] in ['b3-hp', 'b3-rage']:
                    assert child['rect']['width'] == 64
                if child['tabIndex'] == '0':
                    assert [child['rect']['width'], child['rect']['height']] == [18, 18]
            focused = [c for c in panel['children'] if c['focus']]
            controls = [c for c in panel['children'] if c['tabIndex'] == '0']
            if name.startswith('focus-'):
                assert len(focused) == 1
                assert focused[0] == controls[0 if name == 'focus-first' else -1]
                focus = focused[0]
                width, offset = [float(focus[k].removesuffix('px')) for k in ['outlineWidth', 'outlineOffset']]
                assert width > 0 and focus['outlineStyle'] != 'none'
                r, extra = focus['rect'], max(0, width+offset)
                assert contains(box, dict(left=r['left']-extra, top=r['top']-extra, right=r['right']+extra, bottom=r['bottom']+extra))
            assert not any(intersects(box, a['body'], 2) for a in reference['scene']['anchors'] if a['visible'] and a.get('body'))
            assert not any(intersects(box, n['rect'], 2) for n in reference['presentation']['footer'] if n['class'] != 'b3-bottom')
            panel_results.append(dict(actor=panel['actor'], badges=len(info['badges']), focused=len(focused), valuesExact=True,
                                      textAndChildBoxesContained=True, bodyAndControlBoxesClearAt2px=True))
        canvas = stat(np.any(images['baseline']['canvas0'] != group['canvas0'], axis=2))
        assert canvas['pixels'] == 0
        screen = np.any(images['baseline']['screen0'] != group['screen0'], axis=2)
        intent = np.zeros((720, 1280), dtype=bool)
        rects = [x['rect'] for x in baseline['scene']['labels'] if x['id'] == 'mochi'] + [p['rect'] for p in reference['panels']]
        for r in rects:
            l, t = max(0, math.floor(r['x']-2)), max(0, math.floor(r['y']-2))
            rr, bb = min(1280, math.ceil(r['x']+r['width']+2)), min(720, math.ceil(r['y']+r['height']+2))
            intent[t:bb, l:rr] = True
        row = dict(phase=name, rawCanvas=canvas, screenAll=stat(screen), screenOutsideIntendedBounds=stat(screen & ~intent))
        peer = next(p for p in claim['paired'] if p['phase'] == name)
        for key in ['rawCanvas', 'screenAll', 'screenOutsideIntendedBounds']:
            assert row[key] == peer[key]
            pixels += 1
        row['panels'] = panel_results
        phase_rows.append(row)
    rows.append(dict(key=case['key'], statusCase=case['statusCase'], phases=phase_rows))

assert (pictures, states, repeats, pixels) == (120, 240, 80, 48)
read(Path(__file__))
receipt = dict(utc=datetime.now(timezone.utc).isoformat(), sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'], url=raw['url'],
               raw=dict(path=str(base/'report.json'), sha256=hashes[str((base/'report.json').resolve())]),
               imagesVerified=pictures, fullStateSnapshots=states, repeatedPairs=repeats, crossPhaseStatistics=pixels,
               artifactHashes=hashes, cases=rows, imagesViewed=0, productionAcceptance=False,
               decision='ACCEPT exact fixed-state content/geometry/raw-canvas and numerical evidence only',
               limits=['All four full-screen restorations remain nonzero; no repaired conceal-control claim.',
                       'Numeric child/text/outline boxes do not alone prove complete paint or owner association.',
                       'Only Mochi panel and badge counts1/5 exercised; zero effects, dual media, fallback and full trajectory remain untested.',
                       'No performance, motion or art acceptance; independent legal-action replay is a separate receipt.'])
output.write_text(json.dumps(receipt, indent=2)+'\n')
print(json.dumps(dict(output=str(output), hashes=len(hashes), images=pictures, states=states, pairs=repeats, pixelStats=pixels,
                     restoredPixels=[c['phases'][-1]['screenAll']['pixels'] for c in rows])))
