"""Consecutive encoded frames for every complete Needle release; markers supply clocks."""
from pathlib import Path
from PIL import Image, ImageDraw
import argparse
import gzip
import json
import math
import subprocess

p = argparse.ArgumentParser()
p.add_argument('--capture-root', default='reports/v3-feel/REVIEW/V4-A7-NEEDLE')
p.add_argument('--out', default='reports/v4-art/REVIEW/A7/needle-moth')
a = p.parse_args()
capture, root = Path(a.capture_root), Path(a.out)
out = root / 'raw/projectile-review'
out.mkdir(parents=True, exist_ok=True)
receipts = []
for fixture in ['wave1', 'wave3', 'boss']:
    d = json.loads(gzip.decompress((capture / fixture / 'capture.json.gz').read_bytes()))
    for plan in d['plans']:
        if 'needle-moth' not in plan['actorId']:
            continue
        if plan['clockStart'] + plan['duration'] / 1000 >= d['videoSeconds']:
            continue
        eligible = [s for s in d['resampled']
                    if (d['frames'][s['renderFrame']].get('action') or {}).get('key') == plan['key']
                    and plan['impact'] - 150 <= d['frames'][s['renderFrame']]['action']['elapsed'] < plan['impact']]
        assert eligible, 'Complete action lacks marked flight interval'
        first = eligible[0]['frame']
        frames = list(range(first, min(first + 6, len(d['resampled']))))
        raw = out / (fixture + '-A' + str(plan['key']))
        raw.mkdir(exist_ok=True)
        expression = '+'.join('eq(n\\,' + str(n) + ')' for n in frames)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(capture / (fixture + '.webm')),
                        '-vf', 'select=' + expression, '-fps_mode', 'vfr', '-q:v', '2', str(raw / '%02d.jpg')], check=True)
        sheet = Image.new('RGB', (1024, 24 + math.ceil(len(frames) / 2) * 310), '#211e26')
        draw = ImageDraw.Draw(sheet)
        draw.text((8, 4), fixture + ' A' + str(plan['key']) + ' / consecutive encoded30fps / ' + ('ultimate' if plan['ultimate'] else 'basic'), fill='white')
        row = {'fixture': fixture, 'key': plan['key'], 'actor': plan['actorId'], 'ultimate': plan['ultimate'],
               'videoSha256': d['videoSha256'], 'frames': [], 'visibleFramesReviewed': None}
        for i, n in enumerate(frames):
            shot = d['resampled'][n]
            frame = d['frames'][shot['renderFrame']]
            action = frame.get('action') or {}
            elapsed = action.get('elapsed') if action.get('key') == plan['key'] else None
            x, y = i % 2 * 512, 24 + i // 2 * 310
            sheet.paste(Image.open(raw / ('%02d.jpg' % (i + 1))).resize((512, 288), Image.Resampling.LANCZOS), (x, y))
            draw.text((x + 4, y + 290), 'frame' + str(n) + ' / marked elapsed ' + str(round(elapsed, 1) if elapsed is not None else 'other action') + 'ms', fill='white')
            row['frames'].append({'encodedFrame': n, 'renderOrdinal': shot['renderFrame'], 'elapsed': elapsed})
        path = out / (fixture + '-A' + str(plan['key']) + '.jpg')
        sheet.save(path, quality=93)
        row['sheet'] = str(path)
        receipts.append(row)
(root / 'projectile-frames.json').write_text(json.dumps(receipts, indent=2) + '\n')
print(json.dumps({'sheets': len(receipts), 'visualFlightCounts': 'pending first review'}))
