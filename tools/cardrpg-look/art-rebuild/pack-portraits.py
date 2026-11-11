"""Derive opt-in portraits/icons from our reviewed masters; no model calls.

The manifest is delivered to Lane U without changing the shell or default assets.
Runtime identity review remains separate from source/packing validation.
"""
import hashlib
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'assets/cardrpg-look/v3-portraits'
REPORT = ROOT / 'reports/cardrpg-look/art-rebuild/r3'
CATS = 'mochi soot clover panko mallow cinnamon velvet biscuit brioche marigold sorrel inkcap'.split()
FOES = 'button-guard sock-skipper spool-ram needle-moth teacup-healer binding-thread practice-cushion pollen-scout crumb-sentinel rain-spool yarn-giant kettle-knight pantry-crown'.split()
OUT.mkdir(parents=True, exist_ok=True)
REPORT.mkdir(parents=True, exist_ok=True)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path):
    return str(path.relative_to(ROOT))


def backdrop(width, height, hostile=False):
    image = Image.new('RGBA', (width, height))
    pixels = image.load()
    for y in range(height):
        for x in range(width):
            glow = math.exp(-(((x / width - .42) / .65) ** 2 + ((y / height - .32) / .62) ** 2) * 2)
            base = (25, 22, 32) if hostile else (16, 33, 41)
            tint = (43, 16, 18) if hostile else (20, 35, 29)
            pixels[x, y] = tuple(int(base[i] + tint[i] * glow) for i in range(3)) + (255,)
    return image


def save_pair(image, stem, display):
    paths, hashes = {}, {}
    for scale in (1, 2):
        path = OUT / f'{stem}-{scale}x.webp'
        image.resize(tuple(v * scale for v in display), Image.Resampling.LANCZOS).save(path, 'WEBP', quality=92, method=6)
        paths[f'{scale}x'], hashes[f'{scale}x'] = relative(path), sha(path)
    return paths, hashes


manifest = dict(version=3, style='Painted night cafe', pathBase='repository-root',
                enabledBy='lookV2 && lookArt=v3; Lane U adoption only',
                status='SOURCE_REVIEW_REQUIRED; runtime roster identity review pending',
                portraits={}, skills={}, frames={}, sourcePolicy='Existing original built-in image_gen masters; no new generation or external images')
portraits = []
for unit in CATS + FOES:
    path = ROOT / f'assets/source/look-v3/concepts/{unit}.png'
    source = Image.open(path).convert('RGBA')
    left, top, right, bottom = source.getchannel('A').getbbox()
    width, height = right - left, bottom - top
    crop_width = max(width * 1.08, height * .64)
    crop_height = crop_width * 1.25
    cx = (left + right) / 2
    y = top - height * .055
    box = tuple(round(v) for v in (cx - crop_width / 2, y, cx + crop_width / 2, y + crop_height))
    crop = source.crop(box)
    if crop.width < 512 or crop.height < 640:
        raise ValueError(f'{unit}: insufficient source pixels for 2x portrait')
    image = backdrop(512, 640, unit in FOES)
    image.alpha_composite(crop.resize((512, 640), Image.Resampling.LANCZOS))
    paths, hashes = save_pair(image, unit, (256, 320))
    manifest['portraits'][unit] = dict(id=unit, side='enemy' if unit in FOES else 'cat',
        portrait={**paths, 'display':[256, 320], 'sizes':[[256, 320], [512, 640]]},
        provenance=dict(source=relative(path), sourceSha256=sha(path), crop=box,
            method='Original master crop, alpha composite on authored cafe gradient, Lanczos downsample, WebP92', deliveredSha256=hashes))
    portraits.append((unit, image))

icons = []
for unit in CATS:
    source = ROOT / f'assets/cardrpg-look/v3-vfx/{unit}-light.webp'
    sheet = Image.open(source).convert('RGBA')
    for suffix, tile in [('1', 3), ('2', 0), ('3', 1), ('4', 2), ('passive', 0)]:
        image = backdrop(128, 128)
        sprite = sheet.crop((tile % 2 * 512, tile // 2 * 512, tile % 2 * 512 + 512, tile // 2 * 512 + 512))
        size = 82 if suffix == 'passive' else 120
        sprite = sprite.resize((size, size), Image.Resampling.LANCZOS)
        image.alpha_composite(sprite, ((128-size)//2, (128-size)//2))
        draw = ImageDraw.Draw(image)
        draw.rounded_rectangle((3, 3, 124, 124), radius=24, outline='#8a7955', width=2)
        if suffix == '4':
            draw.rounded_rectangle((7, 7, 120, 120), radius=21, outline='#f3bb61', width=2)
        if suffix == 'passive':
            draw.ellipse((53, 101, 75, 123), fill='#233e46', outline='#9ccbb1', width=2)
        ident = unit + '-' + suffix
        paths, hashes = save_pair(image, 'skill-' + ident, (64, 64))
        manifest['skills'][ident] = dict(id=ident, icon1x=paths['1x'], icon2x=paths['2x'], display=[64, 64],
            provenance=dict(source=relative(source), sourceSha256=sha(source), tile=tile, deliveredSha256=hashes))
        icons.append((ident, image))

for tier, color, count in [('common', '#a2aaa4', 1), ('rare', '#81b9ca', 2), ('epic', '#baa1d3', 3), ('legendary', '#f3bb61', 4)]:
    frame = Image.new('RGBA', (512, 640))
    draw = ImageDraw.Draw(frame)
    draw.rounded_rectangle((4, 4, 507, 635), radius=29, outline='#172d36', width=12)
    draw.rounded_rectangle((8, 8, 503, 631), radius=25, outline=color, width=4)
    draw.rounded_rectangle((16, 16, 495, 623), radius=20, outline='#725e45', width=2)
    for i in range(count):
        x = 256 + (i - (count - 1) / 2) * 20
        draw.polygon([(x, 4), (x+7, 14), (x, 24), (x-7, 14)], fill=color, outline='#fff0d2')
    paths, hashes = save_pair(frame, 'frame-' + tier, (256, 320))
    manifest['frames'][tier] = dict(id=tier, plate1x=paths['1x'], plate2x=paths['2x'], display=[256, 320],
        provenance=dict(tool='Authored Pillow geometry', author=relative(Path(__file__)), authorSha256=sha(Path(__file__)), deliveredSha256=hashes))

for name, items, cell, columns in [('portraits', portraits, (192, 266), 5), ('icons', icons, (128, 156), 10)]:
    contact = Image.new('RGB', (columns*cell[0], math.ceil(len(items)/columns)*cell[1]), '#102129')
    draw = ImageDraw.Draw(contact)
    for i, (ident, image) in enumerate(items):
        tile = image.copy()
        tile.thumbnail((cell[0], cell[1]-26), Image.Resampling.LANCZOS)
        x, y = i % columns * cell[0], i // columns * cell[1]
        contact.paste(tile, (x+(cell[0]-tile.width)//2, y), tile)
        draw.text((x+6, y+cell[1]-21), ident, fill='#fff0d2')
    contact.save(REPORT / (name+'-source-review.webp'), 'WEBP', quality=91, method=6)

(OUT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps(dict(portraits=len(portraits), icons=len(icons), frames=len(manifest['frames']),
                     bytes=sum(p.stat().st_size for p in OUT.glob('*.webp')))))
