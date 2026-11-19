#!/usr/bin/env python3
"""Transparent designer idles. Fixed union crop, shared scale, straight-alpha outputs."""
import argparse
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import zipfile

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
FPS = 30


def run(args):
    subprocess.run([str(x) for x in args], check=True)


def natural(path):
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r'(\d+)', str(path))]


def unpack(source, scratch):
    if source.is_dir():
        folder = source
    elif source.suffix.lower() == '.zip':
        folder = scratch / 'source'
        if folder.exists():
            shutil.rmtree(folder)
        folder.mkdir(parents=True)
        with zipfile.ZipFile(source) as archive:
            for item in archive.infolist():
                target = (folder / item.filename).resolve()
                if not target.is_relative_to(folder.resolve()):
                    raise ValueError(f'Unsafe ZIP path: {item.filename}')
                if '__MACOSX' not in item.filename and not Path(item.filename).name.startswith('._'):
                    archive.extract(item, folder)
    elif source.suffix.lower() == '.mov':
        folder = scratch / 'source'
        if folder.exists():
            shutil.rmtree(folder)
        folder.mkdir(parents=True)
        run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', source,
             '-vf', 'fps=30', '-pix_fmt', 'rgba', folder / '%04d.png'])
        with Image.open(folder / '0001.png') as first:
            lost_alpha = first.convert('RGBA').getchannel('A').getextrema()[0] == 255
        if lost_alpha and shutil.which('swift'):
            print('MOV alpha not exposed by ffmpeg; using native Apple RGBA decoding', flush=True)
            run(['swift', ROOT / 'tools/v9/alpha/decode-mov.swift', source, folder])
    else:
        raise ValueError('Input must be a PNG directory, .zip, or transparent .mov')
    frames = sorted((p for p in folder.rglob('*') if p.suffix.lower() == '.png'
                     and not p.name.startswith('._') and '__MACOSX' not in p.parts), key=natural)
    if len(frames) < 2:
        raise ValueError('At least two transparent PNG frames are required')
    return frames


def difference(a, b):
    a, b = np.asarray(a, dtype=np.float32) / 255, np.asarray(b, dtype=np.float32) / 255
    support = (a[..., 3] > .01) | (b[..., 3] > .01)
    aa = np.concatenate((a[..., :3] * a[..., 3:], a[..., 3:]), axis=2)
    bb = np.concatenate((b[..., :3] * b[..., 3:], b[..., 3:]), axis=2)
    return float(np.abs(aa - bb)[support].mean() * 255) if support.any() else 0.


def blend_rgba(a, b, weight):
    a, b = np.asarray(a, dtype=np.float32) / 255, np.asarray(b, dtype=np.float32) / 255
    alpha = a[..., 3:] * (1 - weight) + b[..., 3:] * weight
    color = a[..., :3] * a[..., 3:] * (1 - weight) + b[..., :3] * b[..., 3:] * weight
    rgb = np.divide(color, alpha, out=np.zeros_like(color), where=alpha > 1e-6)
    return Image.fromarray(np.uint8(np.clip(np.concatenate((rgb, alpha), 2) * 255, 0, 255)))


