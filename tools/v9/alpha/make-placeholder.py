#!/usr/bin/env python3
"""Border-connected black key for temporary MP4 stand-ins, never designer alpha."""
import argparse
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image
from scipy import ndimage

CONNECTIVITY = np.ones((3, 3), dtype=bool)


def background_mask(rgb, previous=None):
    # The backdrop is almost neutral black. A low threshold protects dark cloth;
    # the old 64/255 luminance key incorrectly made Mochi's apron translucent.
    high, low = rgb.max(axis=2), rgb.min(axis=2)
    black = (high <= 12) & ((high.astype(np.int16) - low) <= 7)
    seeds = np.zeros(black.shape, dtype=bool)
    seeds[[0, -1], :] = black[[0, -1], :]
    seeds[:, [0, -1]] = black[:, [0, -1]]
    if previous is not None:
        # A tail can close around an already exterior patch of background.
        # Carry only overlapping near-black backdrop pixels across adjacent
        # frames, then flood within that frame. Never fill every enclosed hole.
        seeds |= previous & black
    return ndimage.binary_propagation(seeds, structure=CONNECTIVITY, mask=black)


def refine_edges(rgb, background):
    color = rgb.astype(np.float32)
    r, g, b = color.transpose(2, 0, 1)
    level = color.max(axis=2)
    # The MP4 bakes a dim yellow lantern/tea glow into the black backdrop.
    # Treat only border-connected warm falloff as emission coverage, otherwise
    # a low black threshold leaves a dark opaque collar around the lantern.
    warm_falloff = (level <= 64) & (r >= g*.8) & (g >= r*.4) & (b <= g*.5)
    background = ndimage.binary_propagation(background, structure=CONNECTIVITY,
                                           mask=background | warm_falloff)
    foreground = ~background
    core = ndimage.binary_erosion(foreground, structure=CONNECTIVITY, iterations=3)
    if not core.any():
        raise ValueError('No opaque foreground remains after black key')
    # Estimate coverage only within three source pixels of the exterior.
    # Everything deeper inside the subject, including dark eyes/apron, is opaque.
    edge = foreground & ~core
    _, nearest = ndimage.distance_transform_edt(~core, return_indices=True)
    reference = color[nearest[0][edge], nearest[1][edge]]
    observed = color[edge]
    coverage = np.sum(observed * reference, axis=1) / np.maximum(
        np.sum(reference * reference, axis=1), 1.)
    alpha = foreground.astype(np.float32)
    alpha[edge] = np.clip(coverage, 0., 1.)
    glow = background & warm_falloff
    alpha[glow] = np.clip((level[glow]-4.)/251., 0., 1.)
    straight = np.divide(color, alpha[..., None], out=np.zeros_like(color),
                         where=alpha[..., None] > .001)
    return np.round(np.concatenate((np.clip(straight, 0, 255),
                                    alpha[..., None] * 255), axis=2)).astype(np.uint8)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('video', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--reuse-rgb', action='store_true',
                        help='Reuse this source video\'s existing extracted RGB frames')
    parser.add_argument('--reuse-masks', action='store_true',
                        help='Reuse forward background masks when refining edge treatment')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    raw_dir = args.output.parent / (args.output.name + '-rgb')
    raw_dir.mkdir(exist_ok=True)
    if not args.reuse_rgb:
        for old in raw_dir.glob('*.png'):
            old.unlink()
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                        '-i', str(args.video), '-vf', 'fps=30',
                        str(raw_dir / '%04d.png')], check=True)
    frames = sorted(raw_dir.glob('*.png'))
    if len(frames) < 2:
        raise ValueError('At least two source frames are required')
    mask_dir = args.output.parent / (args.output.name + '-background')
    mask_dir.mkdir(exist_ok=True)
    for old in args.output.glob('*.png'):
        old.unlink()
    previous = None
    for i, path in enumerate([] if args.reuse_masks else frames, 1):
        with Image.open(path) as im:
            rgb = np.asarray(im.convert('RGB'))
        previous = background_mask(rgb, previous)
        Image.fromarray(previous).save(mask_dir / path.name)
        if i % 60 == 0:
            print(f'Background tracking: {i}/{len(frames)}', flush=True)
    # Reverse pass also handles a gap that starts closed, then opens later.
    previous = None
    for i, path in enumerate(reversed(frames), 1):
        with Image.open(path) as im:
            rgb = np.asarray(im.convert('RGB'))
        forward = np.asarray(Image.open(mask_dir / path.name), dtype=bool)
        previous = background_mask(rgb, forward if previous is None else forward | previous)
        Image.fromarray(refine_edges(rgb, previous)).save(args.output / path.name, compress_level=2)
        if i % 60 == 0:
            print(f'Edge matte: {i}/{len(frames)}', flush=True)
    print(f'TEMPORARY border/temporal black-key sequence: {args.output}', flush=True)


if __name__ == '__main__':
    main()
