"""Measure bounded native Clover art evidence before creating single-view sheets."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np

cv2.setNumThreads(1)
base, output = (Path(x).resolve() for x in sys.argv[1:3])
assert base.is_relative_to(ROOT / 'work/v5/CXV')
assert output.is_relative_to(ROOT / 'reports/v5/CXV') and not output.exists()
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
raw_path = base / 'report.json'
raw = json.loads(raw_path.read_text())
assert raw['pass'] and len(raw['rows']) == len(raw['captures']) == 65
assert raw['viewport'] == [1280, 720] and not raw['errors'] and not raw['blockedRequests']
rows = {r['frame']: r for r in raw['rows']}
images = {}
for c in raw['captures']:
    assert sha(c['path']) == c['sha256']
    image = cv2.imread(c['path'])
    assert image.shape == (720, 1280, 3)
    images[c['frame']] = image
    assert abs(rows[c['frame']]['decoded']['mediaTime'] - c['frame'] % 300 / 30) <= 1e-5

first = rows[0]
quad = np.array([[p['x'] + first['host']['x'], p['y'] + first['host']['y']] for p in first['quad']])
manifest = first['manifest']
assert abs(quad[1, 1]-quad[0, 1]) < 1e-5 and abs(quad[2, 0]-quad[0, 0]) < 1e-5
for r in rows.values():
    current = np.array([[p['x']+r['host']['x'], p['y']+r['host']['y']] for p in r['quad']])
    assert np.max(np.abs(current-quad)) < 1e-5

def rectangle(logical, padding=0):
    x, y, w, h = logical
    points = np.array([quad[0] + (quad[1]-quad[0])*u/manifest['width'] + (quad[2]-quad[0])*v/manifest['height']
                       for u, v in [(x, y), (x+w, y+h)]])
    left, top = np.floor(points.min(axis=0)).astype(int)-padding
    right, bottom = np.ceil(points.max(axis=0)).astype(int)+padding
    assert 0 <= left < right <= 1280 and 0 <= top < bottom <= 720
    return [int(left), int(top), int(right-left), int(bottom-top)]

body = rectangle([0, 0, manifest['width'], manifest['height']], 4)
regions = {'fullMediaQuad': rectangle([0, 0, manifest['width'], manifest['height']]),
           'lowerLeftStudyRegion': rectangle([0, 150, 85, 110]),
           'sceneControl': [1210, 50, 60, 140]}

def crop(image, rect):
    x, y, w, h = rect
    return image[y:y+h, x:x+w]

pair_rows = []
for before in range(270, 330):
    pair_rows.append(dict(before=before, after=before+1, seam=before==299,
                         rgbMAE={name: float(np.abs(crop(images[before], rect).astype(float)-crop(images[before+1], rect)).mean())
                                 for name, rect in regions.items()}))
metrics = {}
for name in regions:
    values = np.array([p['rgbMAE'][name] for p in pair_rows if not p['seam']])
    seam = next(p['rgbMAE'][name] for p in pair_rows if p['seam'])
    median, p95 = float(np.median(values)), float(np.quantile(values, .95))
    metrics[name] = dict(seamRGBMAE=seam, ordinaryMedianRGBMAE=median, ordinaryP95RGBMAE=p95,
                         ordinaryMaxRGBMAE=float(values.max()), seamToMedian=seam/median if median else None,
                         seamToP95=seam/p95 if p95 else None)
(base/'adjacent-frame-metrics.json').write_text(json.dumps(dict(regions=regions, rows=pair_rows), indent=2)+'\n')

source_path = Path('/Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m/clover-four-plane-q21-r1/source.rgba')
source_hash = '21fd9e6e159cbb1390c96dfc1b3dab4dffaa96d1ecb16ed7a97b0cbfcdecb7ac'
assert sha(source_path) == source_hash
rgba = np.memmap(source_path, dtype=np.uint8, mode='r', shape=(300, 260, 212, 4))
source_rows = [{'before': f, 'rgbaMAE': float(np.abs(rgba[f%300].astype(float)-rgba[(f+1)%300]).mean())} for f in range(270, 330)]
source_seam = next(x['rgbaMAE'] for x in source_rows if x['before']==299)
source_regular = np.array([x['rgbaMAE'] for x in source_rows if x['before']!=299])

review = base/'review'
review.mkdir()
sheets = []
for name, selected in [('quarters', [75, 150, 225]), ('seam', [295, 299, 300, 304])]:
    sheet = np.full((1000, 800, 3), 240, np.uint8)
    for k, f in enumerate(selected):
        part = crop(images[f], body)
        zoom = cv2.resize(part, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST)
        assert zoom.shape[0] <= 476 and zoom.shape[1] <= 396
        x, y = (k%2)*400+2, (k//2)*500+22
        sheet[y:y+zoom.shape[0], x:x+zoom.shape[1]] = zoom
        cv2.putText(sheet, f'F{f%300} | native pixels 2x nearest', (x, y-7), cv2.FONT_HERSHEY_SIMPLEX, .43, (25,25,25), 1, cv2.LINE_AA)
    path = review/(name+'.jpg')
    cv2.imwrite(str(path), sheet, [cv2.IMWRITE_JPEG_QUALITY, 95])
    sheets.append(dict(path=str(path), sha256=sha(path), dimensions=[800,1000], frames=selected,
                       nativeCrop=body, inspectionScale=2, interpolation='nearest', views=0, bytes=path.stat().st_size))

receipt = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'],
               url=raw['url'], viewport=raw['viewport'], capturedUTC=[raw['utc'], raw['finishedUTC']], raw=dict(path=str(raw_path), sha256=sha(raw_path)),
               runtimePatchSha256=raw['runtimePatchSha256'], runtimeSourceSubstitutions=[], nativeFrames=65, nativeCallbacksExact=True,
               maxFootDelta=raw['maxFootDelta'], nativeBodyHeight=first['body']['height'], sourceFilm=dict(path=raw['loopFilm'], sha256=sha(raw['loopFilm'])),
               seamMetrics=metrics, pairMetrics=dict(path=str(base/'adjacent-frame-metrics.json'), sha256=sha(base/'adjacent-frame-metrics.json')),
               keyedMatteSource=dict(path=str(source_path), sha256=source_hash, seamRGBAMAE=source_seam, ordinaryMedianRGBAMAE=float(np.median(source_regular)),
                                    ordinaryP95RGBAMAE=float(np.quantile(source_regular,.95))), reviewImages=sheets, visualReviewed=False,
               limits=['Native RGB regions contain actual scene background;lower-left rectangle is not an independently labelled tail mask.',
                       'Keyed RGBA source is the already rejected/unaccepted original matte,not true commissioned alpha ground truth.',
                       'Two-times nearest inspection adds no native detail;original viewport remains1280x720.',
                       '65deterministic frames and2second loop window do not prove realtime FPS,entire-cycle matte,or release acceptance.'],
               preservedAttempt='clover-art-r1-113910:zero captures;harness logicalSize property corrected to manifest width/height;application unchanged')
output.write_text(json.dumps(receipt, indent=2)+'\n')
print(json.dumps(dict(output=str(output), frames=65, seamMetrics=metrics, keyedSource=receipt['keyedMatteSource'], reviewImages=sheets)))
