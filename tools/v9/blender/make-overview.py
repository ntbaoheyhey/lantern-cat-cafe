#!/usr/bin/env python3
"""Two-row overview from delivered atlas cells, plus synchronized 3s review."""
import json
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[3]
catalog=json.loads(Path(__file__).with_name('effects.json').read_text())
work=ROOT/'work/v9/CXV/vfx'
public=ROOT/'apps/web/public/vfx/v9'
peaks=[3,8,13,13,22,7,11,8]
items=[]
for name,spec in catalog.items():
    meta=json.loads((public/f'{name}.json').read_text())
    atlas=Image.open(public/f'{name}.webp').convert('RGBA')
    items.append((name,spec,meta,atlas))
try:
    font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',17)
    small=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',12)
except OSError:
    font=small=ImageFont.load_default()


def compose(frame=None):
    sheet=Image.new('RGB',(1024,644),'#15131a');draw=ImageDraw.Draw(sheet)
    draw.text((18,14),'V9 / LANTERN CAT CAFE — 256 px EFFECT REVIEW',fill='#f7efd8',font=font)
    for i,(name,spec,meta,atlas) in enumerate(items):
        x=(i%4)*256;y=48+(i//4)*298
        draw.text((x+10,y),name,fill='#eadfc7',font=font)
        draw.text((x+10,y+23),f'{meta["frames"]} frames / {meta["blend"]}'+(' / loop' if meta['loop'] else ''),fill='#aaa2b5',font=small)
        bg=Image.new('RGBA',(256,256),'black')
        index=peaks[i] if frame is None else frame%(meta['frames']+(0 if meta['loop'] else 12))
        if index<meta['frames']:
            sx=(index%meta['cols'])*512;sy=(index//meta['cols'])*512
            tile=atlas.crop((sx,sy,sx+512,sy+512)).resize((256,256),Image.Resampling.LANCZOS)
            bg.alpha_composite(tile)
        sheet.paste(bg.convert('RGB'),(x,y+42))
    return sheet


compose().save(work/'overview.jpg',quality=94)
folder=work/'overview-frames';folder.mkdir(exist_ok=True)
for i in range(90):compose(i).save(folder/f'{i+1:04d}.png',compress_level=1)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','30','-i',str(folder/'%04d.png'),
 '-frames:v','90','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',str(work/'overview-3s.mp4')],check=True)
for p in folder.glob('*.png'):p.unlink()
folder.rmdir()
print(work/'overview.jpg');print(work/'overview-3s.mp4')
