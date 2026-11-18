"""Verify complete filtered label paint without fitting or moving any pixels."""
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


def box(rect, padding=0):
    return [max(0, math.floor(rect['x']) - padding), max(0, math.floor(rect['y']) - padding),
            min(1280, math.ceil(rect['x'] + rect['width']) + padding),
            min(720, math.ceil(rect['y'] + rect['height']) + padding)]


def overlap(a, b):
    return a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1]


def main():
    base, output = map(lambda p: Path(p).resolve(), sys.argv[1:3])
    assert base.is_relative_to(ROOT / 'work/v5/CXV')
    assert output.is_relative_to(ROOT / 'work/v5/CXV') and not output.exists()
    raw_path, analysis_path = base / 'report.json', base / 'analysis.json'
    raw, analysis = [json.loads(p.read_text()) for p in (raw_path, analysis_path)]
    assert len(raw['cases']) == len(analysis['cases'])
    assert sha(raw_path) == analysis['raw']['sha256']
    results = []
    for case, measured in zip(raw['cases'], analysis['cases']):
        key = case.get('key', f"{case['mode']}-{case['frame']}")
        result = {'key': key, 'controlsValid': bool(measured['valid']), 'labels': []}
        results.append(result)
        if not measured.get('pixelDifferences'):
            result['pass'] = False
            result['reason'] = 'Incomplete attribution; no zero or clearance claim.'
            continue
        masks = measured['pixelDifferences']
        assert sha(masks['path']) == masks['sha256']
        data = dict(np.load(masks['path']))
        state = case['before']
        escapes = []
        for padding in range(11):
            covered = np.zeros((720, 1280), bool)
            for label in state['labels']:
                x0, y0, x1, y1 = box(label['rect'], padding)
                covered[y0:y1, x0:x1] = True
            escapes.append(int(np.count_nonzero((data['labelPaint'] > 0) & ~covered)))
        result.update(masks=masks, escapesByPadding=escapes)
        project = lambda rect: dict(rect, x=rect['x'] + state['host']['x'], y=rect['y'] + state['host']['y'])
        for cat in ('mochi', 'clover'):
            label = next(l for l in state['labels'] if l['id'] == cat)
            bounds = box(label['rect'], 10)
            x0, y0, x1, y1 = bounds
            ownership = all(not overlap(bounds, box(l['rect'], 10)) for l in state['labels'] if l['id'] != cat)
            paint = data['labelPaint'][y0:y1, x0:x1]
            yy, xx = np.nonzero(paint)
            paint_bounds = None if not len(xx) else [x0 + int(xx.min()), y0 + int(yy.min()), x0 + int(xx.max()) + 1, y0 + int(yy.max()) + 1]
            guards = [('hud:' + str(i), box(h['rect'])) for i, h in enumerate(state['hud'])]
            for actor in state['anchors']:
                if not actor['visible']:
                    continue
                if actor.get('face'):
                    guards.append(('face:' + actor['id'], box(project(actor['face']))))
                if actor.get('body') and actor['id'] not in ('mochi', 'clover'):
                    guards.append(('native-body:' + actor['id'], box(project(actor['body']), 6)))
            guards += [('label:' + l['id'], box(l['rect'], 10)) for l in state['labels'] if l['id'] != cat]
            guard_hits = [name for name, rect in guards if paint_bounds and overlap(paint_bounds, rect)]
            viewport = bool(paint_bounds and paint_bounds[0] >= 4 and paint_bounds[1] >= 4 and paint_bounds[2] <= 1276 and paint_bounds[3] <= 716)
            counts = []
            for threshold in (0, 1, 2, 4):
                for margin in (0, 1, 2):
                    for body, contribution in data.items():
                        if not body.endswith('Contribution'):
                            continue
                        mask = (contribution > threshold).astype(np.uint8)
                        if margin:
                            mask = cv2.dilate(mask, np.ones((margin * 2 + 1, margin * 2 + 1), np.uint8))
                        pixels = int(np.count_nonzero((paint > threshold) & (mask[y0:y1, x0:x1] > 0)))
                        counts.append(dict(body=body, threshold=threshold, margin=margin, pixels=pixels))
            clear = all(c['pixels'] == 0 for c in counts if c['threshold'] == 0 and c['margin'] == 2)
            result['labels'].append(dict(id=cat, crop=bounds, ownershipDisjoint=ownership,
                                         paintBounds=paint_bounds, viewportClear=viewport, guardHits=guard_hits,
                                         counts=counts, paintClear=clear,
                                         **{'pass': ownership and viewport and not guard_hits and clear}))
        result['pass'] = bool(result['controlsValid'] and escapes[10] == 0 and all(l['pass'] for l in result['labels']))
    report = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), url=raw['url'],
                  sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'], viewport=raw['viewport'],
                  raw=dict(path=str(raw_path), sha256=sha(raw_path)),
                  analysis=dict(path=str(analysis_path), sha256=sha(analysis_path)),
                  harness=dict(path=str(Path(__file__)), sha256=sha(__file__)),
                  runtimeDiagnostic=raw['runtimeDiagnostic'], cases=len(results),
                  validControls=sum(r['controlsValid'] for r in results),
                  comparisons=sum(len(l['counts']) for r in results for l in r['labels']),
                  **{'pass': bool(analysis['attributionValid'] and results and all(r['pass'] for r in results))},
                  results=results, productionAcceptance=False,
                  limits=['Paused diagnostic paint only; isolated native roots exclude shadows and independent VFX.',
                          'Invalid cases retained and excluded from acceptance; fixed offsets never refitted here.'])
    output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: report[k] for k in ('cases', 'validControls', 'comparisons', 'pass')}))
    print(json.dumps({'failures': [{'key': r['key'], 'valid': r['controlsValid'],
                                  'labels': [l['id'] for l in r['labels'] if not l['pass']]}
                                 for r in results if not r['pass']]}))
    return 0 if report['pass'] else 1


if __name__ == '__main__':
    sys.exit(main())
