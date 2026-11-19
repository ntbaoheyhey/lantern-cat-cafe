#!/usr/bin/env python3
"""Source reference next to decoded VP9 on grey/light; local review artifact."""
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[3]
work = root / 'work/v9/CXV'
sheet = Image.new('RGB', (1200, 1100), '#26252b')
draw = ImageDraw.Draw(sheet)
for row, cat in enumerate(('mochi', 'clover')):
    video = root / f'apps/web/public/units/{cat}/designer/idle.webm'
    decoded = work / cat / 'webm-first.png'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-c:v', 'libvpx-vp9',
                    '-i', str(video), '-frames:v', '1', str(decoded)], check=True)
    for col, (name, bg) in enumerate((('Source MP4 reference', '#000000'), ('Decoded VP9 / grey', '#808080'), ('Decoded VP9 / light', '#f4f0e8'))):
        im = Image.open(work / 'reference' / f'{cat}.jpg' if col == 0 else decoded).convert('RGBA')
        im.thumbnail((380, 500), Image.Resampling.LANCZOS)
        panel = Image.new('RGBA', (400, 510), bg)
        panel.alpha_composite(im, ((400-im.width)//2, 510-im.height))
        sheet.paste(panel.convert('RGB'), (col*400, row*550+40))
        draw.text((col*400+12, row*550+15), f'{cat.upper()} | {name}', fill='white')
sheet.save(work / 'V0-reference-comparison.jpg', quality=93)
print(work / 'V0-reference-comparison.jpg')
