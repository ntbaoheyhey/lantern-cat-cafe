"""Independently reconstruct retained initial/restored paint counts without viewing images."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math
import sys

sys.path.insert(0, '/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/python')
import numpy as np
import cv2

cv2.setNumThreads(1)

claim_path, output_path = map(Path, sys.argv[1:])
sha = lambda path: hashlib.sha256(Path(path).read_bytes()).hexdigest()
claim = json.loads(claim_path.read_text())
for ref in (claim['raw'], claim['analysis']):
    assert sha(ref['path']) == ref['sha256'], ref['path']
analysis = json.loads(Path(claim['analysis']['path']).read_text())
for name in ('raw', 'preregistration', 'harness'):
    assert sha(analysis[name]['path']) == analysis[name]['sha256'], name
raw = json.loads(Path(claim['raw']['path']).read_text())
pre = json.loads(Path(analysis['preregistration']['path']).read_text())
assert pre['thresholds'] == [0, 1, 2, 4]
assert raw['viewport'] == [1280, 720]
for name in ('sourceCommit', 'indexSha256', 'url'):
    assert claim[name] == analysis[name] == raw[name], name
y, x = np.indices((720, 1280))

def region(rect, margin=0):
    return ((x >= math.floor(rect['x']) - margin) &
            (x < math.ceil(rect['x'] + rect['width']) + margin) &
            (y >= math.floor(rect['y']) - margin) &
            (y < math.ceil(rect['y'] + rect['height']) + margin))

expected = {row['key']: row for row in analysis['results']}
assert len(expected) == len(raw['cases']) == 34
images_verified = 0
integers_verified = 0
totals = {t: dict.fromkeys(('changed', 'labelBoxes', 'hudBoxes', 'outsideBoth',
                           'conditionedLabelSupport'), 0) for t in pre['thresholds']}
changed_cases = 0
case_results = []
for case in raw['cases']:
    captures = [('pre-' + item['variant'], item) for item in case['precondition']]
    captures += [(item['variant'], item) for item in case['captures']
                 if item['variant'] in ('baseline', 'labels-hidden')]
    images = {}
    for name, ref in captures:
        assert sha(ref['path']) == ref['sha256'], ref['path']
        image = cv2.imread(ref['path'], cv2.IMREAD_COLOR)
        assert image is not None and image.shape == (720, 1280, 3)
        images[name] = image.astype(np.int16)
        images_verified += 1
    difference = np.max(np.abs(images['pre-initial'] - images['pre-restored']), axis=2)
    painted = np.any(images['baseline'] != images['labels-hidden'], axis=2)
    labels = {item['id']: region(item['rect'], 10) for item in case['before']['labels']}
    label_union = np.any(np.stack(list(labels.values())), axis=0)
    hud_union = np.any(np.stack([region(item['rect']) for item in case['before']['hud']]), axis=0)
    rows = []
    for threshold in pre['thresholds']:
        changed = difference > threshold
        row = dict(threshold=threshold, changed=int(np.count_nonzero(changed)),
                   labelBoxes=int(np.count_nonzero(changed & label_union)),
                   hudBoxes=int(np.count_nonzero(changed & hud_union)),
                   outsideBoth=int(np.count_nonzero(changed & ~(label_union | hud_union))),
                   conditionedLabelSupport=int(np.count_nonzero(changed & painted)),
                   labels={key: int(np.count_nonzero(changed & mask)) for key, mask in labels.items()})
        rows.append(row)
        integers_verified += 5 + len(labels)
        for name in totals[threshold]:
            totals[threshold][name] += row[name]
    result = dict(key=case['key'], maxDelta=int(difference.max()), counts=rows)
    assert result == expected[case['key']], case['key']
    integers_verified += 1
    changed_cases += rows[0]['changed'] > 0
    case_results.append(dict(key=case['key'], maxDelta=result['maxDelta'], changed=rows[0]['changed']))
assert images_verified == claim['hashes'] == analysis['hashes'] == 170
assert changed_cases == claim['changedCases'] == 32
assert totals[0] == claim['threshold0']
receipt = dict(utc=datetime.now(timezone.utc).isoformat(),
               claim=dict(path=str(claim_path), sha256=sha(claim_path)),
               analysis=claim['analysis'], raw=claim['raw'],
               auditor=dict(path=__file__, sha256=sha(__file__)),
               sourceCommit=claim['sourceCommit'], indexSha256=claim['indexSha256'], url=claim['url'],
               cases=len(case_results), imagesVerified=images_verified, integersVerified=integers_verified,
               changedCases=changed_cases, totals=totals, perCase=case_results,
               numericalAudit='PASS', productionAcceptance=False, imagesViewed=0,
               limits=claim['limits'])
with output_path.open('x') as output:
    json.dump(receipt, output, indent=2)
    output.write('\n')
print(json.dumps({key: receipt[key] for key in ('cases', 'imagesVerified', 'integersVerified',
                                               'changedCases', 'totals', 'numericalAudit')}))
