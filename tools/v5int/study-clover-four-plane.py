"""Bounded Clover encoding for decoded-spout study; no loop or scene acceptance."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess
import sys
sys.path.insert(0, '/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/python')
import cv2
import numpy as np
cv2.setNumThreads(1)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT/'work/v5/CXI/batch-m'
quality = int(sys.argv[1]) if len(sys.argv) > 1 else 22
full_matte = '--full-matte' in sys.argv[2:]
assert quality in [21, 22]
OUT = BASE/f"clover-{'full-matte' if full_matte else 'four-plane'}-q{quality}-r1"
OUT.mkdir(exist_ok=False)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
source = BASE/'matte-r2/clover-premul.rgba'
assert sha(source) == 'c7741308c934b742022fe293dc3419c2d28cb72c3c3d7bc960bb56117e86574f'
original = np.memmap(source, np.uint8, 'r', shape=(300, 390, 318, 4))
w, h = (318, 390) if full_matte else (212, 260)
resized_path = OUT/'source.rgba'
resized = np.memmap(resized_path, np.uint8, 'w+', shape=(300, h, w, 4))
for i in range(300):
    resized[i] = original[i] if full_matte else cv2.resize(original[i], (w, h), interpolation=cv2.INTER_AREA)
resized.flush()
if full_matte: assert sha(resized_path) == sha(source), "Full-matte study must retain every source RGBA byte"
baseline = json.loads((BASE/'four-plane-local-vslow-q22-r1/report.json').read_text())
command = list(baseline['trials'][0]['command'])
video = OUT/f'ycrcb-crf{quality}.mp4'
command[command.index('-crf')+1] = str(quality)
command[command.index('-video_size')+1] = f'{w*2}x{h*2}'
command[command.index('-vf')+1] = f'addroi=0:0:{w}:{h}:-0.12,addroi={w}:{h}:{w}:{h}:-0.04'
command[-1] = str(video)
process = subprocess.Popen(command, stdin=subprocess.PIPE)
neutral = np.full((h, w), 128, np.uint8).tobytes()
for frame in resized:
    color = cv2.cvtColor(frame[:, :, :3], cv2.COLOR_RGB2YCrCb)
    tile = np.block([[color[:, :, 0], color[:, :, 1]], [color[:, :, 2], frame[:, :, 3]]])
    process.stdin.write(tile.tobytes()+neutral+neutral)
process.stdin.close()
assert process.wait() == 0
decoded_path = OUT/'decoded.rgb'
subprocess.run(['ffmpeg', '-y', '-nostdin', '-v', 'error', '-i', str(video), '-vf', 'scale=in_color_matrix=bt601:in_range=full:out_range=full', '-pix_fmt', 'rgb24', '-f', 'rawvideo', str(decoded_path)], check=True, stdin=subprocess.DEVNULL)
decoded = np.memmap(decoded_path, np.uint8, 'r', shape=(300, h*2, w*2, 3))
white, black, edge, mask = [], [], [], []
for frame, packed in zip(resized, decoded):
    tile = packed[:, :, 0]
    color = cv2.cvtColor(np.dstack([tile[:h, :w], tile[:h, w:], tile[h:, :w]]), cv2.COLOR_YCrCb2RGB).astype(float)
    alpha = tile[h:, w:].astype(float)
    original_frame = frame.astype(float)
    actual_white = np.clip(color+255-alpha[:, :, None], 0, 255)
    source_white = np.clip(original_frame[:, :, :3]+255-original_frame[:, :, 3:4], 0, 255)
    error = np.abs(actual_white-source_white)
    foreground = frame[:, :, 3] > 16
    boundary = (frame[:, :, 3] > 4) & (frame[:, :, 3] < 250)
    white.append(float(error[foreground].mean()))
    black.append(float(np.abs(color-original_frame[:, :, :3])[foreground].mean()))
    edge.append(float(error[boundary].mean()))
    mask.append(float(np.abs(alpha-original_frame[:, :, 3]).mean()))
trial = dict(mode='ycrcb', video=str(video), bytes=video.stat().st_size, sha256=sha(video), encodedDimensions=[w*2, h*2],
             foregroundWhiteMAE=float(np.mean(white)), foregroundBlackMAE=float(np.mean(black)), edgeFrameMax=max(edge), maskMAE=float(np.mean(mask)), command=command)
trial['numericPass'] = trial['foregroundWhiteMAE'] <= 3 and trial['edgeFrameMax'] <= 15 and trial['maskMAE'] <= 2
report = dict(utc=datetime.now(timezone.utc).isoformat(), cat='clover', status='STUDY_ONLY', sourceRgba=str(resized_path), sourceRgbaSha256=sha(resized_path), originalMatte=dict(path=str(source), sha256=sha(source)),
              sourceSize=[318, 390], logicalSize=[w, h], opaqueHeight=384 if full_matte else 256, frames=300, fps=30, duration=10, scale=1 if full_matte else 2/3, resize='Identity; exact original matte RGBA' if full_matte else 'INTER_AREA on premultiplied RGBA', trials=[trial],
              nativeAssetAcceptance=False, loopAccepted=False, imagesViewed=0, limits='Compression error measured against resized pinned matte only. Original alpha/fringe quality, downsampling loss, tail seam and provisional head/palm sockets remain unaccepted. No runtime or registry change.')
(OUT/'report.json').write_text(json.dumps(report, indent=2)+'\n')
(ROOT/f"reports/v5/CXI/evidence/v8-clover-{'full-matte' if full_matte else 'four-plane'}-q{quality}-review.json").write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({k: v for k, v in trial.items() if k != 'command'}))
