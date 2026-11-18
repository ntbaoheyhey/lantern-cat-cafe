"""Fresh source-only boundary observations; no training or fitted coordinates."""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np

cv2.setNumThreads(1)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--out', type=Path, default=ROOT / 'work/v5/CXV/batch-m/clover-geometric-observation-audit-R2')
OUT = parser.parse_args().out.resolve()
assert OUT.is_relative_to(ROOT / 'work/v5/CXV'), 'Evidence must stay inside owned ignored work'
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
config = json.loads((OUT / 'preregistration.json').read_text())
source = ROOT / config['source']
assert sha(source) == config['sourceSha256']
frames = np.load(source, mmap_mode='r')
assert frames.shape == (300, 640, 526, 3)
assert not (OUT / 'plots.json').exists()
plots = []
for name, crop, scale in config.get('regions', [('face', [130, 30, 280, 240], 1.1), ('palm', [55, 305, 160, 150], 1.6)]):
    for batch in range((len(config['frames'])+5)//6):
        selected = config['frames'][batch*6:(batch+1)*6]
        canvas = np.full((980, 768, 3), 244, np.uint8)
        cv2.putText(canvas, f'{name} SOURCE OBSERVATIONS {batch+1} | no fitted marks', (12, 20), cv2.FONT_HERSHEY_SIMPLEX, .48, (20, 20, 20), 1, cv2.LINE_AA)
        x, y, w, h = crop
        cells = []
        for i, frame in enumerate(selected):
            cx, cy = (i % 2)*384, 28+(i//2)*312
            ox, oy = cx+46, cy+36
            part = cv2.resize(frames[frame, y:y+h, x:x+w], (round(w*scale), round(h*scale)), interpolation=cv2.INTER_LINEAR)
            canvas[oy:oy+part.shape[0], ox:ox+part.shape[1]] = part
            cv2.putText(canvas, f'F{frame}', (cx+5, cy+14), cv2.FONT_HERSHEY_SIMPLEX, .47, (20, 20, 20), 1, cv2.LINE_AA)
            for sx in range((x+19)//20*20, x+w, 20):
                px = round(ox+(sx-x)*scale)
                cv2.line(canvas, (px, oy-4), (px, oy), (20, 20, 20), 1)
                cv2.putText(canvas, str(sx), (px-9, oy-7), cv2.FONT_HERSHEY_SIMPLEX, .3, (20, 20, 20), 1, cv2.LINE_AA)
            for sy in range((y+19)//20*20, y+h, 20):
                py = round(oy+(sy-y)*scale)
                cv2.line(canvas, (ox-4, py), (ox, py), (20, 20, 20), 1)
                cv2.putText(canvas, str(sy), (ox-30, py+3), cv2.FONT_HERSHEY_SIMPLEX, .34, (20, 20, 20), 1, cv2.LINE_AA)
            cells.append(dict(frame=frame, crop=crop, scale=scale, origin=[ox, oy]))
        path = OUT / f'{name}-source-observation-{batch+1}.jpg'
        assert not path.exists()
        cv2.imwrite(str(path), canvas, [cv2.IMWRITE_JPEG_QUALITY, 94])
        actual = cv2.imread(str(path))
        assert actual.shape[:2] == (980, 768)
        plots.append(dict(name=name, path=str(path), sha256=sha(path), dimensions=[768, 980], bytes=path.stat().st_size, cells=cells, views=0))
(OUT / 'plots.json').write_text(json.dumps(dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), preregistrationSha256=sha(OUT/'preregistration.json'), plots=plots), indent=2)+'\n')
print(json.dumps([dict(path=p['path'], dimensions=p['dimensions'], sha256=p['sha256']) for p in plots]))
