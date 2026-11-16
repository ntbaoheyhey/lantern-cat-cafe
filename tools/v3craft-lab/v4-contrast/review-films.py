"""Read encoded HUD strips at10fps; leave the existing recorder untouched."""
from pathlib import Path
from PIL import Image, ImageDraw
import fcntl, gzip, hashlib, json, math, statistics, subprocess
root = Path('reports/v4-art/REVIEW/A10/contrast')
sources = json.loads((root / 'capture-sources.json').read_text())
raw = root / 'raw/hud-films'
raw.mkdir(parents=True, exist_ok=True)
expected = json.loads((root / 'source-hashes.json').read_text())
existing = root / 'film-review.json'
lock = (raw / 'review.lock').open('w')
fcntl.flock(lock, fcntl.LOCK_EX)
report = {'scope': 'Every encoded third frame (10fps) across all three30s films. Native-scale portrait stars and wider projected world-label regions; these are not recorded DOM bounds. Unchanged poses/blind reads are not re-reviewed.', 'sourceHashes': expected, 'fixtures': [], 'pages': []}
if existing.exists():
    report = json.loads(existing.read_text())
    assert report['sourceHashes'] == expected, 'Existing report belongs to another runtime'
    assert all(hashlib.sha256(Path(p['path']).read_bytes()).hexdigest() == p['sha256'] for p in report['pages'])
    for page in report['pages']:
        page['reviewRequired'] = page.get('layoutVersion') == 2
    report['scope'] = 'Every encoded third frame (10fps). V2 uses176x54 native-pixel world-label regions and four64x54 portrait-star regions. Projection uses face-box centre/body top, not recorded DOM bounds; exact counter coverage remains a separate open gate. Earlier pages/notes are retained unchanged.'
composition = json.loads((root / 'runtime-contrast-r2.json').read_text())
def save():
    temporary = existing.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(report, indent=2) + '\n')
    temporary.replace(existing)
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
    images = sorted(decoded.glob('*.jpg'))
    if not images:
        subprocess.run(['ffmpeg', '-nostdin', '-n', '-v', 'error', '-i', str(capture / (fixture + '.webm')), '-vf', 'select=not(mod(n\\,3))', '-fps_mode', 'vfr', '-q:v', '2', str(decoded / '%04d.jpg')], check=True)
        images = sorted(decoded.glob('*.jpg'))
    assert len(images) == 300, len(images)
    assert [p.name for p in images] == [f'{n:04d}.jpg' for n in range(1, 301)]
    decoded_manifest = {'videoSha256': d['videoSha256'], 'frames': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in images}}
    binding = decoded / 'source-binding.json'
    if binding.exists():
        assert json.loads(binding.read_text()) == decoded_manifest, 'Decoded frames/source changed'
    else:
        binding.write_text(json.dumps(decoded_manifest, indent=2) + '\n')
    proof = next(v for v in composition['variants'] if v['fixture'] == fixture and v['height'] == 720 and v['state'] == 'rest')
    stars = [r['rect'] for r in proof['metadata'] if r['selector'] == '.b3-stars']
    actor_ids = [a['id'] for a in d['initial']['actors']]
    assert len(actor_ids) <= 10 and len(stars) == 4
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
    for start in range(0, 300, 15):
        path = raw / f'{fixture}-hud-v2-{start//15+1:02d}.jpg'
        saved = next((p for p in report['pages'] if p['path'] == str(path)), None)
        if saved:
            assert saved['sha256'] == hashlib.sha256(path.read_bytes()).hexdigest()
            continue
        sheet = Image.new('RGB', (1024, 32 + 15 * 124), '#211c2b');draw = ImageDraw.Draw(sheet)
        draw.text((4, 4), fixture + ' / five actor crops per row; two star crops at right / native pixels /10fps', fill='#ffe9b5')
        for row, n in enumerate(range(start, start + 15)):
            encoded = n * 3;sample = d['resampled'][encoded];frame = d['frames'][sample['renderFrame']]
            im = Image.open(images[n]).convert('RGB');y = 32 + row * 124
            action = frame.get('action') or {}
            draw.text((4, y), f'f{encoded:03d} {encoded/30:05.2f}s / marker{sample["renderFrame"]} / {action.get("actorId","")} {action.get("tier","")}', fill='#ffe9b5')
            unit_map = {u['id']: u for u in frame['units']}
            for slot, aid in enumerate(actor_ids):
                if aid not in unit_map: continue
                u = unit_map[aid];b = u['box'];face = u['faceBox']
                x = max(36, min(1244, face['x'] + face['width'] / 2));anchor_y = max(18, b['y'] - 9)
                crop = im.crop((round(x)-88, round(anchor_y)-50, round(x)+88, round(anchor_y)+4))
                sheet.paste(crop, (slot % 5 * 176, y + 14 + slot // 5 * 54))
            for slot, b in enumerate(stars):
                x = b['x'] + b['width'] / 2;sy = b['y']
                sheet.paste(im.crop((round(x)-32, round(sy)-24, round(x)+32, round(sy)+30)), (880 + slot % 2 * 64, y + 14 + slot // 2 * 54))
        assert not path.exists(), 'Never overwrite inspected sheets'
        sheet.save(path, quality=94)
        report['pages'].append({'path': str(path), 'fixture': fixture, 'encodedStart': start*3, 'encodedEnd': (start+14)*3, 'samples': 15, 'layoutVersion': 2, 'reviewRequired': True, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'reviewed': False})
        save()
    actual = [f for f in d['frames'] if 0 <= f['t'] < 30]
    result = {'fixture': fixture, 'sourceCommit': d['sourceCommit'], 'hashesVerified': len(source), 'videoSha256': d['videoSha256'], 'samples10fps': 300, 'encodedFramingSamples': len(metrics), 'extrema': extrema, 'framingFailures': failures, 'parity': d['parity'], 'errors': d['errors'], 'medianRenderFps': 1/statistics.median(b['t']-a['t'] for a,b in zip(actual,actual[1:])), 'audio': d['audio'], 'actions': len(d['plans']), 'actorCount': len(actor_ids)}
    prior = next((f for f in report['fixtures'] if f['fixture'] == fixture), None)
    if prior: prior.update(result)
    else: report['fixtures'].append(result)
    print(fixture, 'samples300/v2pages20/framing failures', len(failures), flush=True)
    save()
