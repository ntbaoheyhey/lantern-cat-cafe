"""Cross-check an existing projected socket against an independent F0 template.

Usage: python3 tools/v5vfx/crosscheck-designer-socket.py TRACKS SPEC OUTPUT
The search stays fixed around the preselected source ROI, never around LK output.
"""
from pathlib import Path
import datetime
import hashlib
import json
import sys

root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root / 'work/v5/CXV/python'))
import cv2
import numpy as np

cv2.setNumThreads(2)
track_path, spec_path, out = map(Path, sys.argv[1:4])
assert not out.exists(), 'Never overwrite prior evidence'
tracks = json.loads(track_path.read_text())
specs = json.loads(spec_path.read_text())
cat = tracks['cat']
assert cat in ('mochi', 'clover')
base = root / 'work/v5/CXV/ref/batch-m'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(base / ('Scene1.mp4' if cat == 'mochi' else 'clover.mp4')) == tracks['sourceSha256']
frames = np.load(base / f'{cat}-frames.npy', mmap_mode='r')
gray = [cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) for frame in frames]
assert len(gray) == tracks['frames'] == 300
scale = np.array(tracks['conversion']['preScale']) * tracks['conversion']['finalScale']
result = {
    'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'cat': cat, 'sourceSha256': tracks['sourceSha256'],
    'tracks': {'path': str(track_path.resolve()), 'sha256': sha(track_path)},
    'spec': {'path': str(spec_path.resolve()), 'sha256': sha(spec_path)},
    'runnerSha256': sha(Path(__file__)),
    'method': 'Fixed F0 grayscale template; independent +/-40 source-pixel search; normalized correlation and subpixel peak. Projected displacement only, not recovered bones.',
    'gates': {'minTemplateCorrelation': .8, 'maxDisagreementDeliveryPx': 2},
    'sockets': {},
}
for name, spec in specs.items():
    entry = tracks['sockets'][name]
    assert 'worldOffsets' in entry, 'Need a measured track, even if rejected'
    x, y, w, h = spec['sourceRoi']
    template = gray[0][y:y+h, x:x+w]
    xx, yy = max(0, x-40), max(0, y-40)
    right, bottom = min(gray[0].shape[1], x+w+40), min(gray[0].shape[0], y+h+40)
    offsets, correlations = [], []
    for frame in gray:
        scores = cv2.matchTemplate(frame[yy:bottom, xx:right], template, cv2.TM_CCOEFF_NORMED)
        _, maximum, _, (px, py) = cv2.minMaxLoc(scores)
        subpixel = np.zeros(2)
        for axis, (a, b) in enumerate(((px, py), (py, px))):
            line = scores[b, :] if axis == 0 else scores[:, b]
            if 0 < a < len(line)-1:
                denominator = line[a-1] - 2*line[a] + line[a+1]
                if abs(denominator) > 1e-9:
                    subpixel[axis] = np.clip(.5*(line[a-1]-line[a+1])/denominator, -.5, .5)
        offsets.append(np.array([px+xx-x, py+yy-y]) + subpixel)
        correlations.append(maximum)
    offsets = np.array(offsets)
    offsets -= offsets[0]
    template_delivery = offsets * scale
    tracked_delivery = np.array(entry['worldOffsets']) * [384/512, -384/512]
    disagreement = np.linalg.norm(template_delivery-tracked_delivery, axis=1)
    minimum, maximum = float(min(correlations)), float(disagreement.max())
    result['sockets'][name] = {
        'trackingAccepted': entry['accepted'],
        'minCorrelation': minimum, 'worstCorrelationFrame': int(np.argmin(correlations)),
        'maxDisagreementDeliveryPx': maximum, 'worstDisagreementFrame': int(disagreement.argmax()),
        'templateSeamDeliveryPx': float(np.linalg.norm(template_delivery[-1])),
        'templateRangeDeliveryPx': np.ptp(template_delivery, axis=0).tolist(),
        'templateAccepted': minimum >= .8 and maximum <= 2,
        'accepted': entry['accepted'] and minimum >= .8 and maximum <= 2,
        'templateDeliveryOffsets': np.round(template_delivery, 6).tolist(),
        'correlations': correlations,
    }
out.write_text(json.dumps(result, separators=(',', ':')) + '\n')
print(json.dumps({name: {k: v for k, v in value.items() if k not in ('templateDeliveryOffsets', 'correlations')}
                  for name, value in result['sockets'].items()}))
