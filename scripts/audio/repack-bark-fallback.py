"""Rebuild MP3 bark fallbacks from licensed lossless lines without changing cues."""
import datetime, hashlib, json, math, subprocess
from pathlib import Path
import numpy as np
from voice_features import RATE, decode, features

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'apps/web/public/audio'
REPORT = ROOT / 'reports/v3-shell/b2'
WORK = ROOT / 'work/q5-bark-fallback'
WORK.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
signed = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p)}
manifest = json.loads((OUT / 'manifest.json').read_text())
source = json.loads((REPORT / 'VOICE-DISTINCT.json').read_text())
licences = json.loads((OUT / 'LICENSES.json').read_text())
rows = []
for cat in source['cats']:
    pack = 'cat-' + cat['id']
    samples = {s['variantId']: s for cue in manifest['cues'].values()
               for s in cue if s['pack'] == pack}
    length = round((max(s['start'] + s['duration'] for s in samples.values()) + .08) * RATE)
    pcm = np.zeros(length, dtype=np.float32)
    inputs = []
    for row in cat['lines']:
        path = ROOT / row['path']
        assert sha(path) == row['sha256'], 'Use the measured lossless source'
        sample = samples[path.name]
        x = decode(path)
        assert abs(len(x) / RATE - sample['duration']) < 1 / RATE
        start = round(sample['start'] * RATE)
        pcm[start:start + len(x)] = x
        inputs.append(signed(path))
    path = WORK / (pack + '.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(RATE),
                    '-ac', '1', '-i', 'pipe:0', '-af', 'volume=0.3dB',
                    '-c:a', 'libmp3lame', '-b:a', '40k', str(path)],
                   input=pcm.astype('<f4').tobytes(), check=True)
    measured = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(path), '-af',
                              'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'],
                             capture_output=True, text=True, check=True).stderr
    levels, _ = json.JSONDecoder().raw_decode(measured[measured.rindex('{'):])
    decoded = decode(path)
    probes = []
    for original in cat['measurementLines']:
        sample = samples[Path(original).name]
        start = round(sample['start'] * RATE)
        probes.append(features(decoded[start:start + round(sample['duration'] * RATE)]))
    row = {'id': cat['id'], 'sourceRecording': cat['sourceRecording'],
           'inputs': inputs, 'output': signed(path), 'before': signed(OUT / path.name),
           'bytesBefore': (OUT / path.name).stat().st_size, 'bytesAfter': path.stat().st_size,
           'integratedLufs': float(levels['input_i']), 'truePeakDbTP': float(levels['input_tp']),
           'mfcc': np.mean([p['mfcc'] for p in probes], axis=0).tolist(),
           'medianF0': float(np.median([p['medianF0'] for p in probes]))}
    rows.append(row)
    print(cat['id'], row['bytesBefore'], '->', row['bytesAfter'], flush=True)
for row in rows:
    nearest = min((r for r in rows if r is not row), key=lambda r: math.dist(row['mfcc'], r['mfcc']))
    distance = math.dist(row['mfcc'], nearest['mfcc'])
    semitones = abs(12 * math.log2(max(1, row['medianF0']) / max(1, nearest['medianF0'])))
    row.update(nearestCat=nearest['id'], nearestMfccDistance=distance, nearestF0Semitones=semitones)
    row['passes'] = (distance >= source['sourceP25'] and
                     (row['sourceRecording'] != nearest['sourceRecording'] or semitones >= 3) and
                     -17 <= row['integratedLufs'] <= -15 and row['truePeakDbTP'] <= -1)
result = {'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'method': '40 kbps mono MP3 fallback encoded from original FLAC bark lines at exact manifest offsets, +0.3dB constant trim for sprite silence; every select/attack/ultimate identity remeasured after decoding. WebM and spoken callouts unchanged.',
          'source': signed(REPORT / 'VOICE-DISTINCT.json'), 'sourceP25': source['sourceP25'],
          'cats': rows, 'published': False}
evidence = REPORT / 'q5/bark-fallback-budget.json'
evidence.write_text(json.dumps(result, indent=2) + '\n')
assert all(r['passes'] for r in rows), 'Reject a loss of identity or level compliance'
for row in rows:
    temporary = ROOT / row['output']['path']
    target = OUT / temporary.name
    target.write_bytes(temporary.read_bytes())
    entry = next(r for r in licences['files'] if r['path'] == str(target.relative_to(ROOT)))
    entry.update(sha256=sha(target), fallbackCodec='MP3 mono 40 kbps', fallbackGainDb=.3,
                 processingDate=result['date'], processingEvidence=str(evidence.relative_to(ROOT)))
    row['output'] = signed(target)
(OUT / 'LICENSES.json').write_text(json.dumps(licences, indent=2) + '\n')
result['published'] = True
result['shippedBytes'] = sum(p.stat().st_size for p in OUT.iterdir() if p.suffix in ['.mp3', '.webm'])
evidence.write_text(json.dumps(result, indent=2) + '\n')
print('Published', len(rows), 'verified fallback banks;', result['shippedBytes'], 'shipped bytes', flush=True)
