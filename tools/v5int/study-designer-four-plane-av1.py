#!/usr/bin/env python3
"""One AV1 trial on the accepted four-plane matte/layout. No shipped assets."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess
import cv2
import numpy as np

cv2.setNumThreads(2)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
OUT = BASE / 'four-plane-av1-q25-r1'
OUT.mkdir(exist_ok=False)
w, h = 312, 260
source = BASE / 'local-color-matte-all-r1/source.rgba'
raw = np.memmap(source, np.uint8, 'r', shape=(300, h, w, 4))
video, decoded = OUT/'ycrcb-av1-crf25.mp4', OUT/'decoded.rgb'
command = ['ffmpeg', '-y', '-nostdin', '-v', 'warning', '-f', 'rawvideo',
           '-pixel_format', 'yuv420p', '-video_size', f'{w*2}x{h*2}',
           '-framerate', '30', '-color_range', 'pc', '-i', '-', '-an',
           '-c:v', 'libsvtav1', '-preset', '4', '-crf', '25', '-g', '60',
           '-svtav1-params', 'tune=1:film-grain=0:enable-tf=0:lp=2',
           '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709',
           '-color_trc', 'iec61966-2-1', '-colorspace', 'smpte170m',
           '-color_range', 'pc', '-tag:v', 'av01', '-movflags', '+faststart', str(video)]
report = {'utc': datetime.now(timezone.utc).isoformat(), 'status': 'OFFLINE_STUDY_ONLY',
          'source': str(source), 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'toolSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          'layout': 'Full-range Y/Cr/Cb/alpha quadrants; neutral video chroma128',
          'logicalDimensions': [w, h], 'encodedDimensions': [2*w, 2*h],
          'frames': 300, 'fps': 30, 'duration': 10, 'opaqueHeight': 256,
          'sourceMatteUnchanged': True, 'runtimeChanged': False,
          'command': command, 'nativeAcceptance': False}
(OUT/'report.json').write_text(json.dumps(report, indent=2)+'\n')
encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
neutral = np.full((h, w), 128, np.uint8).tobytes()
try:
    for frame in raw:
        color = cv2.cvtColor(frame[:, :, :3], cv2.COLOR_RGB2YCrCb)
        tile = np.block([[color[:, :, 0], color[:, :, 1]], [color[:, :, 2], frame[:, :, 3]]])
        encoder.stdin.write(tile.tobytes()+neutral+neutral)
finally:
    encoder.stdin.close()
assert encoder.wait() == 0
probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                   '-count_frames', '-show_entries', 'stream=codec_name,profile,pix_fmt,width,height,nb_read_frames,r_frame_rate,color_range,color_space,color_transfer,color_primaries,duration',
                   '-of', 'json', str(video)], stdin=subprocess.DEVNULL))
stream = probe['streams'][0]
assert stream['codec_name'] == 'av1' and stream['nb_read_frames'] == '300'
assert stream['width'] == 2*w and stream['height'] == 2*h and stream['color_range'] == 'pc'
subprocess.run(['ffmpeg', '-y', '-nostdin', '-v', 'error', '-i', str(video),
                '-vf', 'scale=in_color_matrix=bt601:in_range=full:out_range=full',
                '-pix_fmt', 'rgb24', '-f', 'rawvideo', str(decoded)], check=True, stdin=subprocess.DEVNULL)
pixels = np.memmap(decoded, np.uint8, 'r', shape=(300, 2*h, 2*w, 3))
rows = []
for index, original in enumerate(raw):
    tile = pixels[index, :, :, 0]
    ycrcb = np.dstack((tile[:h, :w], tile[:h, w:], tile[h:, :w]))
    rgb = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2RGB).astype(np.float32)
    alpha = tile[h:, w:].astype(np.float32)
    original = original.astype(np.float32)
    white = np.clip(rgb+255-alpha[:, :, None], 0, 255)
    target_white = np.clip(original[:, :, :3]+255-original[:, :, 3:4], 0, 255)
    error = np.abs(white-target_white)
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
              probe=probe, metrics=metrics, numericPass=passed,
              completedUTC=datetime.now(timezone.utc).isoformat())
(OUT/'frame-metrics.json').write_text(json.dumps(rows, indent=2)+'\n')
(OUT/'report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report), flush=True)
