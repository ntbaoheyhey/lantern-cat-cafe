"""Add an original offbeat shaker to the licensed 99 BPM menu arrangement.

The quiet eighth-note part fills the browsing groove without speeding up the
melody. No reference audio is used. Production output remains a normal music
asset; browser captures independently decide acceptance.
"""
import datetime
import hashlib
import json
import subprocess
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt
from analyse import RATE, analyse_file

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/audio-sources/b2/music/menu-home-tempo-1.1.flac'
DEST = ROOT / 'assets/audio-sources/b2/music/menu-home-shaker.flac'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def signed(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': sha(path)}

def ff(args, data=None):
    return subprocess.check_output(['ffmpeg', '-v', 'error', '-y', *args], input=data)

pcm = np.frombuffer(ff(['-i', str(SOURCE), '-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1']), dtype='<f4').copy()
shaker = np.zeros(len(pcm))
rng = np.random.default_rng(3113)
period = 60 / 99 / 2
for index, at in enumerate(np.arange(period / 2, len(pcm) / RATE, period)):
    duration = .055 if index % 2 else .045
    size = round(duration * RATE)
    t = np.arange(size) / RATE
    grain = sosfilt(butter(2, [3200 + (index % 3) * 150, 7800], btype='bandpass', fs=RATE, output='sos'), rng.normal(0, 1, size))
    grain = grain / np.max(np.abs(grain)) * np.minimum(t / .002, 1) * np.exp(-t / (.010 if index % 2 else .014))
    start = round(at * RATE)
    end = min(len(pcm), start + size)
    shaker[start:end] += grain[:end-start] * (1 if index % 4 == 0 else .7)
arrangement = pcm + shaker * 10 ** (-16 / 20)
ff(['-f', 'f32le', '-ar', str(RATE), '-ac', '1', '-i', 'pipe:0', '-c:a', 'flac', str(DEST)], arrangement.astype('<f4').tobytes())
license_path = ROOT / 'apps/web/public/audio/LICENSES.json'
licenses = json.loads(license_path.read_text())
source_license = next(row for row in licenses['files'] if row['path'] == str(SOURCE.relative_to(ROOT)))
record = {key: source_license[key] for key in ['sourceUrl', 'licenseUrl', 'license', 'author']}
record.update(**signed(DEST), file=DEST.name, date=datetime.datetime.now(datetime.timezone.utc).date().isoformat(), sourceFiles=[signed(SOURCE)], tool='NumPy and SciPy original percussion synthesis; ffmpeg encoding', script=signed(Path(__file__)), prompt=__doc__.strip(), processing='99 BPM; eighth-note shaker with sixteenth-note offset; alternating 45/55ms decay; 2ms attack; 3.2–7.8kHz noise; -16dB peak gain; seed3113. Existing melody and loudness are preserved.')
records = [record]
for ext, codec in [('webm', 'libopus'), ('mp3', 'libmp3lame')]:
    target = ROOT / f'apps/web/public/audio/menu-home.{ext}'
    ff(['-i', str(DEST), '-c:a', codec, '-b:a', '96k', str(target)])
    records.append({**record, **signed(target), 'file': target.name, 'sourceFiles': [signed(DEST)]})
for row in records:
    licenses['files'] = [r for r in licenses['files'] if r['path'] != row['path']] + [row]
license_path.write_text(json.dumps(licenses, indent=2) + '\n')
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'method': __doc__, 'provenance': records, 'metrics': analyse_file(ROOT/'apps/web/public/audio/menu-home.webm', duration=len(pcm)/RATE), 'runtimeAcceptance': 'Pending actual six-scene captures.'}
(ROOT/'reports/v3-shell/b2/q5/home-percussion-publication31.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report['metrics'].items() if not isinstance(v, list)}))
