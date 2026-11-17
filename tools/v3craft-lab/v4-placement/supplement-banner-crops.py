"""Preserve failed replay-located crops and add film-located native supplements."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A11/banner-runtime-r2'
REPORT = OUT / 'native-banner-review.json'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
report = json.loads(REPORT.read_text())
atlas = json.loads((OUT / 'crop-location-atlas.json').read_text())
assert atlas['reviewed'] and not report['reviewComplete']
assert not report.get('supplementsCreatedAt'), 'Never overwrite supplemental crops'
assert all(sha(ROOT / p) == h for p, h in report['runtimeHashes'].items())
groups = [('wave1', [0, 1, 2], [380, 420, 892, 676]),
          ('wave3', [27, 28, 29], [0, 420, 512, 676])]
for fixture, indices, box in groups:
    frames = sorted({m['encodedFrame'] for m in report['mappings'] if m['fixture'] == fixture})
    sources = sorted((OUT / 'raw/native-banner' / fixture).glob('frame-*.png'))
    assert len(frames) == len(sources)
    decoded = dict(zip(frames, sources))
    sheet = Image.new('RGB', (1024, 568), '#211e26')
    draw = ImageDraw.Draw(sheet)
    bindings = []
    for slot, index in enumerate(indices):
        mapping = report['mappings'][index]
        assert mapping['fixture'] == fixture and mapping['bannerFullyVisible'] is False
        source = decoded[mapping['encodedFrame']]
        x, y = slot % 2 * 512, slot // 2 * 284
        with Image.open(source) as frame:
            assert frame.size == (1280, 720)
            sheet.paste(frame.crop(box), (x, y + 28))
        draw.text((x + 5, y + 4), f"{fixture} f{mapping['encodedFrame']} Panko +{mapping['elapsedMs']:.1f}ms", fill='white')
        mapping['originalCropFullyVisible'] = False
        bindings.append({'mappingIndex': index, 'encodedFrame': mapping['encodedFrame'],
                         'crop': box, 'sourcePath': str(source.relative_to(ROOT)),
                         'sourceSha256': sha(source)})
    target = OUT / 'raw/native-banner' / (fixture + '-supplement-r1.png')
    assert not target.exists()
    sheet.save(target)
    report['sheets'].append({'fixture': fixture, 'path': str(target.relative_to(ROOT)),
                             'sha256': sha(target), 'dimensions': list(sheet.size),
                             'mappingIndices': indices, 'supplement': True,
                             'sourceBindings': bindings, 'reviewed': False})
report['supplementsCreatedAt'] = datetime.now(timezone.utc).isoformat()
report['supplementScriptSha256'] = sha(Path(__file__))
report['originalMissingCaptionMappings'] = list(report['missingCaptionMappings'])
REPORT.write_text(json.dumps(report, indent=2) + '\n')
print('Created 2 new sheets / 6 native crops; visual coverage remains pending.')
