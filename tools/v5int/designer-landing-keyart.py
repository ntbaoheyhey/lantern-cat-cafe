"""Landing key art built only from the designer's idle posters on the café garden backdrop.

The previous landing painting showed a different Mochi (quilted coat, teapot shield),
a witch-hat Soot and a calico Clover; judges then met other cats in battle.
Sources: apps/web/public/art/v3-shell/b2/backdrop-garden.webp (project backdrop) and
apps/web/public/units/<cat>/designer/poster.webp. Composite only, no generator.
Run: python3 -I tools/v5int/designer-landing-keyart.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageChops

ROOT = Path(__file__).resolve().parents[2]
PUB = ROOT / 'apps/web/public'
W, H = 1440, 810
HEIGHT = {'mochi': 380, 'soot': 410, 'clover': 425}  # on-screen body heights, matched to the battle line-up
# (cat, feet x, feet y, mirror)
LAYOUT = [('soot', 655, 712, False), ('clover', 1200, 718, True), ('mochi', 935, 768, False)]


def cover(im, w, h):
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def grade(cat_im):
    """Pull the neutral studio poster toward the lantern-lit night: warm, slightly lower key, warm rim."""
    rgb, a = cat_im.convert('RGB'), cat_im.split()[3]
    warm = Image.new('RGB', rgb.size, (255, 236, 212))
    rgb = ImageChops.multiply(rgb, warm)
    rgb = ImageEnhance.Brightness(rgb).enhance(0.96)
    # warm rim light from the café side (right): edge of alpha shifted left
    edge = ImageChops.subtract(a, a.transform(a.size, Image.AFFINE, (1, 0, 6, 0, 1, 2))).filter(ImageFilter.GaussianBlur(2))
    rim = Image.new('RGB', rgb.size, (255, 196, 120))
    rgb = Image.composite(ImageChops.screen(rgb, rim), rgb, edge.point(lambda v: int(v * 0.55)))
    out = rgb.convert('RGBA')
    out.putalpha(a)
    return out


def main():
    bg = cover(Image.open(PUB / 'art/v3-shell/b2/backdrop-garden.webp').convert('RGB'), W, H).convert('RGBA')
    # left-side night vignette so the title panel and buttons read clearly
    shade = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(shade)
    for x in range(W):
        t = max(0.0, 1 - x / (W * 0.5))
        d.line([(x, 0), (x, H)], fill=int(225 * t ** 0.9))
    bg = Image.composite(Image.new('RGBA', (W, H), (22, 18, 40, 255)), bg, shade)
    # floor vignette
    floor = Image.new('L', (W, H), 0)
    ImageDraw.Draw(floor).rectangle((0, int(H * 0.9), W, H), fill=120)
    bg = Image.composite(Image.new('RGBA', (W, H), (18, 14, 30, 255)), bg, floor.filter(ImageFilter.GaussianBlur(40)))
    for cat, fx, fy, mirror in LAYOUT:
        meta = json.loads((PUB / f'units/{cat}/designer/meta.json').read_text())
        poster = Image.open(PUB / f'units/{cat}/designer/poster.webp').convert('RGBA')
        box = poster.split()[3].getbbox()
        body = poster.crop(box)
        feet_in_crop = meta['feetY'] - box[1]
        target_h = HEIGHT[cat]
        s = target_h / body.height
        body = body.resize((round(body.width * s), round(body.height * s)), Image.LANCZOS)
        if mirror:
            body = body.transpose(Image.FLIP_LEFT_RIGHT)
        body = grade(body)
        x, y = int(fx - body.width / 2), int(fy - feet_in_crop * s)
        shadow = Image.new('L', (W, H), 0)
        sw = body.width * 0.62
        ImageDraw.Draw(shadow).ellipse((fx - sw / 2, fy - 16, fx + sw / 2, fy + 14), fill=150)
        bg = Image.composite(Image.new('RGBA', (W, H), (10, 6, 16, 255)), bg, shadow.filter(ImageFilter.GaussianBlur(10)))
        bg.alpha_composite(body, (x, y))
    out = bg.convert('RGB')
    out.save(PUB / 'art/v3-shell/landing.webp', quality=90, method=6)
    out.save(PUB / 'art/v3-shell/landing.avif', quality=78)
    print('landing', out.size)


if __name__ == '__main__':
    main()
