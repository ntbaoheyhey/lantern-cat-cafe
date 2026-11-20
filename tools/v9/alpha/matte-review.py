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
    parser.add_argument('cat', choices=['mochi', 'clover', 'soot'])
    parser.add_argument('--source-dir', type=Path,
                        help='Designer PNG sequence; compare source against decoded grey/light panels')
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
    if args.source_dir:
        import re
        sources = sorted((p for p in args.source_dir.rglob('*.png')
                          if not p.name.startswith('._') and '__MACOSX' not in p.parts),
                         key=lambda p: [int(x) if x.isdigit() else x.lower()
                                        for x in re.split(r'(\d+)', str(p))])
        if len(sources) < 175:
            raise ValueError('The selected review frames require at least 175 PNGs')
    sheet = Image.new('RGB', (1120, 1520), '#ded9cc')
    draw = ImageDraw.Draw(sheet)
    for row, number in enumerate((1, 75, 125, 175)):
        source = Image.open(sources[number-1] if args.source_dir else
                            work / 'placeholder-rgb' / f'{number:04d}.png').convert('RGBA')
        source = source.crop(meta['sourceBounds'])
        if args.source_dir:
            width = round(source.width * meta['sourceScale'])
            source = source.resize((width, meta['heightPx']), Image.Resampling.LANCZOS)
            aligned = Image.new('RGBA', (meta['width'], meta['height']))
            aligned.paste(source, ((meta['width']-width)//2, meta['feetY']-meta['heightPx']))
            source = aligned
        new = Image.open(decoded / f'{row+1:02d}.png').convert('RGBA')
        if args.source_dir:
            panels = ((source, 'Designer PNG', '#808080'),
                      (new.copy(), 'Decoded VP9 / grey', '#808080'),
                      (new, 'Decoded VP9 / light', '#f4f0e8'))
        else:
            old = Image.open(work / 'matte-before-decoded' / f'{row+1:02d}.png').convert('RGBA')
            panels = ((source, 'Source RGB', '#000000'),
                      (old, 'Before / decoded VP9', '#f4f0e8'),
                      (new, 'Corrected / decoded VP9', '#f4f0e8'))
        for col, (im, label, background) in enumerate(panels):
            im.thumbnail((360, 342), Image.Resampling.LANCZOS)
            panel = Image.new('RGBA', (370, 350), background)
            panel.alpha_composite(im, ((370-im.width)//2, 350-im.height))
            sheet.paste(panel.convert('RGB'), (col*375, row*380+30))
            draw.text((col*375+8, row*380+9), f'{args.cat} {number:03d} | {label}', fill='#17151d')
    output = work / ('designer-matte-review.jpg' if args.source_dir else 'matte-r2-review.jpg')
    sheet.save(output, quality=94)
    print(output)


if __name__ == '__main__':
    main()
