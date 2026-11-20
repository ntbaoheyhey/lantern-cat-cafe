"""Derive every shell/HUD still of the demo squad from the designer's own idle poster.

Why: battle renders the designer idle video, while the café cards, Collection,
HUD portraits and turn queue showed three older concept generations, so Mochi,
Clover and Soot looked like different cats in and out of battle.
Source = apps/web/public/units/<cat>/designer/poster.webp (designer Live2D export,
frame 0 of idle.webm). Method = alpha crop, Lanczos resample, composite on the
existing per-cat café gradient. No generator, no reference art.
Run: python3 -I tools/v5int/designer-identity-derivatives.py [--preview out.png]
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
UNITS = ROOT / 'apps/web/public/units'
A6 = ROOT / 'assets/cardrpg-a6/illustrations'
LOOK = ROOT / 'assets/cardrpg-look/v3-portraits'
HOME = ROOT / 'apps/web/public/art/v5-delivery/home-portraits'
COMPACT = ROOT / 'apps/web/src/game/cardrpg/ui-v3/home-portrait-manifest-loader.json'
CATS = {
    # inner/outer gradient = the colours of the previous HUD portraits and face tiles
    'mochi': {'inner': (150, 118, 76), 'outer': (74, 58, 55), 'face': (23, 49, 58)},
    'clover': {'inner': (104, 132, 98), 'outer': (52, 70, 62), 'face': (23, 49, 58)},
    'soot': {'inner': (120, 96, 150), 'outer': (58, 44, 82), 'face': (23, 49, 58)},
}


def poster(cat):
    im = Image.open(UNITS / cat / 'designer/poster.webp').convert('RGBA')
    return im.crop(im.split()[3].getbbox())


def head_center(body):
    """Alpha-weighted x centre of the top 17% rows (ears + head, not the tail)."""
    a = body.split()[3]
    w, h = a.size
    rows = int(h * 0.17)
    total = sx = 0
    px = a.load()
    for y in range(rows):
        for x in range(0, w, 2):
            v = px[x, y]
            if v > 128:
                total += 1
                sx += x
    return sx / max(total, 1)


def radial(size, inner, outer, ring=True):
    w, h = size
    bg = Image.new('RGBA', size, outer + (255,))
    glow = Image.new('L', size, 0)
    d = ImageDraw.Draw(glow)
    r = int(min(w, h) * 0.46)
    d.ellipse((w // 2 - r, int(h * 0.42) - r, w // 2 + r, int(h * 0.42) + r), fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(min(w, h) * 0.18))
    bg.paste(Image.new('RGBA', size, inner + (255,)), (0, 0), glow)
    if ring:
        d = ImageDraw.Draw(bg)
        r = int(min(w, h) * 0.40)
        d.ellipse((w // 2 - r, int(h * 0.42) - r, w // 2 + r, int(h * 0.42) + r), outline=(255, 226, 170, 46), width=max(1, w // 128))
    return bg


def rounded(im, radius):
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.size[0] - 1, im.size[1] - 1), radius, fill=255)
    out = im.copy()
    out.putalpha(Image.composite(im.split()[3], mask, mask))
    return out


def head_crop(body, side_ratio, top_pad):
    w, h = body.size
    side = int(h * side_ratio)
    cx = head_center(body)
    left = int(cx - side / 2)
    top = int(-side * top_pad)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(body, (-left, -top)) if left >= 0 and top >= 0 else canvas.paste(body, (-left, -top), body)
    return canvas


def window(body, size, height_ratio, top_pad):
    """Crop a size-aspect window around the head, height = height_ratio * body height."""
    w, h = size
    ch = int(body.height * height_ratio)
    cw = int(ch * w / h)
    cx = head_center(body)
    canvas = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    canvas.paste(body, (int(cw / 2 - cx), int(ch * top_pad)), body)
    return canvas.resize(size, Image.LANCZOS)


def look_variants(cat, body, face_bg):
    """assets/cardrpg-look/v3-portraits: bust 1x/2x, head, ui and round face icons."""
    out = []
    inner = tuple(min(255, c + 22) for c in face_bg)
    specs = {'1x': (0.78, 0.05), '2x': (0.78, 0.05), 'head-1x': (0.56, 0.04), 'head-2x': (0.56, 0.04),
             'ui-144': (0.52, 0.03), 'ui-72': (0.52, 0.03), 'ui-56': (0.52, 0.03),
             'face-144': (0.52, 0.03), 'face-72': (0.52, 0.03)}
    for suffix, (ratio, pad) in specs.items():
        path = LOOK / f'{cat}-{suffix}.webp'
        if not path.exists():
            continue
        size = Image.open(path).size
        tile = radial(size, inner, face_bg, ring=False)
        tile.alpha_composite(window(body, size, ratio, pad))
        if suffix.startswith('face'):
            mask = Image.new('L', size, 0)
            ImageDraw.Draw(mask).ellipse((0, 0, size[0] - 1, size[1] - 1), fill=255)
            tile.putalpha(mask)
            save(tile, path, quality=92, method=6)
        else:
            save(tile.convert('RGB'), path, quality=92, method=6)
        out.append(path)
    return out


def save(im, path, **kw):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, **kw)
    return path


def build():
    made = {}
    compact = json.loads(COMPACT.read_text())
    for cat, tone in CATS.items():
        body = poster(cat)
        w, h = body.size
        # 1) Café / Collection illustration: whole designer body, transparent.
        scale = 768 / max(w, h) if max(w, h) > 768 else 1
        art = body.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        pad = Image.new('RGBA', (art.width + 24, art.height + 24), (0, 0, 0, 0))
        pad.alpha_composite(art, (12, 12))
        save(pad, A6 / f'{cat}.webp', quality=92, method=6)
        save(pad, A6 / f'{cat}.avif', quality=80)
        # 2) compact 384w home portrait (content-addressed name like the previous delivery)
        small = pad.resize((384, round(pad.height * 384 / pad.width)), Image.LANCZOS)
        tmp = HOME / f'{cat}-tmp.avif'
        save(small, tmp, quality=58)
        digest = hashlib.sha256(tmp.read_bytes()).hexdigest()
        final = HOME / f'{cat}-{digest[:12]}.avif'
        old = compact.get(cat, {}).get('src')
        if old and (ROOT / 'apps/web/public' / old.lstrip('/')).exists() and old != f'/art/v5-delivery/home-portraits/{final.name}':
            (ROOT / 'apps/web/public' / old.lstrip('/')).unlink()
        tmp.replace(final)
        compact[cat] = {'src': f'/art/v5-delivery/home-portraits/{final.name}', 'width': 384, 'height': small.height,
                        'sourceSha256': hashlib.sha256((UNITS / cat / 'designer/poster.webp').read_bytes()).hexdigest(),
                        'sha256': digest}
        # 3) HUD / turn-queue / banner portrait 256 with rounded café gradient.
        head = head_crop(body, 0.80, 0.03).resize((256, 256), Image.LANCZOS)
        tile = radial((256, 256), tone['inner'], tone['outer'])
        tile.alpha_composite(head)
        tile = rounded(tile, 18)
        save(tile, UNITS / cat / 'portrait.webp', quality=92, method=6)
        save(tile, UNITS / cat / 'portrait.avif', quality=80)
        # 4) face tile 144 (Journal / small UI)
        face = head_crop(body, 0.56, 0.02).resize((144, 144), Image.LANCZOS)
        ftile = radial((144, 144), tuple(min(255, c + 22) for c in tone['face']), tone['face'], ring=False)
        ftile.alpha_composite(face)
        save(ftile.convert('RGB'), A6 / f'{cat}-face.webp', quality=92, method=6)
        look_variants(cat, body, tone['face'])
        made[cat] = (pad, tile, ftile)
    COMPACT.write_text(json.dumps(compact, indent=2) + '\n')
    update_manifests()
    return made


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def update_manifests():
    method = 'Designer idle poster (frame 0 of idle.webm), alpha crop, Lanczos, cafe gradient; tools/v5int/designer-identity-derivatives.py'
    a6 = json.loads((A6 / 'manifest.json').read_text())
    for cat in CATS:
        a6['units'][cat]['source'] = f'apps/web/public/units/{cat}/designer/poster.webp'
    (A6 / 'manifest.json').write_text(json.dumps(a6, indent=2) + '\n')
    look = json.loads((LOOK / 'manifest.json').read_text())
    for cat in CATS:
        entry = look['portraits'].get(cat)
        if not entry:
            continue
        src = f'apps/web/public/units/{cat}/designer/poster.webp'
        prov = entry.setdefault('provenance', {})
        prov.update({'source': src, 'sourceSha256': sha(ROOT / src), 'method': method})
        prov.pop('crop', None)
        if 'deliveredSha256' in prov:
            prov['deliveredSha256'] = {k: sha(ROOT / entry['portrait'][k]) for k in ('1x', '2x')}
        face = entry.get('faceIcon')
        if face:
            face['provenance'] = {'source': src, 'method': method + ', circular mask'}
    (LOOK / 'manifest.json').write_text(json.dumps(look, indent=2) + '\n')


if __name__ == '__main__':
    made = build()
    if '--preview' in sys.argv:
        out = Path(sys.argv[sys.argv.index('--preview') + 1])
        sheet = Image.new('RGB', (3 * 520, 420), (40, 30, 28))
        for i, (cat, (art, tile, face)) in enumerate(made.items()):
            a = art.copy(); a.thumbnail((250, 400))
            sheet.paste(a, (i * 520, 10), a)
            sheet.paste(tile, (i * 520 + 260, 10), tile)
            sheet.paste(face, (i * 520 + 260, 280))
        sheet.save(out)
    print('ok', ', '.join(made))
