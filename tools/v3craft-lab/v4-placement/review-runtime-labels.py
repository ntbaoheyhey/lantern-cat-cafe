"""Extract native-scale label crops from new, marker-verified films; no recorder changes."""
from pathlib import Path
from datetime import datetime, timezone
from PIL import Image, ImageDraw
import gzip
import hashlib
import json
import os
import subprocess

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A11/placement-runtime-r1'
CAPTURE = ROOT / 'reports/v3-feel/REVIEW/V4-A11-PLACEMENT-R1'
RAW = OUT / 'raw/native-labels-r1'
REPORT = OUT / 'native-label-review-r1.json'
read = lambda p: json.loads(p.read_text())
packed = lambda p: json.loads(gzip.decompress(p.read_bytes()))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert not REPORT.exists() and not RAW.exists(), 'Never overwrite review evidence'
replay = read(OUT / 'runtime-check-r1.json')
markers = read(OUT / 'encoded-markers.json')
runtime = read(OUT / 'source-hashes.json')
assert replay['pass'] and all(r['pass'] for r in markers)
assert all(sha(ROOT / p) == h for p, h in runtime.items())
RAW.mkdir(parents=True)
report = {'started': datetime.now(timezone.utc).isoformat(), 'pid': os.getpid(),
          'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
          'scriptSha256': sha(Path(__file__)), 'replaySha256': sha(OUT / 'runtime-check-r1.json'),
          'markerSha256': sha(OUT / 'encoded-markers.json'),
          'scope': 'Native 512x256 crops from new encoded720p films at the closest sampled elapsed time of the matching plan ordinal. This is fresh semantic evidence, not pixel equivalence to the original defect films.',
          'mappingToleranceMs': 1000 / 30 + 1, 'mappings': [], 'sheets': [],
          'complete': False, 'mappingPass': False, 'reviewComplete': False, 'reviewedCount': 0}
save = lambda: REPORT.write_text(json.dumps(report, indent=2) + '\n')
save()
try:
    for case in (c for c in replay['cases'] if c['height'] == 720):
        fixture = case['fixture']
        old = packed(ROOT / case['capturePath'])
        capture_path = CAPTURE / fixture / 'capture.json.gz'
        current = packed(capture_path)
        video = CAPTURE / (fixture + '.webm')
        marker = next(m for m in markers if m['fixture'] == fixture)
        assert sha(video) == marker['videoSha256'] and sha(capture_path) == marker['captureSha256']
        mappings = []
        for sample in (s for s in case['samples'] if s['retainedDefects']):
            ordinal = next(i for i, p in enumerate(old['plans']) if p['key'] == sample['action']['key'])
            old_plan, new_plan = old['plans'][ordinal], current['plans'][ordinal]
            for key in ('id', 'actorId', 'skillId', 'tier', 'duration', 'impact'):
                assert old_plan[key] == new_plan[key], (fixture, ordinal, key)
            candidates = [(r, current['frames'][r['renderFrame']]) for r in current['resampled']]
            candidates = [(r, f) for r, f in candidates if f.get('action') and f['action']['key'] == new_plan['key']]
            assert candidates, (fixture, ordinal, 'No encoded action sample')
            encoded, frame = min(candidates, key=lambda row: abs(row[1]['action']['elapsed'] - sample['action']['elapsed']))
            delta = frame['action']['elapsed'] - sample['action']['elapsed']
            assert abs(delta) <= report['mappingToleranceMs'], (fixture, ordinal, delta)
            for defect in sample['retainedDefects']:
                actor = next(u for u in frame['units'] if u['id'] == defect['actor'])
                face = actor['faceBox']
                cx = face['x'] + face['width'] / 2 + (60 if actor['side'] == 'party' else -60)
                cy = face['y'] + face['height'] / 2
                x = round(max(0, min(current['width'] - 512, cx - 256)))
                y = round(max(0, min(current['height'] - 256, cy - 128)))
                mappings.append({'fixture': fixture, 'actor': defect['actor'], 'originalDefect': defect['resolution'],
                                 'originalEncodedFrame': sample['encodedFrame'], 'planOrdinal': ordinal,
                                 'actionId': new_plan['id'], 'actionKey': new_plan['key'],
                                 'targetElapsedMs': sample['action']['elapsed'], 'actualElapsedMs': frame['action']['elapsed'],
                                 'elapsedDifferenceMs': delta, 'encodedFrame': encoded['frame'], 'renderFrame': encoded['renderFrame'],
                                 'faceBox': face, 'crop': [x, y, x + 512, y + 256],
                                 'videoSha256': marker['videoSha256'], 'captureSha256': marker['captureSha256']})
        folder = RAW / fixture
        folder.mkdir()
        indices = sorted({m['encodedFrame'] for m in mappings})
        select = 'select=' + '+'.join(f'eq(n\\,{index})' for index in indices)
        subprocess.run(['ffmpeg', '-v', 'error', '-i', str(video), '-vf', select, '-fps_mode', 'vfr',
                        str(folder / 'frame-%03d.png')], check=True)
        decoded = sorted(folder.glob('frame-*.png'))
        assert len(decoded) == len(indices), (fixture, len(decoded), len(indices))
        frames = dict(zip(indices, decoded))
        for start in range(0, len(mappings), 4):
            sheet = Image.new('RGB', (1024, 568), '#211e26')
            draw = ImageDraw.Draw(sheet)
            slots = []
            for slot, mapping in enumerate(mappings[start:start + 4]):
                x, y = slot % 2 * 512, slot // 2 * 284
                with Image.open(frames[mapping['encodedFrame']]) as im:
                    assert im.size == (1280, 720)
                    sheet.paste(im.crop(mapping['crop']), (x, y + 28))
                draw.text((x + 5, y + 4), f"{fixture} f{mapping['encodedFrame']} {mapping['actor']} | old f{mapping['originalEncodedFrame']}", fill='white')
                slots.append(len(report['mappings']))
                report['mappings'].append(mapping)
            target = RAW / f'{fixture}-{start // 4 + 1:02}.png'
            sheet.save(target)
            report['sheets'].append({'fixture': fixture, 'path': str(target.relative_to(ROOT)),
                                      'sha256': sha(target), 'dimensions': list(sheet.size),
                                      'mappingIndices': slots, 'reviewed': False})
        print(f'{fixture}: {len(mappings)} retained-defect crops from {len(indices)} new encoded frames', flush=True)
        save()
    assert len(report['mappings']) == replay['defectInventory'], (len(report['mappings']), replay['defectInventory'])
    report['mappingPass'] = True
except Exception as error:
    report['error'] = str(error)
    raise
finally:
    report['complete'] = True
    report['finished'] = datetime.now(timezone.utc).isoformat()
    save()
