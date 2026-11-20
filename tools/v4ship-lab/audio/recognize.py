"""First twelve distinct gameplay lines, cropped from the original full browser mix."""
import argparse, datetime, gzip, hashlib, json, re, subprocess
from pathlib import Path
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('trial')
args = parser.parse_args()
assert re.fullmatch(r'[a-z0-9-]+', args.trial)
folder = ROOT / 'reports/v4-ship/S5' / args.trial
out = folder / 'intelligibility.json'
if out.exists():
    raise RuntimeError('Preserve previous evidence')
capture = json.loads((folder / 'check.json').read_text())
snapshot = folder / 'recognition-capture.json'
if snapshot.exists():
    raise RuntimeError('Preserve prior recognition selection')
snapshot.write_text(json.dumps(capture, indent=2)+'\n')
metadata = {r['cueId']: r for r in json.loads((ROOT / 'apps/web/src/audio/voice-callouts.json').read_text())}
def signed(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
def words(text):
    return re.findall(r"[a-z0-9']+", text.lower())
def accuracy(expected, actual):
    a, b = words(expected), words(actual)
    dp = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        nxt = [i]
        for j, y in enumerate(b, 1):
            nxt.append(min(nxt[-1] + 1, dp[j] + 1, dp[j-1] + (x != y)))
        dp = nxt
    return max(0, 1 - dp[-1] / max(1, len(a)))
selected, seen = [], set()
for scene in capture['rows']:
    source, events = ROOT / scene['capture']['path'], ROOT / scene['events']['path']
    for path, expected in [(source, scene['capture']), (events, scene['events'])]:
        if signed(path)['sha256'] != expected['sha256']:
            raise RuntimeError('Changed capture evidence')
    data = json.loads(gzip.decompress(events.read_bytes()))
    for start in data['starts']:
        cue = start['id']
        if cue not in metadata or cue in seen or start['bus'] != 'voice':
            continue
        req = start.get('request')
        if req is None:
            continue
        at = (req['wallMs'] + start['callPerformanceMs'] - req['performanceMs']) / 1000 - data['started'] + start['when'] - start['callAudioTime']
        duration = start['bufferDuration'] / start['rate']
        if at < .15 or at + duration + .2 > scene['actualSeconds']:
            continue
        seen.add(cue)
        selected.append({'scene': scene['name'], 'cueId': cue, 'expected': metadata[cue]['text'], 'atSeconds': at, 'durationSeconds': duration,
                         'interrupted': start.get('endedAudioTime', start['when'] + duration) < start['when'] + duration - .05,
                         'audio': scene['capture'], 'source': source})
        if len(selected) == 12:
            break
    if len(selected) == 12:
        break
model = WhisperModel('small.en', device='cpu', compute_type='int8', cpu_threads=2, download_root=str(ROOT / 'tools/audio-models'), local_files_only=True)
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'trial': args.trial,
          'method': 'First twelve distinct eligible callouts in scene/capture order; first occurrence only, no substitutions after recognition. Original unnormalized full mix, 150ms pre-roll and 200ms tail. Local small.en CPU/int8, no text prompt, beam5, temperature0, no VAD, no previous-text conditioning. Exact normalized words determine the automated proxy; physical listening remains separate.',
          'captureReport': signed(snapshot), 'rows': []}
for index, item in enumerate(selected):
    source = item.pop('source')
    crop = ROOT / 'work/v4ship-audio' / args.trial / f'line-{index+1:02d}.flac'
    subprocess.run(['ffmpeg', '-v', 'error', '-n', '-ss', str(item['atSeconds']-.15), '-i', str(source), '-t', str(item['durationSeconds']+.35), '-ac', '1', '-ar', '24000', '-c:a', 'flac', str(crop)], check=True)
    segments, _ = model.transcribe(str(crop), language='en', beam_size=5, vad_filter=False, condition_on_previous_text=False, temperature=0)
    recognized = ' '.join(segment.text.strip() for segment in segments)
    score = accuracy(item['expected'], recognized)
    row = {**item, 'recognized': recognized, 'wordAccuracy': score, 'exact': words(item['expected']) == words(recognized), 'crop': signed(crop)}
    report['rows'].append(row)
    report['measured'] = len(report['rows'])
    report['exact'] = sum(r['exact'] and not r['interrupted'] for r in report['rows'])
    report['automatedProxyPass'] = report['measured'] == 12 and report['exact'] >= 10
    report['humanListeningPass'] = None
    out.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: row[k] for k in ['scene','cueId','expected','recognized','wordAccuracy','exact','interrupted']}), flush=True)
if not selected:
    report.update(measured=0, exact=0, automatedProxyPass=False, humanListeningPass=None)
    out.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({k: report[k] for k in ['measured','exact','automatedProxyPass','humanListeningPass']}), flush=True)
