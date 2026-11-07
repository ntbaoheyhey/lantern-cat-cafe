"""REFERENCE: docs/design/cardrpg/LOOK-BIBLE.md; memory/PROMPT.md LOOK2(a).
Original deterministic, seamless, colour-neutral DOM material overlays.
Run with Pillow and NumPy; no imported images, renderer or model service.
"""
import argparse
import hashlib
import json
from pathlib import Path
import platform

import numpy as np
from PIL import Image, ImageDraw, ImageFont, __version__ as pillow_version

ROOT = Path(__file__).resolve().parents[2]
SIZE = 256
SEED = 20261107

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def periodic_blur(field, radius):
    """Gaussian convolution on a torus; edges use exactly the same kernel."""
    frequency = np.fft.fftfreq(SIZE)
    xx, yy = np.meshgrid(frequency, frequency)
    kernel = np.exp(-2 * np.pi ** 2 * radius ** 2 * (xx ** 2 + yy ** 2))
    return np.fft.ifft2(np.fft.fft2(field) * kernel).real

def standard(field):
    return (field - field.mean()) / max(float(field.std()), 1e-8)

def overlays():
    rng = np.random.default_rng(SEED)
    noise = rng.standard_normal((SIZE, SIZE))
    paper = .50 * standard(periodic_blur(noise, 1.4)) + .30 * standard(periodic_blur(noise, 8))
    # Short diagonal pulp fibres drawn with wraparound, then softly blended.
    fibres = np.zeros((SIZE, SIZE))
    for _ in range(350):
        x, y = rng.integers(0, SIZE, 2)
        length = int(rng.integers(5, 24))
        slope = rng.uniform(-.5, .5)
        strength = rng.uniform(-1, 1)
        for step in range(length):
            fibres[int(round(y + step * slope)) % SIZE, (x + step) % SIZE] += strength
    paper += .28 * standard(periodic_blur(fibres, .65))
    y, x = np.mgrid[:SIZE, :SIZE]
    warp = np.sin(2 * np.pi * y / 64) * .14
    weave = np.sin(2 * np.pi * x / 8 + warp) * np.cos(2 * np.pi * y / 8)
    felt = .38 * weave + .62 * standard(periodic_blur(rng.standard_normal((SIZE, SIZE)), .62))
    grain = standard(periodic_blur(rng.standard_normal((SIZE, SIZE)), .35))
    return {'paper': (paper, 18), 'felt': (felt, 16), 'grain': (grain, 10)}

def build(output, report, tokens):
    output.mkdir(parents=True, exist_ok=True)
    report.mkdir(parents=True, exist_ok=True)
    rows = []
    preview = Image.new('RGB', (1024, 620), '#102129')
    draw = ImageDraw.Draw(preview)
    font = ImageFont.load_default(size=22)
    small = ImageFont.load_default(size=16)
    palette = tokens.get('palette', {})
    colours = [palette.get('panel', '#233E46'), palette.get('paper', '#E8D7B8')]
    draw.text((24, 18), 'Original material tiles - preparation, not UI acceptance', fill='#FFF0D2', font=font)
    for index, (name, (field, max_alpha)) in enumerate(overlays().items()):
        signed = np.clip(field / 2.8, -1, 1)
        pixels = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)
        pixels[:, :, :3] = np.where(signed[:, :, None] >= 0, 255, 0)
        pixels[:, :, 3] = np.round(np.abs(signed) * max_alpha).astype(np.uint8)
        tile = Image.fromarray(pixels)
        path = output / (name + '.png')
        # Exact indexed RGBA retains every alpha value and avoids bloating the HTML.
        colours_rgba, indices = np.unique(pixels.reshape(-1, 4), axis=0, return_inverse=True)
        indexed = Image.fromarray(indices.reshape(SIZE, SIZE).astype(np.uint8)).convert('P')
        indexed.putpalette(colours_rgba[:, :3].flatten().tolist())
        indexed.info['transparency'] = bytes(colours_rgba[:, 3])
        indexed.save(path, optimize=True)
        decoded = np.asarray(Image.open(path).convert('RGBA'))
        assert np.array_equal(pixels, decoded)
        # A seam should resemble any adjacent edge, not a forced dark/light line.
        composite = np.where(signed >= 0, 1., -1.) * pixels[:, :, 3]
        internal_x = float(np.abs(np.diff(composite, axis=1)).mean())
        internal_y = float(np.abs(np.diff(composite, axis=0)).mean())
        seam_x = float(np.abs(composite[:, 0] - composite[:, -1]).mean())
        seam_y = float(np.abs(composite[0] - composite[-1]).mean())
        assert seam_x < internal_x * 1.5 + .2 and seam_y < internal_y * 1.5 + .2
        rows.append({'path': str(path.relative_to(ROOT)), 'width': SIZE, 'height': SIZE,
                     'bytes': path.stat().st_size, 'sha256': digest(path),
                     'alphaMax': int(decoded[:, :, 3].max()), 'alphaMean': float(decoded[:, :, 3].mean()),
                     'rgbaRoundTripExact': True,
                     'seam': {'x': seam_x, 'y': seam_y, 'ordinaryX': internal_x, 'ordinaryY': internal_y}})
        left = 24 + index * 336
        draw.text((left, 64), name.title(), fill='#FFF0D2', font=font)
        for j, colour in enumerate(colours):
            sample = Image.new('RGBA', (300, 220), colour)
            for xx in range(0, 300, SIZE):
                sample.alpha_composite(tile, (xx, 0))
            preview.paste(sample.convert('RGB'), (left, 104 + j * 246))
        draw.text((left, 586), f'256px tile / alpha <= {max_alpha}/255', fill='#B3C0BA', font=small)
    preview.save(report / 'materials-preview.png', optimize=True)
    source = Path(__file__).resolve()
    receipt = {
        'method': 'Original seeded periodic scalar fields, wrapped pulp fibres and woven sinusoidal relief; alpha-only black/white overlays.',
        'seed': SEED, 'tileSize': SIZE, 'source': str(source.relative_to(ROOT)), 'sourceSha256': digest(source),
        'tools': {'python': platform.python_version(), 'pillow': pillow_version, 'numpy': np.__version__},
        'externalReferences': [], 'modelCalls': 0,
        'usage': 'Static DOM backgrounds behind content, recoloured by LOOK tokens; no changes to 3D or flag-off styling.',
        'acceptance': 'Prepared assets only; browser rendering, real-text contrast and visual before/after still pending.',
        'assets': rows, 'totalBytes': sum(r['bytes'] for r in rows),
        'preview': {'path': str((report / 'materials-preview.png').relative_to(ROOT)),
                    'sha256': digest(report / 'materials-preview.png')},
    }
    (report / 'materials.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--tokens', type=Path)
    args = parser.parse_args()
    tokens = json.loads(args.tokens.read_text()) if args.tokens else {}
    build(ROOT / 'assets/art/cardrpg-look-meta', ROOT / 'reports/cardrpg-big/look-ui', tokens)
