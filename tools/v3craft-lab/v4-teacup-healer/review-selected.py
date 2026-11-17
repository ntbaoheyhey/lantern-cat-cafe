"""One-pass selected drawing review at 225px opaque height and 2x head scale."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
import numpy as np

lab = Path('tools/v3craft-lab/v4-teacup-healer')
base = Image.new('RGBA', (1152, 1152))
base.alpha_composite(Image.open('apps/web/public/units/teacup-healer/runtime.webp').convert('RGBA'), (256, 256))
base.save(lab / 'raw/K0-normal.png')
frames = [('K0', base, [478, 582])]
for key, source in [('K1-A3', 'K1-A3-normal'), ('K2-A2', 'K2-A2-colour-70'), ('K4-A3', 'K4-A3-colour-70')]:
    metrics = json.loads((lab / (key + '-metrics.json')).read_text())
    head = [v * metrics['scale'] + metrics['offset'][1] for v in metrics['headLandmarksSource']]
    frames.append((key, Image.open(lab / 'raw' / (source + '.png')).convert('RGBA'), head))
for page in range(2):
    out = Image.new('RGB', (900, 610), '#37313c')
    draw = ImageDraw.Draw(out)
    for column, (key, im, (top, chin)) in enumerate(frames[page * 2:page * 2 + 2]):
        alpha = np.array(im)[:, :, 3]
        ys, xs = np.where(alpha >= 128)
        bounds = (int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1))
        scale = 225 / 409
        body = im.crop(bounds)
        body = body.resize(tuple(round(v * scale) for v in body.size), Image.Resampling.LANCZOS)
        cx = column * 450 + 225
        out.paste(body, (cx - body.width // 2, 285 - body.height), body)
        draw.text((column * 450 + 20, 20), key + ' | 225 px opaque height', fill='white')
        draw.line((column * 450 + 20, 286, column * 450 + 430, 286), fill='#766a78')
        band = (alpha[int(top) + 8:int(top) + 18] >= 128).any(axis=0)
        cap = np.flatnonzero(band)
        groups = np.split(cap, np.flatnonzero(np.diff(cap) > 4) + 1)
        center = float(max(groups, key=len).mean())
        head = im.crop((round(center - 125), round(top - 28), round(center + 125), round(chin + 30)))
        head = head.resize(tuple(round(v * scale * 2) for v in head.size), Image.Resampling.LANCZOS)
        out.paste(head, (cx - head.width // 2, 360), head)
        draw.text((column * 450 + 20, 325), '2x battle-scale head / fixed landmarks', fill='white')
    out.save(lab / f'selected-review-{page + 1}.jpg', quality=94)
print('Created two new 900px review sheets; no prior review reopened.')
