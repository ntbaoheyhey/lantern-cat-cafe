"""Original low drum intensity loops, at the existing 120/125 BPM score tempos.

Soft mallet attacks and quiet filtered noise reinforce danger without competing
with speech consonants. Deterministic NumPy synthesis; no recordings or reference
media, paid services, model calls or external samples.
"""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import subprocess
import numpy as np

ROOT = Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip())
RATE = 24000
parser = argparse.ArgumentParser()
parser.add_argument('--publish', action='store_true')
args = parser.parse_args()
out = ROOT / ('apps/web/public/audio' if args.publish else 'tmp/p4-preview')
out.mkdir(parents=True, exist_ok=True)
manifest = json.loads((ROOT / 'apps/web/public/audio/manifest.json').read_text())
licenses = json.loads((ROOT / 'apps/web/public/audio/LICENSES.json').read_text())
rows = []
for kind, beat in [('battle', .5), ('boss', .48)]:
    length = round(4 * beat * RATE)
    pcm = np.zeros(length, dtype=np.float64)
    rng = np.random.default_rng(20261114)
    for tick, strength in [(0, 1), (1, .45), (1.5, .28), (2, .8), (3, .38), (3.5, .3)]:
        t = np.arange(round(.36 * RATE)) / RATE
        frequency = 62 + 45 * np.exp(-t / .035)
        envelope = (1 - np.exp(-t / .018)) * np.exp(-t / .085) * np.minimum(1, (.36 - t) / .045)
        grain = np.convolve(rng.normal(size=len(t)), np.ones(32) / 32, 'same')
        signal = (np.sin(2 * np.pi * np.cumsum(frequency) / RATE) + .055 * grain) * envelope * strength
        indices = (round(tick * beat * RATE) + np.arange(len(t))) % length
        np.add.at(pcm, indices, signal)
    pack = 'score-danger-' + kind
    for extension, codec, bitrate in [('webm', 'libopus', '24k'), ('mp3', 'libmp3lame', '32k')]:
        target = out / (pack + '.' + extension)
        command = ['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(RATE), '-ac', '1', '-i', 'pipe:0',
                   '-af', 'loudnorm=I=-22:TP=-6:LRA=6', '-ar', str(RATE), '-c:a', codec, '-b:a', bitrate]
        if extension == 'webm':
            command += ['-vbr', 'constrained']
        subprocess.run(command + [str(target)], input=pcm.astype('<f4').tobytes(), check=True)
        row = {'path': str(target.relative_to(ROOT)), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
               'bytes': target.stat().st_size, 'durationSeconds': length / RATE}
        rows.append(row)
        if args.publish:
            url = 'https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/v3-shell-2026-11-13/scripts/audio/compose-intensity.py'
            licenses['files'] = [r for r in licenses['files'] if r['path'] != row['path']]
            licenses['files'].append({**row, 'file': target.name, 'sourceUrl': url, 'licenseUrl': url,
                'license': 'Own synthesis', 'author': 'Taskbar Hero original synthesis',
                'date': datetime.datetime.now(datetime.timezone.utc).date().isoformat(), 'tool': 'Python NumPy + ffmpeg',
                'prompt': __doc__, 'script': {'path': str(Path(__file__).resolve().relative_to(ROOT)),
                    'sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
                'processing': 'One-bar mono low-mallet loop; exact existing score tempo; wrapped tails; no reference media.'})
    if args.publish:
        manifest['packs'][pack] = {ext: f'/audio/{pack}.{ext}' for ext in ['webm', 'mp3']}
        manifest['cues'][f'music.{kind}.intensity'] = [{'pack': pack, 'start': 0, 'duration': length / RATE, 'bus': 'music', 'loop': True}]
if args.publish:
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (out / 'LICENSES.json').write_text(json.dumps(licenses, indent=2) + '\n')
print(json.dumps({'published': args.publish, 'files': rows, 'totalBytes': sum(row['bytes'] for row in rows)}))
