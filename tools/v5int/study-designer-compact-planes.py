#!/usr/bin/env python3
"""One H264 study: full luminance/alpha plus half-resolution color planes."""
from pathlib import Path
from datetime import datetime, timezone
import json
import hashlib
import subprocess
import cv2
import numpy as np

cv2.setNumThreads(2)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT/'work/v5/CXI/batch-m'
OUT = BASE/'compact-plane-q20-r1'
OUT.mkdir(exist_ok=False)
w, h, ew, eh = 312, 260, 480, 544
source = BASE/'local-color-matte-all-r1/source.rgba'
raw = np.memmap(source, np.uint8, 'r', shape=(300, h, w, 4))
video, decoded = OUT/'compact-ycrcb-crf20.mp4', OUT/'decoded.rgb'
command = ['ffmpeg', '-y', '-nostdin', '-v', 'warning', '-f', 'rawvideo',
           '-pixel_format', 'yuv420p', '-video_size', f'{ew}x{eh}', '-framerate', '30',
           '-color_range', 'pc', '-i', '-', '-an', '-c:v', 'libx264', '-threads', '2',
           '-preset', 'veryslow', '-crf', '20', '-psy', '0', '-pix_fmt', 'yuv420p',
           '-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1',
           '-colorspace', 'smpte170m', '-color_range', 'pc',
           '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=13:matrix_coefficients=6:video_full_range_flag=1',
           '-vf', 'addroi=0:0:320:272:-0.12,addroi=0:272:320:272:-0.04',
           '-movflags', '+faststart', str(video)]
report = {'utc': datetime.now(timezone.utc).isoformat(), 'status': 'OFFLINE_STUDY_ONLY',
          'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'toolSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          'logicalDimensions': [w, h], 'encodedDimensions': [ew, eh],
          'planes': {'Y': [0, 0, w, h], 'alpha': [0, 272, w, h],
                     'Cr': [320, 0, w//2, h//2], 'Cb': [320, 144, w//2, h//2]},
          'padding': 'Edge replicated to16px block boundaries; unused area128',
          'chromaResampling': 'INTER_AREA half then INTER_LINEAR up; alpha untouched before encode',
          'frames': 300, 'fps': 30, 'duration': 10, 'command': command,
          'runtimeChanged': False, 'nativeAcceptance': False}
(OUT/'report.json').write_text(json.dumps(report, indent=2)+'\n')
encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
neutral = np.full((eh//2, ew//2), 128, np.uint8).tobytes()
try:
    for frame in raw:
        color = cv2.cvtColor(frame[:, :, :3], cv2.COLOR_RGB2YCrCb)
        tile = np.full((eh, ew), 128, np.uint8)
        tile[:272, :320] = cv2.copyMakeBorder(color[:, :, 0], 0, 12, 0, 8, cv2.BORDER_REPLICATE)
        tile[272:, :320] = cv2.copyMakeBorder(frame[:, :, 3], 0, 12, 0, 8, cv2.BORDER_REPLICATE)
        for channel, y in [(1, 0), (2, 144)]:
            half = cv2.resize(color[:, :, channel], (w//2, h//2), interpolation=cv2.INTER_AREA)
            tile[y:y+144, 320:] = cv2.copyMakeBorder(half, 0, 14, 0, 4, cv2.BORDER_REPLICATE)
        encoder.stdin.write(tile.tobytes()+neutral+neutral)
finally:
    encoder.stdin.close()
assert encoder.wait() == 0
subprocess.run(['ffmpeg', '-y', '-nostdin', '-v', 'error', '-i', str(video),
                '-vf', 'scale=in_color_matrix=bt601:in_range=full:out_range=full',
                '-pix_fmt', 'rgb24', '-f', 'rawvideo', str(decoded)], check=True, stdin=subprocess.DEVNULL)
pixels = np.memmap(decoded, np.uint8, 'r', shape=(300, eh, ew, 3))
rows = []
for index, original in enumerate(raw):
    tile = pixels[index, :, :, 0]
    cr = cv2.resize(tile[:130, 320:476], (w, h), interpolation=cv2.INTER_LINEAR)
    cb = cv2.resize(tile[144:274, 320:476], (w, h), interpolation=cv2.INTER_LINEAR)
    rgb = cv2.cvtColor(np.dstack((tile[:h, :w], cr, cb)), cv2.COLOR_YCrCb2RGB).astype(np.float32)
    alpha = tile[272:532, :w].astype(np.float32)
    original = original.astype(np.float32)
    error = np.abs(np.clip(rgb+255-alpha[:, :, None], 0, 255)-np.clip(original[:, :, :3]+255-original[:, :, 3:4], 0, 255))
    foreground = original[:, :, 3] > 16
    edge = (original[:, :, 3] > 4) & (original[:, :, 3] < 250)
    rows.append({'frame': index, 'whiteMAE': float(error[foreground].mean()),
                 'blackMAE': float(np.abs(rgb-original[:, :, :3])[foreground].mean()),
                 'edgeMAE': float(error[edge].mean()),
                 'maskMAE': float(np.abs(alpha-original[:, :, 3]).mean())})
metrics = {'bytes': video.stat().st_size,
           'foregroundWhiteMAE': float(np.mean([x['whiteMAE'] for x in rows])),
           'foregroundBlackMAE': float(np.mean([x['blackMAE'] for x in rows])),
           'edgeFrameMax': max(x['edgeMAE'] for x in rows),
           'maskMAE': float(np.mean([x['maskMAE'] for x in rows]))}
passed = metrics['bytes'] <= 1000000 and metrics['foregroundWhiteMAE'] <= 3 and metrics['edgeFrameMax'] <= 15 and metrics['maskMAE'] <= 2
report.update(video=str(video), videoSha256=hashlib.sha256(video.read_bytes()).hexdigest(),
              metrics=metrics, numericPass=passed, completedUTC=datetime.now(timezone.utc).isoformat())
(OUT/'frame-metrics.json').write_text(json.dumps(rows, indent=2)+'\n')
(OUT/'report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report), flush=True)
