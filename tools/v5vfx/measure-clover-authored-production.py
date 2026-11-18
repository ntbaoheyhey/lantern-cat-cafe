"""Measure native authored bindings, then prepare four fresh bounded review sheets."""
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
cv2.setNumThreads(1)

base = Path(sys.argv[1]).resolve()
assert base.is_relative_to(ROOT / 'work/v5/CXV')
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
ref = lambda p: dict(path=str(p), sha256=sha(p))
raw_path = base / 'report.json'
raw = json.loads(raw_path.read_text())
prereg_path = Path(raw['preregistration']['path'])
assert sha(prereg_path) == raw['preregistration']['sha256']
prereg = json.loads(prereg_path.read_text())
for item in prereg['inputs']:
    assert sha(item['path']) == item['sha256']
assert raw['pass'] and not raw['errors'] and not raw['blockedRequests']
assert raw['viewport'] == [1280, 720] and len(raw['captures']) == 16 and len(raw['actions']) == 4
assert raw['runtimeSourceSubstitutions'] == []
normal = [r for r in raw['rows'] if r['phase'] == 'idle' and not r['reduced']]
reduced = [r for r in raw['rows'] if r['phase'] == 'idle' and r['reduced']]
assert sorted(r['sourceFrame'] for r in normal) == list(range(300)) and len(reduced) == 5
for action in raw['actions']:
    assert action['plan']['contact'] == (1100 if action['skill'] == 4 else 350)
summary = {}
for key in ['head', 'offHand']:
    values = [r['authored'][key] for r in raw['rows']]
    summary[key] = dict(samples=len(values), maxContinuousError=max(v['continuousError'] for v in values), maxDecodedError=max(v['decodedError'] for v in values))
    assert summary[key]['maxContinuousError'] <= prereg['gate']['maxContinuousMeshAttachmentCSSPx']
    assert summary[key]['maxDecodedError'] <= prereg['gate']['maxDecodedMeshAttachmentCSSPx']
assert all(r['minTriangleRatio'] > 0 and r['media']['ready'] is True
           and not r['media'].get('failure') and not r['media']['disposed'] for r in raw['rows'])
assert all(r['decodedFrame'] == r['sourceFrame'] for r in normal)
assert all(r['decodedFrame'] == 0 and r['maxMeshDelta'] == 0 for r in reduced)
foot = lambda r: np.array([r['foot'][k] for k in ['x', 'y']])
max_idle_foot_delta = max(float(np.abs(foot(r)-foot(normal[0])).max()) for r in normal)
assert max_idle_foot_delta < 1e-5

review = base / 'authored-review'
review.mkdir(exist_ok=False)
panels = []
captures = []
for capture in raw['captures']:
    p = Path(capture['path'])
    assert sha(p) == capture['sha256']
    im = cv2.imread(str(p))
    assert im.shape == (720, 1280, 3) and im.std() > 10
    row = raw['rows'][capture['row']]
    b, host = row['body'], row['host']
    x0 = max(0, math.floor(b['x']+host['x'])-18)
    y0 = max(0, math.floor(b['y']+host['y'])-25)
    x1 = min(1280, math.ceil(b['x']+b['width']+host['x'])+18)
    y1 = min(720, math.ceil(b['y']+b['height']+host['y'])+18)
    assert x1 > x0 and y1 > y0
    crop = im[y0:y1, x0:x1]
    scale = min(1.7, 492/(x1-x0), 425/(y1-y0))
    zoom = cv2.resize(crop, (round(crop.shape[1]*scale), round(crop.shape[0]*scale)), interpolation=cv2.INTER_NEAREST)
    panel = np.full((500, 512, 3), 242, np.uint8)
    left, top = (512-zoom.shape[1])//2, 48
    panel[top:top+zoom.shape[0], left:left+zoom.shape[1]] = zoom
    cv2.putText(panel, capture['name'], (8, 18), cv2.FONT_HERSHEY_SIMPLEX, .45, (25,25,25), 1, cv2.LINE_AA)
    cv2.putText(panel, 'native crop; nearest resize; no new detail', (8, 37), cv2.FONT_HERSHEY_SIMPLEX, .36, (50,50,50), 1, cv2.LINE_AA)
    for key, color in [('head',(30,60,210)), ('offHand',(190,80,30))]:
        point = row['authored'][key]['actual']
        xy = (round((point['x']+host['x']-x0)*scale)+left, round((point['y']+host['y']-y0)*scale)+top)
        # An open ring avoids painting over the source landmark itself.
        cv2.circle(panel, xy, 7, color, 1, cv2.LINE_AA)
    cv2.putText(panel, 'red ring=head; blue ring=free paw (approximate)', (8, 486), cv2.FONT_HERSHEY_SIMPLEX, .36, (40,40,40), 1, cv2.LINE_AA)
    panels.append(panel)
    captures.append({**capture, 'cropXYXY':[x0,y0,x1,y1], 'reviewScale':scale, 'rgbMean':float(im.mean()), 'rgbStdDev':float(im.std())})
images=[]
for i in range(4):
    p = review / f'sheet-{i}.jpg'
    a,b,c,d = panels[i*4:i*4+4]
    sheet = np.vstack([np.hstack([a,b]), np.hstack([c,d])])
    assert sheet.shape == (1000,1024,3)
    assert cv2.imwrite(str(p),sheet,[cv2.IMWRITE_JPEG_QUALITY,95])
    images.append({**ref(p),'dimensions':[1024,1000],'bytes':p.stat().st_size,'captureNames':[c['name'] for c in captures[i*4:i*4+4]],'reviewed':False,'views':0})
result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), raw=ref(raw_path), harness=ref(__file__), preregistration=raw['preregistration'],
    url=raw['url'], viewport=raw['viewport'], sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'], runtimePatch=raw['runtimePatch'],
    captureUTC=raw['utc'], captureEndedUTC=raw['finishedUTC'], idleSamples=len(normal)+len(reduced), actionSamples=len(raw['rows'])-len(normal)-len(reduced),
    actions=[dict(reduced=a['reduced'],skill=a['skill'],contact=a['plan']['contact']) for a in raw['actions']], authored=summary,
    maxNormalIdleFootDeltaCSSPx=max_idle_foot_delta, maxEmissionError=raw['maxEmissionError'], emissionSamples=raw['emissionSamples'],
    captures=captures, reviewImages=images, numericPass=True, visualReviewed=False,
    limits=['Authored approximate source curves have8/6sourcepx manual bounds,not statistical confidence intervals or continuous anatomical truth.',
            'Native ring locations and numerical alignment do not validate the underlying alpha,tail seam or normal-laptop performance.',
            'Byte counts are report-only;no byte cap.','Nearest enlargement adds no native detail;actual viewport1280x720.'])
result['pass']=False
output=ROOT/'reports/v5/CXV/M-clover-authored-native-R1.json'
assert not output.exists()
output.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(report=str(output),numericPass=True,idleSamples=result['idleSamples'],actionSamples=result['actionSamples'],authored=summary,reviewImages=images)))
