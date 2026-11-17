"""Pair private banner context with native text crops; all inputs remain local and unmodified."""
from pathlib import Path
from datetime import datetime, timezone
from PIL import Image, ImageDraw
import hashlib
import json

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A11/banner-r1'
TARGET = OUT / 'comparisons.json'
assert not TARGET.exists(), 'Never overwrite inspected comparisons'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
drills = json.loads((OUT / 'drills.json').read_text())
assert drills['complete'] and drills['pass'] and drills['runtimeUnchanged']
report = {'at': datetime.now(timezone.utc).isoformat(), 'drillsSha256': sha(OUT / 'drills.json'),
          'scope': 'Private same-source comparisons. Each row has reduced full-scene context at640px width and an unscaled384px native crop centered on the title. Neither is production acceptance.',
          'sheets': [], 'reviewComplete': False}
for case in drills['cases']:
    if not case['snapshots']:
        continue
    frames = sorted({s['encodedFrame'] for s in case['snapshots']})
    for frame in frames:
        sample = next(s for s in case['samples'] if s['encodedFrame'] == frame)
        context_height = round(case['height'] * 640 / case['width'])
        row_height = context_height + 28
        board = Image.new('RGB', (1024, row_height * 3), '#211e26')
        draw = ImageDraw.Draw(board)
        rows = []
        for i, mode in enumerate(['baseline', 'vertical', 'obstacles']):
            source = next(s for s in case['snapshots'] if s['encodedFrame'] == frame and s['variant'] == mode)
            path = ROOT / source['path']
            assert sha(path) == source['sha256']
            box = sample['geometry']['title'] if mode == 'baseline' else sample['candidates'][mode]['actual']
            metrics = sample['baseline'] if mode == 'baseline' else sample['candidates'][mode]['metrics']
            with Image.open(path) as im:
                assert im.size == (case['width'], case['height'])
                board.paste(im.resize((640, context_height), Image.Resampling.LANCZOS), (0, i * row_height + 28))
                x = round(max(0, min(im.width - 384, box['x'] + box['width'] / 2 - 192)))
                y = round(max(0, min(im.height - context_height, box['y'] + box['height'] / 2 - context_height / 2)))
                board.paste(im.crop((x, y, x + 384, y + context_height)), (640, i * row_height + 28))
            draw.text((6, i * row_height + 5), f'{case["fixture"]} {case["height"]}p f{frame} | {mode} | HUD{len(metrics["hud"])} faces{len(metrics["faces"])} bodies{len(metrics["bodies"])} labels{len(metrics["labels"])}', fill='white')
            rows.append({'variant': mode, 'source': source, 'nativeCrop': [x, y, x + 384, y + context_height], 'metrics': metrics})
        output = OUT / 'raw' / f'comparison-{case["fixture"]}-{case["height"]}-f{frame}.png'
        assert not output.exists()
        board.save(output)
        report['sheets'].append({'fixture': case['fixture'], 'height': case['height'], 'encodedFrame': frame,
                                 'path': str(output.relative_to(ROOT)), 'sha256': sha(output),
                                 'dimensions': list(board.size), 'rows': rows, 'reviewed': False})
TARGET.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'comparisonSheets': len(report['sheets']), 'reviewed': 0}))
