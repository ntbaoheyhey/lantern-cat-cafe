"""Review all completed 900p captures without touching the original movies."""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib
import json
import statistics
import subprocess

root = Path('reports/v4-art/REVIEW/A7/yarn-giant')
limits = {'catMedian': ('min', .30), 'catDeviation': ('max', .08),
          'left': ('min', .03), 'right': ('min', .03),
          'span': ('min', .80), 'gap': ('max', .20), 'boss': ('min', .45)}
results = []
for fixture in ['wave1', 'wave3', 'boss']:
    folder = root / 'raw' / (fixture + '-900') / fixture
    metadata = folder / 'capture.json'
    d = json.loads(metadata.read_text())
    assert (d['width'], d['height']) == (1440, 900)
    source_commit = d['_meta']['sourceCommit']
    expected_hashes = json.loads((root / 'source-hashes.json').read_text())
    captured_hashes = {p: hashlib.sha256(subprocess.check_output(['git', 'show', source_commit + ':' + p])).hexdigest() for p in expected_hashes}
    assert captured_hashes == expected_hashes, '900p runtime differs from validated film source'
    values = []
    for f in d['frames']:
        units = f['units']
        cats = [u for u in units if u['side'] == 'party']
        foes = [u for u in units if u['side'] == 'enemy']
        if not cats or not foes:
            continue
        hs = [u['box']['height'] / d['height'] for u in cats]
        median = statistics.median(hs)
        left = min(u['box']['x'] for u in units) / d['width']
        right = 1 - max(u['box']['x'] + u['box']['width'] for u in units) / d['width']
        values.append({'t': f['t'], 'index': f['index'], 'catMedian': median,
                       'catDeviation': max(abs(h / median - 1) for h in hs),
                       'left': left, 'right': right, 'span': 1 - left - right,
                       'gap': (min(u['box']['x'] for u in foes) -
                               max(u['box']['x'] + u['box']['width'] for u in cats)) / d['width'],
                       'boss': next((u['box']['height'] / d['height'] for u in foes if u['kind'] == 'boss'), None)})
    extrema, failures = {}, []
    for key, (direction, limit) in limits.items():
        valid = [v for v in values if v[key] is not None]
        if not valid:
            continue
        worst = (min if direction == 'min' else max)(valid, key=lambda v: v[key])
        extrema[key] = {'value': worst[key], 't': worst['t'], 'index': worst['index']}
        failing = [v for v in valid if (v[key] < limit if direction == 'min' else v[key] > limit)]
        if failing:
            failures.append({'metric': key, 'count': len(failing), 'worst': extrema[key]})
    own = [f['index'] for f in d['frames'] if f['action'] and
           'yarn-giant' in f['action']['actorId'] and 350 <= f['action']['elapsed'] < 384]
    indices = [extrema[f['metric']]['index'] for f in failures]
    indices += [0] + own[:1] + [extrema['catDeviation']['index'], extrema['gap']['index']]
    if fixture == 'boss':
        indices += [extrema['boss']['index']]
    available = sorted(int(p.stem.split('-')[1]) for p in folder.glob('frame-*.png'))
    indices = list(dict.fromkeys(min(available, key=lambda n: abs(n - i)) for i in indices))[:4]
    sheet = Image.new('RGB', (1024, 688), '#211e26')
    draw = ImageDraw.Draw(sheet)
    for slot, index in enumerate(indices):
        with Image.open(folder / f'frame-{index:05}.png') as im:
            tile = im.convert('RGB').resize((512, 320), Image.Resampling.LANCZOS)
        x, y = slot % 2 * 512, slot // 2 * 344
        sheet.paste(tile, (x, y + 24))
        draw.text((x + 8, y + 6), f'900p {fixture} | frame {index} | {index / d["fps"]:.2f}s', fill='white')
    path = root / 'raw' / f'layout900-{fixture}.jpg'
    assert not path.exists(), 'Never regenerate an already inspected sheet'
    sheet.save(path, quality=92)
    result = {'fixture': fixture, 'captureSha256': hashlib.sha256(metadata.read_bytes()).hexdigest(),
              'sourceCommit': source_commit, 'runtimeSourceHashesVerified': len(captured_hashes),
              'frames': len(d['frames']), 'seconds': d['seconds'], 'parity': d['parity'], 'errors': d['errors'],
              'extrema': extrema, 'failures': failures, 'reviewFrameIndices': indices,
              'sheet': str(path), 'visuallyReviewed': False}
    results.append(result)
    print(fixture, 'samples', len(values), 'failures', [f['metric'] for f in failures])
result = {'method': 'Unmodified silent fixed-clock 1440x900 capture; bbox layout only, not audio, FPS, alpha occlusion or HUD proof.',
          'fixtures': results, 'failures': [{'fixture': r['fixture'], **f} for r in results for f in r['failures']]}
(root / 'layout900.json').write_text(json.dumps(result, indent=2) + '\n')
