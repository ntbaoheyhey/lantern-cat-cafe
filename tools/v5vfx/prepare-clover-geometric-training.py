"""Render separate source-only training views; never read holdout coordinates."""
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
OUT = ROOT / 'work/v5/CXV/batch-m/clover-geometric-anchors-R1'
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
ann_path = OUT / 'holdout-annotations.json'
assert sha(ann_path) == 'd0027a6605308aed890775b2487a2ea0046a1dde6ed262f7787671bae11be0e9'
config = json.loads(ann_path.read_text())
indices = config['trainingFrames']
assert indices == [9, 28, 46, 65, 84, 103, 121, 140, 159, 178, 196, 215, 234, 253, 271, 290]
source = ROOT / config['source']
assert sha(source) == 'dcc06d163cfd968db4f4a7674576eb5a419646ce27f65e4805784b92923f3b4e'
frames = np.load(source, mmap_mode='r')
assert frames.shape == (300, 640, 526, 3)
manifest = OUT / 'training-plots.json'
assert not manifest.exists(), 'Do not overwrite previously prepared evidence'
plots = []
for name, crop, scale in [('face', [100, 45, 330, 240], .8), ('palm', [55, 315, 155, 140], 1.35)]:
    for batch in range(2):
        chosen = indices[batch * 8:(batch + 1) * 8]
        canvas = np.full((988, 624, 3), 245, np.uint8)
        cv2.putText(canvas, f'{name} TRAINING {batch + 1} | source coordinates; no fitted marks', (8, 19), cv2.FONT_HERSHEY_SIMPLEX, .44, (20, 20, 20), 1, cv2.LINE_AA)
        x, y, w, h = crop
        cells = []
        for i, frame in enumerate(chosen):
            cx, cy = (i % 2) * 312, 28 + (i // 2) * 240
            ox, oy = cx + 35, cy + 34
            img = cv2.resize(frames[frame, y:y+h, x:x+w], (round(w*scale), round(h*scale)), interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_LINEAR)
            canvas[oy:oy+img.shape[0], ox:ox+img.shape[1]] = img
            cv2.putText(canvas, f'F{frame}', (cx+8, cy+13), cv2.FONT_HERSHEY_SIMPLEX, .43, (20, 20, 20), 1, cv2.LINE_AA)
            for v in range(((x+19)//20)*20, x+w, 40):
                px = round(ox+(v-x)*scale)
                cv2.line(canvas, (px, oy-4), (px, oy), (60, 60, 60))
                cv2.putText(canvas, str(v), (px-9, oy-7), cv2.FONT_HERSHEY_SIMPLEX, .28, (20, 20, 20), 1, cv2.LINE_AA)
            for v in range(((y+19)//20)*20, y+h, 40):
                py = round(oy+(v-y)*scale)
                cv2.line(canvas, (ox-4, py), (ox, py), (60, 60, 60))
                cv2.putText(canvas, str(v), (cx+4, py+3), cv2.FONT_HERSHEY_SIMPLEX, .28, (20, 20, 20), 1, cv2.LINE_AA)
            cells.append({'frame': frame, 'sourceCropXYWH': crop, 'plotOrigin': [ox, oy], 'scale': scale})
        path = OUT / f'{name}-training-{batch+1}.png'
        assert not path.exists()
        assert cv2.imwrite(str(path), canvas)
        measured = cv2.imread(str(path))
        assert max(measured.shape[:2]) <= 1024
        plots.append({'path': str(path), 'sha256': sha(path), 'bytes': path.stat().st_size, 'dimensions': [measured.shape[1], measured.shape[0]], 'views': 0, 'channel': name, 'cells': cells})
        print(json.dumps({k: plots[-1][k] for k in ('path', 'sha256', 'bytes', 'dimensions', 'views')}))
manifest.write_text(json.dumps({'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'sourceSha256': sha(source), 'holdoutSha256': sha(ann_path), 'plots': plots}, indent=2)+'\n')
