"""Locate retained precondition differences without changing validity rules."""
from pathlib import Path
import datetime, hashlib, json, math, sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np

cv2.setNumThreads(2)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
prepath = ROOT / 'reports/v5/CXV/M-label-conditioning-R1-preregistration.json'
pre = json.loads(prepath.read_text())
assert sha(pre['raw']['path']) == pre['raw']['sha256']
raw = json.loads(Path(pre['raw']['path']).read_text())
out = ROOT / 'work/v5/CXV/batch-m/label-conditioning-r1'
out.mkdir(exist_ok=False)

def mask(rect, padding=0):
    x0 = max(0, math.floor(rect['x']) - padding)
    y0 = max(0, math.floor(rect['y']) - padding)
    x1 = min(1280, math.ceil(rect['x'] + rect['width']) + padding)
    y1 = min(720, math.ceil(rect['y'] + rect['height']) + padding)
    result = np.zeros((720, 1280), bool)
    result[y0:y1, x0:x1] = True
    return result

delta = lambda a, b: np.abs(a.astype(np.int16) - b.astype(np.int16)).max(axis=2)
results = []
hashes = 0
for case in raw['cases']:
    images = {}
    selected = [(f"pre-{v['variant']}", v) for v in case['precondition']]
    selected += [(v['variant'], v) for v in case['captures'] if v['variant'] in ('baseline', 'labels-hidden')]
    for name, capture in selected:
        assert sha(capture['path']) == capture['sha256']
        hashes += 1
        images[name] = cv2.imread(capture['path'])
        assert images[name].shape == (720, 1280, 3)
    difference = delta(images['pre-initial'], images['pre-restored'])
    paint = delta(images['baseline'], images['labels-hidden'])
    labels = {v['id']: mask(v['rect'], 10) for v in case['before']['labels']}
    label_union = np.logical_or.reduce(list(labels.values()))
    hud = np.logical_or.reduce([mask(v['rect']) for v in case['before']['hud']])
    rows = []
    for threshold in pre['thresholds']:
        changed = difference > threshold
        rows.append(dict(threshold=threshold, changed=int(changed.sum()),
                         labelBoxes=int((changed & label_union).sum()),
                         hudBoxes=int((changed & hud).sum()),
                         outsideBoth=int((changed & ~(label_union | hud)).sum()),
                         conditionedLabelSupport=int((changed & (paint > 0)).sum()),
                         labels={cat: int((changed & m).sum()) for cat, m in labels.items()}))
    results.append(dict(key=case['key'], maxDelta=int(difference.max()), counts=rows))

result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
              raw=pre['raw'], preregistration=dict(path=str(prepath), sha256=sha(prepath)),
              harness=dict(path=__file__, sha256=sha(__file__)),
              url=raw['url'], sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'],
              hashes=hashes, results=results, limits=pre['limits'], imagesViewed=0)
(out / 'report.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(dict(cases=len(results), hashes=hashes,
                     changedCases=sum(r['counts'][0]['changed'] > 0 for r in results),
                     outsideBothCases=[r['key'] for r in results if r['counts'][0]['outsideBoth']],
                     totals={k: sum(r['counts'][0][k] for r in results) for k in
                             ('changed', 'labelBoxes', 'hudBoxes', 'outsideBoth', 'conditionedLabelSupport')})))
