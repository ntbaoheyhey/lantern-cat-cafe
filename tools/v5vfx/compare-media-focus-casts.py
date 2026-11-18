"""Compare full production cast receipts before/after the focus shader fix."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np

before_path, after_path = map(lambda p: Path(p).resolve(), sys.argv[1:3])
out = after_path.parent / 'focus-comparison.json'
assert not out.exists(), 'Retain prior evidence'
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
before, after = (json.loads(p.read_text()) for p in (before_path, after_path))
assert before['pass'] and after['pass']
assert before['cat'] == after['cat']
assert before['url'] == after['url']
assert before['viewport'] == after['viewport'] == [1280, 720]
assert len(before['rows']) == len(after['rows'])
fields = ['cat', 'reduced', 'skill', 'ms', 'sampled', 'maxMeshDelta', 'minTriangleRatio',
          'worldFoot', 'screenFoot', 'root', 'body']
mismatches = []
for i, (old, new) in enumerate(zip(before['rows'], after['rows'])):
    for field in fields:
        if old[field] != new[field]:
            mismatches.append(dict(row=i, field=field, before=old[field], after=new[field]))
rules_exact = all(a['log'] == b['log'] and a['actors'] == b['actors'] and a['plan'] == b['plan']
                  for a, b in zip(before['actions'], after['actions']))
images = []
for reduced in (False, True):
    old = min((s for s in before['captures'] if s['skill'] == 4 and s['reduced'] == reduced), key=lambda s: abs(s['ms'] - 533.3333333))
    new = min((s for s in after['captures'] if s['skill'] == 4 and s['reduced'] == reduced), key=lambda s: abs(s['ms'] - old['ms']))
    assert new['ms'] == old['ms'] and abs(new['ms'] - 533.3333333) < .01
    assert sha(old['path']) == old['sha256'] and sha(new['path']) == new['sha256']
    a, b = [cv2.imread(s['path']) for s in (old, new)]
    assert a.shape == b.shape == (720, 1280, 3)
    body = after['rows'][new['row']]['body']
    x0 = max(0, int(np.floor(body['x'] - 12)))
    y0 = max(0, int(np.floor(body['y'] - 12)))
    x1 = min(1280, int(np.ceil(body['x'] + body['width'] + 12)))
    y1 = min(720, int(np.ceil(body['y'] + body['height'] + 12)))
    mask = np.zeros((720, 1280), bool)
    mask[y0:y1, x0:x1] = True
    difference = np.abs(a.astype(np.int16) - b.astype(np.int16)).max(axis=2)
    # Descriptive color count only; it cannot establish an alpha silhouette.
    def warm_count(frame):
        blue, green, red = [frame[:, :, c].astype(np.int16) for c in range(3)]
        return int(((red > 180) & (green > 140) & (red - blue > 65) & (green - blue > 35) & mask).sum())
    images.append(dict(reduced=reduced, ms=new['ms'], crop=[x0, y0, x1-x0, y1-y0],
                       before=dict(path=old['path'], sha256=old['sha256']),
                       after=dict(path=new['path'], sha256=new['sha256']),
                       changedPixelsInside=int(((difference > 2) & mask).sum()),
                       changedPixelsOutside=int(((difference > 2) & ~mask).sum()),
                       meanDifferenceInside=float(difference[mask].mean()),
                       warmPixelsBefore=warm_count(a), warmPixelsAfter=warm_count(b)))
report = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
              before=dict(path=str(before_path), sha256=sha(before_path), source=before['sourceCommit'], index=before['indexSha256']),
              after=dict(path=str(after_path), sha256=sha(after_path), source=after['sourceCommit'], index=after['indexSha256']),
              runnerSha256=sha(__file__), url=after['url'], viewport=after['viewport'],
              rowCount=len(after['rows']), comparedFields=fields, numericMismatches=mismatches,
              rulesExact=rules_exact, numericParityPass=not mismatches and rules_exact,
              anticipation=images, visualReviewed=False,
              limits='Numeric motion/rules parity and descriptive pixel difference; fresh visual review still required. Static bounds and warm-color counts do not establish decoded alpha or realtime performance.')
out.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(dict(out=str(out), parity=report['numericParityPass'], rows=report['rowCount'], images=images)))
assert report['numericParityPass'], 'Focus correction must retain cast motion and rules'
