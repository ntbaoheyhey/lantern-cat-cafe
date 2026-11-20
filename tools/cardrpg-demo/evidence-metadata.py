"""Compare captured pixels and recheck original asset hashes (Pillow required).

This reads existing captures; it does not modify images or rerun the browser.
Run from the integrated checkout after isolation-check.mjs completes.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageChops

root = Path(__file__).resolve().parents[2]
report = root / 'reports/cardrpg'


def read(path):
    return json.loads((root / path).read_text())


def digest(path):
    return hashlib.sha256((root / path).read_bytes()).hexdigest()


pixels = []
for width, height in [(1024, 600), (1280, 720), (1440, 900)]:
    before = f'reports/cardrpg/isolation/{width}-before.png'
    after = f'reports/cardrpg/isolation/{width}-after.png'
    a, b = Image.open(root / before).convert('RGBA'), Image.open(root / after).convert('RGBA')
    assert a.size == b.size == (width, height)
    difference = ImageChops.difference(a, b)
    changed = sum(pixel != (0, 0, 0, 0) for pixel in difference.getdata())
    pixels.append(dict(width=width, height=height, differingPixels=changed,
                       beforeSha256=digest(before), afterSha256=digest(after)))
(report / 'isolation/pixels.json').write_text(json.dumps(pixels, indent=2) + '\n')
assert all(row['differingPixels'] == 0 for row in pixels), pixels

procedural = read('assets/cardrpg/procedural-manifest.json')
models = read('docs/turn3d/ASSET-MANIFEST.json')
portraits = read('assets/cardrpg/portraits/manifest.json')['records']
records = []
for item in procedural['sourceSha256'] + models['assets'] + models['portraits'] + portraits:
    path = item.get('path', item.get('output'))
    actual = digest(path)
    records.append(dict(path=path, passHash=actual == item['sha256'], sha256=actual))
(report / 'validation/provenance.json').write_text(json.dumps(records, indent=2) + '\n')
assert len(records) == 33 and all(row['passHash'] for row in records)
sources = {item['path']: item['sha256'] for portrait in portraits for item in portrait['sourceSha256']}
assert all(digest(path) == expected for path, expected in sources.items())
print(json.dumps(dict(pixelComparisons=pixels, originalAssetHashes=len(records),
                      portraitSourceHashes=len(sources))))
