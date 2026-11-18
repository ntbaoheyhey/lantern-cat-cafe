#!/usr/bin/env python3
"""One macroblock-aligned data-plane experiment; no registry or loader edit."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import time
import cv2
import numpy as np

cv2.setNumThreads(1)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
OUT = BASE / 'four-plane-aligned-r1'
OUT.mkdir(exist_ok=False)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
baseline_path = BASE / 'four-plane-local-vslow-q22-r1/report.json'
baseline = json.loads(baseline_path.read_text())
trial = baseline['trials'][0]
assert sha(trial['video']) == trial['sha256']
source = Path(baseline['sourceRgba'])
assert sha(source) == baseline['sourceRgbaSha256']
w, h, stride_w, stride_h = 312, 260, 320, 272
raw = np.memmap(source, np.uint8, 'r', shape=(300, h, w, 4))
video, decoded = OUT / 'aligned-q22.mp4', OUT / 'decoded.rgb'
command = list(trial['command'])
command[command.index('-video_size')+1] = f'{stride_w*2}x{stride_h*2}'
command[command.index('-vf')+1] = f'addroi=0:0:{stride_w}:{stride_h}:-0.12,addroi={stride_w}:{stride_h}:{stride_w}:{stride_h}:-0.04'
command[-1] = str(video)
started = time.monotonic()
process = subprocess.Popen(command, stdin=subprocess.PIPE)
neutral = np.full((stride_h, stride_w), 128, np.uint8).tobytes()
for frame in raw:
    color = cv2.cvtColor(frame[:, :, :3], cv2.COLOR_RGB2YCrCb)
    pad = lambda a: np.pad(a, ((0, stride_h-h), (0, stride_w-w)), mode='edge')
    tile = np.block([[pad(color[:, :, 0]), pad(color[:, :, 1])], [pad(color[:, :, 2]), pad(frame[:, :, 3])]])
    assert np.array_equal(tile[:h, :w], color[:, :, 0])
    assert np.array_equal(tile[stride_h:stride_h+h, stride_w:stride_w+w], frame[:, :, 3])
    process.stdin.write(tile.tobytes()+neutral+neutral)
process.stdin.close()
assert process.wait() == 0
subprocess.run(['ffmpeg', '-y', '-nostdin', '-v', 'error', '-threads', '2', '-i', str(video), '-vf', 'scale=in_color_matrix=bt601:in_range=full:out_range=full', '-pix_fmt', 'rgb24', '-f', 'rawvideo', str(decoded)], check=True, stdin=subprocess.DEVNULL)
assert decoded.stat().st_size == 300*(stride_h*2)*(stride_w*2)*3
pixels = np.memmap(decoded, np.uint8, 'r', shape=(300, stride_h*2, stride_w*2, 3))
white, black, edge, mask = [], [], [], []
for i in range(300):
    tile = pixels[i, :, :, 0]
    packed = np.dstack((tile[:h, :w], tile[:h, stride_w:stride_w+w], tile[stride_h:stride_h+h, :w]))
    color = cv2.cvtColor(packed, cv2.COLOR_YCrCb2RGB).astype(np.float32)
    alpha = tile[stride_h:stride_h+h, stride_w:stride_w+w].astype(np.float32)
    f = raw[i].astype(np.float32)
    error = np.abs(np.clip(color+255-alpha[:, :, None], 0, 255)-np.clip(f[:, :, :3]+255-f[:, :, 3:4], 0, 255))
    white.append(float(error[f[:, :, 3] > 16].mean()))
    black.append(float(np.abs(color-f[:, :, :3])[f[:, :, 3] > 16].mean()))
    edge.append(float(error[(f[:, :, 3] > 4) & (f[:, :, 3] < 250)].mean()))
    mask.append(float(np.abs(alpha-f[:, :, 3]).mean()))
metrics = dict(bytes=video.stat().st_size, saving=trial['bytes']-video.stat().st_size, foregroundWhiteMAE=float(np.mean(white)), foregroundBlackMAE=float(np.mean(black)), edgeFrameMax=max(edge), maskMAE=float(np.mean(mask)))
numeric_pass = metrics['foregroundWhiteMAE'] <= 3 and metrics['edgeFrameMax'] <= 15 and metrics['maskMAE'] <= 2
report = dict(utc=datetime.now(timezone.utc).isoformat(), source=dict(path=str(source), sha256=sha(source)),
              baseline=dict(path=str(baseline_path), sha256=sha(baseline_path), bytes=trial['bytes']),
              video=dict(path=str(video), sha256=sha(video)), harnessSha256=sha(__file__), command=command,
              logicalDimensions=[w, h], planeStride=[stride_w, stride_h], encodedDimensions=[stride_w*2, stride_h*2],
              frames=300, fps=30, padding='edge replication, unchanged logical pixels', metrics=metrics,
              offlineNumericPass=numeric_pass, worthwhileByteGate=metrics['saving'] >= 50000,
              elapsedSeconds=time.monotonic()-started, imagesViewed=0, nativeAccepted=False, runtimeChanged=False)
(OUT / 'report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report), flush=True)
