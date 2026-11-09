"""Draft packer for original 6x6 Blender frames. Not yet executed on art.

WebP stores the explicitly premultiplied channel bytes. Runtime must upload with
premultiplyAlpha:none and use ONE/ONE_MINUS_SRC_ALPHA (not multiply alpha twice).
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument('root', type=Path)
args = parser.parse_args()
families = ['smoke', 'steam', 'flame', 'sparkle', 'yarn-dust', 'ribbon']
rows = []
for family in families:
    source = args.root / 'source' / family
    atlas = np.zeros((1536, 1536, 4), dtype=np.uint8)
    preview = Image.new('RGB', (1536, 1568), '#172e36')
    draw = ImageDraw.Draw(preview)
    draw.text((12, 9), family + ' / 36 original Blender frames / premultiplied runtime atlas', fill='#f7e9ca')
    frames = []
    for index in range(36):
        path = source / f'{index:03}.png'
        image = Image.open(path).convert('RGBA')
        assert image.size == (256, 256), (family, index, image.size)
        rgba = np.array(image, dtype=np.uint16)
        rgba[:, :, :3] = (rgba[:, :, :3] * rgba[:, :, 3:4] + 127) // 255
        y, x = (index // 6) * 256, (index % 6) * 256
        atlas[y:y + 256, x:x + 256] = rgba.astype(np.uint8)
        preview.paste(image, (x, y + 32), image)
        frames.append({'frame': index, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                       'visiblePixels': int((rgba[:, :, 3] > 4).sum()),
                       'borderAlphaMax': int(max(rgba[0, :, 3].max(), rgba[-1, :, 3].max(), rgba[:, 0, 3].max(), rgba[:, -1, 3].max()))})
    target = args.root / f'{family}.webp'
    # Lossless preserves the premultiplied edge relation exactly, including RGB=0 at alpha=0.
    Image.fromarray(atlas, 'RGBA').save(target, 'WEBP', lossless=True, method=6, exact=True)
    decoded = np.array(Image.open(target).convert('RGBA'))
    assert np.array_equal(atlas, decoded), family + ' lossless roundtrip failed'
    assert np.all(decoded[:, :, :3] <= decoded[:, :, 3:4]), family + ' not premultiplied'
    preview.save(args.root / f'{family}-contact.webp', 'WEBP', quality=92, method=6)
    rows.append({'family': family, 'file': str(target), 'bytes': target.stat().st_size,
                 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'size': [1536, 1536],
                 'grid': [6, 6], 'frames': frames, 'alpha': 'premultiplied encoded RGB',
                 'roundtripExact': True, 'sampler': 'linear, clamp-to-edge, no mipmaps; half-pixel cell clamp'})
receipt = {'source': str(Path(__file__)), 'sourceSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
           'rows': rows, 'totalBytes': sum(row['bytes'] for row in rows)}
(args.root / 'packing.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'families': len(rows), 'bytes': receipt['totalBytes']}))
