"""Original concept -> filled articulated parts -> one atlas + rig; no inference.

Run with /Users/bao/tools/cardrpg-look/venv/bin/python, followed by a unit id.
Only the chosen unit is rebuilt. Masters and native-era artifacts are immutable.
The receipt compares source/config/tool fingerprints to resume completed work.
"""
from pathlib import Path
import argparse
import hashlib
import json
import math
import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
OUT = ROOT / 'assets/cardrpg-look/v3-puppets'
MASTERS = Path('/Users/bao/art/look-v3/puppets')


def fingerprint(*paths):
    return hashlib.sha256(b''.join(p.read_bytes() for p in paths)).hexdigest()


def layout(parts, size, scale):
    """Stable shelves, largest height first; four transparent texels per edge."""
    x = y = row = 0
    result = {}
    for part in sorted(parts, key=lambda p: (-p['image'].height, p['part'])):
        w, h = [max(1, round(v * scale)) for v in part['image'].size]
        if w + 8 > size:
            return None
        if x + w + 8 > size:
            y += row
            x = row = 0
        if y + h + 8 > size:
            return None
        result[part['part']] = [x + 4, y + 4, w, h]
        x += w + 8
        row = max(row, h + 8)
    return result


def build(unit, force=False):
    if (ROOT / 'STOP-B').exists():
        raise RuntimeError('STOP-B requested')
    config = HERE / 'configs' / f'{unit}.json'
    cfg = json.loads(config.read_text())
    source = ROOT / cfg['source']
    signature = fingerprint(source, config, Path(__file__))
    external = MASTERS / unit
    external.mkdir(parents=True, exist_ok=True)
    receipt = external / 'receipt.json'
    destination = OUT / f'{unit}.rig.json'
    atlas_path = OUT / f'{unit}.webp'
    if not force and receipt.exists() and destination.exists() and atlas_path.exists():
        old = json.loads(receipt.read_text())
        if old.get('input') == signature:
            print(json.dumps(dict(id=unit, resumed=True, bytes=atlas_path.stat().st_size)))
            return
    im = Image.open(source).convert('RGBA')
    im.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    w, h = im.size
    arr = np.array(im)
    alpha = arr[:, :, 3]
    alpha[alpha < 8] = 0
    owned = np.zeros((h, w), np.uint8)
    masks = []
    for part, poly, pivot in cfg['layers']:
        m = Image.new('L', (w, h))
        ImageDraw.Draw(m).polygon([(round(x*w), round(y*h)) for x, y in poly], fill=255)
        m = np.array(m)
        mask = np.minimum(m, 255-owned)
        front = owned.copy()
        owned = np.maximum(owned, m)
        masks.append((part, mask, pivot, front))
    masks.append(('body', 255-owned, [.5, .66], owned))
    parts = []
    radius = cfg.get('underlap', 32)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (radius*2+1, radius*2+1))
    for depth, (part, mask, pivot, front) in enumerate(reversed(masks)):
        # Extend only behind adjacent original pixels, never outside the silhouette.
        # Fill hidden texels from this part, rather than duplicating a moving limb.
        visible = np.minimum(mask, alpha)
        extended = np.minimum(np.maximum(mask, np.minimum(cv2.dilate(mask, kernel), front)), alpha)
        if not np.any(visible):
            raise ValueError(f'{unit}/{part}: empty authored partition')
        missing = np.where((extended > 0) & (visible == 0), 255, 0).astype(np.uint8)
        rgb = arr[:, :, :3].copy()
        # Nearby non-owned opaque pixels are masked too, so only the same part
        # seeds its hidden edge. Telea extends texture locally; visible art is exact.
        hole = np.where((mask == 0) & (alpha > 0), 255, 0).astype(np.uint8)
        filled = cv2.inpaint(rgb, hole, 5, cv2.INPAINT_TELEA)
        rgb[missing > 0] = filled[missing > 0]
        layer = Image.fromarray(np.dstack([rgb, extended]))
        bounds = layer.getchannel('A').getbbox()
        cropped = layer.crop(bounds)
        cropped.save(external / f'{part}.png')
        parts.append(dict(part=part, pivot=pivot, rect=[bounds[0]/w, bounds[1]/h,
            (bounds[2]-bounds[0])/w, (bounds[3]-bounds[1])/h], depth=depth*.009,
            image=cropped, filledPixels=int(np.count_nonzero(missing))))
    size = 1536 if cfg.get('boss') else 1024
    low, high = .1, 1.
    for _ in range(18):
        mid = (low+high)/2
        if layout(parts, size, mid):
            low = mid
        else:
            high = mid
    packed = layout(parts, size, low)
    atlas = Image.new('RGBA', (size, size))
    rows = []
    for part in parts:
        x, y, pw, ph = packed[part['part']]
        tile = part['image'].resize((pw, ph), Image.Resampling.LANCZOS)
        atlas.paste(tile, (x, y))
        rows.append({k: v for k, v in part.items() if k not in ('image', 'filledPixels')} |
                    dict(atlasRect=[x/size, y/size, pw/size, ph/size]))
    OUT.mkdir(parents=True, exist_ok=True)
    atlas.save(atlas_path, 'WEBP', quality=93, method=6, alpha_quality=100)
    rig = dict(version=1, id=unit, role=cfg['role'], boss=cfg.get('boss', False),
        height=cfg['height'], aspect=w/h, face=cfg['face'], eyes=cfg.get('eyes', []),
        atlas=f'{unit}.webp', atlasSize=[size, size], layers=rows,
        sockets=cfg.get('sockets', {'mainHand':['armR',0,-.06], 'offHand':['armL',0,-.06]}),
        provenance=dict(source=cfg['source'], method='Authored polygons; OpenCV Telea hidden overlap fill; Pillow WebP93',
                        tool='tools/cardrpg-look/art-rebuild/puppet/build.py'))
    destination.write_text(json.dumps(rig, indent=2)+'\n')
    summary = dict(id=unit, input=signature, layers=len(parts), atlasSize=size,
        packedScale=round(low, 4), bytes=atlas_path.stat().st_size,
        overlapPixels=sum(p['filledPixels'] for p in parts), master=str(external))
    receipt.write_text(json.dumps(summary, indent=2)+'\n')
    # Reconstruct the zero pose beside its immutable concept for seam inspection.
    preview = Image.new('RGBA', (w, h))
    for p in parts:
        preview.alpha_composite(p['image'], (round(p['rect'][0]*w), round(p['rect'][1]*h)))
    preview.save(external/'rest.png')
    print(json.dumps(summary))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('unit')
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    if args.unit not in [p.stem for p in (HERE/'configs').glob('*.json')]:
        parser.error('Unknown unit; author its semantic config first')
    build(args.unit, args.force)
