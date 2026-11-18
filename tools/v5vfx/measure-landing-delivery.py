"""Measure fresh landing response comparisons and preserve prior image-review hashes."""
from pathlib import Path
import datetime, hashlib, json, math, sys
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(2)
base, output, prior_path = [Path(p).resolve() for p in sys.argv[1:4]]
assert base.is_relative_to(ROOT / 'work/v5/CXV')
assert output.is_relative_to(ROOT / 'reports/v5/CXV') and not output.exists()
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
raw_path = base / 'capture.json'
raw, prior = [json.loads(p.read_text()) for p in (raw_path, prior_path)]
assert raw['viewport'] == [1280, 720]
assert raw['url'] == 'http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3'
assert len(raw['conditions']) == 3
known = {r['sha256']: r['path'] for r in prior['reviewImages'] if r.get('reviewed')}
images, reviews = {}, []
for item in raw['conditions']:
    assert not item['errors'] and item['state']['url'] == raw['url']
    assert item['sha256'] == sha(item['path'])
    assert item['previewSha256'] == sha(item['preview'])
    a = cv2.imread(item['path']); preview = cv2.imread(item['preview'])
    assert a.shape == (720, 1280, 3) and preview.shape == (576, 1024, 3)
    assert float(a.std()) > 10
    images[item['mode']] = a
    reused = known.get(item['previewSha256'])
    reviews.append(dict(path=item['preview'], sha256=item['previewSha256'], dimensions=[1024,576], mode=item['mode'], reviewed=bool(reused), views=0, priorReviewedHashReuse=reused))
assert set(images) == {'served','original','candidate'}
metrics = {}
x,y,w,h = roi = [640,100,640,500]
original = images['original'][y:y+h,x:x+w].astype(float)
for mode in ('served','candidate'):
    diff = images[mode][y:y+h,x:x+w].astype(float)-original
    rmse = float(np.sqrt(np.mean(diff**2)))
    metrics[mode] = dict(artROI=roi,maeVsOriginal=float(np.abs(diff).mean()),rmseVsOriginal=rmse,psnrVsOriginal=20*math.log10(255/rmse) if rmse else None,p95AbsoluteChannelError=float(np.percentile(np.abs(diff),95)))
x,y,w,h = detail_roi = [800,170,460,510]
canvas = np.full((540,920,3),240,np.uint8)
for n,mode in enumerate(('original','candidate')):
    canvas[30:,n*w:(n+1)*w] = images[mode][y:y+h,x:x+w]
    cv2.putText(canvas,mode,(n*w+12,22),cv2.FONT_HERSHEY_SIMPLEX,.55,(20,20,20),1,cv2.LINE_AA)
detail = base/'desktop-detail.jpg'
assert not detail.exists()
assert cv2.imwrite(str(detail),canvas,[cv2.IMWRITE_JPEG_QUALITY,95])
reviews.append(dict(path=str(detail),sha256=sha(detail),dimensions=[920,540],mode='fresh-native-detail-pair',sourceROI=detail_roi,reviewed=False,views=0))
for mode in ('original','candidate'):
    entry = raw[mode]
    assert sha(entry['path']) == entry['sha256']
    assert Path(entry['path']).stat().st_size == entry['bytes']
result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),rawCapturePath=str(raw_path),rawCaptureSha256=sha(raw_path),capture=raw,measurementHarnessSha256=sha(__file__),priorReview=dict(path=str(prior_path),sha256=sha(prior_path)),reviewImages=reviews,pixelMetrics=metrics,reviewed=False,assessmentPending=True,savingVsServedBytes=raw['served']['bytes']-raw['candidate']['bytes'],limits='Fresh judge capture with image-response-only substitutions in separate contexts. Reuse only exact previously reviewed preview hashes. No deployment, production enrollment, or whole-battle byte-budget acceptance.')
output.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(output=str(output),saving=result['savingVsServedBytes'],pixelMetrics=metrics,toView=[r for r in reviews if not r['reviewed']])))
