"""L6 scratch packing and decode checks; never rewrites the runtime manifest.

Sources are real Blender renders. Downsampling uses premultiplied colour;
lossless WebP must decode to exactly the intended RGBA pixels at both scales.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument('--kind', choices=['icons', 'portraits', 'frames'], required=True)
parser.add_argument('--round', type=int, required=True)
args = parser.parse_args()
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
source = HERE / (f'round-{args.round}' if args.kind == 'icons' else f'{args.kind}-round-{args.round}')
out = HERE / f'{args.kind}-packed-round-{args.round}'
out.mkdir(exist_ok=True)
width, height = (64, 64) if args.kind == 'icons' else (256, 320)
names = sorted(p.stem for p in source.glob('*.png'))
expected = {'icons': 48, 'portraits': 12, 'frames': 4}[args.kind]
assert len(names) == expected, (args.kind, names)
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
rows = []
for name in names:
    path = source / f'{name}.png'
    image = Image.open(path).convert('RGBA')
    assert image.size == (width * 4, height * 4), (name, image.size)
    alpha = np.array(image.getchannel('A'))
    assert not max(alpha[:2].max(), alpha[-2:].max(), alpha[:, :2].max(), alpha[:, -2:].max()), name
    outputs = {}
    for scale in [1, 2]:
        resized = image.convert('RGBa').resize((width * scale, height * scale), Image.Resampling.LANCZOS).convert('RGBA')
        delivered = out / f'{name}-{scale}x.webp'
        resized.save(delivered, 'WEBP', lossless=True, exact=True, method=6)
        decoded = Image.open(delivered).convert('RGBA')
        assert decoded.size == resized.size and decoded.tobytes() == resized.tobytes(), name
        decoded_alpha = np.array(decoded.getchannel('A'))
        if args.kind == 'frames':
            h, w = decoded_alpha.shape
            assert not decoded_alpha[int(h * .25):int(h * .75), int(w * .25):int(w * .75)].max(), name
        outputs[f'{scale}x'] = {'file': str(delivered.relative_to(ROOT)), 'size': list(decoded.size),
                                'bytes': delivered.stat().st_size, 'sha256': sha(delivered),
                                'rgbaSha256': hashlib.sha256(decoded.tobytes()).hexdigest(), 'decodeExact': True}
    rows.append({'id': name, 'source': str(path.relative_to(ROOT)), 'sourceSha256': sha(path),
                 'display': [width, height], 'outputs': outputs,
                 'alphaCoverage': float((alpha > 8).mean()), 'sourceBorderAlphaMax': 0})

# Both light and dark backplates expose fringes and weak silhouettes.
columns = 8 if args.kind == 'icons' else 4
for tone, color in [('dark', '#233e46'), ('light', '#f5ebdc')]:
    tile_width, tile_height = width + 24, height + 35
    sheet = Image.new('RGB', (columns * tile_width, math.ceil(len(rows) / columns) * tile_height), color)
    draw = ImageDraw.Draw(sheet)
    for i, row in enumerate(rows):
        x, y = i % columns * tile_width, i // columns * tile_height
        im = Image.open(ROOT / row['outputs']['1x']['file']).convert('RGBA')
        sheet.paste(im, (x + 12, y + 25), im)
        draw.text((x + 4, y + 6), row['id'], fill='#fff1d2' if tone == 'dark' else '#233e46')
    sheet.save(out / f'{args.kind}-{tone}.png')

if args.kind == 'icons':
    for scale in [1, 2]:
        padding, side = 2 * scale, width * scale
        stride = side + padding * 2
        atlas = Image.new('RGBA', (8 * stride, 6 * stride))
        for index, row in enumerate(rows):
            x, y = index % 8 * stride + padding, index // 8 * stride + padding
            im = Image.open(ROOT / row['outputs'][f'{scale}x']['file']).convert('RGBA')
            atlas.paste(im, (x, y))
            row.setdefault('atlas', {})[f'{scale}x'] = {'rect': [x, y, side, side], 'padding': padding}
        atlas.save(out / f'skills-atlas-{scale}x.webp', 'WEBP', lossless=True, exact=True, method=6)
        assert Image.open(out / f'skills-atlas-{scale}x.webp').convert('RGBA').tobytes() == atlas.tobytes()

receipt = {'kind': args.kind, 'round': args.round, 'status': 'scratch packed; visual review pending',
           'packing': '4x rendered source, premultiplied Lanczos downsample, lossless WebP exact RGBA',
           'scriptSha256': sha(Path(__file__)), 'images': rows,
           'deliveredBytes': sum(o['bytes'] for row in rows for o in row['outputs'].values())}
(out / 'packing.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'kind': args.kind, 'images': len(rows), 'files': len(rows) * 2,
                  'bytes': receipt['deliveredBytes'], 'decodeExact': True, 'visualReviewPending': True}))
