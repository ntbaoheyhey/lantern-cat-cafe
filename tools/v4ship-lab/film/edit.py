#!/usr/bin/env python3
"""Cut real compositor frames and the recorded mix; retain source-time provenance.

LEARN: reports/v4-ship/LEARN/S10.md. This produces preparation, never R2/FINAL.
No generated scenes, audio replacement, speed changes, or fabricated chain proof.
"""
import argparse
import bisect
import gzip
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import textwrap
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[3]
FF = Path('/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg')
FP = FF.with_name('ffprobe')
FPS = 30
TRANSLATIONS = {
    'Shields!': 'Dựng khiên!', 'Lights!': 'Ánh sáng!',
    'Watch the flowers bloom!': 'Ngắm những đóa hoa nở!',
    'Close!': 'Đóng lại!', 'Tangle!': 'Quấn chặt!', 'Bound!': 'Trói lại!',
}


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def relative(path):
    return str(Path(path).relative_to(ROOT))


def save(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def timestamp(seconds, ass=False):
    base = 100 if ass else 1000
    ticks = round(seconds * base)
    hours, ticks = divmod(ticks, 3600 * base)
    minutes, ticks = divmod(ticks, 60 * base)
    secs, fraction = divmod(ticks, base)
    return (f'{hours}:{minutes:02}:{secs:02}.{fraction:02}' if ass else
            f'{hours:02}:{minutes:02}:{secs:02},{fraction:03}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=int)
    parser.add_argument('attempt', type=int)
    args = parser.parse_args()
    out = ROOT / f'work/v4ship-prep/S10-edit-{args.attempt}'
    report_path = ROOT / f'reports/v4-ship/S10/film-edit-{args.attempt}.json'
    if out.exists() or report_path.exists() or (ROOT / 'STOP-V4SHIP').exists():
        raise RuntimeError('Preserve prior output / respect STOP')
    if not FF.is_file():
        raise RuntimeError('An explicit libass-capable ffmpeg-full is required')
    capture_path = ROOT / f'reports/v4-ship/S10/film-capture-{args.capture}.json'
    capture = json.loads(capture_path.read_text())
    if not capture['pass'] or not capture.get('fixtureRollback'):
        raise RuntimeError('Only a verified, rolled-back capture may enter the edit')
    raw = ROOT / capture['raw']
    source_path = raw / 'recording.json'
    recording = json.loads(source_path.read_text())
    if digest(raw / 'audio.webm') != recording['audio']['sha256']:
        raise RuntimeError('Recorded audio changed')
    starts_path = ROOT / capture['audioStarts']['path']
    if digest(starts_path) != capture['audioStarts']['sha256']:
        raise RuntimeError('Audio event log changed')
    starts = json.loads(gzip.decompress(starts_path.read_bytes()))
    for event in starts:
        event['sourceStart'] = event['wallMs'] / 1000 - recording['zero']
        event['sourceEnd'] = event['sourceStart'] + event['durationSeconds']
    voices = [e for e in starts if e['bus'] == 'voice']
    callout_path = ROOT / 'apps/web/src/audio/voice-callouts.json'
    callouts = {x['cueId']: x for x in json.loads(callout_path.read_text())}
    marks = {x['name']: x['at'] for x in capture['marks']}

    # Preserve every transaction action/result and use explicit cuts only in battles.
    # Move boundaries outside speech, never silently clip a spoken callout.
    def speech_safe(t, direction):
        for _ in range(len(voices) + 1):
            hit = next((v for v in voices if v['sourceStart'] - .08 < t < v['sourceEnd'] + .12), None)
            if hit is None:
                return (math.floor(t * FPS) if direction < 0 else math.ceil(t * FPS)) / FPS
            t = hit['sourceStart'] - .1 if direction < 0 else hit['sourceEnd'] + .14
        raise RuntimeError('Could not locate a speech-safe edit')

    cuts = [
        {'name': 'landing-guest-first-battle', 'start': 0, 'end': speech_safe(marks['first-battle'] + 23, 1)},
        {'name': 'trial-result-workshop-boss-start', 'start': speech_safe(marks['reward-ready'] - 6, -1), 'end': speech_safe(marks['boss-battle'] + 10, 1)},
        {'name': 'boss-result-wallet-proof', 'start': speech_safe(marks['proof-ready'] - 10, -1), 'end': math.floor(marks['end'] * FPS) / FPS},
    ]
    cursor = 0
    for i, cut in enumerate(cuts):
        assert 0 <= cut['start'] < cut['end'] <= recording['seconds']
        assert i == 0 or cuts[i - 1]['end'] < cut['start']
        cut['outputStart'] = cursor
        cursor += cut['end'] - cut['start']
        cut['outputEnd'] = cursor
        cut['speed'] = 1
    duration = round(cursor, 6)
    assert 130 <= duration <= 170, f'Unexpected cut length: {duration}'
    for action in capture['actions']:
        assert any(c['start'] <= action['at'] < c['end'] for c in cuts), action['name']

    out.mkdir(parents=True)
    report = {'at': datetime.now(timezone.utc).isoformat(), 'mode': 'PREPARATION ONLY',
              'capture': relative(capture_path), 'captureSha256': digest(capture_path),
              'recordingSha256': digest(source_path), 'audioSha256': digest(raw / 'audio.webm'),
              'calloutSha256': digest(callout_path), 'cuts': cuts, 'seconds': duration,
              'sourceRuntime': capture['buildEvidence'], 'pass': False, 'submissionPass': False,
              'open': ['Public Snowtrace footage absent; no local substitute',
                       'Scheduled integrated R2 and FINAL remain due',
                       'Human listening and caption/readability review remain required']}
    logs = []

    def run(label, command):
        if (ROOT / 'STOP-V4SHIP').exists():
            raise RuntimeError('STOP-V4SHIP')
        print(json.dumps({'step': label, 'status': 'running'}), flush=True)
        result = subprocess.run([str(x) for x in command], cwd=out, capture_output=True, text=True)
        logs.append({'step': label, 'command': [str(x) for x in command], 'exitCode': result.returncode,
                     'stdout': result.stdout, 'stderr': result.stderr})
        (ROOT / f'reports/v4-ship/S10/film-edit-{args.attempt}.log.json.gz').write_bytes(
            gzip.compress(json.dumps(logs, ensure_ascii=False).encode()))
        if result.returncode:
            raise RuntimeError(f'{label} failed; inspect preserved compressed log')
        print(json.dumps({'step': label, 'exitCode': 0}), flush=True)
        return result

    try:
        # A variable-duration image manifest retains real static-frame gaps.
        pictures = recording['pictures']
        times = [p['t'] for p in pictures]
        assert times == sorted(times) and len(set(times)) == len(times)
        lines = ['ffconcat version 1.0']
        selected = {}
        for cut in cuts:
            index = max(0, bisect.bisect_right(times, cut['start']) - 1)
            current = cut['start']
            while current < cut['end'] - 1e-8:
                following = times[index + 1] if index + 1 < len(times) else recording['seconds']
                stop = min(cut['end'], following)
                picture = pictures[index]
                frame = raw / picture['name']
                assert re.fullmatch(r'shot-\d+\.jpg', picture['name'])
                if stop > current:
                    lines += [f"file '{frame}'", 'option framerate 1000', f'duration {stop-current:.9f}']
                    if picture['name'] not in selected:
                        selected[picture['name']] = {'sourceSeconds': picture['t'], 'sha256': digest(frame)}
                current = stop
                index += 1
            last_frame = frame
        lines += [f"file '{last_frame}'", 'option framerate 1000']
        manifest = out / 'frames.ffconcat'
        manifest.write_text('\n'.join(lines) + '\n')
        integrity = ROOT / f'reports/v4-ship/S10/film-frame-integrity-{args.attempt}.json.gz'
        integrity.write_bytes(gzip.compress(json.dumps(selected, sort_keys=True).encode()))
        report['frames'] = {'selected': len(selected), 'manifestSha256': digest(manifest),
                            'integrity': relative(integrity), 'integritySha256': digest(integrity),
                            'firstSourceFrameSeconds': times[0], 'sourceMaxGapSeconds': recording['maxGapSeconds'],
                            'gapTreatment': 'Hold last real compositor frame; no interpolation or synthetic scene'}

        # Narrative descriptions and sound labels share a dedicated caption rail.
        captions = []
        def caption(start, end, en, vi, priority=0, kind='description', cue=None):
            for cut in cuts:
                lo, hi = max(start, cut['start']), min(end, cut['end'])
                if hi > lo:
                    captions.append({'start': cut['outputStart'] + lo - cut['start'],
                                     'end': cut['outputStart'] + hi - cut['start'],
                                     'en': en, 'vi': vi, 'priority': priority, 'kind': kind, 'cue': cue})

        sections = [
            (0, marks['click:Play free'], 'Lantern Cat Café · Local Anvil preparation\n[Game music]', 'Lantern Cat Café · Bản chuẩn bị trên Anvil cục bộ\n[Nhạc trò chơi]'),
            (marks['click:Play free'], marks['first-battle'], 'Play as a guest. Start the trial.', 'Chơi bằng tài khoản khách. Bắt đầu thử thách.'),
            (marks['first-battle'], marks['reward-ready'], 'Protect the café together.\n[Battle impacts and magic]', 'Cùng bảo vệ quán cà phê.\n[Tiếng giao chiến và phép thuật]'),
            (marks['reward-ready'], marks['click:Mint trial reward'], 'Trial complete. Mint the reward on local Anvil.', 'Hoàn thành thử thách. Mint phần thưởng trên Anvil cục bộ.'),
            (marks['click:Mint trial reward'], marks['receipt-ready'], 'Minting the trial reward…', 'Đang mint phần thưởng thử thách…'),
            (marks['receipt-ready'], marks['click:Fund workshop'], 'Receipt: confirmation time, AVAX fee, and payer.', 'Biên nhận: thời gian xác nhận, phí AVAX và người trả.'),
            (marks['click:Fund workshop'], marks['click:Seal Epic'], 'Fund the workshop.', 'Cấp vốn cho xưởng.'),
            (marks['click:Seal Epic'], marks['click:Forge Legendary'], 'Seal an Epic item.', 'Seal vật phẩm Epic.'),
            (marks['click:Forge Legendary'], marks['click:List for 5 YARN'], 'Forge a Legendary item.', 'Rèn vật phẩm Legendary.'),
            (marks['click:List for 5 YARN'], marks['click:Buy with demo wallet'], 'List the item for 5 YARN.', 'Niêm yết vật phẩm với giá 5 YARN.'),
            (marks['click:Buy with demo wallet'], marks['click:Withdraw Spool'], 'Buy with a second local demo wallet.', 'Mua bằng ví demo cục bộ thứ hai.'),
            (marks['click:Withdraw Spool'], marks['click:Face the boss'], 'Withdraw Spool from the café.', 'Rút Spool từ quán cà phê.'),
            (marks['click:Face the boss'], marks['proof-ready'], 'Face the boss together.\n[Battle impacts and magic]', 'Cùng đối đầu trùm.\n[Tiếng giao chiến và phép thuật]'),
            (marks['proof-ready'], marks['proof-ready'] + 10, 'The wallet history links the complete local journey.', 'Lịch sử ví liên kết toàn bộ hành trình cục bộ.'),
            (marks['proof-ready'] + 10, marks['end'], 'Public Fuji Snowtrace footage is still pending.\nThis preparation is not the submission film.', 'Còn thiếu cảnh Snowtrace Fuji công khai.\nBản chuẩn bị này chưa phải phim nộp dự thi.'),
        ]
        for section in sections:
            caption(*section)
        included = []
        for voice in voices:
            intersections = [c for c in cuts if max(c['start'], voice['sourceStart']) < min(c['end'], voice['sourceEnd'])]
            if not intersections:
                continue
            assert len(intersections) == 1
            cut = intersections[0]
            assert cut['start'] <= voice['sourceStart'] and voice['sourceEnd'] <= cut['end'], 'Truncated speech'
            text = callouts[voice['id']]['text']
            translated = TRANSLATIONS[text]  # Unknown speech must be translated before rendering.
            name = callouts[voice['id']]['unitId'].replace('-', ' ').title()
            caption(voice['sourceStart'], voice['sourceEnd'] + .1,
                    f'{name}: {text}', f'{name}: {translated}', 10, 'speech', voice['id'])
            included.append({'id': voice['id'], 'sourceStart': voice['sourceStart'], 'duration': voice['durationSeconds']})
        chimes = []
        for event in starts:
            if event['id'] != 'tx.confirmed':
                continue
            t = event['sourceStart']
            if chimes and t < chimes[-1][1] + .25:
                chimes[-1][1] = max(chimes[-1][1], t + 1.2)
            else:
                chimes.append([t, t + 1.2])
        for start, end in chimes:
            caption(start, end, '[Transaction confirmation chime]',
                    '[Âm báo xác nhận giao dịch]', 2, 'sound')
        for cut in cuts[1:]:
            caption(cut['start'], cut['start'] + 2,
                    '[Battle excerpt · time omitted]', '[Trích đoạn trận đấu · đã lược thời gian]', 5, 'cut')

        # Resolve overlaps explicitly; no invisible subtitles hidden behind other cues.
        boundaries = sorted({0, duration, *(max(0, min(duration, c[k])) for c in captions for k in ('start', 'end'))})
        cues = []
        for lo, hi in zip(boundaries, boundaries[1:]):
            if hi - lo < .001:
                continue
            active = [c for c in captions if c['start'] <= (lo + hi) / 2 < c['end']]
            if not active:
                continue
            chosen = max(active, key=lambda c: (c['priority'], c['start']))
            key = (chosen['en'], chosen['vi'], chosen['kind'], chosen['cue'])
            if cues and cues[-1]['key'] == key and abs(cues[-1]['end'] - lo) < .002:
                cues[-1]['end'] = hi
            else:
                cues.append({'start': lo, 'end': hi, 'en': chosen['en'], 'vi': chosen['vi'],
                             'kind': chosen['kind'], 'cue': chosen['cue'], 'key': key})
        cues = [c for c in cues if c['kind'] == 'speech' or c['end'] - c['start'] >= .5]
        for cue in cues:
            cue.pop('key')
            for language in ('en', 'vi'):
                text = cue[language]
                rows = text.split('\n') if '\n' in text else textwrap.wrap(text, width=74, break_long_words=False)
                assert len(rows) <= 2 and max(map(len, rows)) <= 84
                cue[language] = '\n'.join(rows)
        assert sum(c['kind'] == 'speech' for c in cues) == len(included), 'Speech overlap/loss needs review'
        caption_dir = ROOT / 'docs/v4/film'
        caption_dir.mkdir(exist_ok=True)
        caption_paths = {}
        for language in ('en', 'vi'):
            p = caption_dir / f'preparation-{args.attempt}.{language}.srt'
            assert not p.exists()
            p.write_text('\n\n'.join(f"{i}\n{timestamp(c['start'])} --> {timestamp(c['end'])}\n{c[language]}"
                                    for i, c in enumerate(cues, 1)) + '\n')
            caption_paths[language] = {'path': relative(p), 'sha256': digest(p)}
        ass_header = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,22,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,3,1,0,2,48,48,10,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
        ass = out / 'english.ass'
        ass.write_text(ass_header + '\n'.join(
            f"Dialogue: 0,{timestamp(c['start'], True)},{timestamp(c['end'], True)},Default,,0,0,0,," + c['en'].replace('\n', r'\N')
            for c in cues) + '\n')
        report['captions'] = {'files': caption_paths, 'count': len(cues), 'speechEvents': included,
                              'speechEventsIncluded': len(included), 'truncatedSpeech': 0,
                              'basis': 'Actual source starts and original callout text; human listening review remains open',
                              'rail': {'game': [64, 0, 1152, 648], 'captionArea': [0, 648, 1280, 72]}}
        save(out / 'captions.json', cues)
        save(out / 'edit-decision-list.json', report)

        audio_graph = f'[0:a]asplit={len(cuts)}' + ''.join(f'[s{i}]' for i in range(len(cuts))) + ';'
        audio_graph += ';'.join(f"[s{i}]atrim=start={c['start']:.9f}:end={c['end']:.9f},asetpts=PTS-STARTPTS[a{i}]" for i, c in enumerate(cuts)) + ';'
        audio_graph += ''.join(f'[a{i}]' for i in range(len(cuts))) + f'concat=n={len(cuts)}:v=0:a=1[a]'
        run('cut-original-mix', [FF, '-hide_banner', '-y', '-i', raw / 'audio.webm', '-filter_complex', audio_graph,
                                '-map', '[a]', '-c:a', 'pcm_s24le', 'mix.wav'])
        video_filter = 'fps=30:start_time=0,scale=1152:648:flags=lanczos,pad=1280:720:64:0:black,setsar=1,ass=english.ass,format=yuv420p'
        run('captioned-master', [FF, '-hide_banner', '-y', '-f', 'concat', '-safe', '0', '-i', manifest,
                                '-vf', video_filter, '-t', duration, '-an', '-c:v', 'libx264',
                                '-preset', 'fast', '-crf', '10', '-threads', '4', 'master.mp4'])
        bitrate = min(430000, math.floor((10_000_000 * 8 * .92 / duration - 64000) / 1000) * 1000)
        common = [FF, '-hide_banner', '-y', '-i', 'master.mp4', '-c:v', 'libx264', '-b:v', bitrate,
                  '-preset', 'slow', '-pix_fmt', 'yuv420p', '-threads', '4', '-passlogfile', 'encode-pass']
        run('encode-pass-1', common + ['-pass', '1', '-an', '-f', 'null', '/dev/null'])
        film = out / 'preparation.mp4'
        run('encode-pass-2', [FF, '-hide_banner', '-y', '-i', 'master.mp4', '-i', 'mix.wav',
                              '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-b:v', bitrate,
                              '-preset', 'slow', '-pix_fmt', 'yuv420p', '-threads', '4', '-passlogfile', 'encode-pass',
                              '-pass', '2', '-c:a', 'aac', '-b:a', '64000', '-ar', '48000',
                              '-t', duration, '-movflags', '+faststart', film])
        probe = json.loads(run('probe', [FP, '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', film]).stdout)
        run('full-decode', [FF, '-v', 'error', '-i', film, '-f', 'null', '/dev/null'])
        ssim_log = run('ssim', [FF, '-hide_banner', '-i', film, '-i', 'master.mp4', '-lavfi', '[0:v][1:v]ssim', '-an', '-f', 'null', '/dev/null']).stderr
        audio_log = run('measure-encoded-mix', [FF, '-hide_banner', '-i', film, '-af', 'loudnorm=I=-18:TP=-1:LRA=5:print_format=json', '-vn', '-f', 'null', '/dev/null']).stderr
        loudness, _ = json.JSONDecoder().raw_decode(audio_log[audio_log.rfind('{'):])
        v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        a = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
        seconds = float(probe['format']['duration'])
        report['media'] = {'path': relative(film), 'sha256': digest(film), 'bytes': film.stat().st_size,
                           'seconds': seconds, 'width': v['width'], 'height': v['height'], 'fps': v['avg_frame_rate'],
                           'frames': int(v['nb_read_frames']), 'videoCodec': v['codec_name'], 'audioCodec': a['codec_name'],
                           'videoBitrateTarget': bitrate, 'audioBitrateTarget': 64000,
                           'ssim': float(re.findall(r'All:([0-9.]+)', ssim_log)[-1]),
                           'audioTreatment': 'Recorded mix cut at identical source times; AAC encoding only, no gain/EQ/normalization',
                           'loudness': {k: float(loudness[k]) for k in ['input_i', 'input_tp', 'input_lra']}}
        report['checks'] = {'duration': 130 <= seconds <= 170, 'size': film.stat().st_size <= 10_000_000,
                            'resolution': v['width'] == 1280 and v['height'] == 720, 'fps': v['avg_frame_rate'] == '30/1',
                            'frameCount': abs(int(v['nb_read_frames']) - round(duration * FPS)) <= 1,
                            'audioVideoDuration': abs(float(v['duration']) - float(a['duration'])) <= .05,
                            'decode': True, 'allActionsRetained': True, 'captionFiles': True, 'noClippedSpeech': True}
        report['audioGate'] = {'lufs': -20 <= float(loudness['input_i']) <= -16,
                               'truePeak': float(loudness['input_tp']) <= -1,
                               'lra': float(loudness['input_lra']) >= 5}
        report['pass'] = all(report['checks'].values())
    except Exception as error:
        report['failure'] = str(error)
    finally:
        save(report_path, report)
    print(json.dumps({'report': relative(report_path), 'pass': report['pass'], 'submissionPass': False,
                      'failure': report.get('failure'), 'media': report.get('media')}, ensure_ascii=False), flush=True)
    return 0 if report['pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
