#!/usr/bin/env python3
"""Pack Blender cells and produce eye-review contact sheets and 3s clips."""
import argparse
import json
import math
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[3]
CATALOG=json.loads(Path(__file__).with_name('effects.json').read_text())


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--effect',choices=['all']+list(CATALOG),default='all')
    parser.add_argument('--draft',action='store_true')
    args=parser.parse_args()
    public=ROOT/'apps/web/public/vfx/v9'
    if not args.draft:public.mkdir(parents=True,exist_ok=True)
    for name in CATALOG if args.effect=='all' else [args.effect]:
        spec=CATALOG[name];work=ROOT/'work/v9/CXV/vfx'/name
        files=sorted((work/('draft' if args.draft else 'frames')).glob('*.png'))
        if not files:raise ValueError(f'No rendered frames for {name}')
        if not args.draft:
            expected=[f'{i:04d}.png' for i in range(1,spec['frames']+1)]
            if [p.name for p in files]!=expected:raise ValueError(f'Incomplete sequence: {name}')
        cols=4;rows=math.ceil(len(files)/cols)
        mode='RGBA' if spec['blend']=='normal' else 'RGB'
        atlas=Image.new(mode,(512*cols,512*rows),(0,0,0,0) if mode=='RGBA' else (0,0,0))
        sheet=Image.new('RGB',(4*256,rows*280+52),'#17151d')
        draw=ImageDraw.Draw(sheet)
        draw.text((16,15),f'{name.upper()} | 256 px review | 30 fps | {spec["blend"]} | '+('LOOP' if spec['loop'] else 'ONE SHOT'),fill='#f1eee6')
        for i,path in enumerate(files):
            with Image.open(path) as raw:
                if raw.size!=(512,512):raise ValueError(f'Wrong cell size: {path}')
                frame=raw.convert(mode)
            atlas.paste(frame,((i%cols)*512,(i//cols)*512))
            small=frame.convert('RGBA').resize((256,256),Image.Resampling.LANCZOS)
            bg=Image.new('RGBA',(256,256),'black');bg.alpha_composite(small)
            x,y=(i%cols)*256,(i//cols)*280+52
            sheet.paste(bg.convert('RGB'),(x,y));draw.text((x+9,y+260),f'{int(path.stem):02d} / {spec["frames"]:02d}',fill='#c6c2cb')
        sheet.save(work/('draft-sheet.jpg' if args.draft else 'contact-sheet.jpg'),quality=93)
        if args.draft:
            print(f'DRAFT {name}: {len(files)} cells; {work / "draft-sheet.jpg"}')
            continue
        atlas.save(public/f'{name}.webp',lossless=True,method=6)
        meta=dict(cell=[512,512],cols=cols,rows=rows,frames=spec['frames'],fps=30,
                  blend=spec['blend'],loop=spec['loop'],anchor=[.5,.5])
        (public/f'{name}.json').write_text(json.dumps(meta,indent=2)+'\n')
        # Repeat one-shots with a quiet gap; loop effects continue without a hold.
        preview=work/'preview-frames';preview.mkdir(exist_ok=True)
        for old in preview.glob('*.png'):old.unlink()
        for i in range(90):
            slot=i%(spec['frames'] if spec['loop'] else spec['frames']+12)
            bg=Image.new('RGBA',(512,512),'black')
            if slot<spec['frames']:
                with Image.open(files[slot]) as raw:bg.alpha_composite(raw.convert('RGBA'))
            bg.convert('RGB').save(preview/f'{i+1:04d}.png',compress_level=1)
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','30',
          '-i',str(preview/'%04d.png'),'-frames:v','90','-c:v','libx264','-crf','17',
          '-pix_fmt','yuv420p','-movflags','+faststart',str(work/'preview-3s.mp4')],check=True)
        # Keep local reviews light; rendered originals remain for reproduction.
        for path in preview.glob('*.png'):path.unlink()
        preview.rmdir()
        print(f'PACKED {name}: {cols*512}x{rows*512}, {spec["frames"]} frames; {public / (name+".webp")}',flush=True)


if __name__=='__main__':main()
