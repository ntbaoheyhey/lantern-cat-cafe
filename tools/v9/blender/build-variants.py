#!/usr/bin/env python3
"""V2: cat tints derived from the neutral Blender atlases, plus a screen flash."""
import json
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / 'apps/web/public/vfx/v9'
WORK = ROOT / 'work/v9/CXV/vfx/variants'
PALETTES = {'mochi': '#ffbd4c', 'clover': '#74e69e', 'soot': '#b873ff'}
EFFECTS = {'impact-core': 3, 'shockwave-ring': 8, 'rune-circle': 8}


def to_linear(s):
    return np.where(s <= .04045, s / 12.92, ((s + .055) / 1.055) ** 2.4)


def to_srgb(s):
    return np.where(s <= .0031308, s * 12.92, 1.055 * s ** (1 / 2.4) - .055)


def tint_atlas(atlas, color, preserve_core):
    linear = to_linear(np.asarray(atlas.convert('RGB'), dtype=np.float32) / 255.)
    hue = to_linear(np.array([int(color[i:i+2], 16) for i in (1, 3, 5)], dtype=np.float32) / 255.)
    highlight = np.clip((linear.max(axis=2, keepdims=True) - .55) / .45, 0., 1.)
    highlight = highlight * highlight * (3 - 2 * highlight)
    # Keep impact's hottest core white; ring/rune strokes retain their cat hue.
    white = highlight * (1. if preserve_core else .12)
    tinted = linear * (hue * (1 - white) + white)
    return Image.fromarray(np.uint8(np.round(np.clip(to_srgb(tinted), 0, 1) * 255)))


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    items = []
    for cat, color in PALETTES.items():
        for effect in EFFECTS:
            name = f'{effect}-{cat}'
            meta = json.loads((PUBLIC / f'{effect}.json').read_text())
            with Image.open(PUBLIC / f'{effect}.webp') as original:
                atlas = tint_atlas(original, color, effect == 'impact-core')
            atlas.save(PUBLIC / f'{name}.webp', lossless=True, method=6)
            meta.update(variantOf=effect, cat=cat, tintSRGB=color)
            (PUBLIC / f'{name}.json').write_text(json.dumps(meta, indent=2) + '\n')
            items.append((cat, effect, meta, atlas))
            print(f'V2 {name}: {meta["frames"]} frames, {color}', flush=True)

    size = 1024
    yy, xx = np.mgrid[-1:1:complex(size), -1:1:complex(size)]
    # A broad white veil with a brighter center, no hard circle or edge cutoff.
    alpha = np.round((.14 + .86 * np.exp(-2.4 * (xx*xx + yy*yy))) * 255).astype(np.uint8)
    rgba = np.full((size, size, 4), 255, dtype=np.uint8)
    rgba[..., 3] = alpha
    flash = Image.fromarray(rgba)
    flash.save(PUBLIC / 'flash-gradient.webp', lossless=True, method=6)
    meta = dict(cell=[size, size], cols=1, rows=1, frames=1, fps=30,
                blend='normal', loop=False, anchor=[.5, .5], screenSpace=True,
                alpha='straight', description='White full-screen radial flash; animate opacity in code')
    (PUBLIC / 'flash-gradient.json').write_text(json.dumps(meta, indent=2) + '\n')

    try:
        font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 18)
        small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 13)
    except OSError:
        font = small = ImageFont.load_default()

    def overview(frame=None):
        sheet = Image.new('RGB', (816, 956), '#18151e')
        draw = ImageDraw.Draw(sheet)
        draw.text((16, 14), 'V9 / CAT COLOUR VARIANTS / 256 px', fill='#f9efdc', font=font)
        for i, (cat, effect, m, atlas) in enumerate(items):
            x, y = (i % 3)*272 + 8, (i // 3)*300 + 54
            draw.text((x, y), f'{cat.upper()} / {effect}', fill=PALETTES[cat], font=small)
            bg = Image.new('RGB', (256, 256), 'black')
            index = EFFECTS[effect] if frame is None else frame % (m['frames'] + (0 if m['loop'] else 12))
            if index < m['frames']:
                sx, sy = index % m['cols']*512, index // m['cols']*512
                tile = atlas.crop((sx, sy, sx+512, sy+512)).resize((256, 256), Image.Resampling.LANCZOS)
                bg.paste(tile)
            sheet.paste(bg, (x, y+25))
        return sheet

    overview().save(WORK / 'overview.jpg', quality=94)
    encode = subprocess.Popen(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'rawvideo', '-pixel_format', 'rgb24', '-video_size', '816x956', '-framerate', '30',
        '-i', 'pipe:0', '-frames:v', '90', '-c:v', 'libx264', '-crf', '17',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(WORK / 'preview-3s.mp4')], stdin=subprocess.PIPE)
    try:
        for frame in range(90):
            encode.stdin.write(overview(frame).tobytes())
    finally:
        encode.stdin.close()
    if encode.wait() != 0:
        raise RuntimeError('V2 preview encoding failed')

    sheet = Image.new('RGB', (1024, 610), '#18151e')
    draw = ImageDraw.Draw(sheet)
    for i, (color, opacity, label) in enumerate((('#251c31', .45, 'Dark / 45% opacity'),
                                               ('#b9a483', .45, 'Cafe / 45% opacity'),
                                               ('#251c31', 1., 'Dark / full opacity'),
                                               ('#b9a483', 1., 'Cafe / full opacity'))):
        layer = flash.resize((512, 270), Image.Resampling.LANCZOS)
        layer.putalpha(layer.getchannel('A').point(lambda a: round(a*opacity)))
        panel = Image.new('RGBA', layer.size, color)
        panel.alpha_composite(layer)
        x, y = (i % 2)*512, (i // 2)*305
        draw.text((x+12, y+10), label, fill='#f9efdc', font=font)
        sheet.paste(panel.convert('RGB'), (x, y+35))
    sheet.save(WORK / 'flash-gradient-review.jpg', quality=94)
    print(f'V2 flash-gradient: {size}x{size} straight RGBA; review {WORK}', flush=True)


if __name__ == '__main__':
    main()
