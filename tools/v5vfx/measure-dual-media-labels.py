"""Freeze paint attribution and exact controls before viewing diagnostic screenshots.

Differences identify visible RGB contribution, not alpha or anatomical segmentation.
All thresholds and failed controls are retained. This never clears natural R1 gates.
"""
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
THRESHOLDS = (0, 1, 2, 4)
CATS = ('mochi', 'clover')
VARIANTS = ('baseline', 'baseline-repeat', 'labels-hidden',
            'labels-hidden-repeat', 'without-mochi', 'without-clover', 'restored')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def delta(a, b):
    return np.max(np.abs(a.astype(np.int16) - b.astype(np.int16)), axis=2).astype(np.uint8)


def bounds(rect):
    x, y, w, h = (rect[k] for k in ('x', 'y', 'width', 'height'))
    assert all(math.isfinite(v) for v in (x, y, w, h)) and w > 0 and h > 0
    return [max(0, min(1280, math.floor(x))), max(0, min(720, math.floor(y))),
            max(0, min(1280, math.ceil(x + w))), max(0, min(720, math.ceil(y + h)))]


def pixels(mask):
    y, x = np.nonzero(mask)
    return dict(count=len(x), bbox=[int(x.min()), int(y.min()), int(x.max()) + 1,
                                   int(y.max()) + 1] if len(x) else None,
                sampleXY=[[int(a), int(b)] for a, b in zip(x[:8], y[:8])])


def stable_state(state, initial, fixed_time):
    gates = dict(paused=state['paused'] and not state['plan'],
                 rules=state['battle'] == initial['battle'],
                 labels=state['labels'] == initial['labels'],
                 renderTime=state['renderTime'] == fixed_time,
                 sceneTime=state['sceneTime'] == initial['sceneTime'],
                 host=state['host'] == initial['host'],
                 labelPaint=state.get('labelPaintState') == initial.get('labelPaintState'))
    for cat in CATS:
        a, b = state['media'][cat], initial['media'][cat]
        gates[cat] = (a['state']['ready'] and not a['state'].get('failure') and
                      not a['state']['disposed'] and not a['state']['seeking'] and
                      a['state']['currentTime'] == b['state']['currentTime'] and
                      a['decoded']['mediaTime'] == b['decoded']['mediaTime'] and
                      a['planeVisible'] and a['rootVisible'] and
                      a['body'] == b['body'] and a['face'] == b['face'])
    return gates