def face_score(im, box):
    # A useful default for three-quarter idles: choose the most symmetric head,
    # including RGB facial features. Art direction can override with --cutin N.
    x0, y0, x1, y1 = box
    head = im.crop((x0, y0, x1, int(y0 + (y1-y0)*.43))).resize((128, 80))
    arr = np.asarray(head, dtype=np.float32) / 255
    arr[..., :3] *= arr[..., 3:]
    return float(np.abs(arr - arr[:, ::-1]).mean())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('cat', choices=['mochi', 'clover', 'soot'])
    parser.add_argument('--cutin', type=int, help='1-based full-resolution source frame')
    parser.add_argument('--height-ratio', type=float, help='Explicit ratio to Mochi when sources are not at a shared scale')
    parser.add_argument('--placeholder', action='store_true', help='Label a black-key stand-in; never final designer art')
    args = parser.parse_args()
    if args.height_ratio is not None and args.height_ratio <= 0:
        parser.error('--height-ratio must be positive')
    scratch = ROOT / 'work/v9/CXV' / args.cat
    scratch.mkdir(parents=True, exist_ok=True)
    frames = unpack(args.source.resolve(), scratch)
    if args.cutin is not None and not 1 <= args.cutin <= len(frames):
        parser.error(f'--cutin must be 1..{len(frames)}')
    bounds, source_size, best = None, None, (math.inf, 1)
    for i, path in enumerate(frames):
        with Image.open(path) as raw:
            if 'A' not in raw.getbands() and 'transparency' not in raw.info:
                raise ValueError(f'{path.name}: missing alpha; use make-placeholder.py only for temporary MP4s')
            im = raw.convert('RGBA')
        if source_size is None:
            source_size = im.size
        if im.size != source_size:
            raise ValueError('Frames must use one stable source canvas')
        alpha = im.getchannel('A')
        if alpha.getextrema()[0] == 255:
            raise ValueError(f'{path.name}: opaque input; HEVC-alpha MOV may need a ProRes 4444 export')
        box = alpha.point(lambda x: 255 if x > 2 else 0).getbbox()
        if box:
            bounds = box if bounds is None else (min(bounds[0], box[0]), min(bounds[1], box[1]), max(bounds[2], box[2]), max(bounds[3], box[3]))
            score = face_score(im, box)
            if score < best[0]:
                best = score, i + 1
    if bounds is None:
        raise ValueError('Sequence is entirely transparent')
    source_height = bounds[3] - bounds[1]
    ref_path = ROOT / 'apps/web/public/units/mochi/designer/meta.json'
    if args.cat == 'mochi':
        scale, ratio, calibration = 720 / source_height, 1., 'mochi-720px'
    elif args.height_ratio:
        ratio, calibration = args.height_ratio, 'explicit-height-ratio'
        scale = 720 * ratio / source_height
    else:
        if not ref_path.exists():
            raise ValueError('Convert Mochi first to establish the shared source scale')
        reference = json.loads(ref_path.read_text())
        if not args.placeholder and reference.get('placeholder'):
            raise ValueError('Replace the Mochi placeholder first; final exports must share the final Mochi source scale')
        scale = reference['sourceScale']
        ratio, calibration = source_height * scale / 720, 'shared-source-scale'
    height = round(source_height * scale)
    width = round((bounds[2] - bounds[0]) * scale)
    margin = max(2, math.ceil(height * .04))
    canvas_width = (width + margin * 2 + 1) // 2 * 2
    canvas_height = (height + margin * 2 + 1) // 2 * 2
    feet_y = canvas_height - margin
    left, top = (canvas_width - width) // 2, feet_y - height
    normalized = scratch / 'normalized'
    if normalized.exists():
        shutil.rmtree(normalized)
    normalized.mkdir()
    for i, path in enumerate(frames, 1):
        with Image.open(path) as raw:
            # Pillow's RGBA resize filters premultiplied colors, preventing dark fringes.
            crop = raw.convert('RGBA').crop(bounds).resize((width, height), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (canvas_width, canvas_height))
        canvas.paste(crop, (left, top))
        canvas.save(normalized / f'{i:04d}.png', compress_level=2)
    first = Image.open(normalized / '0001.png').convert('RGBA')
    last = Image.open(normalized / f'{len(frames):04d}.png').convert('RGBA')
    before = difference(first, last)
    print(f'{args.cat}: first/last mean premultiplied RGBA difference = {before:.3f}/255 (visible pixels)', flush=True)
    crossfade = before > 1.5
    if crossfade:
        count = min(6, len(frames) - 1)
        for step in range(1, count + 1):
            path = normalized / f'{len(frames)-count+step:04d}.png'
            with Image.open(path) as raw:
                t = step / count
                blend_rgba(raw.convert('RGBA'), first, t*t*(3-2*t)).save(path, compress_level=2)
        print(f'{args.cat}: crossfaded the last {count} frames into frame 1 in premultiplied alpha', flush=True)
    out = ROOT / 'apps/web/public/units' / args.cat / 'designer'
    # Stage files so an encoder failure does not leave a half-replaced delivery.
    stage = scratch / 'delivery'
    stage.mkdir(exist_ok=True)
    seq = normalized / '%04d.png'
    run(['ffmpeg', '-hide_banner', '-loglevel', 'warning', '-y', '-framerate', FPS, '-i', seq,
         '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-crf', 28, '-b:v', 0,
         '-row-mt', 1, '-threads', 6, '-auto-alt-ref', 0, stage / 'idle.webm'])
    run(['ffmpeg', '-hide_banner', '-loglevel', 'warning', '-y', '-framerate', FPS, '-i', seq,
         '-an', '-c:v', 'hevc_videotoolbox', '-pix_fmt', 'bgra', '-alpha_quality', .75,
         '-tag:v', 'hvc1', '-b:v', '5M', '-movflags', '+faststart', stage / 'idle.mov'])
    first.save(stage / 'poster.webp', lossless=True, method=6)
    cutin = args.cutin or best[1]
    if not 1 <= cutin <= len(frames):
        raise ValueError(f'--cutin must be 1..{len(frames)}')
    with Image.open(frames[cutin - 1]) as raw:
        raw.convert('RGBA').save(stage / 'cutin.png')
    after = difference(first, Image.open(normalized / f'{len(frames):04d}.png').convert('RGBA'))
    meta = dict(fps=FPS, frames=len(frames), width=canvas_width, height=canvas_height,
                feetY=feet_y, heightPx=height, anchor=[.5, feet_y/canvas_height],
                sourceSize=list(source_size), sourceBounds=list(bounds), sourceScale=scale,
                heightRatioToMochi=ratio, heightCalibration=calibration,
                placeholder=args.placeholder, cutinFrame=cutin,
                cutinSelection='explicit' if args.cutin else 'head-symmetry-heuristic',
                loopDifferenceBefore=round(before, 4), loopDifferenceAfter=round(after, 4),
                loopCrossfadeFrames=min(6, len(frames)-1) if crossfade else 0,
                alpha='straight', marginPx=margin)
    (stage / 'meta.json').write_text(json.dumps(meta, indent=2) + '\n')
    out.mkdir(parents=True, exist_ok=True)
    for name in ['idle.webm', 'idle.mov', 'poster.webp', 'cutin.png', 'meta.json']:
        shutil.copy2(stage / name, out / name)
    print(f'{args.cat}: {len(frames)} frames, {canvas_width}x{canvas_height}, feetY={feet_y}, height={height}, cut-in={cutin}; {out}', flush=True)


if __name__ == '__main__':
    main()
