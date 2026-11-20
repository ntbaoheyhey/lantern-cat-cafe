"""Pair fresh native captures with the unchanged commissioned clip at equal height/1x."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, subprocess, sys
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, '/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/python')
import cv2
import numpy as np
cv2.setNumThreads(1)
base = Path(sys.argv[1]).resolve()
assert base.is_relative_to(ROOT / 'work/v5/CXI')
raw_path = base / 'report.json'
raw = json.loads(raw_path.read_text())
assert raw['pass'] and len(raw['rows']) == len(raw['captures']) == 300
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
source = Path('/Users/bao/Downloads/Scene1.mp4')
assert sha(source) == '1912e17112ca1bc3c6ad3a44da52c8f7813ebfc74137299c477bead781170524'
measure = json.loads((ROOT / 'work/v5/CXI/batch-m/experiments/mochi-384/measurements.json').read_text())
w, h = measure['studyCanvas']
source_bytes = subprocess.check_output(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(source), '-vf', f'scale={w}:{h}:flags=lanczos', '-pix_fmt', 'bgr24', '-f', 'rawvideo', '-'])
frames = np.frombuffer(source_bytes, np.uint8).reshape(300, h, w, 3)
x0, y0, x1, y1 = measure['sourceBoundsAtStudy']
body = raw['rows'][0]['body']
target = round(body['height'])
crop = [max(0, int(body['x'])-20), max(0, int(body['y'])-40), int(np.ceil(body['x']+body['width']))+20, int(np.ceil(body['y']+body['height']))+18]
video = base / 'mochi-source-vs-profile-1x.mp4'
assert not video.exists()
proc = subprocess.Popen(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '1280x720', '-r', '30', '-i', '-', '-an', '-c:v', 'libx264', '-threads', '2', '-crf', '18', '-pix_fmt', 'yuv420p', '-y', str(video)], stdin=subprocess.PIPE)
views, tiles, comparisons = [], [], []
for i, (row, cap) in enumerate(zip(raw['rows'], raw['captures'])):
    assert row['frame'] == cap['frame'] == i and abs(row['decoded']['mediaTime']-i/30) < 1e-5
    assert sha(cap['path']) == cap['sha256']
    shot = cv2.imread(cap['path']); assert shot.shape == (720, 1280, 3)
    canvas = np.full((720, 1280, 3), 24, np.uint8)
    ref = cv2.resize(frames[i, y0:y1, x0:x1], (round((x1-x0)*target/(y1-y0)), target), interpolation=cv2.INTER_AREA)
    xx = (640-ref.shape[1])//2; canvas[500-target:500, xx:xx+ref.shape[1]] = ref
    a,b,c,d = crop; native = shot[b:d, a:c]
    xx = 640+(640-native.shape[1])//2; yy = round(500-(body['y']+body['height']-b)); canvas[yy:yy+native.shape[0], xx:xx+native.shape[1]] = native
    for px,title in [(42,'Mochi commissioned source'), (680,'Mochi-only scene capture')]:
        cv2.putText(canvas,title,(px,105),cv2.FONT_HERSHEY_SIMPLEX,.72,(235,235,235),1,cv2.LINE_AA)
        cv2.putText(canvas,f'1x / {target}px body height / frame {i:03d}',(px,140),cv2.FONT_HERSHEY_SIMPLEX,.57,(205,205,205),1,cv2.LINE_AA)
    cv2.putText(canvas,'Left: original black composite. Right: actual scene pixels. Source alpha is unknown.',(38,625),cv2.FONT_HERSHEY_SIMPLEX,.57,(205,205,205),1,cv2.LINE_AA)
    cv2.putText(canvas,'300 deterministic decoded frames at 30Hz; this film does not measure laptop FPS.',(38,653),cv2.FONT_HERSHEY_SIMPLEX,.57,(205,205,205),1,cv2.LINE_AA)
    proc.stdin.write(canvas.tobytes())
    if i in [90,299]:
        p=base/f'comparison-{i}.png';cv2.imwrite(str(p),cv2.resize(canvas,(1024,576),interpolation=cv2.INTER_AREA));views.append(p)
    if i in [0,90,180,299]:tiles.append(cv2.resize(canvas,(512,288),interpolation=cv2.INTER_AREA))
    comparisons.append(dict(frame=i,nativeBodyHeight=row['body']['height'],sourceDisplayedHeight=target,decodedTime=row['decoded']['mediaTime']))
proc.stdin.close(); assert proc.wait() == 0
sheet=base/'comparison-contact.png';cv2.imwrite(str(sheet),np.concatenate([np.concatenate(tiles[:2],axis=1),np.concatenate(tiles[2:],axis=1)],axis=0));views.append(sheet)
images=[]
for p in views:
    a=cv2.imread(str(p));images.append(dict(path=str(p),sha256=sha(p),dimensions=[a.shape[1],a.shape[0]],bytes=p.stat().st_size,mean=float(a.mean()),stdev=float(a.std()),viewed=False))
report=dict(utc=datetime.now(timezone.utc).isoformat(),url=raw['url'],sourceCommit=raw['sourceCommit'],indexSha256=raw['indexSha256'],viewport=raw['viewport'],raw=dict(path=str(raw_path),sha256=sha(raw_path)),source=dict(path=str(source),sha256=sha(source)),video=dict(path=str(video),sha256=sha(video),frames=300,fps=30,duration=10,dimensions=[1280,720]),sourceCrop=[x0,y0,x1,y1],studyCanvas=[w,h],nativeCrop=crop,displayedHeight=target,maxHeightMismatch=max(abs(x['nativeBodyHeight']-target) for x in comparisons),frames=300,images=images,artAccepted=False,productionAcceptance=False,imagesViewed=0,limits='Reference is black-composited RGB, not alpha truth. Native pixels are not resized inside the full-size film. No seam repair or wall-clock performance claim.')
with (base/'comparison-measurements.json').open('x') as output: output.write(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['video','displayedHeight','maxHeightMismatch','images']}))
