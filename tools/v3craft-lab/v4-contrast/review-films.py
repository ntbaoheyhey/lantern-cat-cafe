"""Read encoded HUD strips at10fps; leave the existing recorder untouched."""
from pathlib import Path
from PIL import Image, ImageDraw
import gzip, hashlib, json, math, statistics, subprocess, sys
root = Path('reports/v4-art/REVIEW/A10/contrast')
sources = json.loads((root / 'capture-sources.json').read_text())
raw = root / 'raw/hud-films'
raw.mkdir(parents=True, exist_ok=True)
expected = json.loads((root / 'source-hashes.json').read_text())
existing = root / 'film-review.json'
if existing.exists():
    saved = json.loads(existing.read_text())
    assert saved['sourceHashes'] == expected and len(saved['fixtures']) == 3 and len(saved['pages']) == 36
    assert all(hashlib.sha256(Path(p['path']).read_bytes()).hexdigest() == p['sha256'] for p in saved['pages'])
    print('Preserved existing source-bound36pages and all human notes; no regeneration.')
    sys.exit(0)
composition = json.loads((root / 'runtime-contrast-r2.json').read_text())
report = {'scope': 'Every encoded third frame (10fps) across all three30s films. Native-scale portrait-star crops and projected world-label regions; unchanged poses/blind reads are not re-reviewed.', 'sourceHashes': expected, 'fixtures': [], 'pages': []}
limits = {'catMedian': ('min', .30), 'catDeviation': ('max', .08), 'left': ('min', .03), 'right': ('min', .03), 'span': ('min', .80), 'gap': ('max', .20), 'boss': ('min', .45)}
for fixture in ['wave1', 'wave3', 'boss']:
    capture = Path(sources[fixture])
    d = json.loads(gzip.decompress((capture / fixture / 'capture.json.gz').read_bytes()))
    source = {p: hashlib.sha256(subprocess.check_output(['git', 'show', d['sourceCommit'] + ':' + p])).hexdigest() for p in expected}
    assert source == expected, 'Film source mismatch'
    assert hashlib.sha256((capture / (fixture + '.webm')).read_bytes()).hexdigest() == d['videoSha256']
    decoded = raw / fixture
    decoded.mkdir(exist_ok=True)
    # The standard encoded markers are checked separately against every30fps frame.
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(capture / (fixture + '.webm')), '-vf', 'select=not(mod(n\\,3))', '-fps_mode', 'vfr', '-q:v', '2', str(decoded / '%04d.jpg')], check=True)
    images = sorted(decoded.glob('*.jpg'))
    assert len(images) == 300, len(images)
    proof = next(v for v in composition['variants'] if v['fixture'] == fixture and v['height'] == 720 and v['state'] == 'rest')
    stars = [r['rect'] for r in proof['metadata'] if r['selector'] == '.b3-stars']
    actor_ids = [a['id'] for a in d['initial']['actors']]
    assert len(actor_ids) <= 8 and len(stars) == 4
    metrics = []
    for sample in d['resampled']:
        frame = d['frames'][sample['renderFrame']]
        units = frame['units'];cats = [u for u in units if u['side'] == 'party'];foes = [u for u in units if u['side'] == 'enemy']
        if not cats or not foes:
            continue
        hs = [u['box']['height'] / 720 for u in cats];median = statistics.median(hs)
        left = min(u['box']['x'] for u in units) / 1280;right = 1 - max(u['box']['x'] + u['box']['width'] for u in units) / 1280
        metrics.append({'frame': sample['frame'], 'catMedian': median, 'catDeviation': max(abs(h / median - 1) for h in hs), 'left': left, 'right': right, 'span': 1 - left - right,
            'gap': (min(u['box']['x'] for u in foes) - max(u['box']['x'] + u['box']['width'] for u in cats)) / 1280,
            'boss': next((u['box']['height'] / 720 for u in foes if u['kind'] == 'boss'), None)})
    extrema, failures = {}, []
    for key, (direction, limit) in limits.items():
        values = [v for v in metrics if v[key] is not None]
        if not values:
            continue
        worst = (min if direction == 'min' else max)(values, key=lambda v: v[key])
        extrema[key] = {'value': worst[key], 'frame': worst['frame']}
        bad = [v for v in values if v[key] < limit] if direction == 'min' else [v for v in values if v[key] > limit]
        if bad: failures.append({'metric': key, 'count': len(bad), 'worst': extrema[key]})
    for start in range(0, 300, 25):
        sheet = Image.new('RGB', (1024, 32 + 25 * 68), '#211c2b');draw = ImageDraw.Draw(sheet)
        draw.text((4, 4), fixture + ' / world-label regions in actor order + four portrait-star bands / native pixels /10fps', fill='#ffe9b5')
        for row, n in enumerate(range(start, start + 25)):
            encoded = n * 3;sample = d['resampled'][encoded];frame = d['frames'][sample['renderFrame']]
            im = Image.open(images[n]).convert('RGB');y = 32 + row * 68
            action = frame.get('action') or {}
            draw.text((4, y), f'f{encoded:03d} {encoded/30:05.2f}s / marker{sample["renderFrame"]} / {action.get("actorId","")} {action.get("tier","")}', fill='#ffe9b5')
            unit_map = {u['id']: u for u in frame['units']}
            for slot, aid in enumerate(actor_ids):
                if aid not in unit_map: continue
                u = unit_map[aid];b = u['box'];face = u['faceBox']
                x = max(36, min(1244, face['x'] + face['width'] / 2));anchor_y = max(18, b['y'] - 9)
                crop = im.crop((round(x)-48, round(anchor_y)-50, round(x)+48, round(anchor_y)+4))
                sheet.paste(crop, (slot * 96, y + 14))
            for slot, b in enumerate(stars):
                x = b['x'] + b['width'] / 2;sy = b['y']
                sheet.paste(im.crop((round(x)-32, round(sy)-24, round(x)+32, round(sy)+30)), (768 + slot * 64, y + 14))
        path = raw / f'{fixture}-{start//25+1:02d}.jpg'
        assert not path.exists(), 'Never overwrite inspected sheets'
        sheet.save(path, quality=94)
        report['pages'].append({'path': str(path), 'fixture': fixture, 'encodedStart': start*3, 'encodedEnd': (start+24)*3, 'samples': 25, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'reviewed': False})
    actual = [f for f in d['frames'] if 0 <= f['t'] < 30]
    report['fixtures'].append({'fixture': fixture, 'sourceCommit': d['sourceCommit'], 'hashesVerified': len(source), 'videoSha256': d['videoSha256'], 'samples10fps': 300, 'encodedFramingSamples': len(metrics), 'extrema': extrema, 'framingFailures': failures, 'parity': d['parity'], 'errors': d['errors'], 'medianRenderFps': 1/statistics.median(b['t']-a['t'] for a,b in zip(actual,actual[1:])), 'audio': d['audio'], 'actions': len(d['plans'])})
    print(fixture, 'samples300/pages12/framing failures', len(failures), flush=True)
    (root / 'film-review.json').write_text(json.dumps(report, indent=2) + '\n')
