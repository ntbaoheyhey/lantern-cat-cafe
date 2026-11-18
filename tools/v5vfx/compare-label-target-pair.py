"""Compare unchanged and temporary-offset captures; do not waive other art gates."""
from pathlib import Path
import datetime
import hashlib
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(2)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load(path):
    p = Path(path).resolve()
    assert p.is_relative_to(ROOT / 'work/v5/CXV')
    return json.loads(p.read_text())


def image(c, variant):
    item = next(x for x in c['captures'] if x['variant'] == variant)
    assert sha(item['path']) == item['sha256']
    result = cv2.imread(item['path'], cv2.IMREAD_COLOR)
    assert result.shape == (720, 1280, 3)
    return result


def overlap(a, b):
    return (a['x'] < b['x'] + b['width'] and a['x'] + a['width'] > b['x']
            and a['y'] < b['y'] + b['height'] and a['y'] + a['height'] > b['y'])


def main():
    ap, bp, output = map(Path, sys.argv[1:4])
    aa, bb = load(ap), load(bp)
    assert not output.exists() and output.resolve().is_relative_to(ROOT / 'reports/v5/CXV')
    raw = []
    for analysis in (aa, bb):
        assert sha(analysis['raw']['path']) == analysis['raw']['sha256']
        raw.append(load(analysis['raw']['path']))
    assert aa['sourceCommit'] == bb['sourceCommit'] and aa['indexSha256'] == bb['indexSha256']
    targets = [a['runtimeDiagnostic']['labelTarget'] for a in (aa, bb)]
    assert targets[0].get('dx', 0) == targets[0]['dy'] == 0
    expected_shift = dict(x=targets[1].get('dx', 0), y=targets[1]['dy'], width=0, height=0)
    assert (expected_shift['x'], expected_shift['y']) in ((0, 5), (-12, 19))
    assert raw[0]['plannedCases'] == raw[1]['plannedCases']
    result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  sourceCommit=aa['sourceCommit'], indexSha256=aa['indexSha256'], url=aa['url'],
                  inputs=[dict(path=str(p.resolve()), sha256=sha(p)) for p in (ap, bp)],
                  harness=dict(path=str(Path(__file__)), sha256=sha(__file__)), cases=[],
                  productionAcceptance=False, imagesViewed=0, expectedCloverShift=expected_shift)
    assert len(aa['cases']) == len(bb['cases']) == len(raw[0]['cases']) == len(raw[1]['cases'])
    for a, b, ar, br in zip(aa['cases'], bb['cases'], raw[0]['cases'], raw[1]['cases']):
        assert (a['mode'], a['sourceFrame']) == (b['mode'], b['sourceFrame'])
        x, y = ar['before'], br['before']
        labels_a = {v['id']: v for v in x['labels']}
        labels_b = {v['id']: v for v in y['labels']}
        deltas = {}
        for key in labels_a:
            r, s = labels_a[key]['rect'], labels_b[key]['rect']
            deltas[key] = {k: s[k] - r[k] for k in ('x', 'y', 'width', 'height')}
        expected_delta = all(all(abs(v - (expected_shift[k] if cat == 'clover' else 0)) <= 1/64
                                for k, v in delta.items()) for cat, delta in deltas.items())
        no_labels_a, no_labels_b = image(a, 'labels-hidden'), image(b, 'labels-hidden')
        canvas_changed = int(np.count_nonzero(np.any(no_labels_a != no_labels_b, axis=2)))
        changed = np.any(image(a, 'baseline') != image(b, 'baseline'), axis=2)
        allowed = np.zeros(changed.shape, dtype=bool)
        for r in (labels_a['clover']['rect'], labels_b['clover']['rect']):
            l, t = max(0, math.floor(r['x'])-4), max(0, math.floor(r['y'])-4)
            rr, bot = min(1280, math.ceil(r['x']+r['width'])+4), min(720, math.ceil(r['y']+r['height'])+4)
            allowed[t:bot, l:rr] = True
        outside_changed = int(np.count_nonzero(changed & ~allowed))
        rect = labels_b['clover']['rect']
        faces = [v['face'] for v in y['anchors'] if v.get('visible') and v.get('face')]
        hud = [v['rect'] for v in y['hud']]
        other = [v['rect'] for k, v in labels_b.items() if k != 'clover']
        gates = dict(bothAttributionsValid=a['valid'] and b['valid'],
                     rules=x['battle'] == y['battle'], frames=a['expectedFrames'] == b['expectedFrames'],
                     clocks=x['renderTime'] == y['renderTime'] and all(x['media'][cat]['state']['currentTime'] == y['media'][cat]['state']['currentTime'] for cat in ('mochi', 'clover')),
                     hudUnchanged=x['hud'] == y['hud'], actualLabelDisplacement=expected_delta,
                     canvasExact=canvas_changed == 0, outsideCloverExact=outside_changed == 0,
                     facesHudOtherLabelsClear=not any(overlap(rect, r) for r in faces+hud+other))
        native_bodies = [v['body'] for v in y['anchors'] if v.get('visible') and v.get('body') and v['id'] not in ('mochi', 'clover')]
        if expected_shift['x']:
            gates['nativeBodyRectanglesClear'] = not any(overlap(rect, r) for r in native_bodies)
        row = dict(mode=a['mode'], sourceFrame=a['sourceFrame'], expectedFrames=a['expectedFrames'],
                   gates=gates, labelDeltas=deltas, canvasChangedPixels=canvas_changed,
                   outsideCloverChangedPixels=outside_changed, baseline=a['threshold0Union'], candidate=b['threshold0Union'],
                   candidateBodyRectangleIntersections=[v['id'] for v in y['anchors'] if v.get('visible') and v.get('body') and overlap(rect, v['body'])])
        result['cases'].append(row)
    result['pairValid'] = (aa['attributionValid'] and bb['attributionValid'] and
                           len(result['cases']) == len(raw[0]['plannedCases']) and
                           all(all(c['gates'].values()) for c in result['cases']))
    result['sampledCommissionedPaintClear'] = result['pairValid'] and all(c['candidate']['all']['count'] == 0 for c in result['cases'])
    result['limits'] = ['The recorded paused case list includes regression/heldout poses and reduced F0; no all-frame or cast clearance.',
                        'Outside-Clover pixel isolation uses the union of both DOM bounds expanded by4CSSpx, not exact DOM containment.',
                        'Reversible target offset on unchanged application source, not an accepted source change.',
                        'Only commissioned media contributions isolated; native-body paint and source seam/matte remain open.',
                        'Conservative body-rectangle results are retained; no natural-play acceptance.']
    output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ('pairValid', 'sampledCommissionedPaintClear', 'productionAcceptance')}))


if __name__ == '__main__':
    main()
