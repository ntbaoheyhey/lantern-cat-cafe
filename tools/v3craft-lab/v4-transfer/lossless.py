"""Compare PNG deflate and exact lossless WebP without changing source pixels."""
import hashlib
import json
import time
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A10/transfer'
RAW = OUT / 'raw'
RAW.mkdir(parents=True, exist_ok=True)
registry = json.loads((ROOT / 'assets/cardrpg-look/spine/slots.json').read_text())
sources = []
for unit in registry['units']:
    if unit['id'] in ('mochi', 'soot', 'clover'):
        atlas = ROOT / unit['placeholder']['atlas']
        sources.append((unit['id'], atlas.parent / atlas.read_text().splitlines()[0]))
for unit in ('panko', 'binding-thread', 'yarn-giant'):
    sources.append((unit, ROOT / f'apps/web/public/units/{unit}/rig-depth.png'))
sha = lambda b: hashlib.sha256(b).hexdigest()
rows = []
for unit, source in sources:
    with Image.open(source) as original:
        rgba = original.convert('RGBA')
        metadata = {k: original.info[k] for k in ('icc_profile',) if k in original.info}
        row = {'unit': unit, 'source': str(source.relative_to(ROOT)),
               'sourceSha256': sha(source.read_bytes()), 'sourceBytes': source.stat().st_size,
               'size': list(rgba.size), 'metadataKeys': list(original.info),
               'rgbaSha256': sha(rgba.tobytes()), 'candidates': []}
        for extension, options in [('png', {'optimize': True, 'compress_level': 9}),
                                   ('webp', {'lossless': True, 'exact': True, 'method': 6})]:
            candidate = RAW / f'{unit}.{extension}'
            started = time.monotonic()
            rgba.save(candidate, **options, **metadata)
            with Image.open(candidate) as check:
                actual = check.convert('RGBA').tobytes()
            result = {'file': str(candidate.relative_to(ROOT)), 'bytes': candidate.stat().st_size,
                      'sha256': sha(candidate.read_bytes()), 'rgbaSha256': sha(actual),
                      'exactRGBA': actual == rgba.tobytes(), 'seconds': time.monotonic() - started}
            row['candidates'].append(result)
            print(unit, extension, result['bytes'], result['exactRGBA'], flush=True)
        rows.append(row)
        (OUT / 'lossless-experiment.json').write_text(json.dumps({'method': 'PNG optimize9 vs WebP lossless exact method6; all RGBA bytes including transparent RGB', 'assets': rows}, indent=2) + '\n')
print('EXPERIMENT_EXIT=0', flush=True)
