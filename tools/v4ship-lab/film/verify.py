#!/usr/bin/env python3
"""Verify a preparation film's original frames, speech, captions and delivery.

LEARN: reports/v4-ship/LEARN/S10-explorer-headless.md.
Consumes preserved renderer/decode logs; does not claim human review or FINAL.
"""
import argparse
from datetime import datetime, timezone
from decimal import Decimal
import gzip
import hashlib
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[3]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    data = path.read_bytes()
    return json.loads(gzip.decompress(data) if path.suffix == '.gz' else data)


def binding(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': sha(path)}


def stamp(text):
    h, m, s = text.replace(',', '.').split(':')
    return int(h) * 3600 + int(m) * 60 + float(s)


def subtitles(path):
    rows = []
    for index, block in enumerate(path.read_text().strip().split('\n\n'), 1):
        number, times, text = block.split('\n', 2)
        assert int(number) == index
        start, end = map(stamp, times.split(' --> '))
        rows.append({'start': start, 'end': end, 'text': text})
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('attempt', type=int)
    parser.add_argument('--regression', required=True, type=Path)
    parser.add_argument('--prior-regression', required=True, type=Path)
    args = parser.parse_args()
    assert not (ROOT / 'STOP-V4SHIP').exists()
    output = ROOT / f'reports/v4-ship/S10/film-verify-{args.attempt}.json'
    assert not output.exists(), 'Preserve previous evidence'
    render_path = ROOT / f'reports/v4-ship/S10/film-edit-{args.attempt}.json'
    render = read(render_path)
    work = ROOT / f'work/v4ship-prep/S10-edit-{args.attempt}'
    capture_path = ROOT / render['capture']
    assert sha(capture_path) == render['captureSha256']
    capture = read(capture_path)
    assert capture['pass'] and capture['fixtureRollback'] and not capture['errors']
    raw = ROOT / capture['raw']
    recording = read(raw / 'recording.json')
    assert sha(raw / 'recording.json') == render['recordingSha256']
    assert sha(raw / 'audio.webm') == render['audioSha256'] == recording['audio']['sha256']
    integrity_path = ROOT / render['frames']['integrity']
    assert sha(integrity_path) == render['frames']['integritySha256']
    frames = read(integrity_path)
    originals = {row['name']: row['t'] for row in recording['pictures']}
    for name, row in frames.items():
        assert originals[name] == row['sourceSeconds']
        assert sha(raw / name) == row['sha256']
    assert len(frames) == render['frames']['selected']
    assert sha(work / 'frames.ffconcat') == render['frames']['manifestSha256']
    cuts = render['cuts']
    assert all(c['speed'] == 1 for c in cuts)
    for action in capture['actions']:
        assert any(c['start'] <= action['at'] < c['end'] for c in cuts), action['name']
    retained_marks = ['landing', 'first-battle', 'reward-ready', 'receipt-ready', 'boss-battle', 'proof-ready']
    for mark in capture['marks']:
        if mark['name'] in retained_marks:
            assert any(c['start'] <= mark['at'] < c['end'] for c in cuts), mark['name']
    cues = read(work / 'captions.json')
    tracks = {}
    for language, source in render['captions']['files'].items():
        path = ROOT / source['path']
        assert sha(path) == source['sha256']
        tracks[language] = subtitles(path)
        assert len(tracks[language]) == len(cues) == render['captions']['count']
        for i, (actual, cue) in enumerate(zip(tracks[language], cues)):
            assert actual['text'] == cue[language]
            assert abs(actual['start'] - cue['start']) <= .000501
            assert abs(actual['end'] - cue['end']) <= .000501
            assert 0 <= actual['start'] < actual['end'] <= render['seconds'] + .001
            assert not i or actual['start'] >= tracks[language][i-1]['end']
    assert [(r['start'], r['end']) for r in tracks['en']] == [(r['start'], r['end']) for r in tracks['vi']]
    ass = [line.split(',', 9) for line in (work / 'english.ass').read_text().splitlines() if line.startswith('Dialogue:')]
    assert len(ass) == len(cues)
    for row, cue in zip(ass, cues):
        assert row[9].replace('\\N', '\n') == cue['en']
        assert abs(stamp(row[1]) - cue['start']) <= .005001
        assert abs(stamp(row[2]) - cue['end']) <= .005001
    starts_path = ROOT / capture['audioStarts']['path']
    assert sha(starts_path) == capture['audioStarts']['sha256']
    included, speech = [], [c for c in cues if c['kind'] == 'speech']
    max_speech_error = 0
    for event in read(starts_path):
        if event['bus'] != 'voice':
            continue
        start = event['wallMs'] / 1000 - recording['zero']
        end = start + event['durationSeconds']
        for cut in cuts:
            if start < cut['end'] and end > cut['start']:
                assert start >= cut['start'] and end <= cut['end'], event['id']
                target = cut['outputStart'] + start - cut['start']
                matches = [c for c in speech if c['cue'] == event['id'] and abs(c['start'] - target) < .001]
                assert len(matches) == 1 and matches[0]['end'] >= target + event['durationSeconds']
                serialized = tracks['en'][cues.index(matches[0])]
                max_speech_error = max(max_speech_error, abs(serialized['start'] - target) * 1000)
                included.append({'id': event['id'], 'sourceStart': start, 'duration': event['durationSeconds']})
    assert included == render['captions']['speechEvents'] and len(included) == len(speech)
    assert not render['captions']['truncatedSpeech']
    film = ROOT / render['media']['path']
    assert sha(film) == render['media']['sha256'] and film.stat().st_size == render['media']['bytes']
    log_path = ROOT / f'reports/v4-ship/S10/film-edit-{args.attempt}.log.json.gz'
    logs = {r['step']: r for r in read(log_path)}
    assert all(r['exitCode'] == 0 for r in logs.values())
    assert str(film) in logs['full-decode']['command'] and not logs['full-decode']['stderr'].strip()
    probe = json.loads(logs['probe']['stdout'])
    video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    audio = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
    assert 130 <= float(probe['format']['duration']) <= 170 and film.stat().st_size <= 10_000_000
    assert (video['width'], video['height'], video['avg_frame_rate']) == (1280, 720, '30/1')
    assert int(video['nb_read_frames']) == render['media']['frames'] == round(render['seconds'] * 30)
    assert abs(float(video['duration']) - float(audio['duration'])) <= .05
    loudness = json.loads(re.search(r'\{\s*"input_i"[\s\S]*?\}', logs['measure-encoded-mix']['stderr']).group())
    assert {k: float(loudness[k]) for k in render['media']['loudness']} == render['media']['loudness']
    assert -20 <= float(loudness['input_i']) <= -16 and float(loudness['input_tp']) <= -1 and float(loudness['input_lra']) >= 5
    explorer = render['explorer']
    assert explorer and sha(ROOT / explorer['evidence']['path']) == explorer['evidence']['sha256']
    evidence = read(ROOT / explorer['evidence']['path'])
    row = next(r for r in evidence['rows'] if r['name'] == 'webkit')
    assert row['publicExplorerFootagePass'] and row['httpStatus'] == 200
    assert all(row['before'].values()) and all(row['after'].values()) and not row['errors'] and not row['teardownErrors']
    assert explorer['video'] == row['video'] and sha(ROOT / row['video']['path']) == row['video']['sha256']
    hold_start = (row['verifiedHoldStartedMs'] - row['pageCreatedMs']) / 1000
    assert hold_start + 2 <= explorer['sourceStart']
    assert explorer['sourceStart'] + explorer['seconds'] <= hold_start + row['verifiedHoldMs'] / 1000 - 2
    assert explorer['sourceStart'] + explorer['seconds'] <= float(row['probe']['format']['duration'])
    assert not any(s.get('codec_name') in ['opus', 'aac', 'vorbis'] for s in row['probe']['streams'])
    rpc_path = ROOT / explorer['feeRpcEvidence']['path']
    assert sha(rpc_path) == explorer['feeRpcEvidence']['sha256']
    rpc = read(rpc_path)
    assert evidence['url'].endswith('/' + rpc['transactionHash']) and rpc['status'] == 1 and rpc['chainId'] == 43113
    assert Decimal(explorer['feeAvax']) == Decimal(int(rpc['gasUsed']) * int(rpc['effectiveGasPriceWei'])) / Decimal(10**18)
    assert cues[-1]['kind'] == 'public-explorer' and explorer['feeAvax'] in cues[-1]['en']
    assert abs(cues[-1]['start'] - explorer['outputStart']) < .001 and abs(cues[-1]['end'] - explorer['outputEnd']) < .001
    regression_path = ROOT / args.regression / 'check.json'
    regression = read(regression_path)
    assert regression['complete'] and sha(ROOT / regression['log']['path']) == regression['log']['sha256']
    comparisons = []
    for directory in [args.prior_regression, args.regression]:
        p = ROOT / directory / 'log.jsonl.gz'
        rows = [json.loads(line) for line in gzip.decompress(p.read_bytes()).decode().splitlines()]
        text = ''.join(r['text'] for r in rows if r['name'] == 'web')
        text = re.sub(r'\x1b\[[0-9;]*m', '', text)
        failures = re.findall(r'^\s*FAIL\s+(.+)$', text, re.M)
        comparisons.append({**binding(p), 'failures': failures})
    same_failures = comparisons[0]['failures'] == comparisons[1]['failures'] and len(comparisons[1]['failures']) == 7
    assert same_failures
    assert {r['name']: r['exitCode'] for r in regression['rows']} == {'server': 0, 'rules': 0, 'web': 1, 'typecheck': 0, 'parity-probe': 0, 'build': 0}
    delivery = ROOT / f'reports/v4-ship/S10/preparation-{args.attempt}.mp4'
    assert not delivery.exists()
    archives = []
    for source in evidence['rows']:
        src = ROOT / source['video']['path']
        dest = ROOT / f"reports/v4-ship/S10/explorer-source-1-{source['name']}.webm"
        assert not dest.exists() and sha(src) == source['video']['sha256']
        archives.append((src, dest))
    before = sum(p.stat().st_size for p in (ROOT / 'reports/v4-ship').rglob('*') if p.is_file())
    assert before + film.stat().st_size + sum(s.stat().st_size for s, _ in archives) + 100000 < 150_000_000
    shutil.copyfile(film, delivery)
    for src, dest in archives:
        shutil.copyfile(src, dest)
        assert sha(src) == sha(dest)
    assert sha(delivery) == sha(film)
    report = {'at': datetime.now(timezone.utc).isoformat(), 'scope': 'Preparation film source/caption/delivery verification; no screenshots, image opens or native desktop access',
              'harness': binding(Path(__file__)), 'render': binding(render_path), 'decodeAndMeasurementLog': binding(log_path),
              'delivery': {**binding(delivery), 'bytes': delivery.stat().st_size, 'byteEqualToMeasuredRender': True},
              'frames': {'selected': len(frames), 'allSelectedOriginalNamesTimesAndHashesMatch': True, 'manifestHashMatches': True},
              'actions': {'allRetained': True, 'count': len(capture['actions']), 'unchangedSpeed': True},
              'captions': {'count': len(cues), 'enViTimingIdentical': True, 'orderedNonOverlappingInFilm': True, 'matchesRenderCuePlan': True,
                           'englishAssTextAndTimingMatch': True, 'completeSpeechEvents': len(included), 'maxSerializedSpeechStartErrorMs': max_speech_error, 'humanListeningAndReadabilityPassed': False},
              'explorer': {'sourceArchives': [{**binding(d), 'bytes': d.stat().st_size} for _, d in archives], 'acceptedEngine': 'webkit', 'rejectedEngine': 'chromium-full',
                           'realPublicSourceBound': True, 'rpcFeeMatchesCaption': True, 'timing': explorer['timingMethod'], 'humanReadabilityPass': False},
              'audio': render['media']['loudness'], 'audioGate': render['audioGate'], 'mediaChecks': render['checks'],
              'regression': {'check': binding(regression_path), 'comparison': comparisons, 'sameSevenArtFailures': same_failures, 'G-REG': False, 'officialClassParityGate': False},
              'reportsBytesAfterDelivery': sum(p.stat().st_size for p in (ROOT / 'reports/v4-ship').rglob('*') if p.is_file()),
              'technicalPreparationPass': True, 'submissionPass': False, 'open': render['open']}
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'report': str(output.relative_to(ROOT)), 'deliveryBytes': delivery.stat().st_size, 'sourceFrames': len(frames), 'captions': len(cues), 'voices': len(included), 'technicalPreparationPass': True, 'submissionPass': False}))


if __name__ == '__main__':
    main()
