"""Reduce immutable production films; LEARN/A2.md. No recorder changes."""
from pathlib import Path
import gzip, json, math, statistics, subprocess, sys
from PIL import Image, ImageDraw

root = Path('reports/v4-art/REVIEW/A2')
selected = sys.argv[1] if len(sys.argv) > 1 else None
out = root / 'raw' / ('action-strips-r7' if selected else 'action-strips-r6')
out.mkdir(parents=True, exist_ok=True)
all_results = [r for r in json.loads((root/'film-framing.json').read_text()) if r['fixture'] != selected] if selected else []
for fixture in ['wave1', 'wave3', 'boss']:
    if selected and fixture != selected: continue
    capture = root / fixture / 'capture.json.gz'
    if not capture.exists():
        continue
    d = json.loads(gzip.decompress(capture.read_bytes()))
    frames = [f for f in d['frames'] if 0 <= f['t'] <= 30 and f['units']]
    values = []
    for f in frames:
        units = f['units']; cats = [u for u in units if u['side'] == 'party']
        foes = [u for u in units if u['side'] == 'enemy']
        hs = [u['box']['height'] / d['height'] for u in cats]
        if not hs or not foes:
            continue
        median = statistics.median(hs)
        left = min(u['box']['x'] for u in units) / d['width']
        right = 1 - max(u['box']['x'] + u['box']['width'] for u in units) / d['width']
        gap = (min(u['box']['x'] for u in foes) - max(u['box']['x'] + u['box']['width'] for u in cats)) / d['width']
        values.append({'t': f['t'], 'ordinal': f['ordinal'], 'action': f.get('action'),
                       'catMedian': median, 'catDeviation': max(abs(v / median - 1) for v in hs),
                       'left': left, 'right': right, 'span': 1-left-right, 'gap': gap,
                       'boss': next((u['box']['height']/d['height'] for u in foes if u['kind']=='boss'), None)})
    limits = {'catMedian': ('min', .30), 'catDeviation': ('max', .08), 'left': ('min', .03),
              'right': ('min', .03), 'span': ('min', .80), 'gap': ('max', .20), 'boss': ('min', .45)}
    extrema = {}; failures = []
    for key, (direction, limit) in limits.items():
        valid = [f for f in values if f[key] is not None]
        if not valid:
            continue
        worst = (min if direction == 'min' else max)(valid, key=lambda f: f[key])
        extrema[key] = {k: worst[k] for k in [key, 't', 'ordinal', 'action']}
        failing = [f for f in valid if f[key] < limit] if direction == 'min' else [f for f in valid if f[key] > limit]
        if failing:
            failures.append({'metric': key, 'count': len(failing), 'worst': extrema[key]})
    image_dir = out / fixture
    image_dir.mkdir(exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(root/(fixture+'.webm')), '-vf',
                    'fps=30,scale=112:63', '-q:v', '2', str(image_dir/'%04d.jpg')], check=True)
    actions = []
    for p in d['plans']:
        if p['at'] >= 30:
            continue
        start = p.get('clockStart', p['at']); impact = start + p['impact']/1000
        times = [impact-.3+i*.1 for i in range(9)]
        actions.append({'key': p['key'], 'actor': p['actorId'], 'skill': p['skillId'], 'ultimate': p['ultimate'],
                        'start': start, 'impact': impact, 'times': times, 'truncated': min(times)<0 or max(times)>=30})
    for page in range(math.ceil(len(actions)/14)):
        batch = actions[page*14:(page+1)*14]
        sheet = Image.new('RGB', (1024, len(batch)*94+24), '#221f29'); draw = ImageDraw.Draw(sheet)
        draw.text((8, 5), f'{fixture}: every contact window, 10fps, -300 to +500ms. Small framing overview; inspect extrema separately.', fill='white')
        for row, a in enumerate(batch):
            y = 24+row*94
            draw.text((8, y), f'A{a["key"]:02} {a["actor"] or "ROUND"} {a["skill"]} | impact {a["impact"]:.3f}s', fill='white')
            for i,t in enumerate(a['times']):
                p = image_dir/f'{round(t*30)+1:04d}.jpg'
                if 0<=t<30 and p.exists():
                    sheet.paste(Image.open(p), (8+i*112, y+17))
                else:
                    draw.text((8+i*112, y+37), 'OUTSIDE', fill='#ffa86a')
        sheet.save(out/f'{fixture}-{page+1:02}.jpg', quality=88)
    for p in image_dir.glob('*.jpg'):
        p.unlink()
    image_dir.rmdir()
    result = {'fixture': fixture, 'frames':len(frames), 'videoSha256':d['videoSha256'],
              'extrema':extrema, 'failures':failures, 'actions':actions,
              'cameraConfigurations':len({json.dumps(f['camera'],sort_keys=True) for f in frames}),
              'parity':d['parity'], 'errors':d['errors'],
              'method':'Every actual rendered frame, current posed opaque bounds; visual action strips from encoded film. Overlap uses separate painted-mask probe; this reducer does not claim film alpha occlusion.'}
    all_results.append(result)
    print(fixture, len(frames), 'frames', len(actions), 'actions', 'failures:', [(f['metric'],f['count']) for f in failures])
(root/'film-framing.json').write_text(json.dumps(all_results,indent=2)+'\n')
