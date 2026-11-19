#!/usr/bin/env python3
"""Compare the reported frames against source RGB and the previous delivery."""
import argparse
import json
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('cat', choices=['mochi', 'clover'])
    args = parser.parse_args()
    work = ROOT / 'work/v9/CXV' / args.cat
    public = ROOT / 'apps/web/public/units' / args.cat / 'designer'
    decoded = work / 'matte-after-decoded'
    decoded.mkdir(exist_ok=True)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                    '-c:v', 'libvpx-vp9', '-i', str(public / 'idle.webm'),
                    '-vf', 'select=eq(n,0)+eq(n,74)+eq(n,124)+eq(n,174)'.replace(',', r'\,'),
                    '-fps_mode', 'vfr', str(decoded / '%02d.png')], check=True)
    meta = json.loads((public / 'meta.json').read_text())
    sheet = Image.new('RGB', (1120, 1520), '#ded9cc')
    draw = ImageDraw.Draw(sheet)
    for row, number in enumerate((1, 75, 125, 175)):
        source = Image.open(work / 'placeholder-rgb' / f'{number:04d}.png').convert('RGBA')
        source = source.crop(meta['sourceBounds'])
        old = Image.open(work / 'matte-before-decoded' / f'{row+1:02d}.png').convert('RGBA')
        new = Image.open(decoded / f'{row+1:02d}.png').convert('RGBA')
        for col, (im, label) in enumerate(((source, 'Source RGB'), (old, 'Before / decoded VP9'),
                                         (new, 'Corrected / decoded VP9'))):
            im.thumbnail((360, 342), Image.Resampling.LANCZOS)
            panel = Image.new('RGBA', (370, 350), '#000000' if col == 0 else '#f4f0e8')
            panel.alpha_composite(im, ((370-im.width)//2, 350-im.height))
            sheet.paste(panel.convert('RGB'), (col*375, row*380+30))
            draw.text((col*375+8, row*380+9), f'{args.cat} {number:03d} | {label}', fill='#17151d')
    output = work / 'matte-r2-review.jpg'
    sheet.save(output, quality=94)
    print(output)


if __name__ == '__main__':
    main()
