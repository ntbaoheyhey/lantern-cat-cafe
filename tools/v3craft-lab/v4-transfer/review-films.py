"""Every encoded action window at 10fps, with whole-field recipients visible."""
from pathlib import Path
from PIL import Image, ImageDraw
import gzip, hashlib, json, math, statistics, subprocess
root = Path('reports/v4-art/REVIEW/A10/transfer')
capture = Path('reports/v3-feel/REVIEW/V4-A10-TRANSFER')
out = root / 'raw/review-pages'
out.mkdir(parents=True, exist_ok=True)
results, pages = [], []
for fixture in ('wave1', 'wave3', 'boss'):
    d = json.loads(gzip.decompress((capture/fixture/'capture.json.gz').read_bytes()))
    actions = []
    for plan in d['plans']:
        start = plan.get('clockStart', plan['at'])
        times = [start+i*.1 for i in range(23 if plan['ultimate'] else 9)]
        if min(times) >= 30 or max(times) < 0:
            continue
        actions.append({'key': plan['key'], 'actor': plan['actorId'], 'ultimate': plan['ultimate'], 'times': times, 'complete': min(times) >= 0 and max(times) < 30})
    last = len(d['resampled'])-1
    frames = sorted({min(last,round(t*30)) for a in actions for t in a['times'] if 0 <= t < 30})
    raw = root / f'raw/decoded/{fixture}'
    raw.mkdir(parents=True, exist_ok=True)
    def expression(values):
        if len(values) == 1: return f'eq(n\\,{values[0]})'
        mid = len(values)//2
        return '('+expression(values[:mid])+'+'+expression(values[mid:])+')'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(capture/(fixture+'.webm')), '-vf', 'select='+expression(frames), '-fps_mode', 'vfr', '-q:v', '2', str(raw/'%04d.jpg')], check=True)
    strips = []
    for action in actions:
        strip = Image.new('RGB', (960, 28+math.ceil(len(action['times'])/3)*198), '#211e26')
        draw = ImageDraw.Draw(strip)
        draw.text((8, 7), f"{fixture} A{action['key']} {action['actor']} {'ULT' if action['ultimate'] else 'basic'} {'COMPLETE' if action['complete'] else 'TRUNCATED / EXCLUDED'}", fill='white')
        for i, t in enumerate(action['times']):
            n = min(last,round(t*30))
            if not 0 <= t < 30 or n not in frames: continue
            ordinal = d['resampled'][n].get('renderFrame')
            assert isinstance(ordinal, int) and 0 <= ordinal < len(d['frames'])
            x, y = i%3*320, 28+i//3*198
            strip.paste(Image.open(raw/f'{frames.index(n)+1:04d}.jpg').resize((320, 180), Image.Resampling.LANCZOS), (x, y))
            draw.text((x+4, y+183), f'{t:.2f}s / marker {ordinal}', fill='white')
        strips.append((action, strip))
    for start in range(0, len(strips), 2):
        group = strips[start:start+2]
        sheet = Image.new('RGB', (960, sum(im.height for _, im in group)), '#211e26'); y = 0
        for _, im in group: sheet.paste(im, (0, y)); y += im.height
        path = out/f'{fixture}-{start//2+1:02d}.jpg'
        assert not path.exists(), 'Do not overwrite reviewed pages'
        sheet.save(path, quality=92)
        pages.append({'path': str(path), 'fixture': fixture, 'actions': [a['key'] for a, _ in group], 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    actual = [f for f in d['frames'] if 0 <= f['t'] < 30]
    results.append({'fixture': fixture, 'actions': actions, 'videoSha256': d['videoSha256'], 'parity': d['parity'], 'errors': d['errors'], 'medianRenderFps': 1/statistics.median(b['t']-a['t'] for a,b in zip(actual,actual[1:])), 'audio': d['audio']})
    print(fixture, len(actions), 'actions', sum(a['complete'] for a in actions), 'complete', flush=True)
(root/'film-review.json').write_text(json.dumps(results, indent=2)+'\n')
(root/'review-pages.json').write_text(json.dumps(pages, indent=2)+'\n')
