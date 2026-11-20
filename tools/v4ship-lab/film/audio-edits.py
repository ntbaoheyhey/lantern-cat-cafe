"""Compare predeclared real-footage cuts using the unchanged recorded mix.

LEARN: reports/v4-ship/LEARN/S11-film-audio.md. Audio-only diagnostics cannot
replace a rebuilt and verified audiovisual film or genuine explorer footage.
"""
from pathlib import Path
import copy, datetime, gzip, hashlib, json, math, subprocess, sys

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]
assert attempt.isdecimal() and not (root / 'STOP-V4SHIP').exists()
folder = root / 'work/v4ship-prep' / ('S11-film-audio-' + attempt)
output = root / 'reports/v4-ship/S11' / ('film-audio-comparison-' + attempt + '.json')
log_path = output.with_name(output.stem + '.log.json.gz')
assert not folder.exists() and not output.exists()
folder.mkdir(parents=True)
ff = '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
edit_path = root / 'reports/v4-ship/S10/film-edit-1.json'
edit = json.loads(edit_path.read_text())
capture_path = root / edit['capture']
assert sha(capture_path) == edit['captureSha256']
capture = json.loads(capture_path.read_text())
assert capture['pass'] and capture['fixtureRollback']
raw = root / capture['raw']
recording = json.loads((raw / 'recording.json').read_text())
assert sha(raw / 'recording.json') == edit['recordingSha256']
assert sha(raw / 'audio.webm') == recording['audio']['sha256'] == edit['audioSha256']
assert sha(root / capture['audioStarts']['path']) == capture['audioStarts']['sha256']
starts = json.loads(gzip.decompress((root / capture['audioStarts']['path']).read_bytes()))
voices = [(v['wallMs'] / 1000 - recording['zero'], v['wallMs'] / 1000 - recording['zero'] + v['durationSeconds']) for v in starts if v['bus'] == 'voice']
baseline = json.loads((root / 'reports/v4-ship/S10/film-verify-1.json').read_text())
assert sha(root / baseline['path']) == baseline['sha256']
logs, rows = [], []

def run(label, args):
    assert not (root / 'STOP-V4SHIP').exists()
    print(json.dumps({'step': label, 'status': 'running'}), flush=True)
    result = subprocess.run([ff, '-hide_banner', '-nostats', *map(str, args)], capture_output=True, text=True)
    logs.append({'step': label, 'args': args, 'exitCode': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr})
    log_path.write_bytes(gzip.compress(json.dumps(logs, default=str).encode(), mtime=0))
    if result.returncode:
        raise RuntimeError('Film audio command failed; preserved log: ' + label)
    return result

report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'sourceCapture': {'path': str(capture_path.relative_to(root)), 'sha256': sha(capture_path)}, 'sourceAudio': {'path': str((raw / 'audio.webm').relative_to(root)), 'sha256': sha(raw / 'audio.webm')}, 'harness': {'path': str(Path(__file__).relative_to(root)), 'sha256': sha(Path(__file__))}, 'methods': ['Existing edit', 'Twelve additional seconds of first battle', 'Twelve additional seconds of boss battle'], 'audioTreatment': 'Original source mix at unchanged gain, EQ, rate and channel mapping; source-time cuts and identical 64 kbps AAC encoding only.', 'rows': rows, 'complete': False, 'submissionPass': False}
try:
    for name, extend in [('original', None), ('longer-first-battle', 0), ('longer-boss-battle', 1)]:
        cuts = copy.deepcopy(edit['cuts'])
        if extend is not None:
            end = cuts[extend]['end'] + 12
            for _ in range(len(voices) + 1):
                hit = next(((lo, hi) for lo, hi in voices if lo - .08 < end < hi + .12), None)
                if hit is None:
                    break
                end = hit[1] + .14
            cuts[extend]['end'] = math.ceil(end * 30) / 30
        cursor = 0
        for i, cut in enumerate(cuts):
            assert 0 <= cut['start'] < cut['end'] <= recording['seconds']
            assert i == 0 or cuts[i - 1]['end'] < cut['start']
            for lo, hi in voices:
                if max(lo, cut['start']) < min(hi, cut['end']):
                    assert cut['start'] <= lo and hi <= cut['end'], 'Speech clipped'
            cut['outputStart'] = cursor
            cursor += cut['end'] - cut['start']
            cut['outputEnd'] = cursor
        assert 130 <= cursor <= 170
        assert all(any(c['start'] <= action['at'] < c['end'] for c in cuts) for action in capture['actions'])
        audio = root / baseline['path'] if extend is None else folder / (name + '.m4a')
        if extend is not None:
            graph = '[0:a]asplit=3[s0][s1][s2];' + ';'.join(f"[s{i}]atrim=start={c['start']:.9f}:end={c['end']:.9f},asetpts=PTS-STARTPTS[a{i}]" for i, c in enumerate(cuts)) + ';[a0][a1][a2]concat=n=3:v=0:a=1[a]'
            run(name + '-encode', ['-i', raw / 'audio.webm', '-filter_complex', graph, '-map', '[a]', '-c:a', 'aac', '-b:a', '64000', '-ar', '48000', '-t', cursor, audio])
        measured = run(name + '-measure', ['-i', audio, '-af', 'loudnorm=I=-18:TP=-1:LRA=5:print_format=json', '-vn', '-f', 'null', '/dev/null']).stderr
        levels, _ = json.JSONDecoder().raw_decode(measured[measured.rfind('{'):])
        loudness = {key: float(levels[key]) for key in ['input_i', 'input_tp', 'input_lra']}
        gates = {'duration': 130 <= cursor <= 170, 'lufs': -20 <= loudness['input_i'] <= -16, 'truePeak': loudness['input_tp'] <= -1, 'lra': loudness['input_lra'] >= 5, 'allActions': True, 'noClippedSpeech': True}
        rows.append({'method': name, 'cuts': cuts, 'seconds': cursor, 'audio': {'path': str(audio.relative_to(root)), 'sha256': sha(audio)}, 'loudness': loudness, 'gates': gates, 'candidateAudioPass': all(gates.values())})
        output.write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps(rows[-1]), flush=True)
    report['complete'] = True
    passing = [row for row in rows if row['candidateAudioPass']]
    report['selected'] = passing[0]['method'] if passing else None
    report['decision'] = 'The first predeclared passing cut may proceed to full audiovisual rendering; all encoded-film and human checks remain required.' if passing else 'Neither predeclared longer excerpt fixes all gates. Preserve failures; change method before further retries.'
finally:
    report['log'] = {'path': str(log_path.relative_to(root)), 'sha256': sha(log_path)} if log_path.exists() else None
    output.write_text(json.dumps(report, indent=2) + '\n')
