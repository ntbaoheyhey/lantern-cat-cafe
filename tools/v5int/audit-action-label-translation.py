"""Independently test the chosen static translation; do not refit held-out cases."""
from pathlib import Path
import datetime, hashlib, json, math, sys
import cv2
import numpy as np

delivery, output = map(Path, sys.argv[1:])
assert not output.exists()
root = Path(__file__).resolve().parents[2]
hashes = {}
def verify(ref):
    p = Path(ref['path'])
    digest = hashlib.sha256(p.read_bytes()).hexdigest()
    assert digest == ref['sha256'], str(p)
    hashes[str(p)] = digest
    return p
def load(ref):
    return json.loads(verify(ref).read_text())
def reference(p):
    return {'path': str(p.resolve()), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
def overlap(a, b):
    return a['x'] < b['x']+b['width'] and a['x']+a['width'] > b['x'] and a['y'] < b['y']+b['height'] and a['y']+a['height'] > b['y']

d = json.loads(delivery.read_text()); prereg = load(d['preregistration'])
grid = np.load(verify(d['grid']))
assert grid['accept'].shape == (129,129)
assert int(grid['accept'].sum()) == d['passingTrainingCandidates']
ranked = sorted([(int(grid['dx'][y,x]), int(grid['dy'][y,x])) for y,x in np.argwhere(grid['accept'])], key=lambda p:(p[0]**2+p[1]**2,abs(p[1]),p[0],p[1]))
assert list(ranked[0]) == d['chosen'] and [list(x) for x in ranked[:12]] == d['nearest']
dx, dy = d['chosen']; assert [dx,dy] == [0,-53]
results = []
for suite, field, previous, count in [('training','train','v8-label-action-full-r2-paint-review.json',14), ('reservedProgression','holdout','v8-label-action-recovery-r3-paint-review.json',16)]:
    analysis = load(d[field]); raw = load(analysis['raw'])
    assert raw['sourceCommit'] == d['sourceCommit']
    prior_path = root/'reports/v5/CXI/evidence'/previous
    prior = json.loads(prior_path.read_text())
    accepted = {c['key'] for c in prior['cases'] if c['attributionValid']}
    assert len(accepted) == count
    assert {c['key'] for c in analysis['cases'] if c['valid']} == accepted
    for c in analysis['cases']:
        if c['key'] not in accepted: continue
        s = next(x['before'] for x in raw['cases'] if x['key'] == c['key'])
        b = next(x['rect'] for x in s['labels'] if x['id'] == 'mochi')
        moved = dict(b, x=b['x']+dx, y=b['y']+dy)
        blockers = [(f"label:{x['id']}",x['rect']) for x in s['labels'] if x['id']!='mochi']
        blockers += [(f'hud:{i}',x['rect']) for i,x in enumerate(s['hud'])]
        blockers += [(f"face:{a['id']}",dict(a['face'],x=a['face']['x']+s['host']['x'],y=a['face']['y']+s['host']['y'])) for a in s['anchors'] if a['visible'] and a.get('face')]
        hits = [name for name,rect in blockers if overlap(moved,rect)]
        viewport_clear = moved['x']>=4 and moved['y']>=4 and moved['x']+moved['width']<=1276 and moved['y']+moved['height']<=716
        pixels = np.load(verify(c['pixelDifferences']))
        x0,y0 = math.floor(b['x']),math.floor(b['y']); x1,y1 = math.ceil(b['x']+b['width']),math.ceil(b['y']+b['height'])
        intersections = {}
        for threshold in (0,1,2,4):
            body = np.logical_or.reduce([pixels[cat+'Contribution']>threshold for cat in ('mochi','clover','panko','mallow')]).astype(np.uint8)
            dilated = cv2.dilate(body,np.ones((5,5),np.uint8))
            shifted_body = np.pad(dilated,64)[y0+dy+64:y1+dy+64,x0+dx+64:x1+dx+64]
            paint = pixels['labelPaint'][y0:y1,x0:x1]>threshold
            assert shifted_body.shape == paint.shape
            intersections[str(threshold)] = int(np.count_nonzero(shifted_body & paint))
        claim = next(x for x in d['evaluations'] if x['suite']==suite and x['key']==c['key'])
        clear = viewport_clear and not hits
        assert claim['geometryClear'] == clear and claim['intersections'] == intersections
        results.append(dict(suite=suite,key=c['key'],geometryClear=clear,blockers=hits,viewportClear=viewport_clear,intersections=intersections))
assert len(results)==30
failures=[r for r in results if r['suite']=='reservedProgression' and (not r['geometryClear'] or r['intersections']['0'])]
assert bool(failures) == (not d['reservedPass'])
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),delivery=reference(delivery),tool=reference(Path(__file__)),sourceCommit=d['sourceCommit'],verifiedHashes=len(hashes),chosen=d['chosen'],gridRankingChecked=True,exhaustiveGridRecomputed=False,chosenCases=30,independentPaintCounts=120,results=results,reservedFailures=failures,productionAcceptance=False,imagesViewed=0,decision='REJECT chosen static translation; reserved geometry collisions reproduced.',limits=['Only the chosen translation is independently recomputed; stored grid count/ranking are checked, not every search candidate.','Reuses hash-pinned previously audited body/label masks; no image reopened or native candidate rendered.','Integer mask translation does not prove CSS repaint, background antialiasing or association quality.'])
with output.open('x') as f: json.dump(result,f,indent=2);f.write('\n')
print(json.dumps({k:result[k] for k in ('verifiedHashes','chosenCases','independentPaintCounts','reservedFailures')}))
