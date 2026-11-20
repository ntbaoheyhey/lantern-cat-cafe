"""Verify finished encoded films independently while the900p layout job continues."""
from pathlib import Path
from datetime import datetime, timezone
import argparse, gzip, hashlib, json, re, statistics, subprocess

ROOT = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('--attempt', required=True)
args = parser.parse_args()
assert re.fullmatch(r'r[1-9][0-9]*', args.attempt)
OUT = ROOT / ('reports/v4-art/REVIEW/A11/banner-runtime-' + args.attempt)
CAPTURE = ROOT / 'reports/v3-feel/REVIEW' / ('V4-A11-BANNER-' + args.attempt.upper())
TARGET = OUT / 'film-early-integrity.json'
assert not TARGET.exists(), 'Never overwrite a film verification'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_text())
pipeline, runtime, markers = read(OUT / 'capture-jobs.json'), read(OUT / 'source-hashes.json'), read(OUT / 'encoded-markers.json')
assert all(next(s for s in pipeline['steps'] if s['name'] == name)['exitCode'] == 0 for name in ['capture', 'markers'])
assert all(sha(ROOT / p) == h for p, h in runtime.items())
rows = []
for fixture in ['wave1', 'wave3', 'boss']:
    path = CAPTURE / fixture / 'capture.json.gz'
    capture = json.loads(gzip.decompress(path.read_bytes()))
    video = CAPTURE / (fixture + '.webm')
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(video)]))
    picture = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    audio = [s['codec_name'] for s in probe['streams'] if s['codec_type'] == 'audio']
    times = [f['frameAt'] for f in capture['frames'] if 0 <= f['frameAt'] < 30]
    fps = 1 / statistics.median(b - a for a, b in zip(times, times[1:]) if b > a)
    marker = next(m for m in markers if m['fixture'] == fixture)
    matched = subprocess.run(['git', 'diff', '--quiet', capture['sourceCommit'], '--', *runtime], cwd=ROOT).returncode == 0
    duration = float(probe['format']['duration'])
    passed = (picture['width'] == 1280 and picture['height'] == 720 and picture['r_frame_rate'] == '30/1'
              and audio and abs(duration - 30) < .05 and fps >= 50 and capture['parity'] and not capture['errors']
              and sha(video) == capture['videoSha256'] == marker['videoSha256'] and sha(path) == marker['captureSha256']
              and marker['pass'] and marker['frames'] == marker['valid'] == 900 and matched)
    rows.append({'fixture': fixture, 'captureSha256': sha(path), 'videoSha256': sha(video), 'sourceCommit': capture['sourceCommit'],
                 'sourceRuntimeMatches': matched, 'size': [picture['width'], picture['height']], 'encodedFPS': picture['r_frame_rate'],
                 'durationSeconds': duration, 'medianRenderFPS': fps, 'audioCodecs': audio, 'encodedFrames': marker['frames'], 'pass': bool(passed)})
report = {'at': datetime.now(timezone.utc).isoformat(), 'scriptSha256': sha(Path(__file__)), 'runtimeHashes': runtime,
          'scope': 'Finished720p film integrity only, allowing native review while independent900p layout capture continues. No visual or audio-quality acceptance.',
          'markerSha256': sha(OUT / 'encoded-markers.json'), 'rows': rows, 'pass': all(r['pass'] for r in rows)}
TARGET.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'pass': report['pass'], 'rows': [{'fixture': r['fixture'], 'medianFPS': r['medianRenderFPS'], 'pass': r['pass']} for r in rows]}))
assert report['pass'], 'Film integrity failed; evidence retained'
