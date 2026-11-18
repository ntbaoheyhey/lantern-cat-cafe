"""Measure six timed native PNGs before one bounded review sheet is viewed."""
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
base = Path(sys.argv[1]).resolve()
assert base.is_relative_to(ROOT / 'work/v5/CXV')
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
raw_path = base / 'report.json'
raw = json.loads(raw_path.read_text())
assert raw['pass'] and len(raw['rows']) == 40 and len(raw['cases']) == 5 and len(raw['captures']) == 6
assert not raw['errors'] and not raw['blockedRequests'] and raw['runtimeSourceSubstitutions'] == []
assert raw['viewport'] == [1280, 720]
assert all(c['rulesReplayPass'] and (c['live'] or c['unchanged'] and c['beforeHash'] == c['afterHash']) for c in raw['cases'])
cases = []
for case in raw['cases']:
    rows = [r for r in raw['rows'] if r['mode'] == case['name']]
    assert len(rows) == 8 and [r['target'] for r in rows] == [0, 60, 180, 250, 500, 850, 1050, 1200]
    present = [r for r in rows if r['intro']]
    absent = [r for r in rows if not r['intro']]
    cases.append(dict(**case, introSamples=len(present),
        sampledTexts=sorted(set(r['intro']['text'] for r in present)),
        maxBodyOverlapArea=max(r['bodyOverlapArea'] for r in rows),
        maxFaceOverlapArea=max(r['faceOverlapArea'] for r in rows),
        spoutInsideRows=sum(r['spoutInside'] for r in rows),
        lastObservedPresentMs=max((r['wallMs'] for r in present), default=None),
        firstObservedAbsentMs=min((r['wallMs'] for r in absent if r['wallMs'] > max((v['wallMs'] for v in present), default=-1)), default=None),
        terminalIntroAbsent=rows[-1]['intro'] is None,
        sampledAnimationNames=sorted(set(r['intro']['animationName'] for r in present))))
panels = []
images = []
for cap in raw['captures']:
    p = Path(cap['path'])
    assert sha(p) == cap['sha256']
    im = cv2.imread(str(p))
    assert im.shape == (720, 1280, 3) and im.std() > 10
    row = raw['rows'][cap['row']]
    assert row['mode'] == cap['mode'] and row['target'] == cap['target']
    crop = im[100:470, 300:1000]
    reduced = cv2.resize(crop, (512, 271), interpolation=cv2.INTER_AREA)
    panel = np.full((320, 512, 3), 242, np.uint8)
    panel[42:313] = reduced
    cv2.putText(panel, cap['mode']+' '+str(cap['target'])+'ms', (8, 17), cv2.FONT_HERSHEY_SIMPLEX, .48, (20,20,20), 1, cv2.LINE_AA)
    cv2.putText(panel, 'actual wall '+str(round(row['wallMs'], 1))+'ms; crop300,100..1000,470', (8, 34), cv2.FONT_HERSHEY_SIMPLEX, .36, (40,40,40), 1, cv2.LINE_AA)
    panels.append(panel)
    images.append(dict(**cap, mean=float(im.mean()), stddev=float(im.std()), dimensions=[1280,720], crop=[300,100,1000,470]))
sheet = np.vstack([np.hstack(panels[n:n+2]) for n in [0,2,4]])
assert sheet.shape == (960, 1024, 3)
sheet_path = base / 'intro-review.jpg'
assert not sheet_path.exists()
assert cv2.imwrite(str(sheet_path), sheet, [cv2.IMWRITE_JPEG_QUALITY, 95])
result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    raw=dict(path=str(raw_path),sha256=sha(raw_path)),measurement=dict(path=__file__,sha256=sha(__file__)),
    url=raw['url'],viewport=raw['viewport'],sourceCommit=raw['sourceCommit'],indexSha256=raw['indexSha256'],
    sourceFiles=raw['sourceFiles'],runtimePatch=raw['runtimePatch'],captureStartUTC=raw['utc'],captureEndUTC=raw['finishedUTC'],
    cases=cases,captures=images,review=dict(path=str(sheet_path),sha256=sha(sheet_path),dimensions=[1024,960],views=0,reviewed=False),
    numericPass=True,visualReviewed=False,
    limits='Intro lifetime is bracketed by sampled actual wall times,not assumed to equal900ms. Rect overlap is conservative,not opaque-pixel area. Ordinary cases are unpaused1x opening with automatic legal actions and independent rules replay;not full battle/performance. R1 no-action assumption failure remains preserved. No runtime changes.')
target = ROOT / 'reports/v5/CXV/M-clover-intro-native-R2.json'
assert not target.exists()
target.write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(dict(report=str(target),cases=cases,review=result['review'])))
