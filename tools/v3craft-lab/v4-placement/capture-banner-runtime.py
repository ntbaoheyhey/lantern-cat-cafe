"""Use existing recorders for the validated caster banner; never overwrite prior captures."""
from pathlib import Path
from datetime import datetime, timezone
from PIL import Image
import gzip
import hashlib
import json
import os
import statistics
import subprocess

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A11/banner-runtime-r1'
ITEM = 'V4-A11-BANNER-R1'
CAPTURE = ROOT / 'reports/v3-feel/REVIEW' / ITEM
REPORT = OUT / 'capture-jobs.json'
assert not REPORT.exists() and not CAPTURE.exists(), 'Never overwrite prior evidence'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
now = lambda: datetime.now(timezone.utc).isoformat()
read = lambda p: json.loads(p.read_text())
runtime = read(OUT / 'source-hashes.json')
stable = lambda: all(sha(ROOT / p) == h for p, h in runtime.items())
gates = ['validation.json', 'parity.json', 'lane-audit.json', 'runtime-check-r1.json']
assert stable() and all(read(OUT / name)['pass'] for name in gates)
report = {'started': now(), 'pid': os.getpid(), 'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
          'scriptSha256': sha(Path(__file__)), 'runtimeSourceHashes': runtime,
          'gateReceiptHashes': {name: sha(OUT / name) for name in gates},
          'scope': 'Development fixture films for caster-identified banner; not integrated production transfer acceptance.',
          'steps': [], 'complete': False, 'pass': False}
save = lambda: REPORT.write_text(json.dumps(report, indent=2) + '\n')
save()
python = str(ROOT / 'tools/.venv/bin/python')
commands = [
    ('capture', ['node', 'scripts/v3feel/capture.mjs', '--item', ITEM, '--seconds', '30', '--video-seconds', '30', '--frame-marker']),
    ('markers', [python, 'tools/v3craft-lab/v4-yarn-giant/verify-markers.py', '--capture-root', str(CAPTURE), '--out', str(OUT / 'encoded-markers.json')]),
    ('layout900', ['node', 'scripts/v3a2/battle-capture.mjs', '--width', '1440', '--height', '900', '--seconds', '30', '--complete-actions', '--out', str(OUT / 'raw/layout900')]),
    ('layout-review', [python, 'tools/v3craft-lab/v4-transfer/review-900.py', '--root', str(OUT), '--subdir', 'layout900']),
    ('action-sheets', [python, 'scripts/v3feel/review-sheets.py', ITEM]),
]
try:
    for name, command in commands:
        assert stable(), 'Runtime changed while filming'
        log = ROOT / 'reports/v4-art/jobs' / ('a11-banner-runtime-r1-' + name + '.log')
        row = {'name': name, 'command': command, 'log': str(log), 'started': now()}
        report['steps'].append(row)
        with log.open('xb') as stream:
            child = subprocess.Popen(command, cwd=ROOT, stdin=subprocess.DEVNULL, stdout=stream, stderr=subprocess.STDOUT)
            row['pid'] = child.pid
            save()
            row['exitCode'] = child.wait()
        row['finished'] = now()
        save()
        print(name, 'exit', row['exitCode'], flush=True)
        assert row['exitCode'] == 0, name + ' failed; retained log has details'
    markers = read(OUT / 'encoded-markers.json')
    capture_rows, reviews = [], []
    for fixture in ('wave1', 'wave3', 'boss'):
        compressed = CAPTURE / fixture / 'capture.json.gz'
        capture = json.loads(gzip.decompress(compressed.read_bytes()))
        video = CAPTURE / (fixture + '.webm')
        probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(video)]))
        video_stream = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        audio = [s for s in probe['streams'] if s['codec_type'] == 'audio']
        times = [f['frameAt'] for f in capture['frames'] if 0 <= f['frameAt'] < 30]
        median_fps = 1 / statistics.median(b - a for a, b in zip(times, times[1:]) if b > a)
        marker = next(m for m in markers if m['fixture'] == fixture)
        source_matches = subprocess.run(['git', 'diff', '--quiet', capture['sourceCommit'], '--', *runtime], cwd=ROOT).returncode == 0
        duration = float(probe['format']['duration'])
        valid = (video_stream['width'] == 1280 and video_stream['height'] == 720 and video_stream['r_frame_rate'] == '30/1'
                 and audio and abs(duration - 30) < .05 and median_fps >= 50 and capture['parity'] and not capture['errors']
                 and sha(video) == capture['videoSha256'] and marker['pass'] and marker['frames'] == marker['valid'] == 900 and source_matches)
        capture_rows.append({'fixture': fixture, 'sourceCommit': capture['sourceCommit'], 'sourceRuntimeMatches': source_matches,
                             'captureSha256': sha(compressed), 'video': str(video.relative_to(ROOT)), 'videoSha256': sha(video),
                             'containerDurationSeconds': duration, 'size': [video_stream['width'], video_stream['height']],
                             'encodedFPS': video_stream['r_frame_rate'], 'encodedFrames': marker['frames'],
                             'audioCodecs': [s['codec_name'] for s in audio], 'medianRenderFPS': median_fps,
                             'parity': capture['parity'], 'errors': capture['errors'], 'pass': bool(valid)})
        for action in read(CAPTURE / fixture / 'actions.json'):
            original = ROOT / action['sheet']
            target = OUT / 'raw/review-1024' / fixture / original.name
            target.parent.mkdir(parents=True, exist_ok=True)
            with Image.open(original) as im:
                im.resize((1024, round(im.height * 1024 / im.width)), Image.Resampling.LANCZOS).save(target, quality=90)
            reviews.append({**action, 'fixture': fixture, 'originalSheet': action['sheet'],
                            'reviewPath': str(target.relative_to(ROOT)), 'sha256': sha(target), 'reviewed': False})
    verification = {'at': now(), 'scope': 'Capture integrity only. Median render FPS is inverse median positive frameAt spacing within the encoded30s interval; audio presence is not audio-quality acceptance.',
                    'rows': capture_rows, 'pass': all(r['pass'] for r in capture_rows), 'filmVisualAcceptance': False, 'productionTransferAcceptance': False}
    (OUT / 'film-capture-verification.json').write_text(json.dumps(verification, indent=2) + '\n')
    assert verification['pass'], 'Capture metadata gate failed'
    (OUT / 'film-review.json').write_text(json.dumps({'created': now(), 'scope': 'All recorded action windows at10fps plus impact samples; inspect only new sheets. Truncated windows remain explicit.',
                                                  'sheets': reviews, 'reviewComplete': False, 'reviewedCount': 0}, indent=2) + '\n')
    report.update(pass_=True, runtimeUnchanged=stable(), reviewSheets=len(reviews))
    report['pass'] = report.pop('pass_') and report['runtimeUnchanged']
except Exception as error:
    report['error'] = str(error)
    raise
finally:
    report.update(complete=True, finished=now())
    save()
