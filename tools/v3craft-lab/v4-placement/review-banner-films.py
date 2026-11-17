"""Native caption crops from verified films; reuse existing recorders unchanged."""
from pathlib import Path
from datetime import datetime, timezone
from PIL import Image, ImageDraw
import argparse
import gzip
import hashlib
import json
import os
import re
import subprocess

ROOT = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('--attempt', required=True)
parser.add_argument('--verification', default='film-capture-verification.json')
args = parser.parse_args()
assert re.fullmatch(r'r[1-9][0-9]*', args.attempt)
assert re.fullmatch(r'[a-z0-9-]+\.json', args.verification)
OUT = ROOT / ('reports/v4-art/REVIEW/A11/banner-runtime-' + args.attempt)
CAPTURE = ROOT / 'reports/v3-feel/REVIEW' / ('V4-A11-BANNER-' + args.attempt.upper())
RAW = OUT / 'raw/native-banner'
REPORT = OUT / 'native-banner-review.json'
assert not REPORT.exists() and not RAW.exists(), 'Never overwrite review evidence'
read = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
now = lambda: datetime.now(timezone.utc).isoformat()
runtime = read(OUT / 'source-hashes.json')
stable = lambda: all(sha(ROOT / p) == h for p, h in runtime.items())
replay_path = OUT / ('runtime-check-' + args.attempt + '.json')
replay, markers = read(replay_path), read(OUT / 'encoded-markers.json')
assert stable() and replay['pass'] and read(OUT / args.verification)['pass']
assert all(row['pass'] for row in markers)
RAW.mkdir(parents=True)
report = {'started': now(), 'pid': os.getpid(), 'scriptSha256': sha(Path(__file__)),
          'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
          'runtimeHashes': runtime, 'replaySha256': sha(replay_path),
          'markerSha256': sha(OUT / 'encoded-markers.json'),
          'verificationPath': str((OUT / args.verification).relative_to(ROOT)), 'verificationSha256': sha(OUT / args.verification),
          'scope': 'Native512x256 encoded-film crops at first/middle/last available focus samples for every recorded ultimate. Replay geometry locates a generous crop; the encoded pixels still require visual confirmation. No claim of pixel-identical replay or uncaptured action tails.',
          'mappingToleranceMs': 1000 / 30 + 1, 'mappings': [], 'sheets': [], 'fixtures': [],
          'complete': False, 'mappingPass': False, 'reviewComplete': False, 'reviewedCount': 0}
save = lambda: REPORT.write_text(json.dumps(report, indent=2) + '\n')
save()
try:
    for fixture in ('wave1', 'wave3', 'boss'):
        assert stable(), 'Runtime changed during crop extraction'
        path = CAPTURE / fixture / 'capture.json.gz'
        capture = json.loads(gzip.decompress(path.read_bytes()))
        source_matches = subprocess.run(['git', 'diff', '--quiet', capture['sourceCommit'], '--', *runtime], cwd=ROOT).returncode == 0
        assert source_matches and capture['parity'] and not capture['errors']
        video = CAPTURE / (fixture + '.webm')
        assert sha(video) == capture['videoSha256']
        old = next(case for case in replay['cases'] if case['fixture'] == fixture and case['width'] == 1280)
        groups = {}
        for encoded in capture['resampled']:
            frame = capture['frames'][encoded['renderFrame']]
            if frame.get('action') and frame.get('sequence', {}).get('focus'):
                groups.setdefault(frame['action']['key'], []).append((encoded, frame))
        plans = {plan['key']: plan for plan in capture['plans']}
        mappings = []
        for key, samples in groups.items():
            plan = plans[key]
            assert plan['ultimate'], 'Unexpected non-ultimate focus'
            for at in sorted({0, len(samples) // 2, len(samples) - 1}):
                encoded, frame = samples[at]
                matches = [s for s in old['samples'] if s['action']['key'] == key and s['action']['id'] == frame['action']['id']]
                assert matches, (fixture, key, 'Missing installed replay mapping')
                match = min(matches, key=lambda s: abs(s['action']['elapsed'] - frame['action']['elapsed']))
                delta = abs(match['action']['elapsed'] - frame['action']['elapsed'])
                assert delta <= report['mappingToleranceMs'], (fixture, key, delta)
                box = match['candidates']['portrait']['actual']
                x = max(0, min(1280 - 512, round(box['x'] + box['width'] / 2 - 256)))
                y = max(0, min(720 - 256, round(box['y'] + box['height'] / 2 - 128)))
                mappings.append({'fixture': fixture, 'actionKey': key, 'actionId': plan['id'], 'actor': plan['actorId'],
                                 'skill': plan['skillId'], 'encodedFrame': encoded['frame'], 'elapsedMs': frame['action']['elapsed'],
                                 'replayEncodedFrame': match['encodedFrame'], 'replayElapsedMs': match['action']['elapsed'],
                                 'elapsedDifferenceMs': delta, 'crop': [x, y, x + 512, y + 256],
                                 'lastAvailableFocusMs': samples[-1][1]['action']['elapsed'],
                                 'focusEndCaptured': samples[-1][0]['frame'] < len(capture['resampled']) - 1})
        folder = RAW / fixture
        folder.mkdir()
        indices = sorted({mapping['encodedFrame'] for mapping in mappings})
        select = 'select=' + '+'.join(f'eq(n\\,{index})' for index in indices)
        subprocess.run(['ffmpeg', '-v', 'error', '-i', str(video), '-vf', select, '-fps_mode', 'vfr', str(folder / 'frame-%03d.png')], check=True)
        decoded = sorted(folder.glob('frame-*.png'))
        assert len(decoded) == len(indices)
        frames = dict(zip(indices, decoded))
        for start in range(0, len(mappings), 4):
            sheet = Image.new('RGB', (1024, 568), '#211e26')
            draw, slots = ImageDraw.Draw(sheet), []
            for slot, mapping in enumerate(mappings[start:start + 4]):
                x, y = slot % 2 * 512, slot // 2 * 284
                with Image.open(frames[mapping['encodedFrame']]) as frame:
                    assert frame.size == (1280, 720)
                    sheet.paste(frame.crop(mapping['crop']), (x, y + 28))
                draw.text((x + 5, y + 4), f"{fixture} f{mapping['encodedFrame']} {mapping['actor']} {mapping['elapsedMs']:.1f}ms", fill='white')
                slots.append(len(report['mappings']))
                report['mappings'].append(mapping)
            target = RAW / f'{fixture}-{start // 4 + 1:02}.png'
            sheet.save(target)
            report['sheets'].append({'fixture': fixture, 'path': str(target.relative_to(ROOT)), 'sha256': sha(target),
                                     'dimensions': list(sheet.size), 'mappingIndices': slots, 'reviewed': False})
        report['fixtures'].append({'fixture': fixture, 'captureSha256': sha(path), 'videoSha256': sha(video),
                                   'sourceRuntimeMatches': source_matches, 'ultimateWindows': len(groups), 'crops': len(mappings)})
        save()
        print(f'{fixture}: {len(mappings)} native banner crops across {len(groups)} ultimate windows', flush=True)
    report['mappingPass'] = stable() and bool(report['mappings'])
except Exception as error:
    report['error'] = repr(error)
    raise
finally:
    report.update(complete=True, finished=now())
    save()
