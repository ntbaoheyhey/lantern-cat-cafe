"""A9 own-ultimate windows: encoded frames at10fps, exact marker association."""
from pathlib import Path
from PIL import Image, ImageDraw
import gzip
import hashlib
import json
import math
import statistics
import subprocess

root = Path.cwd()
out = root / 'reports/v4-art/REVIEW/A9'
assets = ['mochi', 'soot', 'clover', 'panko', 'binding-thread', 'needle-moth', 'teacup-healer', 'yarn-giant']
expected = json.loads((out / 'source-hashes.json').read_text())
reports = []
limits = {'catMedian': ('min', .30), 'catDeviation': ('max', .08), 'left': ('min', .03), 'right': ('min', .03), 'span': ('min', .80), 'gap': ('max', .20), 'boss': ('min', .45)}

def balanced(parts):
    if len(parts) == 1:
        return parts[0]
    middle = len(parts) // 2
    return '(' + balanced(parts[:middle]) + '+' + balanced(parts[middle:]) + ')'

for item, fixtures, after in [('V4-A9-CLARITY', ['wave1', 'wave3', 'boss'], 0), ('V4-A9-TAIL45', ['wave1', 'boss'], 30)]:
    capture = root / 'reports/v3-feel/REVIEW' / item
    for fixture in fixtures:
        data = json.loads(gzip.decompress((capture / fixture / 'capture.json.gz').read_bytes()))
        assert all(hashlib.sha256(subprocess.check_output(['git', 'show', data['sourceCommit'] + ':' + path])).hexdigest() == hash_ for path, hash_ in expected.items()), 'Film source differs from regression'
        assert not data['errors'] and data['parity'], 'Keep failed captures before retrying'
        duration = data['videoSeconds']
        actions = []
        for plan in data['plans']:
            asset = next((a for a in assets if plan['actorId'] == a or plan['actorId'].endswith('-' + a)), None)
            if not asset or not plan['ultimate']:
                continue
            marked = [(shot, data['frames'][shot['renderFrame']]) for shot in data['resampled'] if (data['frames'][shot['renderFrame']].get('action') or {}).get('key') == plan['key']]
            if not marked or marked[-1][0]['frame'] / 30 < after:
                continue
            contact = min(marked, key=lambda pair: abs(pair[1]['action']['elapsed'] - plan['impact']))
            first, last = marked[0][0]['frame'], marked[-1][0]['frame']
            indices = sorted(set(list(range(first, last + 4, 3)) + [contact[0]['frame'], last + 1]))
            late_focus = [{'frame': shot['frame'], 'elapsed': f['action']['elapsed'], 'brightness': f['focus']['brightness']} for shot, f in marked if f['action']['elapsed'] >= 600 and f['focus']['brightness'] < 1 - 1e-8]
            shakes = [{'frame': shot['frame'], 'elapsed': f['action']['elapsed'], 'pixels': math.hypot(f['renderCamera']['x'], f['renderCamera']['y']) * f['field']['width'] / f['renderCamera']['worldWidth']} for shot, f in marked]
            moving = [v for v in shakes if v['pixels'] > 1e-8]
            actions.append({'key': plan['key'], 'actor': plan['actorId'], 'asset': asset, 'own': True, 'ultimate': True, 'duration': plan['duration'], 'impact': plan['impact'], 'events': plan['events'], 'indices': indices, 'impactFrame': contact[0]['frame'], 'markedImpactElapsed': contact[1]['action']['elapsed'], 'impactSamplingErrorMs': abs(contact[1]['action']['elapsed'] - plan['impact']), 'firstElapsed': marked[0][1]['action']['elapsed'], 'lastElapsed': marked[-1][1]['action']['elapsed'], 'complete': min(indices) >= 0 and max(indices) < duration * 30 and marked[0][1]['action']['elapsed'] <= 34 and marked[-1][1]['action']['elapsed'] >= plan['duration'] - 67, 'focusAfter600': late_focus, 'maxShakePx': max(v['pixels'] for v in shakes), 'shakeObservedSpanMs': moving[-1]['elapsed'] - moving[0]['elapsed'] if moving else 0, 'shakeSamplingCaveat': 'Observed first-to-last nonzero samples do not by themselves bound unsampled duration.', 'visualReview': 'PENDING'})
        needed = sorted({n for a in actions for n in a['indices'] if 0 <= n < duration * 30})
        directory = out / 'raw/ultimate-strips' / item / fixture
        directory.mkdir(parents=True, exist_ok=True)
        if needed:
            expression = balanced([f'eq(n\\,{n})' for n in needed])
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(capture / (fixture + '.webm')), '-vf', 'select=' + expression, '-fps_mode', 'vfr', '-q:v', '2', str(directory / '%04d.jpg')], check=True)
        for action in actions:
            sheet = Image.new('RGB', (1024, 28 + math.ceil(len(action['indices']) / 4) * 164), '#211e26')
            draw = ImageDraw.Draw(sheet)
            draw.text((8, 7), f"{item} {fixture} A{action['key']} {action['asset']} OWN ULT | {'COMPLETE' if action['complete'] else 'TRUNCATED'}", fill='white')
            for cell, n in enumerate(action['indices']):
                if n not in needed:
                    continue
                frame = data['frames'][data['resampled'][n]['renderFrame']]
                x, y = cell % 4 * 256, 28 + cell // 4 * 164
                with Image.open(directory / f'{needed.index(n) + 1:04d}.jpg') as im:
                    sheet.paste(im.resize((256, 144), Image.Resampling.LANCZOS), (x, y))
                elapsed = (frame.get('action') or {}).get('elapsed')
                draw.text((x + 3, y + 146), f'{n/30:.2f}s | {elapsed:.0f}ms' if elapsed is not None else f'{n/30:.2f}s | return', fill='white')
            path = directory / f"A{action['key']}-{action['asset']}-ultimate.jpg"
            sheet.save(path, quality=92)
            action['sheet'] = str(path.relative_to(root))
        measurements = []
        for shot in data['resampled']:
            f = data['frames'][shot['renderFrame']]
            units = f['units']; cats = [u for u in units if u['side'] == 'party']; foes = [u for u in units if u['side'] == 'enemy']
            if not cats or not foes:
                continue
            hs = [u['box']['height'] / 720 for u in cats]; median = statistics.median(hs)
            left = min(u['box']['x'] for u in units) / 1280; right = 1 - max(u['box']['x'] + u['box']['width'] for u in units) / 1280
            measurements.append({'frame': shot['frame'], 'renderOrdinal': f['ordinal'], 'catMedian': median, 'catDeviation': max(abs(h / median - 1) for h in hs), 'left': left, 'right': right, 'span': 1 - left - right, 'gap': (min(u['box']['x'] for u in foes) - max(u['box']['x'] + u['box']['width'] for u in cats)) / 1280, 'boss': next((u['box']['height'] / 720 for u in foes if u['kind'] == 'boss'), None)})
        extrema, failures = {}, []
        for metric, (direction, limit) in limits.items():
            values = [v for v in measurements if v[metric] is not None]
            if not values:
                continue
            worst = (min if direction == 'min' else max)(values, key=lambda v: v[metric]); extrema[metric] = worst
            failed = [v for v in values if (v[metric] < limit if direction == 'min' else v[metric] > limit)]
            if failed:
                failures.append({'metric': metric, 'count': len(failed), 'worst': worst})
        frames = [f for f in data['frames'] if 0 <= f['t'] < duration]
        gaps = [b['t'] - a['t'] for a, b in zip(frames, frames[1:])]
        reports.append({'item': item, 'fixture': fixture, 'sourceCommit': data['sourceCommit'], 'videoSha256': data['videoSha256'], 'audio': data['audio'], 'parity': data['parity'], 'errors': data['errors'], 'medianRenderFps': 1 / statistics.median(gaps), 'actions': actions, 'framing': {'samples': len(measurements), 'extrema': extrema, 'failures': failures}, 'scope': 'Own ultimates of the eight featured units. Supplemental review begins after30s; no received-hit window is substituted for an own ultimate.'})
        print(item, fixture, 'own ultimate windows', len(actions), 'complete', sum(a['complete'] for a in actions), 'framing failures', len(failures), flush=True)
(out / 'film-review.json').write_text(json.dumps(reports, indent=2) + '\n')