def main():
    base, output = (Path(p).resolve() for p in sys.argv[1:3])
    assert base.is_relative_to(ROOT / 'work/v5/CXV')
    assert (output.is_relative_to(ROOT / 'reports/v5/CXV') or output.is_relative_to(ROOT / 'work/v5/CXV')) and not output.exists()
    raw_path = base / 'report.json'
    raw = json.loads(raw_path.read_text())
    verification = json.loads((base / 'artifact-verification.json').read_text())
    provenance = json.loads((base / 'harness-provenance.json').read_text())
    assert raw['viewport'] == [1280, 720]
    assert raw['sourceCommit'] == verification['sourceCommit']
    assert raw['indexSha256'] == verification['indexSha256']
    assert raw['url'] == verification['url']
    assert raw['runtimeSourceSubstitutions'] == []
    for item in provenance:
        assert sha(base / item['name']) == item['sha256'], item['name']
    captured_analyzer = next(x['sha256'] for x in provenance if x['name'] == Path(__file__).name)
    review = base / ('label-review-' + datetime.datetime.now(datetime.timezone.utc).strftime('%H%M%S%f'))
    review.mkdir(exist_ok=False)
    result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  url=raw['url'], sourceCommit=raw['sourceCommit'],
                  indexSha256=raw['indexSha256'], viewport=raw['viewport'],
                  raw=dict(path=str(raw_path), sha256=sha(raw_path)),
                  artifactVerification=dict(path=str(base / 'artifact-verification.json'),
                                            sha256=sha(base / 'artifact-verification.json')),
                  provenance=dict(path=str(base / 'harness-provenance.json'),
                                  sha256=sha(base / 'harness-provenance.json')),
                  runtimeDiagnostic=raw['runtimeDiagnostic'], thresholds=list(THRESHOLDS),
                  analysisHarness=dict(path=str(Path(__file__).resolve()), sha256=sha(__file__),
                                       capturedVersionSha256=captured_analyzer),
                  interpretation='Visible RGB contribution under label paint; not recovered alpha, anatomy, or an ordinary gameplay capture. No natural rectangle failure is waived.',
                  capturePass=raw['pass'], captureFailure=raw.get('failure'),
                  cases=[], reviewImages=[], visualReviewed=False,
                  attributionValid=False, zeroPaintOverlap=False, productionAcceptance=False)
    images_to_make = []
    for case in raw['cases']:
        initial = case['before']
        row = dict(mode=case['mode'], sourceFrame=case['frame'], fixedTime=case['fixedTime'], expectedFrames=case['expectedFrames'],
                   decoded={cat:initial['media'][cat]['decoded'] for cat in CATS},
                   rulesSha256=hashlib.sha256(initial['battle'].encode()).hexdigest(),
                   controls={}, stateGates=[], captures=[], labels=[], complete=False, precondition=case.get('precondition', []))
        result['cases'].append(row)
        for control in case.get('precondition', []):
            assert sha(control['path']) == control['sha256']
        images = {}
        for capture in case['captures']:
            path = Path(capture['path'])
            assert path.is_relative_to(base) and sha(path) == capture['sha256']
            img = cv2.imread(str(path), cv2.IMREAD_COLOR)
            assert img is not None and img.shape == (720, 1280, 3)
            assert capture['variant'] not in images
            images[capture['variant']] = img
            row['captures'].append({k:capture[k] for k in ('variant', 'path', 'sha256', 'utc')})
            for when in ('before', 'after'):
                row['stateGates'].append(dict(variant=capture['variant'], when=when,
                    gates=stable_state(capture[when], initial, case['fixedTime'])))
        if set(images) != set(VARIANTS):
            row['missingVariants'] = sorted(set(VARIANTS) - set(images))
            continue
        row['complete'] = True
        for name, a, b in [('baselineRepeat', 'baseline', 'baseline-repeat'),
                           ('restored', 'baseline', 'restored'),
                           ('hiddenRepeat', 'labels-hidden', 'labels-hidden-repeat')]:
            diff = delta(images[a], images[b])
            row['controls'][name] = dict(exact=not bool(diff.any()),
                                        changedPixels=int(np.count_nonzero(diff)),
                                        maxRgbDifference=int(diff.max()),
                                        bbox=pixels(diff > 0)['bbox'])
        row['valid'] = (not case.get('errors') and not case.get('blockedRequests') and all(x['exact'] for x in row['controls'].values()) and
                        all(all(x['gates'].values()) for x in row['stateGates']) and
                        all(abs(initial['media'][cat]['decoded']['mediaTime'] -
                                case['expectedFrames'][cat] / 30) < 1e-5 for cat in CATS))
        paint = delta(images['baseline'], images['labels-hidden'])
        contributions = {cat:delta(images['labels-hidden'], images['without-' + cat])
                         for cat in CATS}
        masks = dict(labelPaint=paint, **{cat + 'Contribution':v for cat, v in contributions.items()})
        mask_path = review / f"{case['mode']}-{case['frame']}-differences.npz"
        np.savez_compressed(mask_path, **masks)
        row['pixelDifferences'] = dict(path=str(mask_path), sha256=sha(mask_path),
                                       encoding='uint8 max absolute RGB channel difference, full1280x720')
        union = np.zeros((720, 1280), dtype=bool)
        cross = np.zeros_like(union)
        own = np.zeros_like(union)
        label_occupancy = np.zeros((720, 1280), dtype=np.uint8)
        for label in initial['labels']:
            bb = bounds(label['rect'])
            x0, y0, x1, y1 = bb
            label_occupancy[y0:y1, x0:x1] += 1
            regions = dict(whole=label['rect'], **label.get('regions', {}))
            for region, rect in regions.items():
                if rect is None:
                    continue
                x0, y0, x1, y1 = bounds(rect)
                region_mask = np.zeros_like(union)
                region_mask[y0:y1, x0:x1] = True
                item = dict(labelId=label['id'], region=region, rect=rect,
                            pixelBounds=[x0, y0, x1, y1], thresholds={})
                for threshold in THRESHOLDS:
                    label_mask = (paint > threshold) & region_mask
                    measures = dict(labelPaintPixels=int(label_mask.sum()), media={})
                    for cat in CATS:
                        intersection = label_mask & (contributions[cat] > threshold)
                        measures['media'][cat] = dict(relation='own' if label['id'] == cat else 'cross',
                                                     **pixels(intersection))
                        if threshold == 0 and region == 'whole':
                            union |= intersection
                            if label['id'] == cat:
                                own |= intersection
                            else:
                                cross |= intersection
                    item['thresholds'][str(threshold)] = measures
                row['labels'].append(item)
        row['overlappingLabelBoxPixels'] = int(np.count_nonzero(label_occupancy > 1))
        row['valid'] = row['valid'] and row['overlappingLabelBoxPixels'] == 0
        row['threshold0Union'] = dict(all=pixels(union), own=pixels(own), cross=pixels(cross))
        images_to_make.append((case, row, images['baseline'], images['labels-hidden'], own, cross))
    expected = [(c['mode'], c['frame']) for c in raw.get('plannedCases', [{'mode':'normal','frame':x} for x in (0,90,180,270)]+[{'mode':'reduced','frame':0}])]
    result['attributionValid'] = bool(raw['pass'] and not raw['errors'] and not raw['blockedRequests'] and
        [(c['mode'], c['sourceFrame']) for c in result['cases']] == expected and
        all(c.get('valid', False) for c in result['cases']))
    result['zeroPaintOverlap'] = bool(result['attributionValid'] and
        all(c['threshold0Union']['all']['count'] == 0 for c in result['cases']))
    # Freeze numerical observations before constructing any human-review images.
    output.write_text(json.dumps(result, separators=(',', ':')) + '\n')
    for case, row, baseline, hidden, own, cross in images_to_make:
        sheet = np.zeros((600, 1024, 3), dtype=np.uint8)
        baseline_title = 'Diagnostic label target +5px' if raw['runtimeDiagnostic'].get('labelTarget', {}).get('dy') else 'Ordinary paused baseline'
        for image, left, title in [(baseline, 0, baseline_title),
                                    (hidden, 512, 'Diagnostic: labels hidden')]:
            sheet[26:314, left:left+512] = cv2.resize(image, (512, 288), interpolation=cv2.INTER_AREA)
            cv2.putText(sheet, title, (left + 8, 18), cv2.FONT_HERSHEY_SIMPLEX, .45, (240, 240, 240), 1)
        annotated = baseline.copy()
        annotated[own] = (0, 0, 255)
        annotated[cross] = (255, 0, 255)
        points = np.argwhere(own | cross)
        if len(points):
            y0, x0 = np.maximum(points.min(axis=0) - 24, 0)
            y1, x1 = np.minimum(points.max(axis=0) + 25, [720, 1280])
        else:
            x0, y0, x1, y1 = 0, 0, 1280, 720
        for image, left in [(baseline, 0), (annotated, 512)]:
            crop = image[y0:y1, x0:x1]
            factor = min(496 / crop.shape[1], 236 / crop.shape[0], 2)
            w, h = max(1, round(crop.shape[1] * factor)), max(1, round(crop.shape[0] * factor))
            sheet[344:344+h, left+8:left+8+w] = cv2.resize(crop, (w, h), interpolation=cv2.INTER_NEAREST)
        title = f"{case['mode']} Clover F{case['frame']} Mochi F{case['expectedFrames']['mochi']} | exact controls {row['valid']} | own red; cross magenta | threshold 0"
        cv2.putText(sheet, title, (8, 334), cv2.FONT_HERSHEY_SIMPLEX, .43, (240, 240, 240), 1)
        dest = review / f"{case['mode']}-{case['frame']}.png"
        assert not dest.exists() and cv2.imwrite(str(dest), sheet)
        result['reviewImages'].append(dict(path=str(dest), sha256=sha(dest), dimensions=[1024, 600],
                                          mode=case['mode'], sourceFrame=case['frame'], reviewed=False, views=0))
    output.write_text(json.dumps(result, separators=(',', ':')) + '\n')
    print(json.dumps(dict(output=str(output), attributionValid=result['attributionValid'],
        zeroPaintOverlap=result['zeroPaintOverlap'], cases=[{k:c[k] for k in ('mode','sourceFrame','controls','complete')} |
        {k:c.get(k) for k in ('valid','threshold0Union')} for c in result['cases']],
        reviewImages=result['reviewImages'])))


if __name__ == '__main__':
    main()
