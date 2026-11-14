"""Encode mono menu scores from their lossless licensed sources at 80 kb/s.

Constrained Opus VBR avoids the large bitrate overshoot on harmonic music.
The arrangements, channels, timing and level remain unchanged. Speech is untouched.
"""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'tmp/p3-music-budget'
REPORT = ROOT / 'reports/v3-shell/b2/polish/P3/music-budget.json'
parser = argparse.ArgumentParser()
parser.add_argument('--publish', action='store_true')
args = parser.parse_args()
OUT.mkdir(parents=True, exist_ok=True)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def level(path):
    result = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path),
        '-af', 'loudnorm=I=-18:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'],
        capture_output=True, text=True, check=True)
    data, _ = json.JSONDecoder().raw_decode(result.stderr[result.stderr.rfind('{'):])
    return {key: float(data[key]) for key in ['input_i', 'input_tp', 'input_lra']}

license_path = ROOT / 'apps/web/public/audio/LICENSES.json'
licenses = json.loads(license_path.read_text())
if not args.publish:
    rows = []
    for name in ['menu-forge', 'menu-home']:
        for ext, codec in [('webm', 'libopus'), ('mp3', 'libmp3lame')]:
            target = ROOT / f'apps/web/public/audio/{name}.{ext}'
            record = next(r for r in licenses['files'] if r['path'] == str(target.relative_to(ROOT)))
            source = ROOT / record['sourceFiles'][0]['path']
            assert digest(source) == record['sourceFiles'][0]['sha256']
            staged = OUT / target.name
            command = ['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-c:a', codec,
                       '-b:a', '80k', *(['-vbr', 'constrained'] if ext == 'webm' else []), str(staged)]
            subprocess.run(command, check=True)
            before, after = level(target), level(staged)
            assert abs(after['input_i'] - before['input_i']) <= .3, (before, after)
            assert after['input_tp'] <= -1, after
            rows.append({'path': str(target.relative_to(ROOT)), 'source': record['sourceFiles'][0],
                'staged': str(staged.relative_to(ROOT)), 'beforeSha256': digest(target),
                'afterSha256': digest(staged), 'beforeBytes': target.stat().st_size,
                'afterBytes': staged.stat().st_size, 'beforeLevel': before, 'afterLevel': after,
                'command': command})
    REPORT.write_text(json.dumps({'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'method': __doc__, 'rows': rows, 'published': False}, indent=2) + '\n')
else:
    report = json.loads(REPORT.read_text())
    assert not report['published'], 'Preserve the published receipt'
    for row in report['rows']:
        assert digest(ROOT / row['path']) == row['beforeSha256']
        assert digest(ROOT / row['staged']) == row['afterSha256']
    for row in report['rows']:
        target = ROOT / row['path']
        shutil.copy2(ROOT / row['staged'], target)
        record = next(r for r in licenses['files'] if r['path'] == row['path'])
        record['sha256'] = row['afterSha256']
        record['encoding'] = {'tool': 'ffmpeg, libopus/libmp3lame', 'bitrate': 80000,
            'opusMode': 'constrained VBR', 'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'script': {'path': str(Path(__file__).relative_to(ROOT)), 'sha256': digest(Path(__file__))},
            'source': row['source'], 'processing': __doc__.strip()}
    license_path.write_text(json.dumps(licenses, indent=2) + '\n')
    report['published'] = True
    report['publishedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    REPORT.write_text(json.dumps(report, indent=2) + '\n')
report = json.loads(REPORT.read_text())
print(json.dumps({'published': report['published'], 'bytesSaved': sum(r['beforeBytes'] - r['afterBytes'] for r in report['rows']),
    'maxLufsChange': max(abs(r['beforeLevel']['input_i'] - r['afterLevel']['input_i']) for r in report['rows'])}))
