#!/usr/bin/env python3
"""Black-key stand-ins ONLY. Preserve enclosed dark features and unpremultiply edges."""
import argparse
from pathlib import Path
import subprocess
import numpy as np
from PIL import Image
from scipy import ndimage

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('video', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
raw_dir = args.output.parent / (args.output.name + '-rgb')
raw_dir.mkdir(exist_ok=True)
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(args.video),
                '-vf', 'fps=30', str(raw_dir / '%04d.png')], check=True)
frames = sorted(raw_dir.glob('*.png'))
for i, path in enumerate(frames):
    rgb = np.asarray(Image.open(path).convert('RGB'), dtype=np.float32)
    brightness = rgb.max(axis=2)
    # Fill enclosed low-luminance eyes, straps and nostrils; key only the exterior.
    solid = ndimage.binary_fill_holes(brightness > 64)
    edge_alpha = np.clip((brightness - 4) / 60, 0, 1)
    alpha = np.where(solid, 1., edge_alpha).astype(np.float32)
    alpha[brightness < 5] = np.where(solid[brightness < 5], 1., 0.)
    straight = np.divide(rgb, alpha[..., None], out=np.zeros_like(rgb), where=alpha[..., None] > .001)
    rgba = np.concatenate((np.clip(straight, 0, 255), alpha[..., None] * 255), axis=2).astype(np.uint8)
    Image.fromarray(rgba).save(args.output / path.name, compress_level=2)
    if (i+1) % 60 == 0:
        print(f'Placeholder: {i+1}/{len(frames)} frames', flush=True)
print(f'TEMPORARY black-key sequence: {args.output}', flush=True)
