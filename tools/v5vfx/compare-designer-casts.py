"""Commissioned 1x idle beside real-model production casts at the same initial height."""
from pathlib import Path
import sys, json, subprocess, hashlib, datetime
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np

out = Path(sys.argv[1]).resolve()
assert out.is_relative_to(ROOT / 'work/v5/CXV')
raw = out / 'report.json'
report = json.loads(raw.read_text())
assert report['pass'], 'Numeric contact and boundary gates precede image review'
cat = report['cat']
source_path = ROOT / f'work/v5/CXV/ref/batch-m/{cat}-frames.npy'
source = np.load(source_path, mmap_mode='r')
union = {'mochi': [43, 34, 562, 465], 'clover': [2, 6, 507, 623]}[cat]
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), cat=cat,
              url=report['url'], sourceCommit=report['sourceCommit'], indexSha256=report['indexSha256'],
              raw=str(raw), rawSha256=sha(raw), sourceFrames=str(source_path), sourceCrop=union,
              method='Left commissioned idle at1x; right actual A6 action at1x, including authored holds. Both retain initial measured body height; no per-frame rescaling.',
              limits='Deterministic30Hz, not realtime FPS. Commissioned source has no cast; comparison judges softness and style, not exact cast correspondence.', runs=[])
for run in report['actions']:
    shots = [s for s in report['captures'] if s['name'] == run['name']]
    rows = [report['rows'][s['row']] for s in shots]
    body = rows[0]['body']
    height = round(body['height'])
    left = max(0, int(np.floor(min(r['body']['x'] for r in rows) - 40)))
    top = max(0, int(np.floor(min(r['body']['y'] for r in rows) - 40)))
    right = min(1280, int(np.ceil(max(r['body']['x'] + r['body']['width'] for r in rows) + 40)))
    bottom = min(720, int(np.ceil(max(r['body']['y'] + r['body']['height'] for r in rows) + 40)))
    assert right-left < 600 and bottom-top < 430, 'Native battle crop must fit without rescaling'
    folder = out / run['name']
    video = folder / (run['name'] + '-source-comparison-1280x720.mp4')
    assert not video.exists()
    process = subprocess.Popen(['ffmpeg', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '1280x720', '-r', '30', '-i', '-', '-c:v', 'libx264', '-crf', '19', '-pix_fmt', 'yuv420p', str(video)], stdin=subprocess.PIPE)
    selected = {min(shots, key=lambda s: abs(s['ms']-ms))['frame'] for ms in [-100, run['plan']['contact']/2, run['plan']['contact'], run['plan']['duration']+100]}
    previews = []
    try:
        for shot, row in zip(shots, rows):
            assert sha(shot['path']) == shot['sha256']
            canvas = np.full((720, 1280, 3), 24, np.uint8)
            cv2.line(canvas, (640, 150), (640, 620), (80, 80, 80), 1)
            source_frame = round(shot['ms']/1000*30) % 300
            original = source[source_frame, union[1]:union[3], union[0]:union[2]]
            original = cv2.resize(original, (round(original.shape[1]*height/original.shape[0]), height), interpolation=cv2.INTER_AREA)
            x = (640-original.shape[1])//2
            canvas[520-height:520, x:x+original.shape[1]] = original
            image = cv2.imread(shot['path'])
            assert image.shape[:2] == (720, 1280)
            crop = image[top:bottom, left:right]
            x = 640+(640-crop.shape[1])//2
            y = round(520-(body['y']+body['height']-top))
            assert y >= 150 and y+crop.shape[0] < 620
            canvas[y:y+crop.shape[0], x:x+crop.shape[1]] = crop
            for xx, title in [(45, cat.title()+' commissioned idle / 1x'), (685, run['name']+' actual cast / 1x')]:
                cv2.putText(canvas, title, (xx, 85), cv2.FONT_HERSHEY_SIMPLEX, .65, (235, 235, 235), 1, cv2.LINE_AA)
                cv2.putText(canvas, f'{height}px initial height / action {shot["ms"]:.1f}ms', (xx, 122), cv2.FONT_HERSHEY_SIMPLEX, .56, (200, 200, 200), 1, cv2.LINE_AA)
            cv2.putText(canvas, f'Actual contact {run["plan"]["contact"]}ms / idle lead300ms and tail500ms / deterministic30Hz', (45, 650), cv2.FONT_HERSHEY_SIMPLEX, .56, (190, 190, 190), 1, cv2.LINE_AA)
            cv2.putText(canvas, 'Source '+report['sourceCommit'][:9]+' / full judge route1280x720 / no realtime performance claim', (45, 685), cv2.FONT_HERSHEY_SIMPLEX, .54, (190, 190, 190), 1, cv2.LINE_AA)
            process.stdin.write(canvas.tobytes())
            if shot['frame'] in selected:
                small = cv2.resize(canvas, (1024, 576), interpolation=cv2.INTER_AREA)
                path = folder / f'comparison-{shot["frame"]:03d}.jpg'
                assert not path.exists()
                cv2.imwrite(str(path), small, [cv2.IMWRITE_JPEG_QUALITY, 92])
                previews.append(dict(path=str(path), sha256=sha(path), dimensions=[1024, 576], bytes=path.stat().st_size,
                                     ms=shot['ms'], frame=shot['frame'], sourceFrame=source_frame, nativeDecoderTime=row['media']['currentTime'],
                                     rgbMean=small.mean(axis=(0, 1))[::-1].tolist(), reviewed=False, views=0))
    finally:
        process.stdin.close()
    assert process.wait() == 0
    result['runs'].append(dict(name=run['name'], video=str(video), videoSha256=sha(video), frames=len(shots), fps=30,
                               durationSeconds=len(shots)/30, initialBodyHeight=height, crop=[left, top, right, bottom], previews=previews))
    print(json.dumps(dict(name=run['name'], frames=len(shots), height=height, previews=len(previews))))
(out/'comparison.json').write_text(json.dumps(result, indent=2)+'\n')
