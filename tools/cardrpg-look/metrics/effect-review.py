"""Original source-bound runtime sheets and strict before/after pair deltas."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument('root', type=Path)
parser.add_argument('--before', type=Path)
args = parser.parse_args()
capture = json.loads((args.root / 'captures.json').read_text())
owners = {}
for row in capture['rows']:
    owner = row['id'].split('-')[0] if ':' not in row['id'] else row['id'].split(':')[0]
    owners.setdefault(owner, []).append(row)
for owner, rows in owners.items():
    for first in range(0, len(rows), 4):
        selected = rows[first:first + 4]
        sheet = Image.new('RGB', (1200, len(selected) * 238), '#172e36')
        draw = ImageDraw.Draw(sheet)
        for y, row in enumerate(selected):
            for x, frame in enumerate([1, 3, 4]):
                im = Image.open(row['frames'][frame]['real']).convert('RGB')
                im.thumbnail((400, 214), Image.Resampling.LANCZOS)
                sheet.paste(im, (x * 400, y * 238 + 24))
                draw.text((x * 400 + 5, y * 238 + 5),
                          f"{row['id']} / t={capture['framesAt'][frame]}", fill='#f7e9ca')
        sheet.save(args.root / f'{owner}-runtime-{first // 4 + 1}.png')
if args.before:
    before = json.loads((args.before / 'uniqueness.json').read_text())
    after = json.loads((args.root / 'uniqueness.json').read_text())
    old = {tuple(sorted([r['left'], r['right']])): r for r in before['pairs']}
    pairs = []
    for row in after['pairs']:
        key = tuple(sorted([row['left'], row['right']]))
        if key in old:
            pairs.append({'left': row['left'], 'right': row['right'],
                          'before': old[key]['distance'], 'after': row['distance'],
                          'delta': row['distance'] - old[key]['distance']})
    regressions = [r for r in pairs if r['delta'] < -1e-6]
    result = {'beforeArtifact': before['sha256'], 'afterArtifact': after['sha256'],
              'beforeReceiptSha256': hashlib.sha256((args.before / 'uniqueness.json').read_bytes()).hexdigest(),
              'afterReceiptSha256': hashlib.sha256((args.root / 'uniqueness.json').read_bytes()).hexdigest(),
              'comparison': 'Original threshold/signatures unchanged; numeric pair regressions reported separately, not waived.',
              'pairs': pairs, 'numericRegressions': len(regressions),
              'worstDelta': min((r['delta'] for r in pairs), default=0),
              'thresholdOffenders': after['offenders'], 'faceOffenders': after['faceOffenders'],
              'overdrawOffenders': after['overdrawOffenders']}
    (args.root / 'comparison.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ['numericRegressions', 'worstDelta']}))
