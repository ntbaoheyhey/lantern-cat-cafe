"""Static-mask hypothesis search, never native layout or production acceptance."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import numpy as np


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def overlaps(a, b):
    return (a['x'] < b['x'] + b['width'] and a['x'] + a['width'] > b['x']
            and a['y'] < b['y'] + b['height'] and a['y'] + a['height'] > b['y'])


def main():
    source = ROOT / 'reports/v5/CXV/M-dual-media-label-R6.json'
    receipt = json.loads(source.read_text())
    assert receipt['attributionValid'] and len(receipt['cases']) == 5
    cases = []
    for case in receipt['cases']:
        raw = case['pixelDifferences']
        assert sha(raw['path']) == raw['sha256']
        data = np.load(raw['path'])
        whole = next(r for r in case['labels'] if r['labelId'] == 'clover' and r['region'] == 'whole')
        x0, y0, x1, y1 = whole['pixelBounds']
        cases.append((case, whole, data, data['labelPaint'][y0:y1, x0:x1]))
    candidates = []
    for dy in range(-16, 17):
        for dx in range(-16, 17):
            counts, geometric = [], []
            for case, whole, data, paint in cases:
                x0, y0, x1, y1 = whole['pixelBounds']
                rect = {**whole['rect'], 'x': whole['rect']['x'] + dx, 'y': whole['rect']['y'] + dy}
                other = [r['rect'] for r in case['labels'] if r['labelId'] != 'clover' and r['region'] == 'whole']
                geometric.append(not any(overlaps(rect, r) for r in other))
                per_case = {}
                for cat in ('mochi', 'clover'):
                    contribution = data[cat + 'Contribution'][y0+dy:y1+dy, x0+dx:x1+dx]
                    assert contribution.shape == paint.shape
                    per_case[cat] = {str(t): int(np.count_nonzero((paint > t) & (contribution > t))) for t in (0, 1, 2, 4)}
                counts.append({'mode': case['mode'], 'frame': case['sourceFrame'], 'counts': per_case})
            candidates.append({'dx': dx, 'dy': dy, 'distanceSquared': dx*dx+dy*dy,
                               'otherLabelRectanglesClear': all(geometric), 'cases': counts,
                               'zeroContributionIntersections': all(not n for c in counts for cat in c['counts'].values() for n in cat.values())})
    valid = sorted((c for c in candidates if c['otherLabelRectanglesClear'] and c['zeroContributionIntersections']),
                   key=lambda c: (c['distanceSquared'], abs(c['dy']), c['dx'], c['dy']))
    utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
    out = ROOT / 'work/v5/CXV/batch-m/label-translation-r1'
    out.mkdir(parents=True, exist_ok=False)
    raw_path = out / 'all-candidates.json'
    raw_path.write_text(json.dumps({'utc': utc, 'candidates': candidates}, separators=(',', ':')) + '\n')
    result = {'utc': utc, 'sourceReceipt': {'path': str(source), 'sha256': sha(source)},
              'harness': {'path': str(Path(__file__)), 'sha256': sha(__file__)},
              'raw': {'path': str(raw_path), 'sha256': sha(raw_path)},
              'cases': 5, 'candidates': len(candidates), 'passingStaticCandidates': len(valid),
              'baseline': next(c for c in candidates if c['dx'] == c['dy'] == 0), 'nearest': valid[:6],
              'productionAcceptance': False,
              'limits': ['Fits five previously captured paused cases; no new image viewed.',
                         'Integer mask translation assumes identical label raster; changed background can alter paint differences.',
                         'Only two commissioned contribution planes and other label rectangles checked; HUD/native bodies/actions untested.',
                         'No actual CSS/native placement, all-frame coverage, source change or seam acceptance.']}
    (ROOT / 'reports/v5/CXV/M-label-translation-R1.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'candidates': len(candidates), 'passing': len(valid),
                      'nearest': [{k: c[k] for k in ('dx', 'dy', 'distanceSquared')} for c in valid[:6]],
                      'productionAcceptance': False}))


if __name__ == '__main__':
    main()
