"""Preserve native pixels from existing decoded films for unresolved HUD crops.

This is capture postprocessing only. Each 1280x720 frame is split into two
640x720 halves, stacked without resampling, and saved losslessly under raw/.
"""
from collections import defaultdict
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageChops, ImageDraw

root = Path('reports/v4-art/REVIEW/A10/contrast')
film = json.loads((root / 'film-review.json').read_text())
sources = json.loads((root / 'capture-sources.json').read_text())
output = root / 'coverage-supplements.json'
raw = root / 'raw/coverage-supplements'
raw.mkdir(parents=True, exist_ok=True)
sha = lambda path: hashlib.sha256(Path(path).read_bytes()).hexdigest()
for path, expected in film['sourceHashes'].items():
    assert sha(path) == expected, ('Runtime changed', path)
groups = defaultdict(list)
for index, followup in enumerate(film['coverageFollowups']):
    groups[(followup['fixture'], followup['encodedFrame'])].append(index)
existing = json.loads(output.read_text()) if output.exists() else {'pages': []}
prior = {(p['fixture'], p['encodedFrame']): p for p in existing['pages']}
report = {
    'method': 'Existing 10fps JPEG decode; each full 1280x720 frame is split at x640 and stacked as two 640x720 native-pixel halves with 20px headers. No pixels omitted, scaled, recolored, or recompressed; PNG supplements preserve the decoded JPEG pixels exactly. This does not remove the original decode compression.',
    'sourceHashes': film['sourceHashes'],
    'pages': [],
}
bindings = {}
for fixture in ['wave1', 'wave3', 'boss']:
    bindings[fixture] = json.loads((root / 'raw/hud-films' / fixture / 'source-binding.json').read_text())
    expected = next(x['videoSha256'] for x in film['fixtures'] if x['fixture'] == fixture)
    assert bindings[fixture]['videoSha256'] == expected
    assert sha(Path(sources[fixture]) / (fixture + '.webm')) == expected
for (fixture, frame), indices in sorted(groups.items()):
    assert frame % 3 == 0
    name = f'{frame // 3 + 1:04d}.jpg'
    source = root / 'raw/hud-films' / fixture / name
    source_sha = sha(source)
    assert source_sha == bindings[fixture]['frames'][name]
    path = raw / f'{fixture}-f{frame:04d}.png'
    if (fixture, frame) in prior:
        page = prior[(fixture, frame)]
        assert page['sourceSha256'] == source_sha and page['sha256'] == sha(path)
        assert page['followupIndices'] == indices
    else:
        assert not path.exists(), ('Unindexed supplement', path)
        with Image.open(source) as image:
            image = image.convert('RGB')
            assert image.size == (1280, 720)
            sheet = Image.new('RGB', (640, 1480), '#201c29')
            draw = ImageDraw.Draw(sheet)
            for x, y in [(0, 0), (640, 740)]:
                draw.text((5, y + 4), f'{fixture} / encoded f{frame} / {frame / 30:.2f}s / x{x}..{x + 639} / native pixels', fill='#f2dfb7')
                half = image.crop((x, 0, x + 640, 720))
                sheet.paste(half, (0, y + 20))
                assert ImageChops.difference(half, sheet.crop((0, y + 20, 640, y + 740))).getbbox() is None
            sheet.save(path)
        page = {'fixture': fixture, 'encodedFrame': frame, 'followupIndices': indices,
                'source': str(source), 'sourceSha256': source_sha,
                'videoSha256': bindings[fixture]['videoSha256'], 'path': str(path),
                'sha256': sha(path), 'nativeCopiesMatch': True, 'reviewed': False}
    report['pages'].append(page)
temporary = output.with_suffix('.json.tmp')
temporary.write_text(json.dumps(report, indent=2) + '\n')
temporary.replace(output)
print(f"Prepared {len(report['pages'])} source-bound supplements for {len(film['coverageFollowups'])} followups; recorder unchanged.")
